import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { env } from './env'

const isSupabase = !!env.SUPABASE_URL

// S3 client for local MinIO dev
const s3 = !isSupabase
  ? new S3Client({
      endpoint: env.S3_ENDPOINT,
      region: env.S3_REGION,
      credentials: {
        accessKeyId: env.S3_ACCESS_KEY,
        secretAccessKey: env.S3_SECRET_KEY,
      },
      forcePathStyle: env.S3_FORCE_PATH_STYLE,
    })
  : null

export async function getPresignedUploadUrl(
  key: string,
  contentType: string
) {
  if (isSupabase) {
    // Supabase: return an upload URL that the client POSTs to
    const url = `${env.SUPABASE_URL}/storage/v1/object/${env.S3_BUCKET}/${key}`
    return { url, key, expiresIn: 900, headers: { Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}` } }
  }

  const command = new PutObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: key,
    ContentType: contentType,
  })
  const url = await getSignedUrl(s3!, command, { expiresIn: 900 })
  return { url, key, expiresIn: 900 }
}

export async function getPresignedDownloadUrl(key: string) {
  if (isSupabase) {
    const res = await fetch(
      `${env.SUPABASE_URL}/storage/v1/object/sign/${env.S3_BUCKET}/${key}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ expiresIn: 3600 }),
      }
    )
    const data = await res.json()
    return `${env.SUPABASE_URL}/storage/v1${data.signedURL}`
  }

  const command = new GetObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: key,
  })
  return getSignedUrl(s3!, command, { expiresIn: 3600 })
}

export async function uploadFile(key: string, body: Buffer, contentType: string) {
  if (isSupabase) {
    await fetch(`${env.SUPABASE_URL}/storage/v1/object/${env.S3_BUCKET}/${key}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`,
        'Content-Type': contentType,
      },
      body: new Uint8Array(body),
    })
    return
  }

  await s3!.send(
    new PutObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  )
}

export async function downloadFile(key: string): Promise<Buffer> {
  if (isSupabase) {
    const res = await fetch(
      `${env.SUPABASE_URL}/storage/v1/object/${env.S3_BUCKET}/${key}`,
      { headers: { Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}` } }
    )
    return Buffer.from(await res.arrayBuffer())
  }

  const command = new GetObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: key,
  })
  const response = await s3!.send(command)
  return Buffer.from(await response.Body!.transformToByteArray())
}

export { s3 }
