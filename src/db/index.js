import mongoose from "mongoose";
//import { connectionInstance } from "./db/index.js";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
    try {
       const connectionInstance = await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`);
            console.log(`\n MongoDB connected: !! DB HOST: ${connectionInstance.connection.host}`)
    } 
       catch (error) {
            console.error("mongo DB connection error", error);
            process.exit(1);
        }
}
export default connectDB