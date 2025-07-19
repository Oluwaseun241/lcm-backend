import { prisma } from "../../config/database";

const repository = {
  async addBio(userId: string, data: { firstName: string; lastName: string; dob: string }) {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        dob: data.dob,
      },
    });

    const { password, passcode, ...safeUser } = updatedUser;
    return safeUser;
  },
  async getUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    return user;
  },
};

export default repository;
