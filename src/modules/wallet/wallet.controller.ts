import { Request, Response } from "express";
import { prisma } from "../../config/database";
import ApiError from "../../errors/ApiErrorHandler";
import { generateAccountNumber } from "../../utils/account.utils";
import { generateReference } from "../../utils/transaction.utils";
import { Prisma, TransactionType, TransactionStatus } from "@prisma/client";
import { BVNVerificationSchema, BankAccountSchema, TransferSchema } from "../../services/validate.service";

const walletController = {
  async verifyBVN(req: Request, res: Response): Promise<any> {
    try {
      const validation = BVNVerificationSchema.safeParse(req.body);
      if (!validation.success) {
        return ApiError(400, validation.error.errors.map(err => err.message).join(", "), res);
      }

      const { bvn } = validation.data;

      // TODO: Integrate with actual BVN verification service
      // This is a mock verification for now
      const isVerified = true; // Replace with actual verification logic

      if (!isVerified) {
        return ApiError(400, "BVN verification failed", res);
      }

      // Update user's BVN status
      const userId = req.user?.id;
      if (!userId) {
        return ApiError(401, "User not authenticated", res);
      }

      await prisma.user.update({
        where: { id: userId },
        data: {
          bvn,
          isBvnVerified: true
        }
      });

      return res.status(200).json({
        success: true,
        message: "BVN verified successfully"
      });
    } catch (err) {
      return ApiError(500, "Something went wrong", res);
    }
  },

  async createWallet(req: Request, res: Response): Promise<any> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return ApiError(401, "User not authenticated", res);
      }

      // Check if user has verified BVN
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user?.isBvnVerified) {
        return ApiError(400, "BVN verification required before creating wallet", res);
      }

      // Check if user already has a wallet
      const existingWallet = await prisma.wallet.findUnique({
        where: { userId }
      });

      if (existingWallet) {
        return ApiError(400, "Wallet already exists", res);
      }

      // Generate account number
      const accountNumber = await generateAccountNumber();

      // Create wallet
      const wallet = await prisma.wallet.create({
        data: {
          userId,
          accountNumber,
          accountName: `${user.firstName} ${user.lastName}`,
          balance: 0
        }
      });

      return res.status(201).json({
        success: true,
        message: "Wallet created successfully",
        data: {
          accountNumber: wallet.accountNumber,
          accountName: wallet.accountName,
          balance: wallet.balance
        }
      });
    } catch (err) {
      return ApiError(500, "Something went wrong", res);
    }
  },

  async getWalletDetails(req: Request, res: Response): Promise<any> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return ApiError(401, "User not authenticated", res);
      }

      const wallet = await prisma.wallet.findUnique({
        where: { userId }
      });

      if (!wallet) {
        return ApiError(404, "Wallet not found", res);
      }

      return res.status(200).json({
        success: true,
        data: {
          accountNumber: wallet.accountNumber,
          accountName: wallet.accountName,
          balance: wallet.balance
        }
      });
    } catch (err) {
      return ApiError(500, "Something went wrong", res);
    }
  },

  async topUpWallet(req: Request, res: Response): Promise<any> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return ApiError(401, "User not authenticated", res);
      }

      const { amount } = req.body;
      if (!amount || amount <= 0) {
        return ApiError(400, "Invalid amount", res);
      }

      const wallet = await prisma.wallet.findUnique({
        where: { userId }
      });

      if (!wallet) {
        return ApiError(404, "Wallet not found", res);
      }

      // Create transaction record
      const transaction = await prisma.transaction.create({
        data: {
          walletId: wallet.id,
          type: 'TOPUP',
          amount: Number(amount),
          reference: generateReference('TOPUP'),
          status: 'pending',
          description: 'Wallet top-up'
        }
      });

      // TODO: Integrate with payment gateway
      // For now, we'll simulate a successful payment
      await prisma.$transaction([
        prisma.transaction.update({
          where: { id: transaction.id },
          data: { amount: Number(amount), type: 'TOPUP', walletId: wallet.id, reference: generateReference('TOPUP'), status: 'successful', description: `Top-up of ${amount}`, metadata: {
            paymentMethod: 'paystack',
            paymentStatus: 'successful',
            paymentId: '1234567890',
            paymentDate: new Date()
          } }
        }),
        prisma.wallet.update({
          where: { id: wallet.id },
          data: { balance: wallet.balance + Number(amount) }
        })
      ]);

      return res.status(200).json({
        success: true,
        message: "Wallet topped up successfully",
        data: {
          transaction,
          newBalance: wallet.balance + Number(amount)
        }
      });
    } catch (err) {
      return ApiError(500, "Something went wrong", res);
    }
  },

  async transferToUser(req: Request, res: Response): Promise<any> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return ApiError(401, "User not authenticated", res);
      }

      const validation = TransferSchema.safeParse(req.body);
      if (!validation.success) {
        return ApiError(400, validation.error.errors.map(err => err.message).join(", "), res);
      }

      const { recipientAccountNumber, amount, description } = validation.data;

      // Get sender's wallet
      const senderWallet = await prisma.wallet.findUnique({
        where: { userId }
      });

      if (!senderWallet) {
        return ApiError(404, "Wallet not found", res);
      }

      if (senderWallet.balance < amount) {
        return ApiError(400, "Insufficient funds", res);
      }

      // Get recipient's wallet
      const recipientWallet = await prisma.wallet.findFirst({
        where: { accountNumber: recipientAccountNumber }
      });

      if (!recipientWallet) {
        return ApiError(404, "Recipient wallet not found", res);
      }

      // Generate transaction reference
      const reference = generateReference('TRANSFER');

      // Create transaction record
      const transaction = await prisma.transaction.create({
        data: {
          walletId: senderWallet.id,
          type: TransactionType.TRANSFER,
          amount,
          description: description || 'Transfer to user',
          reference,
          status: TransactionStatus.pending
        }
      });

      // Update sender's balance
      await prisma.wallet.update({
        where: { id: senderWallet.id },
        data: {
          balance: {
            decrement: amount
          }
        }
      });

      // Update recipient's balance
      await prisma.wallet.update({
        where: { id: recipientWallet.id },
        data: {
          balance: {
            increment: amount
          }
        }
      });

      // Update transaction status
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: TransactionStatus.successful
        }
      });

      return res.status(200).json({
        success: true,
        message: "Transfer successful",
        data: transaction
      });
    } catch (err) {
      return ApiError(500, "Something went wrong", res);
    }
  },

  async withdrawToBank(req: Request, res: Response): Promise<any> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return ApiError(401, "User not authenticated", res);
      }

      const { bankAccountId, amount } = req.body;
      if (!amount || amount <= 0) {
        return ApiError(400, "Invalid amount", res);
      }

      // Explicitly type wallet with bankAccounts
      const wallet = await prisma.wallet.findUnique({
        where: { userId },
        include: {
          bankAccounts: true
        }
      }) as (typeof prisma.wallet extends (...args: any) => infer R ? R : any) & { bankAccounts: Array<{ id: string; bankName: string; accountNumber: string; accountName: string; isDefault: boolean; }> };

      if (!wallet) {
        return ApiError(404, "Wallet not found", res);
      }

      if (wallet.balance < Number(amount)) {
        return ApiError(400, "Insufficient balance", res);
      }

      // Add explicit type for acc
      const bankAccount = wallet.bankAccounts.find((acc: { id: string }) => acc.id === bankAccountId);
      if (!bankAccount) {
        return ApiError(404, "Bank account not found", res);
      }

      // Create withdrawal transaction
      const transaction = await prisma.transaction.create({
        data: {
          walletId: wallet.id,
          type: 'WITHDRAWAL',
          amount: Number(amount),
          reference: generateReference('WITHDRAWAL'),
          status: 'pending',
          description: `Withdrawal to ${bankAccount.bankName}`,
          metadata: {
            bankName: bankAccount.bankName,
            accountNumber: bankAccount.accountNumber,
            accountName: bankAccount.accountName
          }
        }
      });

      // Simulate a successful withdrawal
      await prisma.$transaction([
        prisma.transaction.update({
          where: { id: transaction.id },
          data: { status: 'successful' }
        }),
        prisma.wallet.update({
          where: { id: wallet.id },
          data: { balance: wallet.balance - Number(amount) }
        })
      ]);

      return res.status(200).json({
        success: true,
        message: "Withdrawal successful",
        data: transaction
      });
    } catch (err) {
      return ApiError(500, "Something went wrong", res);
    }
  },

  async getStatement(req: Request, res: Response): Promise<any> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return ApiError(401, "User not authenticated", res);
      }

      const { startDate, endDate, type, page = 1, limit = 10 } = req.query;

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
        ...(type && { type: type as any })
      };

      const transactions = await prisma.transaction.findMany({
        where,
        orderBy: {
          createdAt: 'desc'
        },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit)
      });

      const total = await prisma.transaction.count({ where });

      return res.status(200).json({
        success: true,
        data: {
          transactions,
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

  async addBankAccount(req: Request, res: Response): Promise<any> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return ApiError(401, "User not authenticated", res);
      }

      const validation = BankAccountSchema.safeParse(req.body);
      if (!validation.success) {
        return ApiError(400, validation.error.errors.map(err => err.message).join(", "), res);
      }

      const { bankName, accountNumber, accountName, isDefault } = validation.data;

      const wallet = await prisma.wallet.findUnique({
        where: { userId }
      });

      if (!wallet) {
        return ApiError(404, "Wallet not found", res);
      }

      // If this is set as default, unset any existing default
      if (isDefault) {
        await prisma.bankAccount.updateMany({
          where: { walletId: wallet.id, isDefault: true },
          data: { isDefault: false }
        });
      }

      const bankAccount = await prisma.bankAccount.create({
        data: {
          walletId: wallet.id,
          bankName,
          accountNumber,
          accountName,
          isDefault: isDefault || false
        }
      });

      return res.status(201).json({
        success: true,
        message: "Bank account added successfully",
        data: bankAccount
      });
    } catch (err) {
      return ApiError(500, "Something went wrong", res);
    }
  }
};

export default walletController; 