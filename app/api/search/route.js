import clientPromise from '../../mongodb';
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const { query } = await request.json();

        if (!query || typeof query !== 'string') {
            return NextResponse.json({ message: 'Invalid search query' }, { status: 400 });
        }
        
        const client = await clientPromise;
        const db = client.db('DP_MESSAGING');
        const collection = db.collection('CREDENTIALS');

        const searchRegex = new RegExp(query, 'i');

        const users = await collection.find(
            { USERNAME: { $regex: searchRegex } }
        ).project(
            { USERNAME: 1, NAME: 1, _id: 0 ,PHOTO:1}
        ).limit(10).toArray();

        return NextResponse.json(users);

    } catch (error) {
        console.error('Search API Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}