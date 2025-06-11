import { Router, Request, Response } from "express";
import authController from "./auth.controller";
import userController from "../user/user.controller";

const authRouter: Router = Router();

authRouter.use('/auth');

authRouter.post("/signup", authController.registerUser);

authRouter.post("/login", authController.login);

authRouter.post("/refresh-token", authController.refreshToken);

authRouter.post("/add-bio", userController.addBio);

export default authRouter;
