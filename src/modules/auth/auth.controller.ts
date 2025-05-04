import { Request, Response } from "express";
import { UserSchema } from "../../services/validate.service";
import ApiError from "../../errors/ApiErrorHandler";
import authRepository from "./auth.repository";

const auth = {
  async registerUser(req: Request, res: Response) {
    try {
      const validate = UserSchema.safeParse(req.body);
      if (!validate.success) {
        ApiError(400, `${validate.error.errors}`, res);
      }

      const user = authRepository.createUser(req.body);

      return res.status(201).send({
        success: true,
        message: "User registered successfully",
        data: user,
      });
    } catch (err) {
      return ApiError(500, "Something went wrong", res);
    }
  },
};

export default auth;
