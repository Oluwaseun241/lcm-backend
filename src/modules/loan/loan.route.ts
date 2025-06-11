import { Router } from "express";
import loanController from "./loan.controller";
import { authenticateUser } from "../../middleware/auth.middleware";
import { isAdmin } from "../../middleware/admin.middleware";

const loanRouter: Router = Router();

loanRouter.use('/loans', authenticateUser);

// User routes
loanRouter.post("/apply", loanController.applyForLoan);

loanRouter.get("/status/:loanId", loanController.getLoanStatus);

loanRouter.get("/my-loans", loanController.getUserLoans);

loanRouter.post("/repay/:loanId", loanController.makeRepayment);

// Admin routes
loanRouter.use('/adringa', isAdmin);

loanRouter.get("/all", loanController.getAllLoans);

loanRouter.post("/approve/:loanId", loanController.approveLoan);

loanRouter.post("/reject/:loanId", loanController.rejectLoan);

export default loanRouter; 