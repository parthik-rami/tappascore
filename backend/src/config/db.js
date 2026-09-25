import mongoose from 'mongoose';

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri || uri.includes('<username>') || uri.includes('<password>')) {
    console.warn(
      '[MongoDB Notice] MONGODB_URI is set as a placeholder in backend/.env.\n' +
      'Please update backend/.env with your MongoDB Atlas connection string when ready.'
    );
    return false;
  }

  try {
    const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log('✅ MongoDB Connected: ' + conn.connection.host);
    return true;
  } catch (error) {
    console.error('⚠️ MongoDB Connection Error: ' + error.message);
    console.error('👉 Tip: Ensure your IP address is whitelisted in MongoDB Atlas Network Access (0.0.0.0/0 for dev).');
    return false;
  }
};