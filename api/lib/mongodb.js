import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;

if (!uri) {
    throw new Error('MONGODB_URI environment variable is not set');
}

const options = {};

let cachedClient = null;
let cachedDb = null;

export async function connectToDatabase() {
    if (cachedClient && cachedDb) {
        return { client: cachedClient, db: cachedDb };
    }

    const client = new MongoClient(uri, options);
    await client.connect();
    const db = client.db('lhf_forest');

    cachedClient = client;
    cachedDb = db;

    return { client, db };
}
