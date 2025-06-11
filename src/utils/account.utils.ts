import { prisma } from "../config/database";

export const generateAccountNumber = async (): Promise<string> => {
  while (true) {
    // Generate a 10-digit account number
    const accountNumber = Math.floor(1000000000 + Math.random() * 9000000000).toString();
    
    // Check if account number already exists
    const existingWallet = await prisma.wallet.findFirst({
      where: { accountNumber }
    });

    if (!existingWallet) {
      return accountNumber;
    }
  }
}; 