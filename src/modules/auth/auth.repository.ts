import { prisma } from "../../config/database";
import { hashedPassword } from "../../utils/hash.utils";

interface CreateUserData {
  email: string;
  password: string;
}

const repository = {
  async createUser(payload: CreateUserData) {
    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: payload.email }
      });

      if (existingUser) {
        throw new Error("User with this email already exists");
      }

      // Hash the password
      const hashed = await hashedPassword(payload.password);
      // Create the user
      const newUser = await prisma.user.create({
        data: {
          email: payload.email,
          password: hashed,
        },
      });

      // Remove password from response
      const { password, ...userWithoutPassword } = newUser;
      return userWithoutPassword;
    } catch (error) {
      console.error("Repository error:", error);
      throw error;
    }
  },
};

export default repository;
