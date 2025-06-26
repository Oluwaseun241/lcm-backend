import { Request, Response } from "express";
import { prisma } from "../../config/database";
import ApiError from "../../errors/ApiErrorHandler";
import { Prisma } from "@prisma/client";
import { TransactionQuerySchema } from "../../services/validate.service";

const transactionController = {
  async getTransactionHistory(req: Request, res: Response): Promise<any> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return ApiError(401, "User not authenticated", res);
      }

      const validation = TransactionQuerySchema.safeParse(req.query);
      if (!validation.success) {
        return ApiError(400, validation.error.errors.map(err => err.message).join(", "), res);
      }

      const { 
        startDate, 
        endDate, 
        type, 
        status,
        page = 1, 
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = validation.data;

      const wallet = await prisma.wallet.findUnique({
        where: { userId }
      });

      if (!wallet) {
        return ApiError(404, "Wallet not found", res);
      }

      const where: Prisma.TransactionWhereInput = {
        walletId: wallet.id,
        ...(startDate && endDate && {
          createdAt: {
            gte: new Date(startDate),
            lte: new Date(endDate)
          }
        }),
        ...(type && { type }),
        ...(status && { status })
      };

      const [transactions, total] = await Promise.all([
        prisma.transaction.findMany({
          where,
          orderBy: {
            [sortBy]: sortOrder
          },
          skip: (page - 1) * limit,
          take: limit,
          include: {
            wallet: {
              select: {
                accountNumber: true,
                accountName: true
              }
            }
          }
        }),
        prisma.transaction.count({ where })
      ]);

      // Calculate summary statistics
      const summary = await prisma.transaction.groupBy({
        by: ['type'],
        where,
        _sum: {
          amount: true
        },
        _count: true
      });

      return res.status(200).json({
        success: true,
        data: {
          transactions,
          summary: summary.reduce((acc, curr) => ({
            ...acc,
            [curr.type]: {
              totalAmount: curr._sum.amount,
              count: curr._count
            }
          }), {}),
          pagination: {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit)
          }
        }
      });
    } catch (err) {
      return ApiError(500, "Something went wrong", res);
    }
  },

  async getTransactionById(req: Request, res: Response): Promise<any> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return ApiError(401, "User not authenticated", res);
      }

      const { id } = req.params;

      const wallet = await prisma.wallet.findUnique({
        where: { userId }
      });

      if (!wallet) {
        return ApiError(404, "Wallet not found", res);
      }

      const transaction = await prisma.transaction.findFirst({
        where: {
          id,
          walletId: wallet.id
        },
        include: {
          wallet: {
            select: {
              accountNumber: true,
              accountName: true
            }
          }
        }
      });

      if (!transaction) {
        return ApiError(404, "Transaction not found", res);
      }

      return res.status(200).json({
        success: true,
        data: transaction
      });
    } catch (err) {
      return ApiError(500, "Something went wrong", res);
    }
  }
};

export default transactionController; 