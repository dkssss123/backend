import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGO_URI;

        if (!mongoUri) {
            throw new Error("MONGO_URI is not defined in .env");
        }

        const connectionUrl = new URL(mongoUri);

        // Ensure the database name is placed before query params for Atlas SRV URIs.
        if (!connectionUrl.pathname || connectionUrl.pathname === "/") {
            connectionUrl.pathname = `/${DB_NAME}`;
        }

        const connectionInstance = await mongoose.connect(
            connectionUrl.toString()
        );

        console.log(
            `MongoDB connected. DB HOST: ${connectionInstance.connection.host}`
        );
    } catch (error) {
        console.error("MongoDB connection error:", error.message);
        process.exit(1);
    }
};

export default connectDB;
