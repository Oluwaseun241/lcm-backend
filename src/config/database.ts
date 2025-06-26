import * as dotenv from "dotenv";
import logger from "../log/logger";
import { PrismaClient } from "@prisma/client";

dotenv.config();

const prisma = new PrismaClient();

async function connectToDatabase() {
  const MAX_RETRIES = 3;
  let retries = 0;

  while (retries < MAX_RETRIES) {
    try {
      await prisma.$connect();
      logger.info("Database connected successfully");
      return;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      const errorStack = error instanceof Error ? error.stack : "";

      logger.error(
        `Database connection failed (Attempt ${retries + 1}/${MAX_RETRIES})\n` +
          `Error: ${errorMessage}\n` +
          `Stack: ${errorStack}\n` +
          `Connection details: ${process.env.DB_USER}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
      );

      retries += 1;
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }

  logger.error(
    "Failed to connect to the database after multiple attempts./n" +
      "Please check:/n" +
      "1. Database server is running/n" +
      "2. Database credentials are correct/n" +
      "3. Database server is accessible from this host/n" +
      `4. Connection URL: postgres://${process.env.DB_USER}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
  );
  process.exit(1);
}

export { prisma, connectToDatabase };
