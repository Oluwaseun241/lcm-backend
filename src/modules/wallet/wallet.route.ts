import { Router, Request, Response } from "express";
import walletController from "./wallet.controller";
import { authenticateUser } from "../../middleware/auth.middleware";

const walletRouter: Router = Router();

walletRouter.use('/wallet', authenticateUser);

walletRouter.post("/verify-bvn", walletController.verifyBVN);

walletRouter.post("/create", walletController.createWallet);

walletRouter.get("/details", walletController.getWalletDetails);

walletRouter.post("/top-up", walletController.topUpWallet);

walletRouter.post("/transfer", walletController.transferToUser);

walletRouter.post("/withdraw", walletController.withdrawToBank);

walletRouter.get("/statement", walletController.getStatement);

walletRouter.post("/add-bank", walletController.addBankAccount);




export default walletRouter; 