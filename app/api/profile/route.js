import clientPromise from '../../mongodb';
import { NextResponse } from 'next/server'; // Import NextResponse for JSON responses

export async function POST(request) {
    const { username1, username2 } = await request.json();

    if (!username1 || !username2) {
        // Return a JSON object with a message for 400 status
        return NextResponse.json({ message: 'Both usernames are required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('DP_MESSAGING');

    // Find if username1 sent a request to username2
    const user1Request = await db.collection('FRIEND-REQ').findOne({ 'FROM': username1 , 'TO': username2 });
    if (user1Request) {
        // Return a JSON object with the status for the client
        return NextResponse.json({ status: '200', message: 'Request sent by user1 to user2' }); // Changed to 201 as per client logic for 'Requested'
    }

    // Find if username2 sent a request to username1 (incoming request)
    const user2Request = await db.collection('FRIEND-REQ').findOne({ 'FROM': username2 , 'TO': username1 });
    if (user2Request) {
        return NextResponse.json({ status: '201', message: 'Request sent by user2 to user1' }); // Changed to 200 as per client logic for 'Accept request'
    }
    return NextResponse.json({ status: '202', message: 'No existing relationship' }, { status: 202 });
}