import { NextResponse } from 'next/server'
import { S3Client, HeadBucketCommand, PutObjectCommand } from '@aws-sdk/client-s3'

export async function GET() {
  const accountId = process.env.R2_ACCOUNT_ID
  const accessKeyId = process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
  const bucketName = process.env.R2_BUCKET_NAME

  const results: any = {
    env: {
      hasAccountId: !!accountId,
      hasAccessKey: !!accessKeyId,
      hasSecret: !!secretAccessKey,
      hasBucket: !!bucketName,
      bucketName,
    },
    tests: {},
  }

  if (!accountId || !accessKeyId || !secretAccessKey) {
    return NextResponse.json({ ...results, error: 'Missing R2 credentials' }, { status: 500 })
  }

  const r2 = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  })

  // Test 1: HeadBucket (check if bucket exists and we have access)
  try {
    await r2.send(new HeadBucketCommand({ Bucket: bucketName! }))
    results.tests.headBucket = 'OK — bucket exists and accessible'
  } catch (e: any) {
    results.tests.headBucket = `FAIL — ${e.name}: ${e.message}`
  }

  // Test 2: PutObject a tiny test file
  try {
    await r2.send(
      new PutObjectCommand({
        Bucket: bucketName!,
        Key: '__debug__/test.txt',
        Body: 'test',
        ContentType: 'text/plain',
      })
    )
    results.tests.putObject = 'OK — write succeeded'
  } catch (e: any) {
    results.tests.putObject = `FAIL — ${e.name}: ${e.message}`
  }

  // Test 3: Try listing buckets (often restricted)
  try {
    const { ListBucketsCommand } = await import('@aws-sdk/client-s3')
    const list = await r2.send(new ListBucketsCommand({}))
    results.tests.listBuckets = {
      status: 'OK',
      buckets: list.Buckets?.map((b) => b.Name) ?? [],
    }
  } catch (e: any) {
    results.tests.listBuckets = `FAIL — ${e.name}: ${e.message}`
  }

  return NextResponse.json(results)
}
