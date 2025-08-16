import clientPromise from '../../mongodb';
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const { user } = await request.json();
        if (!user) {
            return NextResponse.json({ message: 'User is required' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db('DP_MESSAGING');

        // Correctly query for messages where the user is either the sender OR the receiver
        const messages = await db.collection('MESSAGES').find({
            $or: [{ 'TO': user }, { 'FROM': user }]
        }).sort({ TIME: -1 }).toArray(); // Sort by time descending to easily find the latest

        if (!messages || messages.length === 0) {
            // Return empty objects if no messages are found, which is not an error
            return NextResponse.json({ mp: {}, cnt: {} }, { status: 200 });
        }

        const mp = {}; // Use a plain object for the message map
        const cnt = {}; // Use a plain object for the unread count

        messages.forEach((message) => {
            const otherUser = message.TO === user ? message.FROM : message.TO;

            // If we haven't recorded the latest message for this user yet, this is it.
            if (!mp[otherUser]) {
                mp[otherUser] = {
                    message: message.TEXT, // Assuming the field is named MESSAGE
                    timestamp: message.TIME
                };
            }

            // If the message was sent TO the current user and is unseen, increment the count.
            if (message.TO === user && message.SEEN === false) {
                cnt[otherUser] = (cnt[otherUser] || 0) + 1;
            }
        });

        const result = { mp, cnt };
        return NextResponse.json(result, { status: 200 });

    } catch (error) {
        console.error("Error in messages API:", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
