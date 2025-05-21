// config/auth.ts
export const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET!;
export const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET!;
export const ACCESS_TOKEN_EXPIRES_IN = "24h";
export const REFRESH_TOKEN_EXPIRES_IN = "7d";
