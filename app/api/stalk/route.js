import clientPromise from '../../mongodb';
import { NextResponse } from 'next/server';
export async function POST(request) {
    const { stalker, stalked } = await request.json();

    const client = await clientPromise;
    const db = client.db('DP_MESSAGING');

    try {
        const result = await db.collection('STALKERS').findOne({ STALKER: stalker, STALKED: stalked });
        if (!result) {
            await db.collection('STALKERS').insertOne({ STALKER: stalker, STALKED: stalked, FREQUENCY: 1 });
        }
        else{
            const frequency = result.FREQUENCY + 1;
            await db.collection('STALKERS').updateOne({ STALKER: stalker, STALKED: stalked }, { $set: { FREQUENCY: frequency } });
        }
        console.log(`User ${stalker} is stalking ${stalked}`);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error fetching user data:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}