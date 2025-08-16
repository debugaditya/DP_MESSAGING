import clientPromise from '../../mongodb';

export async function POST(req) {
  const { user } = await req.json();

  if (!user) {
    return new Response(JSON.stringify({ message: 'User not found' }), { status: 404 });
  }

  try {
    const client = await clientPromise;
    const db = client.db('DP_MESSAGING');
    console.log('DEBUG: Fetching sidebar counts for user:', user);
    const messages = await db.collection('MESSAGES').countDocuments({ TO: user, SEEN: false });
    const requests = await db.collection('FRIEND-REQ').countDocuments({ TO: user, SEEN: false });
    console.log('DEBUG: Fetched sidebar counts:', { messages, requests });
    return new Response(JSON.stringify({ messages, requests }), { status: 200 });
  } catch (error) {
    console.error("Error fetching sidebar data:", error);
    return new Response(JSON.stringify({ message: 'Internal Server Error' }), { status: 500 });
  }
}
