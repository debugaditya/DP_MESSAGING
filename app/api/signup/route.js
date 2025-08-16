import clientPromise from '../../mongodb';
import bcrypt from 'bcrypt';
export async function POST(request) {
  const { username, password } = await request.json();

  if (!username || !password) {
    return new Response(JSON.stringify({ message: 'All fields are required' }), { status: 400 });
  }

  const client = await clientPromise;
  const db = client.db('DP_MESSAGING');

  const existingUser = await db.collection('CREDENTIALS').findOne({ 'USERNAME': username });
  if (existingUser) {
    return new Response(JSON.stringify({ message: 'User already exists' }), { status: 409 });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const result = await db.collection('CREDENTIALS').insertOne({ USERNAME: username, PASSWORD: hashedPassword , NAME: "", BIO: "" ,PHOTO: "https://res.cloudinary.com/dr83ajyus/image/upload/v1752303058/r1esmv4w44ezrxqhfuto.jpg", FRIENDS:[] });

  return new Response(JSON.stringify({ message: 'User created successfully', userId: result.insertedId }), { status: 201 });
}
// app/api/signup/route.js