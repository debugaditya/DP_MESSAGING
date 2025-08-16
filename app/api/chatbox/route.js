import clientPromise from '../../mongodb';
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const { admin, username } = await request.json();

        if (!admin || !username) {
            return NextResponse.json({ message: 'Both admin and username are required' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db('DP_MESSAGING');
        const collection = db.collection('MESSAGES');

        // Fetch all messages between the two users and sort them by time
        const messages = await collection.find({
            $or: [
                { 'FROM': admin, 'TO': username },
                { 'FROM': username, 'TO': admin }
            ]
        }).sort({ 'TIME': 1 }).toArray(); // Sort ascending to show oldest first

        console.log(`Fetched ${messages.length} messages between ${admin} and ${username}`);
        return NextResponse.json(messages, { status: 200 });

    } catch (error) {
        console.error('Error fetching chat history:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
