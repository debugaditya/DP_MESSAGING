import { MongoClient } from 'mongodb';
const uri = process.env.MONGODB_URI;
const options = {};
let client;
let clientPromise;

if (!uri) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

if (process.env.NODE_ENV === 'development') {
  // In dev mode, use a global variable so we don't create multiple connections
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production, create a new client each time
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;
