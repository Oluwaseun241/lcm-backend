import { Request, Response } from "express";
import { prisma } from "../../config/database";
import ApiError from "../../errors/ApiErrorHandler";
import { Prisma } from "@prisma/client";

const transactionController = {
  async getTransactionHistory(req: Request, res: Response): Promise<any> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return ApiError(401, "User not authenticated", res);
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
      } = req.query;

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
            gte: new Date(startDate as string),
            lte: new Date(endDate as string)
          }
        }),
        ...(type && { type: type as any }),
        ...(status && { status: status as any })
      };

      const [transactions, total] = await Promise.all([
        prisma.transaction.findMany({
          where,
          orderBy: {
            [sortBy as string]: sortOrder
          },
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit),
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
            page: Number(page),
            limit: Number(limit),
            pages: Math.ceil(total / Number(limit))
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