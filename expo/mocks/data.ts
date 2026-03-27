import { User, Supplier, BuyTransaction, SellTransaction, BankDeposit, BankWithdrawal, Client, CompanyBank, Dividend, HistoryEntry, CashInHand } from '@/types';

export const SAMPLE_USERS: User[] = [];

export const SAMPLE_SUPPLIERS: Supplier[] = [];

export const SAMPLE_BUY_TRANSACTIONS: BuyTransaction[] = [];

export const SAMPLE_SELL_TRANSACTIONS: SellTransaction[] = [];

export const PAYMENT_MODES = ['Cash', 'IMPS', 'UPI'] as const;
export const DEPOSIT_MODES = ['Bank Wire', 'UPI', 'Cash'] as const;
export const WITHDRAW_MODES = ['ATM', 'Cheque', 'UPI-Transfer'] as const;
export const DUE_FREQUENCIES = ['Daily', 'Weekly', 'Monthly', 'Specific Date'] as const;

export const SAMPLE_DEPOSITS: BankDeposit[] = [];

export const SAMPLE_WITHDRAWALS: BankWithdrawal[] = [];

export const SAMPLE_CLIENTS: Client[] = [];

export const SAMPLE_COMPANY_BANKS: CompanyBank[] = [];

export const SAMPLE_DIVIDENDS: Dividend[] = [];

export const HOLD_PURPOSES = ['Trading Capital', 'Client Settlement', 'Emergency Fund', 'Operational Expense', 'Petty Cash'] as const;

export const SAMPLE_CASH_IN_HAND: CashInHand[] = [];

export const SAMPLE_HISTORY: HistoryEntry[] = [];
