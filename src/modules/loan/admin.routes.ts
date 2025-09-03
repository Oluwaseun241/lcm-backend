import loanController from "./loan.controller";
import { Router } from "express";
import { isAdmin } from "../../middleware/admin.middleware";

const adminRouter: Router = Router();

// Admin routes
adminRouter.use(isAdmin);

adminRouter.get("/adringa/all", loanController.getAllLoans);

adminRouter.post("/adringa/approve/:loanId", loanController.approveLoan);

adminRouter.post("/adringa/reject/:loanId", loanController.rejectLoan);

export default adminRouter;
