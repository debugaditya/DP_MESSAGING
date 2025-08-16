import clientPromise from '../../mongodb';
import { NextResponse } from 'next/server';
export async function POST(request) {
    const { username1, username2, type } = await request.json();
    if (!username1 || !username2 || !type) {
        return NextResponse.json({ message: 'All fields are required' }, { status: 400 });
    }
    const client = await clientPromise;
    const db = client.db('DP_MESSAGING');
    if(type === 'unfriend') {
        const result1 = await db.collection('CREDENTIALS').findOne({ 'USERNAME':username1 });
        const result2 = await db.collection('CREDENTIALS').findOne({ 'USERNAME':username2 });
        const update1 = await db.collection('CREDENTIALS').updateOne({ 'USERNAME': username1 }, { $pull: { 'FRIENDS': username2 } });
        const update2 = await db.collection('CREDENTIALS').updateOne({ 'USERNAME': username2 }, { $pull: { 'FRIENDS': username1 } });
        if(update1.modifiedCount === 1 && update2.modifiedCount === 1) {
            return NextResponse.json({ status: '200', message: 'Unfriended successfully' });
        } else {
            return NextResponse.json({ message: 'Error unfriending user' }, { status: 500 });
        }    
    }
    else if(type === 'accept') {
        const result1 = await db.collection('CREDENTIALS').findOne({ 'USERNAME':username1 });
        const result2 = await db.collection('CREDENTIALS').findOne({ 'USERNAME':username2 });
        const update1 = await db.collection('CREDENTIALS').updateOne({ 'USERNAME': username1 }, { $push: { 'FRIENDS': username2 } });
        const update2 = await db.collection('CREDENTIALS').updateOne({ 'USERNAME': username2 }, { $push: { 'FRIENDS': username1 } });
        if(update1.modifiedCount === 1 && update2.modifiedCount === 1) {
            await db.collection('FRIEND-REQ').deleteOne({ 'FROM': username2, 'TO': username1 });
            return NextResponse.json({ status: '200', message: 'Friend request accepted' });
        }
        else {
            return NextResponse.json({ message: 'Error accepting friend request' }, { status: 500 });
        }
    }
    else if(type === 'cancel') {
        const result1 = await db.collection('FRIEND-REQ').findOne({ 'FROM': username1, 'TO': username2 });
        const result2 = await db.collection('FRIEND-REQ').findOne({ 'FROM': username2, 'TO': username1 });
        if(result1 || result2) {
            await db.collection('FRIEND-REQ').deleteOne({ 'FROM': username1, 'TO': username2 });
            await db.collection('FRIEND-REQ').deleteOne({ 'FROM': username2, 'TO': username1 });
            return NextResponse.json({ status: '200', message: 'Friend request canceled' });
        }
        else {
            return NextResponse.json({ message: 'Error canceling friend request' }, { status: 500 });
        }
    }
    else if(type === 'send') {
        try{
            await db.collection('FRIEND-REQ').insertOne({ 'FROM': username1, 'TO': username2 , 'SEEN': false, 'TIME': new Date() });
            return NextResponse.json({ status: '200', message: 'Friend request sent' });
        } catch (error) {
            console.error("Error sending friend request:", error);
            return NextResponse.json({ message: 'Error sending friend request' }, { status: 500 });
        }
    }
    
}
