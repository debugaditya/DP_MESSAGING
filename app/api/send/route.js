import clientPromise from '../../mongodb';
import { NextResponse } from 'next/server';
export async function POST(request) {
    const { sender, receiver, message } = await request.json();
    if (!sender || !receiver || !message) {
        return NextResponse.json({ message: 'Sender, receiver, and message are required' }, { status: 400 });
    }
    const client = await clientPromise;
    const db = client.db('DP_MESSAGING');
    const collection = db.collection('MESSAGES');
    try {
        const result=await collection.insertOne({
            CID: `${sender}_${receiver}`, // Unique conversation ID
            // Ensure CID is unique for each conversation
            FROM: sender,
            TO: receiver,
            TEXT: message,
            TIME: new Date(),
            SEEN: false
        });
        if (result.acknowledged) {
            return NextResponse.json({ message: 'Message sent successfully' }, { status: 200 });
        } else {
            return NextResponse.json({ message: 'Failed to send message' }, { status: 500 });
        }
    } catch (error) {
        console.error('Error sending message:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}