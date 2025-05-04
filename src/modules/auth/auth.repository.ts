import { prisma } from "../../config/database";
import hash from "../../utils/hash.utils";

interface createUser {
  email: string;
  password: string;
}

const repository = {
  async createUser(payload: createUser) {
    const hashedPassword = payload.password
      ? await hash.hashedPassword(payload.password)
      : undefined;

    const newUser = await prisma.user.create({
      data: {
        email: payload.email,
        password: hashedPassword!,
      },
    });

    const { password, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  },
};

export default repository;
