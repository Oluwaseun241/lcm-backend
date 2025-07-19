import loanController from "./loan.controller";
import { Router } from "express";
import { isAdmin } from "../../middleware/admin.middleware";

const adminRouter: Router = Router();

// Admin routes
adminRouter.use('/adringa', isAdmin);

adminRouter.get("/all", loanController.getAllLoans);

adminRouter.post("/approve/:loanId", loanController.approveLoan);

adminRouter.post("/reject/:loanId", loanController.rejectLoan);

export default adminRouter;
