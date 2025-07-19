import { Request, Response } from "express";
import { AddBioSchema, UserSchema } from "../../services/validate.service";
import ApiError from "../../errors/ApiErrorHandler";
import userRepository from "./user.repository";

const userController = {
  async addBio(req: Request, res: Response): Promise<void> {
    try {
      const validation = AddBioSchema.safeParse(req.body);
      if (!validation.success) {
        ApiError(400, `${validation.error.format()}`, res);
        return;
      }

      const userId = req.user?.id;
      if (!userId) {
        ApiError(401, "Unauthorized", res);
        return;
      }

      const user = await userRepository.addBio(userId, validation.data);

      res.status(200).json({
        success: true,
        message: "Bio updated successfully",
        data: user,
      });
    } catch {
      ApiError(500, "Failed to update bio", res);
    }
  },
  
  async getUser(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        ApiError(401, "Unauthorized", res);
        return;
      }

      const user = await userRepository.getUser(userId);

      res.status(200).json({
        success: true,
        message: "User fetched successfully",
        data: user,
      });
    } catch {
      ApiError(500, "Failed to fetch user", res);
    }
  },
};

export default userController;
