import mongoose from "mongoose";

const connectDatabase = async () => {
  const dbName = process.env.MONGODB_DB_NAME || "online-learning-platform";
  const connection = await mongoose.connect(process.env.MONGODB_URI, { dbName });
  console.log(`MongoDB connected: ${connection.connection.host}/${connection.connection.name}`);
};

export default connectDatabase;
