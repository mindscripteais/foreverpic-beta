import { NextResponse } from 'next/server'
import { S3Client, ListBucketsCommand } from '@aws-sdk/client-s3'

export async function GET() {
  try {
    const accountId = process.env.R2_ACCOUNT_ID
    const accessKeyId = process.env.R2_ACCESS_KEY_ID
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
    const bucketName = process.env.R2_BUCKET_NAME

    if (!accountId || !accessKeyId || !secretAccessKey) {
      return NextResponse.json({ error: 'Missing R2 credentials' }, { status: 500 })
    }

    const r2 = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    })

    const result = await r2.send(new ListBucketsCommand({}))

    return NextResponse.json({
      configuredBucket: bucketName ?? 'NOT_SET',
      accessibleBuckets: result.Buckets?.map((b) => b.Name) ?? [],
      owner: result.Owner,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to list buckets', details: (error as Error).message },
      { status: 500 }
    )
  }
}
