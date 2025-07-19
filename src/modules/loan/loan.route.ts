import { Router } from "express";
import loanController from "./loan.controller";
import { authenticateUser } from "../../middleware/auth.middleware";
import { isAdmin } from "../../middleware/admin.middleware";

const loanRouter: Router = Router();

// Apply authentication middleware to all loan routes
loanRouter.use(authenticateUser);

// User routes
loanRouter.post("/loans/apply", loanController.applyForLoan);

loanRouter.get("/loans/status/:loanId", loanController.getLoanStatus);

loanRouter.get("/loans/my-loans", loanController.getUserLoans);

loanRouter.post("/loans/repay/:loanId", loanController.makeRepayment);

export default loanRouter; 