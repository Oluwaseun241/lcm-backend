import { z } from "zod";

export const UserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const AddBioSchema = z.object({
  name: z.string().min(1, "Name is required"),
  dob: z
    .string()
    .refine(
      (val) => !isNaN(Date.parse(val)),
      "Invalid date format (expected ISO 8601)",
    ),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});
