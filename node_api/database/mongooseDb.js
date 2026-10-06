import dotenv from 'dotenv';
//load config
dotenv.config({path:'./config/.env'});
import mongoose from 'mongoose';

export const connectMongoDb = async () => {
    try {
        const conn = await mongoose.connect(
          `${process.env.MONGO_URL}/${process.env.MONGODB_NAME}`,
          { retryWrites: false }
        );
        console.log('Connecting to:', `${process.env.MONGO_URL}/${process.env.MONGODB_NAME}`);
        console.log(`MongoDB connected: ${conn.connection.host}`);
    } catch (err) {
        console.log(err);
        // console.error(err);
        process.exit(1); // fail fast if DB is unreachable at startup
    }
};

