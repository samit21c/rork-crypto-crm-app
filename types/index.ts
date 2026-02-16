export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'member';
  isActive: boolean;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
}

export type PaymentMode = 'Cash' | 'IMPS' | 'UPI';

export interface BuyTransaction {
  id: string;
  type: 'buy';
  volume: number;
  rate: number;
  senderName: string;
  paymentMode: PaymentMode;
  supplierId?: string;
  remarks: string;
  attachmentUri?: string;
  createdAt: string;
  createdBy: string;
}

export interface SellTransaction {
  id: string;
  type: 'sell';
  accountCHZbit: string;
  receiverName: string;
  volume: number;
  rate: number;
  sellVolume: number;
  profitMargin: number;
  balanceVolume: number;
  traderName: string;
  supplierId?: string;
  remarks: string;
  attachmentUri?: string;
  createdAt: string;
  createdBy: string;
}

export type Transaction = BuyTransaction | SellTransaction;

export type DepositMode = 'Bank Wire' | 'UPI' | 'Cash';
export type WithdrawMode = 'ATM' | 'Cheque' | 'UPI-Transfer';

export interface BankDeposit {
  id: string;
  code: string;
  depositorName: string;
  depositorBank: string;
  amount: number;
  mode: DepositMode;
  isVerified: boolean;
  verifiedBy?: string;
  createdAt: string;
  createdBy: string;
}

export interface BankWithdrawal {
  id: string;
  withdrawerName: string;
  withdrawBank: string;
  mode: WithdrawMode;
  amount: number;
  beneficiariesName?: string;
  depositCode?: string;
  createdAt: string;
  createdBy: string;
}

export type DueFrequency = 'Daily' | 'Weekly' | 'Monthly' | 'Specific Date';

export interface Client {
  id: string;
  name: string;
  city: string;
  contractFund: number;
  depositUID?: string;
  tradingFund: number;
  dividendsAmt: number;
  dueFrequency: DueFrequency;
  specificDueDate?: string;
  remarks: string;
  createdAt: string;
  createdBy: string;
}

export interface CompanyBank {
  id: string;
  bankName: string;
  city: string;
  accountNo: string;
  ifsc: string;
  closingBalance: number;
  lastBalanceUpdate: string;
  createdAt: string;
  createdBy: string;
}

export type DividendStatus = 'Pending' | 'Paid' | 'Overdue';

export interface Dividend {
  id: string;
  clientId: string;
  dueDate: string;
  paidAmount: number;
  totalPaid: number;
  nextDueDate: string;
  assignedBankId?: string;
  status: DividendStatus;
  remarks: string;
  createdAt: string;
  createdBy: string;
}

export type HistoryAction = 'Create' | 'Update' | 'Delete';
export type HistorySection = 'Client' | 'CompanyBank' | 'Deposit' | 'Withdrawal' | 'BuyTrade' | 'SellTrade' | 'Dividend' | 'Supplier';

export interface HistoryEntry {
  id: string;
  section: HistorySection;
  action: HistoryAction;
  entityId: string;
  entityLabel: string;
  userId: string;
  userName: string;
  before?: string;
  after?: string;
  timestamp: string;
}

export interface DashboardStats {
  totalBuyVolume: number;
  totalSellVolume: number;
  totalProfit: number;
  activeSuppliers: number;
  avgBuyRate: number;
  avgSellRate: number;
  balanceVolume: number;
  todayBuyVolume: number;
  todaySellVolume: number;
  totalDeposited: number;
  totalWithdrawn: number;
  netBankFunds: number;
  totalClients: number;
  totalContractFunds: number;
  totalDividendsPaid: number;
  pendingDividends: number;
  totalBankBalance: number;
}
