import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import admin from 'firebase-admin';

// 1. Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    // Tip: Ensure FIREBASE_SERVICE_ACCOUNT is a single-line string in Vercel settings
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
  });
}

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export default async function handler(req, res) {
  // --- START CORS BLOCK ---
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*'); // Change '*' to your domain in production
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  // Handle Preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  // --- END CORS BLOCK ---

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 3. Verify Firebase Token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
       return res.status(401).json({ error: 'Missing Authorization Header' });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const userId = decodedToken.uid;

    const { filename, contentType } = req.body;
    
    // 4. Create the Key
    const key = `uploads/${userId}/${Date.now()}-${filename}`;

    // 5. Generate the Presigned URL
    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 60 });

    return res.status(200).json({ uploadUrl, key });
  } catch (error) {
    console.error('Error details:', error);
    return res.status(401).json({ error: 'Authentication or Signing Failed' });
  }
}
