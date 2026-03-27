import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Search, Trash2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import { useData } from '@/contexts/DataContext';
import TransactionCard from '@/components/TransactionCard';
import { Transaction } from '@/types';

export default function TransactionsScreen() {
  const router = useRouter();
  const { buyTransactions, sellTransactions, getSupplierName, deleteBuy, deleteSell } = useData();
  const [tab, setTab] = useState<'all' | 'buy' | 'sell'>('all');
  const [search, setSearch] = useState('');

  const transactions = useMemo(() => {
    let list: Transaction[] = [];
    if (tab === 'all') list = [...buyTransactions, ...sellTransactions];
    else if (tab === 'buy') list = [...buyTransactions];
    else list = [...sellTransactions];

    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(tx => {
        const name = tx.type === 'buy' ? tx.senderName : tx.receiverName;
        const supplier = getSupplierName(tx.supplierId);
        return name.toLowerCase().includes(q) || supplier.toLowerCase().includes(q) || tx.id.toLowerCase().includes(q);
      });
    }

    return list;
  }, [tab, search, buyTransactions, sellTransactions, getSupplierName]);

  const handleDelete = useCallback((tx: Transaction) => {
    Alert.alert(
      'Delete Transaction',
      `Are you sure you want to delete this ${tx.type} transaction?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            if (tx.type === 'buy') await deleteBuy(tx.id);
            else await deleteSell(tx.id);
          },
        },
      ]
    );
  }, [deleteBuy, deleteSell]);

  const totalBuyVol = useMemo(() => buyTransactions.reduce((s, t) => s + t.volume, 0), [buyTransactions]);
  const totalSellVol = useMemo(() => sellTransactions.reduce((s, t) => s + t.sellVolume, 0), [sellTransactions]);

  const renderItem = useCallback(({ item }: { item: Transaction }) => (
    <View style={styles.txRow}>
      <View style={styles.txContent}>
        <TransactionCard
          transaction={item}
          supplierName={getSupplierName(item.supplierId)}
          onPress={() => router.push({ pathname: '/transaction-detail' as any, params: { id: item.id, type: item.type } })}
        />
      </View>
      <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
        <Trash2 size={16} color={Colors.danger} />
      </TouchableOpacity>
    </View>
  ), [getSupplierName, router, handleDelete]);

  const keyExtractor = useCallback((item: Transaction) => item.id, []);

  return (
    <View style={styles.container}>
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { backgroundColor: Colors.buyLight }]}>
          <Text style={[styles.summaryLabel, { color: Colors.buy }]}>Total Buy</Text>
          <Text style={[styles.summaryValue, { color: Colors.buy }]}>{totalBuyVol.toLocaleString()} USDT</Text>
        </View>
        <View style={styles.summaryGap} />
        <View style={[styles.summaryCard, { backgroundColor: Colors.sellLight }]}>
          <Text style={[styles.summaryLabel, { color: Colors.sell }]}>Total Sell</Text>
          <Text style={[styles.summaryValue, { color: Colors.sell }]}>{totalSellVol.toLocaleString()} USDT</Text>
        </View>
      </View>

      <View style={styles.searchRow}>
        <Search size={18} color={Colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search transactions..."
          placeholderTextColor={Colors.textMuted}
        />
      </View>

      <View style={styles.tabRow}>
        {(['all', 'buy', 'sell'] as const).map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.tabBtn, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'all' ? 'All' : t === 'buy' ? 'Buy' : 'Sell'}
            </Text>
          </TouchableOpacity>
        ))}
        <View style={styles.tabCount}>
          <Text style={styles.tabCountText}>{transactions.length} entries</Text>
        </View>
      </View>

      <FlatList
        data={transactions}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No transactions found</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  summaryRow: { flexDirection: 'row', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  summaryGap: { width: 12 },
  summaryCard: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
  },
  summaryLabel: { fontSize: 11, fontWeight: '600' as const, textTransform: 'uppercase' as const, letterSpacing: 0.5 },
  summaryValue: { fontSize: 16, fontWeight: '700' as const, marginTop: 2 },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    paddingHorizontal: 14,
    marginHorizontal: 20,
    marginTop: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    fontSize: 15,
    color: Colors.text,
  },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 8,
  },
  tabBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  tabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tabText: { fontSize: 13, fontWeight: '600' as const, color: Colors.textSecondary },
  tabTextActive: { color: Colors.textLight },
  tabCount: { flex: 1, alignItems: 'flex-end' },
  tabCountText: { fontSize: 12, color: Colors.textMuted },
  listContent: { padding: 20, paddingTop: 8 },
  txRow: { flexDirection: 'row', alignItems: 'center' },
  txContent: { flex: 1 },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.dangerLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    marginBottom: 8,
  },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 15, color: Colors.textMuted },
});
