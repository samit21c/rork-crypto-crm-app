import { useState, useEffect, useMemo, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BuyTransaction, SellTransaction, Supplier, Transaction, DashboardStats, BankDeposit, BankWithdrawal } from '@/types';
import { SAMPLE_BUY_TRANSACTIONS, SAMPLE_SELL_TRANSACTIONS, SAMPLE_SUPPLIERS, SAMPLE_DEPOSITS, SAMPLE_WITHDRAWALS } from '@/mocks/data';

const BUY_KEY = '@usdt_crm_buy';
const SELL_KEY = '@usdt_crm_sell';
const SUPPLIERS_KEY = '@usdt_crm_suppliers';
const DEPOSITS_KEY = '@usdt_crm_deposits';
const WITHDRAWALS_KEY = '@usdt_crm_withdrawals';

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

export { generateDepositCode };

export const [DataProvider, useData] = createContextHook(() => {
  const [buyTransactions, setBuyTransactions] = useState<BuyTransaction[]>([]);
  const [sellTransactions, setSellTransactions] = useState<SellTransaction[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [deposits, setDeposits] = useState<BankDeposit[]>([]);
  const [withdrawals, setWithdrawals] = useState<BankWithdrawal[]>([]);
  const queryClient = useQueryClient();

  const buyQuery = useQuery({
    queryKey: ['buyTransactions'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(BUY_KEY);
      if (stored) return JSON.parse(stored) as BuyTransaction[];
      await AsyncStorage.setItem(BUY_KEY, JSON.stringify(SAMPLE_BUY_TRANSACTIONS));
      return SAMPLE_BUY_TRANSACTIONS;
    },
  });

  const sellQuery = useQuery({
    queryKey: ['sellTransactions'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(SELL_KEY);
      if (stored) return JSON.parse(stored) as SellTransaction[];
      await AsyncStorage.setItem(SELL_KEY, JSON.stringify(SAMPLE_SELL_TRANSACTIONS));
      return SAMPLE_SELL_TRANSACTIONS;
    },
  });

  const suppliersQuery = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(SUPPLIERS_KEY);
      if (stored) return JSON.parse(stored) as Supplier[];
      await AsyncStorage.setItem(SUPPLIERS_KEY, JSON.stringify(SAMPLE_SUPPLIERS));
      return SAMPLE_SUPPLIERS;
    },
  });

  const depositsQuery = useQuery({
    queryKey: ['deposits'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(DEPOSITS_KEY);
      if (stored) return JSON.parse(stored) as BankDeposit[];
      await AsyncStorage.setItem(DEPOSITS_KEY, JSON.stringify(SAMPLE_DEPOSITS));
      return SAMPLE_DEPOSITS;
    },
  });

  const withdrawalsQuery = useQuery({
    queryKey: ['withdrawals'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(WITHDRAWALS_KEY);
      if (stored) return JSON.parse(stored) as BankWithdrawal[];
      await AsyncStorage.setItem(WITHDRAWALS_KEY, JSON.stringify(SAMPLE_WITHDRAWALS));
      return SAMPLE_WITHDRAWALS;
    },
  });

  useEffect(() => { if (buyQuery.data) setBuyTransactions(buyQuery.data); }, [buyQuery.data]);
  useEffect(() => { if (sellQuery.data) setSellTransactions(sellQuery.data); }, [sellQuery.data]);
  useEffect(() => { if (suppliersQuery.data) setSuppliers(suppliersQuery.data); }, [suppliersQuery.data]);
  useEffect(() => { if (depositsQuery.data) setDeposits(depositsQuery.data); }, [depositsQuery.data]);
  useEffect(() => { if (withdrawalsQuery.data) setWithdrawals(withdrawalsQuery.data); }, [withdrawalsQuery.data]);

  const saveBuy = useCallback(async (data: BuyTransaction[]) => {
    await AsyncStorage.setItem(BUY_KEY, JSON.stringify(data));
    setBuyTransactions(data);
    queryClient.setQueryData(['buyTransactions'], data);
  }, [queryClient]);

  const saveSell = useCallback(async (data: SellTransaction[]) => {
    await AsyncStorage.setItem(SELL_KEY, JSON.stringify(data));
    setSellTransactions(data);
    queryClient.setQueryData(['sellTransactions'], data);
  }, [queryClient]);

  const saveSuppliers = useCallback(async (data: Supplier[]) => {
    await AsyncStorage.setItem(SUPPLIERS_KEY, JSON.stringify(data));
    setSuppliers(data);
    queryClient.setQueryData(['suppliers'], data);
  }, [queryClient]);

  const saveDeposits = useCallback(async (data: BankDeposit[]) => {
    await AsyncStorage.setItem(DEPOSITS_KEY, JSON.stringify(data));
    setDeposits(data);
    queryClient.setQueryData(['deposits'], data);
  }, [queryClient]);

  const saveWithdrawals = useCallback(async (data: BankWithdrawal[]) => {
    await AsyncStorage.setItem(WITHDRAWALS_KEY, JSON.stringify(data));
    setWithdrawals(data);
    queryClient.setQueryData(['withdrawals'], data);
  }, [queryClient]);

  const addBuyMutation = useMutation({
    mutationFn: async (tx: BuyTransaction) => {
      const updated = [tx, ...buyTransactions];
      await saveBuy(updated);
      return updated;
    },
  });

  const addSellMutation = useMutation({
    mutationFn: async (tx: SellTransaction) => {
      const updated = [tx, ...sellTransactions];
      await saveSell(updated);
      return updated;
    },
  });

  const updateBuyMutation = useMutation({
    mutationFn: async (tx: BuyTransaction) => {
      const updated = buyTransactions.map(t => t.id === tx.id ? tx : t);
      await saveBuy(updated);
      return updated;
    },
  });

  const updateSellMutation = useMutation({
    mutationFn: async (tx: SellTransaction) => {
      const updated = sellTransactions.map(t => t.id === tx.id ? tx : t);
      await saveSell(updated);
      return updated;
    },
  });

  const deleteBuyMutation = useMutation({
    mutationFn: async (id: string) => {
      const updated = buyTransactions.filter(t => t.id !== id);
      await saveBuy(updated);
      return updated;
    },
  });

  const deleteSellMutation = useMutation({
    mutationFn: async (id: string) => {
      const updated = sellTransactions.filter(t => t.id !== id);
      await saveSell(updated);
      return updated;
    },
  });

  const addSupplierMutation = useMutation({
    mutationFn: async (s: Supplier) => {
      const updated = [...suppliers, s];
      await saveSuppliers(updated);
      return updated;
    },
  });

  const updateSupplierMutation = useMutation({
    mutationFn: async (s: Supplier) => {
      const updated = suppliers.map(sup => sup.id === s.id ? s : sup);
      await saveSuppliers(updated);
      return updated;
    },
  });

  const deleteSupplierMutation = useMutation({
    mutationFn: async (id: string) => {
      const updated = suppliers.filter(s => s.id !== id);
      await saveSuppliers(updated);
      return updated;
    },
  });

  const addDepositMutation = useMutation({
    mutationFn: async (d: BankDeposit) => {
      const updated = [d, ...deposits];
      await saveDeposits(updated);
      return updated;
    },
  });

  const updateDepositMutation = useMutation({
    mutationFn: async (d: BankDeposit) => {
      const updated = deposits.map(dep => dep.id === d.id ? d : dep);
      await saveDeposits(updated);
      return updated;
    },
  });

  const deleteDepositMutation = useMutation({
    mutationFn: async (id: string) => {
      const updated = deposits.filter(d => d.id !== id);
      await saveDeposits(updated);
      return updated;
    },
  });

  const addWithdrawalMutation = useMutation({
    mutationFn: async (w: BankWithdrawal) => {
      const updated = [w, ...withdrawals];
      await saveWithdrawals(updated);
      return updated;
    },
  });

  const updateWithdrawalMutation = useMutation({
    mutationFn: async (w: BankWithdrawal) => {
      const updated = withdrawals.map(wth => wth.id === w.id ? w : wth);
      await saveWithdrawals(updated);
      return updated;
    },
  });

  const deleteWithdrawalMutation = useMutation({
    mutationFn: async (id: string) => {
      const updated = withdrawals.filter(w => w.id !== id);
      await saveWithdrawals(updated);
      return updated;
    },
  });

  const stats: DashboardStats = useMemo(() => {
    const totalBuyVolume = buyTransactions.reduce((sum, t) => sum + t.volume, 0);
    const totalSellVolume = sellTransactions.reduce((sum, t) => sum + t.sellVolume, 0);
    const totalProfit = sellTransactions.reduce((sum, t) => sum + t.profitMargin, 0);
    const totalBuyValue = buyTransactions.reduce((sum, t) => sum + (t.volume * t.rate), 0);
    const totalSellValue = sellTransactions.reduce((sum, t) => sum + (t.sellVolume * t.rate), 0);
    const avgBuyRate = totalBuyVolume > 0 ? totalBuyValue / totalBuyVolume : 0;
    const avgSellRate = totalSellVolume > 0 ? totalSellValue / totalSellVolume : 0;

    const today = new Date().toISOString().split('T')[0];
    const todayBuyVolume = buyTransactions
      .filter(t => t.createdAt.startsWith(today))
      .reduce((sum, t) => sum + t.volume, 0);
    const todaySellVolume = sellTransactions
      .filter(t => t.createdAt.startsWith(today))
      .reduce((sum, t) => sum + t.sellVolume, 0);

    const totalDeposited = deposits.reduce((sum, d) => sum + d.amount, 0);
    const totalWithdrawn = withdrawals.reduce((sum, w) => sum + w.amount, 0);

    return {
      totalBuyVolume,
      totalSellVolume,
      totalProfit,
      activeSuppliers: suppliers.length,
      avgBuyRate,
      avgSellRate,
      balanceVolume: totalBuyVolume - totalSellVolume,
      todayBuyVolume,
      todaySellVolume,
      totalDeposited,
      totalWithdrawn,
      netBankFunds: totalDeposited - totalWithdrawn,
    };
  }, [buyTransactions, sellTransactions, suppliers, deposits, withdrawals]);

  const getSupplierName = useCallback((id?: string) => {
    if (!id) return 'N/A';
    return suppliers.find(s => s.id === id)?.name ?? 'Unknown';
  }, [suppliers]);

  const allTransactions: Transaction[] = useMemo(() => {
    return [...buyTransactions, ...sellTransactions].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [buyTransactions, sellTransactions]);

  return {
    buyTransactions,
    sellTransactions,
    suppliers,
    deposits,
    withdrawals,
    stats,
    allTransactions,
    isLoading: buyQuery.isLoading || sellQuery.isLoading || suppliersQuery.isLoading || depositsQuery.isLoading || withdrawalsQuery.isLoading,
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
    getSupplierName,
    generateDepositCode,
  };
});
