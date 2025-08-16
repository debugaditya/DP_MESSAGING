import clientPromise from '../../mongodb';
export async function POST(request) {
    const { username } = await request.json();
    if (!username) {
        return new Response('All fields are required', { status: 400 });
    }
    const client = await clientPromise;
    const db = client.db('DP_MESSAGING');

    // Fetch user profile
    const user = await db.collection('CREDENTIALS').findOne({ 'USERNAME': username });
    if (!user) {
        console.log(`User not found: ${username}`);
        return new Response('User not found', { status: 404 });
    }
    // Return user profile excluding password
    const { PASSWORD, ...userProfile } = user;
    return new Response(JSON.stringify(userProfile), { status: 200 });
}