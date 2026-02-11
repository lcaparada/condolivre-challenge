import { Db, MongoClient } from 'mongodb';

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export const connectToDatabase = async (): Promise<Db> => {
  if (cachedDb) {
    return cachedDb;
  }

  const uri =
    process.env.NODE_ENV === 'test' ? process.env.MONGODB_URI_TEST : process.env.MONGODB_URI;

  if (!uri) {
    throw new Error(
      `Missing required environment variable: ${
        process.env.NODE_ENV === 'test' ? 'MONGODB_URI_TEST' : 'MONGODB_URI'
      }`
    );
  }

  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    maxPoolSize: 10,
  });

  await client.connect();
  cachedClient = client;
  cachedDb = client.db();
  return cachedDb;
};

export const disconnectFromDatabase = async (): Promise<void> => {
  if (cachedClient) {
    await cachedClient.close();
    cachedClient = null;
    cachedDb = null;
  }
};
