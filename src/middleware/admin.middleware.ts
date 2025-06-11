import { Request, Response, NextFunction } from "express";
import ApiError from "../errors/ApiErrorHandler";

export const isAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    if (!req.user?.isAdmin) {
      return ApiError(403, "Access denied. Admin privileges required.", res);
    }
    next();
  } catch (err) {
    return ApiError(500, "Something went wrong", res);
  }
}; 