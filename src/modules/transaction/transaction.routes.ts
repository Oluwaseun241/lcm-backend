import { Router } from "express";
import transactionController from "./transaction.controller";
import { authenticateUser } from "../../middleware/auth.middleware";

const transactionRouter = Router();
transactionRouter.use('/transactions', authenticateUser);

transactionRouter.get("/history", transactionController.getTransactionHistory);
transactionRouter.get("/:id", transactionController.getTransactionById);

export default transactionRouter; 