import React, { useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowDownLeft, ArrowUpRight, Trash2, Calendar, CreditCard, User, Package, FileText } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { formatINR, INR_SYMBOL, USDT_SYMBOL } from '@/constants/currency';
import { useData } from '@/contexts/DataContext';

export default function TransactionDetailScreen() {
  const { id, type } = useLocalSearchParams<{ id: string; type: string }>();
  const router = useRouter();
  const { buyTransactions, sellTransactions, getSupplierName, deleteBuy, deleteSell } = useData();

  const transaction = useMemo(() => {
    if (type === 'buy') return buyTransactions.find(t => t.id === id);
    return sellTransactions.find(t => t.id === id);
  }, [id, type, buyTransactions, sellTransactions]);

  const handleDelete = useCallback(() => {
    Alert.alert('Delete Transaction', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          if (type === 'buy') await deleteBuy(id ?? '');
          else await deleteSell(id ?? '');
          router.back();
        },
      },
    ]);
  }, [id, type, deleteBuy, deleteSell, router]);

  if (!transaction) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Transaction not found</Text>
      </View>
    );
  }

  const isBuy = transaction.type === 'buy';
  const color = isBuy ? Colors.buy : Colors.sell;
  const bgColor = isBuy ? Colors.buyLight : Colors.sellLight;
  const date = new Date(transaction.createdAt);
  const dateStr = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  const timeStr = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  const details: { label: string; value: string; icon: React.ReactNode }[] = [];

  if (isBuy) {
    const tx = transaction;
    details.push(
      { label: 'Sender', value: tx.senderName, icon: <User size={16} color={Colors.textSecondary} /> },
      { label: 'Volume', value: `${USDT_SYMBOL}${tx.volume.toLocaleString()} USDT`, icon: <Package size={16} color={Colors.textSecondary} /> },
      { label: 'Rate', value: `${INR_SYMBOL}${tx.rate.toFixed(2)}`, icon: <CreditCard size={16} color={Colors.textSecondary} /> },
      { label: 'Total Value', value: `${formatINR(tx.volume * tx.rate)}`, icon: <CreditCard size={16} color={Colors.textSecondary} /> },
      { label: 'Payment Mode', value: tx.paymentMode, icon: <CreditCard size={16} color={Colors.textSecondary} /> },
      { label: 'Supplier', value: getSupplierName(tx.supplierId), icon: <Package size={16} color={Colors.textSecondary} /> },
      { label: 'Date', value: `${dateStr} at ${timeStr}`, icon: <Calendar size={16} color={Colors.textSecondary} /> },
    );
    if (tx.remarks) details.push({ label: 'Remarks', value: tx.remarks, icon: <FileText size={16} color={Colors.textSecondary} /> });
  } else {
    const tx = transaction;
    details.push(
      { label: 'Receiver', value: tx.receiverName, icon: <User size={16} color={Colors.textSecondary} /> },
      { label: 'Account CHZbit', value: tx.accountCHZbit, icon: <CreditCard size={16} color={Colors.textSecondary} /> },
      { label: 'Volume', value: `${USDT_SYMBOL}${tx.volume.toLocaleString()} USDT`, icon: <Package size={16} color={Colors.textSecondary} /> },
      { label: 'Rate', value: `${INR_SYMBOL}${tx.rate.toFixed(2)}`, icon: <CreditCard size={16} color={Colors.textSecondary} /> },
      { label: 'Sell Volume', value: `${USDT_SYMBOL}${tx.sellVolume.toLocaleString()} USDT`, icon: <Package size={16} color={Colors.textSecondary} /> },
      { label: 'Profit Margin', value: `${formatINR(tx.profitMargin)}`, icon: <CreditCard size={16} color={Colors.textSecondary} /> },
      { label: 'Balance Volume', value: `${USDT_SYMBOL}${tx.balanceVolume.toLocaleString()} USDT`, icon: <Package size={16} color={Colors.textSecondary} /> },
      { label: 'Trader', value: tx.traderName, icon: <User size={16} color={Colors.textSecondary} /> },
      { label: 'Supplier', value: getSupplierName(tx.supplierId), icon: <Package size={16} color={Colors.textSecondary} /> },
      { label: 'Date', value: `${dateStr} at ${timeStr}`, icon: <Calendar size={16} color={Colors.textSecondary} /> },
    );
    if (tx.remarks) details.push({ label: 'Remarks', value: tx.remarks, icon: <FileText size={16} color={Colors.textSecondary} /> });
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={[styles.typeHeader, { backgroundColor: bgColor }]}>
        {isBuy ? <ArrowDownLeft size={28} color={color} /> : <ArrowUpRight size={28} color={color} />}
        <Text style={[styles.typeLabel, { color }]}>{isBuy ? 'BUY' : 'SELL'} USDT</Text>
        <Text style={[styles.typeVolume, { color }]}>{USDT_SYMBOL}{transaction.volume.toLocaleString()} USDT</Text>
        <Text style={styles.typeRate}>at {INR_SYMBOL}{transaction.rate.toFixed(2)}</Text>
      </View>

      <View style={styles.detailsCard}>
        {details.map((d, i) => (
          <React.Fragment key={d.label}>
            <View style={styles.detailRow}>
              {d.icon}
              <Text style={styles.detailLabel}>{d.label}</Text>
              <Text style={styles.detailValue}>{d.value}</Text>
            </View>
            {i < details.length - 1 && <View style={styles.divider} />}
          </React.Fragment>
        ))}
      </View>

      <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} activeOpacity={0.7}>
        <Trash2 size={18} color={Colors.danger} />
        <Text style={styles.deleteBtnText}>Delete Transaction</Text>
      </TouchableOpacity>

      <View style={styles.bottomPad} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  content: { padding: 20 },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFoundText: { fontSize: 16, color: Colors.textMuted },
  typeHeader: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  typeLabel: { fontSize: 13, fontWeight: '800' as const, letterSpacing: 1, marginTop: 8 },
  typeVolume: { fontSize: 28, fontWeight: '800' as const, marginTop: 4 },
  typeRate: { fontSize: 14, color: Colors.textMuted, marginTop: 2 },
  detailsCard: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 4,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 14,
  },
  detailLabel: { fontSize: 13, color: Colors.textMuted, marginLeft: 10, flex: 1 },
  detailValue: { fontSize: 14, fontWeight: '600' as const, color: Colors.text, textAlign: 'right' as const, maxWidth: '55%' as const },
  divider: { height: 1, backgroundColor: Colors.borderLight, marginHorizontal: 14 },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.dangerLight,
    borderRadius: 14,
    paddingVertical: 16,
    gap: 8,
  },
  deleteBtnText: { fontSize: 15, fontWeight: '600' as const, color: Colors.danger },
  bottomPad: { height: 20 },
});
