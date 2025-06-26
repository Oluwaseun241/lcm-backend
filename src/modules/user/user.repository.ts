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
};

export default repository;
