import { Router, Request, Response } from "express";
import authController from "./auth.controller";
import userController from "../user/user.controller";

const authRouter: Router = Router();

// check health
authRouter.get("/", (req: Request, res: Response) => {
  res.status(200).json({ status: true, message: "Server is running" });
});

authRouter.post("/auth/signup", authController.registerUser);

authRouter.post("/auth/login", authController.login);

authRouter.post("/auth/refresh-token", authController.refreshToken);

authRouter.post("/auth/add-bio", userController.addBio);

export default authRouter;
