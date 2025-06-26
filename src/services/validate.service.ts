import { z } from "zod";
import { TransactionType, TransactionStatus } from "@prisma/client";

export const UserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const AddBioSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  dob: z
    .string()
    .refine(
      (val) => !isNaN(Date.parse(val)),
      "Invalid date format (expected ISO 8601)",
    ),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

// Loan validation schemas
export const LoanApplicationSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  paymentMode: z.enum(["daily", "weekly", "monthly"]),
  guarantor1: z.object({
    name: z.string().min(1),
    phoneNumber: z.string().min(10),
    relationship: z.string().min(1),
  }),
  guarantor2: z.object({
    name: z.string().min(1),
    phoneNumber: z.string().min(10),
    relationship: z.string().min(1),
  }),
  personalInfo: z.object({
    image: z.string().min(1),
    signature: z.string().min(1),
  }),
  startDate: z.string().refine(
    (val) => !isNaN(Date.parse(val)),
    "Invalid start date format (expected ISO 8601)"
  ),
  endDate: z.string().refine(
    (val) => !isNaN(Date.parse(val)),
    "Invalid end date format (expected ISO 8601)"
  ),
});

export const RepaymentSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  paymentMethod: z.enum(["bank_transfer", "card", "wallet"]),
});

export const LoanApprovalSchema = z.object({
  rejectionReason: z.string().optional(),
});

// Wallet validation schemas
export const BVNVerificationSchema = z.object({
  bvn: z.string().length(11, "BVN must be 11 digits"),
});

export const BankAccountSchema = z.object({
  bankName: z.string().min(1, "Bank name is required"),
  accountNumber: z.string().min(10, "Account number must be at least 10 digits"),
  accountName: z.string().min(1, "Account name is required"),
  isDefault: z.boolean().optional(),
});

export const TransferSchema = z.object({
  recipientAccountNumber: z.string().min(10, "Account number must be at least 10 digits"),
  amount: z.number().positive("Amount must be positive"),
  description: z.string().optional(),
});

// Transaction validation schemas
export const TransactionQuerySchema = z.object({
  startDate: z.string().optional().refine(
    (val) => !val || !isNaN(Date.parse(val)),
    "Invalid start date format (expected ISO 8601)"
  ),
  endDate: z.string().optional().refine(
    (val) => !val || !isNaN(Date.parse(val)),
    "Invalid end date format (expected ISO 8601)"
  ),
  type: z.nativeEnum(TransactionType).optional(),
  status: z.nativeEnum(TransactionStatus).optional(),
  page: z.string().optional().transform(Number),
  limit: z.string().optional().transform(Number),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});
