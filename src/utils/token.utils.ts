import jwt from "jsonwebtoken";
import {
  ACCESS_TOKEN_SECRET,
  REFRESH_TOKEN_SECRET,
  ACCESS_TOKEN_EXPIRES_IN,
  REFRESH_TOKEN_EXPIRES_IN,
} from "../config/auth";

export function generateAccessToken(payload: object) {
  return jwt.sign(payload, ACCESS_TOKEN_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
  });
}

export function generateRefreshToken(payload: object) {
  return jwt.sign(payload, REFRESH_TOKEN_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN,
  });
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, ACCESS_TOKEN_SECRET);
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(token, REFRESH_TOKEN_SECRET);
}
