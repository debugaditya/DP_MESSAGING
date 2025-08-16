import clientPromise from '../../mongodb';
import { NextResponse } from 'next/server';
export async function POST(request) {
    const { user , type} = await request.json();
    const client = await clientPromise;
    const db = client.db('DP_MESSAGING');
    if(type === 'request') {
        const friends = await db.collection('FRIEND-REQ').find({ 'TO': user }).toArray();
        if(friends) {
            console.log('DEBUG: Friend Requests:', friends);
            return NextResponse.json({ status: '200', friends }, { status: 200 });
        } else {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }
    }
    if(type === 'stalkers') {
        const friends = await db.collection('STALKERS').find({ 'STALKED': user , }).sort({ 'FREQUENCY': -1 }).toArray();
        if(friends) {
            return NextResponse.json({ status: '200', friends: friends }, { status: 200 });
        } else {
            return NextResponse.json({ status:'201', message: 'No one stalked you' }, { status: 201 });
        }
    }
}
