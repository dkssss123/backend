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


export default app;
