import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { INR_SYMBOL, USDT_SYMBOL } from '@/constants/currency';
import { Transaction } from '@/types';

interface TransactionCardProps {
  transaction: Transaction;
  supplierName: string;
  onPress: () => void;
}

function TransactionCard({ transaction, supplierName, onPress }: TransactionCardProps) {
  const isBuy = transaction.type === 'buy';
  const color = isBuy ? Colors.buy : Colors.sell;
  const bgColor = isBuy ? Colors.buyLight : Colors.sellLight;
  const name = isBuy ? transaction.senderName : transaction.receiverName;
  const date = new Date(transaction.createdAt);
  const dateStr = date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  const timeStr = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7} testID={`tx-${transaction.id}`}>
      <View style={[styles.iconWrap, { backgroundColor: bgColor }]}>
        {isBuy ? <ArrowDownLeft size={18} color={color} /> : <ArrowUpRight size={18} color={color} />}
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{name}</Text>
        <Text style={styles.meta}>{supplierName} · {dateStr}</Text>
      </View>
      <View style={styles.right}>
        <Text style={[styles.volume, { color }]}>
          {isBuy ? '+' : '-'}{USDT_SYMBOL}{transaction.volume.toLocaleString()} USDT
        </Text>
        <Text style={styles.rate}>{INR_SYMBOL}{transaction.rate.toFixed(2)}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default React.memo(TransactionCard);

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  meta: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  right: {
    alignItems: 'flex-end',
  },
  volume: {
    fontSize: 14,
    fontWeight: '700' as const,
    marginBottom: 2,
  },
  rate: {
    fontSize: 12,
    color: Colors.textMuted,
  },
});
