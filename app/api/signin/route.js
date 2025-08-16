import clientPromise from '../../mongodb';
import bcrypt from 'bcrypt';
export async function POST(request) {
  const { username, password } = await request.json();
    if (!username || !password) {
    return new Response('Username and password are required', { status: 400 });
  }

  const client = await clientPromise;
  const db = client.db('DP_MESSAGING');

  // Check if user exists
  const user = await db.collection('CREDENTIALS').findOne({ 'USERNAME': username });
  if (!user) {
    return new Response('User not found', { status: 404 });
  }

  // Check password
  const isValid = await bcrypt.compare(password, user.PASSWORD);
  if (!isValid) {
    return new Response('Invalid password', { status: 401 });
  }

  // Successful sign-in
  return new Response(JSON.stringify({ username }), { status: 200 });
}
// app/api/signin/route.js