import { Request, Response } from "express";
import { prisma } from "../../config/database";
import { LoginSchema, UserSchema } from "../../services/validate.service";
import ApiError from "../../errors/ApiErrorHandler";
import authRepository from "./auth.repository";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../../utils/token.utils";

const auth = {
  async registerUser(req: Request, res: Response) {
    try {
      const validation = UserSchema.safeParse(req.body);
      if (!validation.success) {
        ApiError(400, `${validation.error.errors}`, res);
      }

      const userData = validation.data;

      const user = authRepository.createUser(userData);

      return res.status(201).send({
        success: true,
        message: "User registered successfully",
        data: user,
      });
    } catch (err) {
      return ApiError(500, "Something went wrong", res);
    }
  },

  async Login(req: Request, res: Response) {
    try {
      const validation = LoginSchema.safeParse(req.body);
      if (!validation.success) {
        return ApiError(400, `${validation.error.format()}`, res);
      }

      const { email, password } = validation.data;

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user || !(await hash.comparePassword(password, user.password))) {
        return ApiError(401, "Invalid email or password", res);
      }

      const payload = { id: user.id, email: user.email };

      const accessToken = generateAccessToken(payload);
      const refreshToken = generateRefreshToken(payload);

      return res.status(200).json({
        success: true,
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      });
    } catch (err) {
      return ApiError(500, "Something went wrong", res);
    }
  },

  async refreshToken(req: Request, res: Response) {
    const { refreshToken } = req.body;
    if (!refreshToken) return ApiError(401, "Refresh token required", res);

    try {
      const decoded = verifyRefreshToken(refreshToken) as {
        id: string;
        email: string;
      };

      const user = await prisma.user.findUnique({ where: { id: decoded.id } });
      if (!user) return ApiError(404, "User not found", res);

      const accessToken = generateAccessToken({
        id: user.id,
        email: user.email,
      });

      return res.status(200).json({
        success: true,
        accessToken,
      });
    } catch (err) {
      return ApiError(403, "Invalid or expired refresh token", res);
    }
  },
};
export default auth;
