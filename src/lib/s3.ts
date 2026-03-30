import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { env } from './env'

const s3 = new S3Client({
  endpoint: env.S3_ENDPOINT,
  region: env.S3_REGION,
  credentials: {
    accessKeyId: env.S3_ACCESS_KEY,
    secretAccessKey: env.S3_SECRET_KEY,
  },
  forcePathStyle: env.S3_FORCE_PATH_STYLE,
})

export async function getPresignedUploadUrl(
  key: string,
  contentType: string
) {
  const command = new PutObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: key,
    ContentType: contentType,
  })
  const url = await getSignedUrl(s3, command, { expiresIn: 900 })
  return { url, key, expiresIn: 900 }
}

export async function getPresignedDownloadUrl(key: string) {
  const command = new GetObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: key,
  })
  return getSignedUrl(s3, command, { expiresIn: 3600 })
}

export { s3 }
