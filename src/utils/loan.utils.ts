import { PaymentMode } from "@prisma/client";

interface RepaymentSchedule {
  dueDate: Date;
  amount: number;
  principal: number;
  interest: number;
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