import { PaymentMode } from "@prisma/client";

interface RepaymentSchedule {
  dueDate: Date;
  amount: number;
  principal: number;
  interest: number;
}

interface LoanLimitInfo {
  availableLimit: number;
  totalLimit: number;
  usedLimit: number;
  maxLoanAmount: number;
}

export const calculateRepaymentSchedule = (
  principal: number,
  interestRate: number,
  paymentMode: PaymentMode,
  startDate: Date,
  endDate: Date
): RepaymentSchedule[] => {
  const schedule: RepaymentSchedule[] = [];
  const totalAmount = principal * (1 + interestRate);
  const totalInterest = totalAmount - principal;

  let currentDate = new Date(startDate);
  const endDateTime = new Date(endDate);

  switch (paymentMode) {
    case 'daily':
      while (currentDate <= endDateTime) {
        schedule.push({
          dueDate: new Date(currentDate),
          amount: totalAmount / getDaysBetween(startDate, endDate),
          principal: principal / getDaysBetween(startDate, endDate),
          interest: totalInterest / getDaysBetween(startDate, endDate)
        });
        currentDate.setDate(currentDate.getDate() + 1);
      }
      break;

    case 'weekly':
      while (currentDate <= endDateTime) {
        schedule.push({
          dueDate: new Date(currentDate),
          amount: totalAmount / getWeeksBetween(startDate, endDate),
          principal: principal / getWeeksBetween(startDate, endDate),
          interest: totalInterest / getWeeksBetween(startDate, endDate)
        });
        currentDate.setDate(currentDate.getDate() + 7);
      }
      break;

    case 'monthly':
      while (currentDate <= endDateTime) {
        schedule.push({
          dueDate: new Date(currentDate),
          amount: totalAmount / getMonthsBetween(startDate, endDate),
          principal: principal / getMonthsBetween(startDate, endDate),
          interest: totalInterest / getMonthsBetween(startDate, endDate)
        });
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
      break;
  }

  return schedule;
};

/**
 * Calculates the user's loan limit based on multiple factors:
 * 
 * 1. **Base Limit**: Minimum ₦100,000 for all users
 * 2. **Wallet Balance**: 3x wallet balance (shows financial capacity)
 * 3. **Loan Portfolio**: 1.2x total loan portfolio (shows creditworthiness)
 * 4. **Credit History**: 
 *    - +₦50,000 bonus per completed loan
 *    - -20% penalty per defaulted loan
 * 5. **Available Limit**: Base limit - outstanding loans
 * 6. **Max Single Loan**: 60% of total limit or available limit (whichever is lower)
 * 
 * @param walletBalance - User's current wallet balance
 * @param existingLoans - Array of user's existing loans with amounts and statuses
 * @param monthlyIncome - Optional monthly income for more accurate calculation
 * @returns LoanLimitInfo object with calculated limits
 */
export const calculateUserLoanLimit = (
  walletBalance: number,
  existingLoans: Array<{ amount: number; remainingAmount: number; status: string }>,
  monthlyIncome?: number
): LoanLimitInfo => {
  // Input validation
  if (walletBalance < 0) walletBalance = 0;
  if (!Array.isArray(existingLoans)) existingLoans = [];
  
  // Calculate total outstanding loan amount (only approved and disbursed loans)
  const outstandingLoans = existingLoans
    .filter(loan => ['approved', 'disbursed'].includes(loan.status))
    .reduce((total, loan) => total + Number(loan.remainingAmount || 0), 0);
  
  // Calculate total loan portfolio (all loans including pending)
  const totalLoanPortfolio = existingLoans.reduce((total, loan) => total + Number(loan.amount || 0), 0);
  
  // Calculate completed loans (for creditworthiness assessment)
  const completedLoans = existingLoans.filter(loan => loan.status === 'completed').length;
  const defaultedLoans = existingLoans.filter(loan => loan.status === 'defaulted').length;
  
  // Base loan limit calculation - more realistic approach
  let baseLimit = 100000; // Minimum ₦100,000
  
  // Increase limit based on wallet balance
  if (walletBalance > 0) {
    baseLimit = Math.max(baseLimit, walletBalance * 3);
  }
  
  // Increase limit based on loan portfolio (shows creditworthiness)
  if (totalLoanPortfolio > 0) {
    baseLimit = Math.max(baseLimit, totalLoanPortfolio * 1.2);
  }
  
  // Bonus for good credit history (completed loans)
  if (completedLoans > 0) {
    baseLimit += completedLoans * 50000; // ₦50,000 bonus per completed loan
  }
  
  // Penalty for bad credit history (defaulted loans)
  if (defaultedLoans > 0) {
    baseLimit = Math.max(100000, baseLimit * (1 - (defaultedLoans * 0.2))); // 20% reduction per default
  }
  
  // Calculate available limit (base limit - outstanding loans)
  const availableLimit = Math.max(0, baseLimit - outstandingLoans);
  
  // Maximum single loan amount (usually 40-60% of total limit)
  const maxLoanAmount = Math.min(availableLimit, baseLimit * 0.6);
  
  return {
    availableLimit: Math.round(availableLimit * 100) / 100, // Round to 2 decimal places
    totalLimit: Math.round(baseLimit * 100) / 100,
    usedLimit: Math.round(outstandingLoans * 100) / 100,
    maxLoanAmount: Math.round(maxLoanAmount * 100) / 100
  };
};

const getDaysBetween = (start: Date, end: Date): number => {
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
};

const getWeeksBetween = (start: Date, end: Date): number => {
  return Math.ceil(getDaysBetween(start, end) / 7);
};

const getMonthsBetween = (start: Date, end: Date): number => {
  return (end.getFullYear() - start.getFullYear()) * 12 + 
         (end.getMonth() - start.getMonth()) + 1;
}; 