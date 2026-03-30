import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'

const DEMO_DIR = join(process.cwd(), 'demo-pdfs')

const s3 = new S3Client({
  endpoint: process.env.S3_ENDPOINT!,
  region: process.env.S3_REGION ?? 'us-east-1',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY!,
    secretAccessKey: process.env.S3_SECRET_KEY!,
  },
  forcePathStyle: true,
})

async function uploadDemos() {
  const files = readdirSync(DEMO_DIR).filter((f) => f.endsWith('.pdf'))
  console.log(`Uploading ${files.length} demo PDFs to S3...`)

  for (const file of files) {
    const body = readFileSync(join(DEMO_DIR, file))
    const key = `demo/${file}`

    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET!,
        Key: key,
        Body: body,
        ContentType: 'application/pdf',
      })
    )
    console.log(`  Uploaded: ${key} (${body.length} bytes)`)
  }

  console.log('Done.')
}

uploadDemos().catch((err) => {
  console.error('Upload failed:', err)
  process.exit(1)
})
