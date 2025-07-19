import { Router, Request, Response } from "express";
import walletController from "./wallet.controller";
import { authenticateUser } from "../../middleware/auth.middleware";

const walletRouter: Router = Router();

// Apply authentication middleware to all wallet routes
walletRouter.use(authenticateUser);

// Wallet routes
walletRouter.post("/wallet/verify-bvn", walletController.verifyBVN);

walletRouter.post("/wallet/create", walletController.createWallet);

walletRouter.get("/wallet/details", walletController.getWalletDetails);

walletRouter.post("/wallet/top-up", walletController.topUpWallet);

walletRouter.post("/wallet/transfer", walletController.transferToUser);

walletRouter.post("/wallet/withdraw", walletController.withdrawToBank);

walletRouter.get("/wallet/statement", walletController.getStatement);

walletRouter.post("/wallet/add-bank", walletController.addBankAccount);

export default walletRouter; 