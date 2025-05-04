import argon2 from "argon2";

const hash = {
  async hashedPassword(password: string) {
    return await argon2.hash(password);
  },
  async comparePassword(password: string, userPassword: string) {
    return await argon2.verify(userPassword, password);
  },
};

export default hash;
