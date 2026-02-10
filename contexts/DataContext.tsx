import { useState, useEffect, useMemo, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BuyTransaction, SellTransaction, Supplier, Transaction, DashboardStats } from '@/types';
import { SAMPLE_BUY_TRANSACTIONS, SAMPLE_SELL_TRANSACTIONS, SAMPLE_SUPPLIERS } from '@/mocks/data';

const BUY_KEY = '@usdt_crm_buy';
const SELL_KEY = '@usdt_crm_sell';
const SUPPLIERS_KEY = '@usdt_crm_suppliers';

export const [DataProvider, useData] = createContextHook(() => {
  const [buyTransactions, setBuyTransactions] = useState<BuyTransaction[]>([]);
  const [sellTransactions, setSellTransactions] = useState<SellTransaction[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
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

  useEffect(() => { if (buyQuery.data) setBuyTransactions(buyQuery.data); }, [buyQuery.data]);
  useEffect(() => { if (sellQuery.data) setSellTransactions(sellQuery.data); }, [sellQuery.data]);
  useEffect(() => { if (suppliersQuery.data) setSuppliers(suppliersQuery.data); }, [suppliersQuery.data]);

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
    };
  }, [buyTransactions, sellTransactions, suppliers]);

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
    stats,
    allTransactions,
    isLoading: buyQuery.isLoading || sellQuery.isLoading || suppliersQuery.isLoading,
    addBuy: addBuyMutation.mutateAsync,
    addSell: addSellMutation.mutateAsync,
    updateBuy: updateBuyMutation.mutateAsync,
    updateSell: updateSellMutation.mutateAsync,
    deleteBuy: deleteBuyMutation.mutateAsync,
    deleteSell: deleteSellMutation.mutateAsync,
    addSupplier: addSupplierMutation.mutateAsync,
    updateSupplier: updateSupplierMutation.mutateAsync,
    deleteSupplier: deleteSupplierMutation.mutateAsync,
    getSupplierName,
  };
});
