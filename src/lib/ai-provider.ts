import { env } from './env'

export type ExtractionField = {
  name: string
  value: string
  confidence: number
}

export type ExtractionResult = {
  fields: Record<string, unknown>
  fieldConfidences: Record<string, number>
  rawLogprobs: { token: string; logProbability: number }[] | null
}

export type ClassificationResult = {
  documentType: string
  confidence: number
}

export type AIProvider = {
  extractStructured(
    text: string,
    schema: GeminiSchema,
    systemPrompt: string
  ): Promise<ExtractionResult>

  classify(
    text: string,
    templateNames: string[]
  ): Promise<ClassificationResult>

  embed(text: string): Promise<number[]>
  embedBatch(texts: string[]): Promise<number[][]>

  extractTextFromMedia(buffer: Buffer, mimeType: string): Promise<string>
}

export type GeminiSchema = {
  type: 'OBJECT'
  properties: Record<string, GeminiSchemaProperty>
  required?: string[]
}

export type GeminiSchemaProperty = {
  type: 'STRING' | 'NUMBER' | 'INTEGER' | 'BOOLEAN' | 'ARRAY' | 'OBJECT'
  description?: string
  items?: GeminiSchemaProperty
  properties?: Record<string, GeminiSchemaProperty>
  required?: string[]
  enum?: string[]
}

export function getAIProvider(): AIProvider {
  if (env.AI_PROVIDER === 'gemini') {
    return createGeminiProvider()
  }
  return createOpenAIProvider()
}

function createGeminiProvider(): AIProvider {
  const { GoogleGenerativeAI, SchemaType } = require('@google/generative-ai')
  const genAI = new GoogleGenerativeAI(env.GOOGLE_AI_API_KEY!)

  return {
    async extractStructured(text, schema, systemPrompt) {
      // Build a schema where each field becomes { value, confidence }
      // so Gemini returns both in a single call
      const withConfidence: Record<string, unknown> = {}
      for (const [key, prop] of Object.entries(schema.properties)) {
        withConfidence[key] = {
          type: SchemaType.OBJECT,
          properties: {
            value: convertProp(prop, SchemaType),
            confidence: {
              type: SchemaType.NUMBER,
              description: `How confident are you in this extraction? 1.0 = the value is explicitly stated in the document. 0.7 = inferred from context. 0.3 = weak guess. 0.0 = not found at all.`,
            },
          },
          required: ['value', 'confidence'],
        }
      }

      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: SchemaType.OBJECT,
            properties: withConfidence,
            required: schema.required,
          },
        },
        systemInstruction: systemPrompt,
      })

      const result = await model.generateContent(text)
      const raw = JSON.parse(result.response.text())

      // Unpack { field: { value, confidence } } into separate maps
      const fields: Record<string, unknown> = {}
      const fieldConfidences: Record<string, number> = {}
      for (const [key, entry] of Object.entries(raw)) {
        const e = entry as { value: unknown; confidence: number }
        fields[key] = e.value
        fieldConfidences[key] = Math.min(Math.max(e.confidence ?? 0.5, 0), 1)
      }

      return { fields, fieldConfidences, rawLogprobs: null }
    },

    async classify(text, templateNames) {
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: SchemaType.OBJECT,
            properties: {
              document_type: {
                type: SchemaType.STRING,
                enum: templateNames,
                description: 'The type of document',
              },
              confidence: {
                type: SchemaType.NUMBER,
                description: 'Confidence score 0.0 to 1.0',
              },
            },
            required: ['document_type', 'confidence'],
          },
        },
      })

      const result = await model.generateContent(
        `Classify this document into one of these types: ${templateNames.join(', ')}.\n\nDocument text:\n${text}`
      )
      const parsed = JSON.parse(result.response.text())

      return {
        documentType: parsed.document_type,
        confidence: parsed.confidence,
      }
    },

    async embed(text) {
      const model = genAI.getGenerativeModel({ model: 'gemini-embedding-001' })
      const result = await model.embedContent({
        content: { role: 'user' as const, parts: [{ text }] },
        outputDimensionality: 768,
      })
      return result.embedding.values
    },

    async embedBatch(texts) {
      const model = genAI.getGenerativeModel({ model: 'gemini-embedding-001' })
      const result = await model.batchEmbedContents({
        requests: texts.map((text) => ({
          content: { role: 'user' as const, parts: [{ text }] },
          outputDimensionality: 768,
        })),
      })
      return result.embeddings.map((e: { values: number[] }) => e.values)
    },

    async extractTextFromMedia(buffer, mimeType) {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
      const result = await model.generateContent([
        {
          inlineData: {
            mimeType,
            data: buffer.toString('base64'),
          },
        },
        'Extract all readable text from this document. Preserve the original structure: line breaks between paragraphs, lists, tables (use tab or pipe separators). Return only the extracted text, no commentary or markdown fencing.',
      ])
      return result.response.text()
    },
  }
}

