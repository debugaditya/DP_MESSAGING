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
                'TO': admin,       // Find messages sent TO the current user
                'FROM': username,  // FROM the person they are chatting with
                'SEEN': false      // That are currently unread
            },
            {
                $set: { 'SEEN': true } // Set their status to read
            }
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
