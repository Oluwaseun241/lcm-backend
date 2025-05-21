import { Request, Response, NextFunction } from "express";
import ApiError from "../errors/ApiErrorHandler";
import { verifyAccessToken } from "../utils/token.utils";

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return ApiError(401, "No token provided", res);

  const token = authHeader.split(" ")[1];

  try {
    const decoded = verifyAccessToken(token) as { id: string };
    req.user = { id: decoded.id };
    next();
  } catch (err) {
    return ApiError(401, "Invalid token", res);
  }
}
