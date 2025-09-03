import { Request, Response } from "express";
import { prisma } from "../../config/database";
import ApiError from "../../errors/ApiErrorHandler";
import { calculateRepaymentSchedule, calculateUserLoanLimit } from "../../utils/loan.utils";
import { LoanApplicationSchema, RepaymentSchema, LoanApprovalSchema } from "../../services/validate.service";

const loanController = {
  async applyForLoan(req: Request, res: Response): Promise<any> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return ApiError(401, "User not authenticated", res);
      }

      const validation = LoanApplicationSchema.safeParse(req.body);
      if (!validation.success) {
        return ApiError(400, validation.error.errors.map(err => err.message).join(", "), res);
      }

      const {
        amount,
        paymentMode,
        guarantor1,
        guarantor2,
        personalInfo,
        startDate,
        endDate
      } = validation.data;

      // Calculate interest and total amount
      const interestRate = 0.005; // 0.5% interest rate
      const totalAmount = Number(amount) * (1 + interestRate);

      // Create loan application
      const loan = await prisma.loan.create({
        data: {
          userId,
          amount,
          interestRate,
          totalAmount,
          remainingAmount: totalAmount,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          paymentMode,
          guarantor1,
          guarantor2,
          personalInfo,
          repaymentSchedule: JSON.stringify(calculateRepaymentSchedule(
            Number(amount),
            interestRate,
            paymentMode,
            new Date(startDate),
            new Date(endDate)
          ))
        }
      });

      return res.status(201).json({
        success: true,
        message: "Loan application submitted successfully",
        data: loan
      });
    } catch (err) {
      return ApiError(500, "Something went wrong", res);
    }
  },

  async getLoanStatus(req: Request, res: Response): Promise<any> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return ApiError(401, "User not authenticated", res);
      }

      const { loanId } = req.params;

      const loan = await prisma.loan.findFirst({
        where: {
          id: loanId,
          userId
        },
        include: {
          repayments: true
        }
      });

      if (!loan) {
        return ApiError(404, "Loan not found", res);
      }

      return res.status(200).json({
        success: true,
        data: loan
      });
    } catch (err) {
      return ApiError(500, "Something went wrong", res);
    }
  },

  async getUserLoans(req: Request, res: Response): Promise<any> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return ApiError(401, "User not authenticated", res);
      }

      // Get user's loans
      const loans = await prisma.loan.findMany({
        where: { userId },
        include: {
          repayments: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      // Get user's wallet balance
      const wallet = await prisma.wallet.findUnique({
        where: { userId },
        select: { balance: true }
      });

      // Calculate loan limit
      const loanLimit = calculateUserLoanLimit(
        wallet?.balance || 0,
        loans.map(loan => ({
          amount: Number(loan.amount),
          remainingAmount: Number(loan.remainingAmount),
          status: loan.status
        }))
      );

      return res.status(200).json({
        success: true,
        data: {
          loans,
          loanLimit,
          limitFactors: {
            walletBalance: wallet?.balance || 0,
            totalLoans: loans.length,
            approvedLoans: loans.filter(l => ['approved', 'disbursed'].includes(l.status)).length,
            pendingLoans: loans.filter(l => l.status === 'pending').length,
            completedLoans: loans.filter(l => l.status === 'completed').length,
            defaultedLoans: loans.filter(l => l.status === 'defaulted').length,
            totalLoanAmount: loans.reduce((sum, l) => sum + Number(l.amount), 0),
            outstandingAmount: loans
              .filter(l => ['approved', 'disbursed'].includes(l.status))
              .reduce((sum, l) => sum + Number(l.remainingAmount), 0)
          }
        }
      });
    } catch (err) {
      return ApiError(500, "Something went wrong", res);
    }
  },

  async makeRepayment(req: Request, res: Response): Promise<any> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return ApiError(401, "User not authenticated", res);
      }

      const { loanId } = req.params;
      
      const validation = RepaymentSchema.safeParse(req.body);
      if (!validation.success) {
        return ApiError(400, validation.error.errors.map(err => err.message).join(", "), res);
      }

      const { amount, paymentMethod } = validation.data;

      const loan = await prisma.loan.findFirst({
        where: {
          id: loanId,
          userId
        }
      });

      if (!loan) {
        return ApiError(404, "Loan not found", res);
      }

      if (loan.status !== 'approved' && loan.status !== 'disbursed') {
        return ApiError(400, "Loan is not in a state that allows repayment", res);
      }

      // Generate unique reference
      const reference = `REP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const repayment = await prisma.repayment.create({
        data: {
          loanId,
          amount,
          paymentMethod,
          reference
        }
      });

      // Update loan remaining amount
      await prisma.loan.update({
        where: { id: loanId },
        data: {
          remainingAmount: Number(loan.remainingAmount) - Number(amount),
          status: Number(loan.remainingAmount) - Number(amount) <= 0 ? 'completed' : 'disbursed'
        }
      });

      return res.status(201).json({
        success: true,
        message: "Repayment recorded successfully",
        data: repayment
      });
    } catch (err) {
      return ApiError(500, "Something went wrong", res);
    }
  },

  // Admin endpoints
  async getAllLoans(req: Request, res: Response): Promise<any> {
    try {
      const { status, page = 1, limit = 10 } = req.query;
      
      const where = status ? { status: status as any } : {};
      
      const loans = await prisma.loan.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phoneNumber: true
            }
          },
          repayments: true
        },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: {
          createdAt: 'desc'
        }
      });

      const total = await prisma.loan.count({ where });

      return res.status(200).json({
        success: true,
        data: loans,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (err) {
      return ApiError(500, "Something went wrong", res);
    }
  },

  async approveLoan(req: Request, res: Response): Promise<any> {
    try {
      const { loanId } = req.params;
      
      const validation = LoanApprovalSchema.safeParse(req.body);
      if (!validation.success) {
        return ApiError(400, validation.error.errors.map(err => err.message).join(", "), res);
      }

      const { rejectionReason } = validation.data;

      const loan = await prisma.loan.findUnique({
        where: { id: loanId }
      });

      if (!loan) {
        return ApiError(404, "Loan not found", res);
      }

      if (loan.status !== 'pending') {
        return ApiError(400, "Loan is not in pending state", res);
      }

      const updatedLoan = await prisma.loan.update({
        where: { id: loanId },
        data: {
          status: 'approved',
          approvedBy: req.user?.id,
          approvedAt: new Date(),
          rejectionReason: null
        }
      });

      return res.status(200).json({
        success: true,
        message: "Loan approved successfully",
        data: updatedLoan
      });
    } catch (err) {
      return ApiError(500, "Something went wrong", res);
    }
  },

  async rejectLoan(req: Request, res: Response): Promise<any> {
    try {
      const { loanId } = req.params;
      
      const validation = LoanApprovalSchema.safeParse(req.body);
      if (!validation.success) {
        return ApiError(400, validation.error.errors.map(err => err.message).join(", "), res);
      }

      const { rejectionReason } = validation.data;

      if (!rejectionReason) {
        return ApiError(400, "Rejection reason is required", res);
      }

      const loan = await prisma.loan.findUnique({
        where: { id: loanId }
      });

      if (!loan) {
        return ApiError(404, "Loan not found", res);
      }

      if (loan.status !== 'pending') {
        return ApiError(400, "Loan is not in pending state", res);
      }

      const updatedLoan = await prisma.loan.update({
        where: { id: loanId },
        data: {
          status: 'declined',
          rejectionReason
        }
      });

      return res.status(200).json({
        success: true,
        message: "Loan rejected successfully",
        data: updatedLoan
      });
    } catch (err) {
      return ApiError(500, "Something went wrong", res);
    }
  }
};

export default loanController; 