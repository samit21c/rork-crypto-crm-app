import { useState, useEffect, useMemo, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BuyTransaction, SellTransaction, Supplier, Transaction, DashboardStats,
  BankDeposit, BankWithdrawal, Client, CompanyBank, Dividend, HistoryEntry,
  HistorySection, HistoryAction,
} from '@/types';
import {
  SAMPLE_BUY_TRANSACTIONS, SAMPLE_SELL_TRANSACTIONS, SAMPLE_SUPPLIERS,
  SAMPLE_DEPOSITS, SAMPLE_WITHDRAWALS, SAMPLE_CLIENTS, SAMPLE_COMPANY_BANKS,
  SAMPLE_DIVIDENDS, SAMPLE_HISTORY,
} from '@/mocks/data';

const BUY_KEY = '@usdt_crm_buy';
const SELL_KEY = '@usdt_crm_sell';
const SUPPLIERS_KEY = '@usdt_crm_suppliers';
const DEPOSITS_KEY = '@usdt_crm_deposits';
const WITHDRAWALS_KEY = '@usdt_crm_withdrawals';
const CLIENTS_KEY = '@usdt_crm_clients';
const COMPANY_BANKS_KEY = '@usdt_crm_company_banks';
const DIVIDENDS_KEY = '@usdt_crm_dividends';
const HISTORY_KEY = '@usdt_crm_history';

function generateDepositCode(): string {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let suffix = '';
  for (let i = 0; i < 4; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `DEP-${dateStr}-${suffix}`;
}

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
}

export { generateDepositCode, generateId };

async function loadOrSeed<T>(key: string, seed: T[]): Promise<T[]> {
  const stored = await AsyncStorage.getItem(key);
  if (stored) return JSON.parse(stored) as T[];
  await AsyncStorage.setItem(key, JSON.stringify(seed));
  return seed;
}

