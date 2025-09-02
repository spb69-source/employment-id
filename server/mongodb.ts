import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://securebank69_id-db_user:sCgZIxMNjYYi72HA@id-me.sg89vi5.mongodb.net/secure-id?retryWrites=true&w=majority&appName=id-me';

let isConnected = false;

export async function connectToMongoDB() {
  if (isConnected) {
    return true;
  }

  try {
    await mongoose.connect(MONGODB_URI, {
      connectTimeoutMS: 10000,
      serverSelectionTimeoutMS: 10000,
    });
    isConnected = true;
    console.log('Connected to MongoDB');
    return true;
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    console.error('This is likely due to IP whitelist restrictions in MongoDB Atlas');
    return false;
  }
}

export default mongoose;