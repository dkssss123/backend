import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();
router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {name: "coverImage",
        maxCount: 1
        },
        {
            name: "gallery",
            maxCount: 5
        },   
      {
            name: "documents",
            maxCount: 10
        }
    ]),

    registerUser

);
export default router;
