import { prisma } from "../../config/database";

const repository = {
  async addBio(userId: string, data: { name: string; dob: string }) {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        dob: data.dob,
      },
    });

    const { password, passcode, ...safeUser } = updatedUser;
    return safeUser;
  },
};

export default repository;
