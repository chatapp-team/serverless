import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Initialize S3 Client
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export default async function handler(req, res) {
  // 1. CORS Setup (Essential for DartPad/Web)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle Preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 2. Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 3. Get filename and type from body
    // We use "test-user" since we removed Firebase authentication
    const { filename = 'test-file.txt', contentType = 'text/plain' } = req.body;
    
    // 4. Create the Key (File path in S3)
    const key = `testing/${Date.now()}-${filename}`;

    // 5. Generate the Presigned URL
    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    });

    // URL valid for 60 seconds
    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 60 });

    // 6. Return the URL and Key
    return res.status(200).json({ 
      uploadUrl, 
      key,
      instructions: "To upload, send a PUT request to the uploadUrl with the file as the body."
    });
  } catch (error) {
    console.error('S3 Error:', error);
    return res.status(500).json({ error: 'Failed to generate upload URL', details: error.message });
  }
}