function createOpenAIProvider(): AIProvider {
  const OpenAI = require('openai').default
  const client = new OpenAI({ apiKey: env.OPENAI_API_KEY! })

  return {
    async extractStructured(text, schema, systemPrompt) {
      const response = await client.chat.completions.create({
        model: env.OPENAI_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'extraction',
            schema: geminiSchemaToJsonSchema(schema),
            strict: true,
          },
        },
        logprobs: true,
        top_logprobs: 5,
      })

      const fields = JSON.parse(response.choices[0].message.content!)
      const logprobs = response.choices[0].logprobs?.content ?? []

      const fieldConfidences = computeFieldConfidences(
        fields,
        logprobs.map((lp: { token: string; logprob: number }) => ({
          token: lp.token,
          logProbability: lp.logprob,
        }))
      )

      return {
        fields,
        fieldConfidences,
        rawLogprobs: logprobs.map((lp: { token: string; logprob: number }) => ({
          token: lp.token,
          logProbability: lp.logprob,
        })),
      }
    },

    async classify(text, templateNames) {
      const response = await client.chat.completions.create({
        model: env.OPENAI_MODEL,
        messages: [
          {
            role: 'system',
            content: `Classify the document into one of: ${templateNames.join(', ')}. Return JSON with document_type and confidence (0-1).`,
          },
          { role: 'user', content: text },
        ],
        response_format: { type: 'json_object' },
      })

      const parsed = JSON.parse(response.choices[0].message.content!)
      return {
        documentType: parsed.document_type,
        confidence: parsed.confidence,
      }
    },

    async embed(text) {
      const response = await client.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
        dimensions: 768,
      })
      return response.data[0].embedding
    },

    async embedBatch(texts) {
      const response = await client.embeddings.create({
        model: 'text-embedding-3-small',
        input: texts,
        dimensions: 768,
      })
      return response.data.map((d: { embedding: number[] }) => d.embedding)
    },

    async extractTextFromMedia(buffer, mimeType) {
      if (mimeType === 'application/pdf') {
        // OpenAI vision does not accept PDFs natively. Skip OCR fallback on
        // OpenAI for scanned PDFs — Gemini is the supported provider for that.
        return ''
      }

      const response = await client.chat.completions.create({
        model: env.OPENAI_MODEL,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Extract all readable text from this image. Preserve structure: line breaks between paragraphs, lists, tables (use tab or pipe separators). Return only the extracted text, no commentary.',
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${buffer.toString('base64')}`,
                },
              },
            ],
          },
        ],
      })
      return response.choices[0].message.content ?? ''
    },
  }
}

function convertProp(prop: GeminiSchemaProperty, SchemaType: Record<string, string>): unknown {
  const result: Record<string, unknown> = {
    type: SchemaType[prop.type],
    description: prop.description,
  }
  if (prop.enum) result.enum = prop.enum
  if (prop.items) result.items = convertProp(prop.items, SchemaType)
  if (prop.properties) {
    result.properties = Object.fromEntries(
      Object.entries(prop.properties).map(([k, v]) => [k, convertProp(v, SchemaType)])
    )
  }
  if (prop.required) result.required = prop.required
  return result
}

function convertSchema(schema: GeminiSchema, SchemaType: Record<string, string>) {
  return {
    type: SchemaType.OBJECT,
    properties: Object.fromEntries(
      Object.entries(schema.properties).map(([k, v]) => [k, convertProp(v, SchemaType)])
    ),
    required: schema.required,
  }
}

function geminiSchemaToJsonSchema(schema: GeminiSchema): Record<string, unknown> {
  function convertProp(prop: GeminiSchemaProperty): Record<string, unknown> {
    const typeMap: Record<string, string> = {
      STRING: 'string', NUMBER: 'number', INTEGER: 'integer',
      BOOLEAN: 'boolean', ARRAY: 'array', OBJECT: 'object',
    }
    const result: Record<string, unknown> = { type: typeMap[prop.type] }
    if (prop.description) result.description = prop.description
    if (prop.enum) result.enum = prop.enum
    if (prop.items) result.items = convertProp(prop.items)
    if (prop.properties) {
      result.properties = Object.fromEntries(
        Object.entries(prop.properties).map(([k, v]) => [k, convertProp(v)])
      )
      result.additionalProperties = false
    }
    if (prop.required) result.required = prop.required
    return result
  }

  return {
    type: 'object',
    properties: Object.fromEntries(
      Object.entries(schema.properties).map(([k, v]) => [k, convertProp(v)])
    ),
    required: schema.required,
    additionalProperties: false,
  }
}

// OpenAI provider uses logprobs for confidence
function computeFieldConfidences(
  fields: Record<string, unknown>,
  logprobTokens: { token: string; logProbability: number }[]
): Record<string, number> {
  const confidences: Record<string, number> = {}
  const avgProb = logprobTokens.length > 0
    ? Math.exp(
        logprobTokens.reduce((sum, t) => sum + t.logProbability, 0) /
          logprobTokens.length
      )
    : 0.5

  for (const key of Object.keys(fields)) {
    confidences[key] = Math.min(Math.max(avgProb, 0), 1)
  }
  return confidences
}
