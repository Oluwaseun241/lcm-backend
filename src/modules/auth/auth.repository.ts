import { prisma } from "../../config/database";
import { hashedPassword } from "../../utils/hash.utils";

interface createUser {
  email: string;
  password: string;
}

const repository = {
  async createUser(payload: createUser) {
    const hashed = payload.password
      ? await hashedPassword(payload.password)
      : undefined;

    const newUser = await prisma.user.create({
      data: {
        email: payload.email,
        password: hashed,
      },
    });

    const { password, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  },
};

export default repository;
