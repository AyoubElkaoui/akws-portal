import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

function getS3Client() {
  if (!process.env.R2_ACCOUNT_ID || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
    return null
  }

  return new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
    forcePathStyle: true,
  })
}

const bucket = process.env.R2_BUCKET_NAME || "akws-portal"

export async function getUploadUrl(key: string, contentType: string): Promise<string | null> {
  const s3 = getS3Client()
  if (!s3) return null

  const command = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType })
  return getSignedUrl(s3, command, { expiresIn: 600 })
}

export async function getDownloadUrl(key: string): Promise<string | null> {
  const s3 = getS3Client()
  if (!s3) return null

  const command = new GetObjectCommand({ Bucket: bucket, Key: key })
  return getSignedUrl(s3, command, { expiresIn: 3600 })
}

export async function deleteFromR2(key: string): Promise<void> {
  const s3 = getS3Client()
  if (!s3) return

  try {
    await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }))
  } catch (err) {
    console.error("[R2] Fout bij verwijderen:", err)
  }
}

export function isR2Configured(): boolean {
  return !!(process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY)
}
