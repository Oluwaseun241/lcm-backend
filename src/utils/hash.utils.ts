import argon2 from "argon2";

export function hashedPassword(password: string) {
  return argon2.hash(password);
}
export function comparePassword(password: string, userPassword: string) {
  return argon2.verify(userPassword, password);
}
