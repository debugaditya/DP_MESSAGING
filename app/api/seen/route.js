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

        // Use updateMany to update all matching documents in a single operation
        const result = await collection.updateMany(
            {
                CID: `${username}_${admin}`, // Unique conversation ID
                SEEN: false, // Only update unseen messages
            },
            { $set: { SEEN: true } } // Set SEEN to true
        );

        return NextResponse.json({ 
            message: 'Messages marked as seen', 
            modifiedCount: result.modifiedCount 
        }, { status: 200 });

    } catch (error) {
        console.error('Error in /api/seen:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
