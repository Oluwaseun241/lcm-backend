import { Request, Response } from "express";
import { AddBioSchema, UserSchema } from "../../services/validate.service";
import ApiError from "../../errors/ApiErrorHandler";
import userRepository from "./user.repository";

const user = {
  async addBio(req: Request, res: Response) {
    try {
      const validation = AddBioSchema.safeParse(req.body);
      if (!validation.success) {
        return ApiError(400, `${validation.error.format()}`, res);
      }

      const userId = req.user?.id;
      if (!userId) return ApiError(401, "Unauthorized", res);

      const user = await userRepository.addBio(userId, validation.data);

      return res.status(200).json({
        success: true,
        message: "Bio updated successfully",
        data: user,
      });
    } catch {
      return ApiError(500, "Failed to update bio", res);
    }
  },
};

export default user;
