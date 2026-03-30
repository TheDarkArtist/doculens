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
      // Two-pass: extract fields, then ask model to self-assess confidence
      // Pass 1: Extract
      const extractModel = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: convertSchema(schema, SchemaType),
        },
        systemInstruction: systemPrompt,
      })

      const extractResult = await extractModel.generateContent(text)
      const fields = JSON.parse(extractResult.response.text())

      // Pass 2: Self-assess confidence per field
      const fieldNames = Object.keys(fields)
      const confProperties: Record<string, unknown> = {}
      for (const name of fieldNames) {
        confProperties[name] = {
          type: SchemaType.NUMBER,
          description: `Confidence 0.0-1.0 that "${name}" was correctly extracted. 1.0 = certain the value is exactly right. 0.5 = guessing. 0.0 = no evidence in the document.`,
        }
      }

      const confModel = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: SchemaType.OBJECT,
            properties: confProperties,
            required: fieldNames,
          },
        },
      })

      let fieldConfidences: Record<string, number> = {}
      try {
        const confResult = await confModel.generateContent(
          `You extracted these fields from a document. Rate your confidence (0.0-1.0) for each field — how certain are you the extracted value is correct based on the source text?\n\nSource text:\n${text.slice(0, 2000)}\n\nExtracted fields:\n${JSON.stringify(fields, null, 2)}`
        )
        fieldConfidences = JSON.parse(confResult.response.text())
      } catch {
        // Fallback: heuristic confidence
        for (const key of fieldNames) {
          const val = fields[key]
          const hasValue = val !== null && val !== '' && val !== undefined && val !== 0
          fieldConfidences[key] = hasValue ? 0.85 : 0.3
        }
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
        })),
        null
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
  }
}

function convertSchema(schema: GeminiSchema, SchemaType: Record<string, string>) {
  function convertProp(prop: GeminiSchemaProperty): unknown {
    const result: Record<string, unknown> = {
      type: SchemaType[prop.type],
      description: prop.description,
    }
    if (prop.enum) result.enum = prop.enum
    if (prop.items) result.items = convertProp(prop.items)
    if (prop.properties) {
      result.properties = Object.fromEntries(
        Object.entries(prop.properties).map(([k, v]) => [k, convertProp(v)])
      )
    }
    if (prop.required) result.required = prop.required
    return result
  }

  return {
    type: SchemaType.OBJECT,
    properties: Object.fromEntries(
      Object.entries(schema.properties).map(([k, v]) => [k, convertProp(v)])
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

function computeFieldConfidences(
  fields: Record<string, unknown>,
  logprobTokens: { token: string; logProbability: number }[],
  avgLogprob: number | null
): Record<string, number> {
  const confidences: Record<string, number> = {}

  if (!logprobTokens.length && avgLogprob !== null) {
    const overall = Math.exp(avgLogprob)
    for (const key of Object.keys(fields)) {
      confidences[key] = Math.min(Math.max(overall, 0), 1)
    }
    return confidences
  }

  // Simplified confidence: use average logprob as baseline for all fields
  // Full token-to-field mapping would use @promptrepo/score
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
