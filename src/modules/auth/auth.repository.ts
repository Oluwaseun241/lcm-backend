import { prisma } from "../../config/database";
import { hashedPassword } from "../../utils/hash.utils";

interface CreateUserData {
  email: string;
  password: string;
}

const repository = {
  async createUser(payload: CreateUserData) {
    try {
      console.log("Repository: Starting user creation for email:", payload.email);
      
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: payload.email }
      });

      if (existingUser) {
        console.log("Repository: User already exists");
        throw new Error("User with this email already exists");
      }

      console.log("Repository: Hashing password...");
      // Hash the password
      const hashed = await hashedPassword(payload.password);
      console.log("Repository: Password hashed successfully");

      console.log("Repository: Creating user in database...");
      // Create the user
      const newUser = await prisma.user.create({
        data: {
          email: payload.email,
          password: hashed,
        },
      });
      console.log("Repository: User created in database:", newUser.id);

      // Remove password from response
      const { password, ...userWithoutPassword } = newUser;
      console.log("Repository: Returning user without password");
      return userWithoutPassword;
    } catch (error) {
      console.error("Repository error:", error);
      // Re-throw the error to be handled by the controller
      throw error;
    }
  },
};

export default repository;
