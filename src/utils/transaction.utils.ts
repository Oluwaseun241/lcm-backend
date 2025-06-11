import { randomBytes } from 'crypto';

export const generateReference = (prefix: string): string => {
  const timestamp = Date.now().toString();
  const random = randomBytes(4).toString('hex').toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}; 