export const [DataProvider, useData] = createContextHook(() => {
  const [buyTransactions, setBuyTransactions] = useState<BuyTransaction[]>([]);
  const [sellTransactions, setSellTransactions] = useState<SellTransaction[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [deposits, setDeposits] = useState<BankDeposit[]>([]);
  const [withdrawals, setWithdrawals] = useState<BankWithdrawal[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [companyBanks, setCompanyBanks] = useState<CompanyBank[]>([]);
  const [dividends, setDividends] = useState<Dividend[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const queryClient = useQueryClient();

  const buyQuery = useQuery({ queryKey: ['buyTransactions'], queryFn: () => loadOrSeed(BUY_KEY, SAMPLE_BUY_TRANSACTIONS) });
  const sellQuery = useQuery({ queryKey: ['sellTransactions'], queryFn: () => loadOrSeed(SELL_KEY, SAMPLE_SELL_TRANSACTIONS) });
  const suppliersQuery = useQuery({ queryKey: ['suppliers'], queryFn: () => loadOrSeed(SUPPLIERS_KEY, SAMPLE_SUPPLIERS) });
  const depositsQuery = useQuery({ queryKey: ['deposits'], queryFn: () => loadOrSeed(DEPOSITS_KEY, SAMPLE_DEPOSITS) });
  const withdrawalsQuery = useQuery({ queryKey: ['withdrawals'], queryFn: () => loadOrSeed(WITHDRAWALS_KEY, SAMPLE_WITHDRAWALS) });
  const clientsQuery = useQuery({ queryKey: ['clients'], queryFn: () => loadOrSeed(CLIENTS_KEY, SAMPLE_CLIENTS) });
  const companyBanksQuery = useQuery({ queryKey: ['companyBanks'], queryFn: () => loadOrSeed(COMPANY_BANKS_KEY, SAMPLE_COMPANY_BANKS) });
  const dividendsQuery = useQuery({ queryKey: ['dividends'], queryFn: () => loadOrSeed(DIVIDENDS_KEY, SAMPLE_DIVIDENDS) });
  const historyQuery = useQuery({ queryKey: ['history'], queryFn: () => loadOrSeed(HISTORY_KEY, SAMPLE_HISTORY) });

  useEffect(() => { if (buyQuery.data) setBuyTransactions(buyQuery.data); }, [buyQuery.data]);
  useEffect(() => { if (sellQuery.data) setSellTransactions(sellQuery.data); }, [sellQuery.data]);
  useEffect(() => { if (suppliersQuery.data) setSuppliers(suppliersQuery.data); }, [suppliersQuery.data]);
  useEffect(() => { if (depositsQuery.data) setDeposits(depositsQuery.data); }, [depositsQuery.data]);
  useEffect(() => { if (withdrawalsQuery.data) setWithdrawals(withdrawalsQuery.data); }, [withdrawalsQuery.data]);
  useEffect(() => { if (clientsQuery.data) setClients(clientsQuery.data); }, [clientsQuery.data]);
  useEffect(() => { if (companyBanksQuery.data) setCompanyBanks(companyBanksQuery.data); }, [companyBanksQuery.data]);
  useEffect(() => { if (dividendsQuery.data) setDividends(dividendsQuery.data); }, [dividendsQuery.data]);
  useEffect(() => { if (historyQuery.data) setHistory(historyQuery.data); }, [historyQuery.data]);

  const persist = useCallback(async <T,>(key: string, data: T[], setter: (d: T[]) => void, qKey: string) => {
    await AsyncStorage.setItem(key, JSON.stringify(data));
    setter(data);
    queryClient.setQueryData([qKey], data);
  }, [queryClient]);

  const saveBuy = useCallback((data: BuyTransaction[]) => persist(BUY_KEY, data, setBuyTransactions, 'buyTransactions'), [persist]);
  const saveSell = useCallback((data: SellTransaction[]) => persist(SELL_KEY, data, setSellTransactions, 'sellTransactions'), [persist]);
  const saveSuppliers = useCallback((data: Supplier[]) => persist(SUPPLIERS_KEY, data, setSuppliers, 'suppliers'), [persist]);
  const saveDeposits = useCallback((data: BankDeposit[]) => persist(DEPOSITS_KEY, data, setDeposits, 'deposits'), [persist]);
  const saveWithdrawals = useCallback((data: BankWithdrawal[]) => persist(WITHDRAWALS_KEY, data, setWithdrawals, 'withdrawals'), [persist]);
  const saveClients = useCallback((data: Client[]) => persist(CLIENTS_KEY, data, setClients, 'clients'), [persist]);
  const saveCompanyBanks = useCallback((data: CompanyBank[]) => persist(COMPANY_BANKS_KEY, data, setCompanyBanks, 'companyBanks'), [persist]);
  const saveDividends = useCallback((data: Dividend[]) => persist(DIVIDENDS_KEY, data, setDividends, 'dividends'), [persist]);
  const saveHistory = useCallback((data: HistoryEntry[]) => persist(HISTORY_KEY, data, setHistory, 'history'), [persist]);

  const addHistoryEntry = useCallback(async (
    section: HistorySection, action: HistoryAction, entityId: string, entityLabel: string,
    userId: string, userName: string, before?: string, after?: string
  ) => {
    const entry: HistoryEntry = {
      id: generateId('hist'),
      section, action, entityId, entityLabel, userId, userName, before, after,
      timestamp: new Date().toISOString(),
    };
    const updated = [entry, ...history];
    await saveHistory(updated);
    return entry;
  }, [history, saveHistory]);

  const addBuyMutation = useMutation({ mutationFn: async (tx: BuyTransaction) => { await saveBuy([tx, ...buyTransactions]); } });
  const addSellMutation = useMutation({ mutationFn: async (tx: SellTransaction) => { await saveSell([tx, ...sellTransactions]); } });
  const updateBuyMutation = useMutation({ mutationFn: async (tx: BuyTransaction) => { await saveBuy(buyTransactions.map(t => t.id === tx.id ? tx : t)); } });
  const updateSellMutation = useMutation({ mutationFn: async (tx: SellTransaction) => { await saveSell(sellTransactions.map(t => t.id === tx.id ? tx : t)); } });
  const deleteBuyMutation = useMutation({ mutationFn: async (id: string) => { await saveBuy(buyTransactions.filter(t => t.id !== id)); } });
  const deleteSellMutation = useMutation({ mutationFn: async (id: string) => { await saveSell(sellTransactions.filter(t => t.id !== id)); } });

  const addSupplierMutation = useMutation({ mutationFn: async (s: Supplier) => { await saveSuppliers([...suppliers, s]); } });
  const updateSupplierMutation = useMutation({ mutationFn: async (s: Supplier) => { await saveSuppliers(suppliers.map(sup => sup.id === s.id ? s : sup)); } });
  const deleteSupplierMutation = useMutation({ mutationFn: async (id: string) => { await saveSuppliers(suppliers.filter(s => s.id !== id)); } });

  const addDepositMutation = useMutation({ mutationFn: async (d: BankDeposit) => { await saveDeposits([d, ...deposits]); } });
  const updateDepositMutation = useMutation({ mutationFn: async (d: BankDeposit) => { await saveDeposits(deposits.map(dep => dep.id === d.id ? d : dep)); } });
  const deleteDepositMutation = useMutation({ mutationFn: async (id: string) => { await saveDeposits(deposits.filter(d => d.id !== id)); } });

  const addWithdrawalMutation = useMutation({ mutationFn: async (w: BankWithdrawal) => { await saveWithdrawals([w, ...withdrawals]); } });
  const updateWithdrawalMutation = useMutation({ mutationFn: async (w: BankWithdrawal) => { await saveWithdrawals(withdrawals.map(wth => wth.id === w.id ? w : wth)); } });
  const deleteWithdrawalMutation = useMutation({ mutationFn: async (id: string) => { await saveWithdrawals(withdrawals.filter(w => w.id !== id)); } });

  const addClientMutation = useMutation({ mutationFn: async (c: Client) => { await saveClients([c, ...clients]); } });
  const updateClientMutation = useMutation({ mutationFn: async (c: Client) => { await saveClients(clients.map(cl => cl.id === c.id ? c : cl)); } });
  const deleteClientMutation = useMutation({ mutationFn: async (id: string) => { await saveClients(clients.filter(c => c.id !== id)); } });

  const addCompanyBankMutation = useMutation({ mutationFn: async (b: CompanyBank) => { await saveCompanyBanks([b, ...companyBanks]); } });
  const updateCompanyBankMutation = useMutation({ mutationFn: async (b: CompanyBank) => { await saveCompanyBanks(companyBanks.map(bk => bk.id === b.id ? b : bk)); } });
  const deleteCompanyBankMutation = useMutation({ mutationFn: async (id: string) => { await saveCompanyBanks(companyBanks.filter(b => b.id !== id)); } });

  const addDividendMutation = useMutation({ mutationFn: async (d: Dividend) => { await saveDividends([d, ...dividends]); } });
  const updateDividendMutation = useMutation({ mutationFn: async (d: Dividend) => { await saveDividends(dividends.map(dv => dv.id === d.id ? d : dv)); } });
  const deleteDividendMutation = useMutation({ mutationFn: async (id: string) => { await saveDividends(dividends.filter(d => d.id !== id)); } });

  const stats: DashboardStats = useMemo(() => {
    const totalBuyVolume = buyTransactions.reduce((sum, t) => sum + t.volume, 0);
    const totalSellVolume = sellTransactions.reduce((sum, t) => sum + t.sellVolume, 0);
    const totalProfit = sellTransactions.reduce((sum, t) => sum + t.profitMargin, 0);
    const totalBuyValue = buyTransactions.reduce((sum, t) => sum + (t.volume * t.rate), 0);
    const totalSellValue = sellTransactions.reduce((sum, t) => sum + (t.sellVolume * t.rate), 0);
    const avgBuyRate = totalBuyVolume > 0 ? totalBuyValue / totalBuyVolume : 0;
    const avgSellRate = totalSellVolume > 0 ? totalSellValue / totalSellVolume : 0;

    const today = new Date().toISOString().split('T')[0];
    const todayBuyVolume = buyTransactions.filter(t => t.createdAt.startsWith(today)).reduce((sum, t) => sum + t.volume, 0);
    const todaySellVolume = sellTransactions.filter(t => t.createdAt.startsWith(today)).reduce((sum, t) => sum + t.sellVolume, 0);

    const totalDeposited = deposits.reduce((sum, d) => sum + d.amount, 0);
    const totalWithdrawn = withdrawals.reduce((sum, w) => sum + w.amount, 0);

    const totalClients = clients.length;
    const totalContractFunds = clients.reduce((sum, c) => sum + c.contractFund, 0);
    const totalDividendsPaid = dividends.filter(d => d.status === 'Paid').reduce((sum, d) => sum + d.paidAmount, 0);
    const pendingDividends = dividends.filter(d => d.status === 'Pending' || d.status === 'Overdue').length;
    const totalBankBalance = companyBanks.reduce((sum, b) => sum + b.closingBalance, 0);

    return {
      totalBuyVolume, totalSellVolume, totalProfit,
      activeSuppliers: suppliers.length,
      avgBuyRate, avgSellRate,
      balanceVolume: totalBuyVolume - totalSellVolume,
      todayBuyVolume, todaySellVolume,
      totalDeposited, totalWithdrawn,
      netBankFunds: totalDeposited - totalWithdrawn,
      totalClients, totalContractFunds, totalDividendsPaid, pendingDividends, totalBankBalance,
    };
  }, [buyTransactions, sellTransactions, suppliers, deposits, withdrawals, clients, companyBanks, dividends]);

  const getSupplierName = useCallback((id?: string) => {
    if (!id) return 'N/A';
    return suppliers.find(s => s.id === id)?.name ?? 'Unknown';
  }, [suppliers]);

  const getClientName = useCallback((id?: string) => {
    if (!id) return 'N/A';
    return clients.find(c => c.id === id)?.name ?? 'Unknown';
  }, [clients]);

  const getBankName = useCallback((id?: string) => {
    if (!id) return 'N/A';
    return companyBanks.find(b => b.id === id)?.bankName ?? 'Unknown';
  }, [companyBanks]);

  const allTransactions: Transaction[] = useMemo(() => {
    return [...buyTransactions, ...sellTransactions].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [buyTransactions, sellTransactions]);

  const isLoading = buyQuery.isLoading || sellQuery.isLoading || suppliersQuery.isLoading ||
    depositsQuery.isLoading || withdrawalsQuery.isLoading || clientsQuery.isLoading ||
    companyBanksQuery.isLoading || dividendsQuery.isLoading || historyQuery.isLoading;

  return {
    buyTransactions, sellTransactions, suppliers, deposits, withdrawals,
    clients, companyBanks, dividends, history,
    stats, allTransactions, isLoading,
    addBuy: addBuyMutation.mutateAsync,
    addSell: addSellMutation.mutateAsync,
    updateBuy: updateBuyMutation.mutateAsync,
    updateSell: updateSellMutation.mutateAsync,
    deleteBuy: deleteBuyMutation.mutateAsync,
    deleteSell: deleteSellMutation.mutateAsync,
    addSupplier: addSupplierMutation.mutateAsync,
    updateSupplier: updateSupplierMutation.mutateAsync,
    deleteSupplier: deleteSupplierMutation.mutateAsync,
    addDeposit: addDepositMutation.mutateAsync,
    updateDeposit: updateDepositMutation.mutateAsync,
    deleteDeposit: deleteDepositMutation.mutateAsync,
    addWithdrawal: addWithdrawalMutation.mutateAsync,
    updateWithdrawal: updateWithdrawalMutation.mutateAsync,
    deleteWithdrawal: deleteWithdrawalMutation.mutateAsync,
    addClient: addClientMutation.mutateAsync,
    updateClient: updateClientMutation.mutateAsync,
    deleteClient: deleteClientMutation.mutateAsync,
    addCompanyBank: addCompanyBankMutation.mutateAsync,
    updateCompanyBank: updateCompanyBankMutation.mutateAsync,
    deleteCompanyBank: deleteCompanyBankMutation.mutateAsync,
    addDividend: addDividendMutation.mutateAsync,
    updateDividend: updateDividendMutation.mutateAsync,
    deleteDividend: deleteDividendMutation.mutateAsync,
    addHistoryEntry,
    getSupplierName, getClientName, getBankName,
    generateDepositCode,
  };
});
