import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/token.utils";
import ApiError from "../errors/ApiErrorHandler";
import { prisma } from "../config/database";

export const authenticateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return ApiError(401, "No token provided", res);
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyAccessToken(token) as { id: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    });

    if (!user) {
      return ApiError(401, "User not found", res);
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (err) {
    return ApiError(401, "Invalid token", res);
  }
};
