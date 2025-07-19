import { Router } from "express";
import transactionController from "./transaction.controller";
import { authenticateUser } from "../../middleware/auth.middleware";

const transactionRouter = Router();

// Apply authentication middleware to all transaction routes
transactionRouter.use(authenticateUser);

// Transaction routes
transactionRouter.get("/transactions/history", transactionController.getTransactionHistory);
transactionRouter.get("/transactions/:id", transactionController.getTransactionById);

export default transactionRouter; 