import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import userRouter from "./routs/user.route.js";

const app = express();
app.use(cors({
    origin:process.env.cors_origin,
    credentials:true,
}));
app.use(express.json({"limit":"16kb"}));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser())


// routes declaration
app.use("/api/v1/user", userRouter);

// http://localhost:5000/api/v1/user/register

// Global error handler
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(statusCode).json({
        success: false,
        statusCode,
        message
    });
});

export default app;
