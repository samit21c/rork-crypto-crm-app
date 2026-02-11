import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { TrendingUp, TrendingDown, DollarSign, ArrowRight, Landmark, Banknote, ArrowDownUp } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useData } from '@/contexts/DataContext';

export default function InsightsScreen() {
  const { buyTransactions, sellTransactions, deposits, withdrawals, stats, getSupplierName } = useData();

  const supplierStats = useMemo(() => {
    const map = new Map<string, { buyVol: number; sellVol: number; buyVal: number; sellVal: number }>();
    buyTransactions.forEach(t => {
      const sid = t.supplierId ?? 'none';
      const existing = map.get(sid) ?? { buyVol: 0, sellVol: 0, buyVal: 0, sellVal: 0 };
      existing.buyVol += t.volume;
      existing.buyVal += t.volume * t.rate;
      map.set(sid, existing);
    });
    sellTransactions.forEach(t => {
      const sid = t.supplierId ?? 'none';
      const existing = map.get(sid) ?? { buyVol: 0, sellVol: 0, buyVal: 0, sellVal: 0 };
      existing.sellVol += t.sellVolume;
      existing.sellVal += t.sellVolume * t.rate;
      map.set(sid, existing);
    });
    return Array.from(map.entries()).map(([sid, data]) => ({
      name: sid === 'none' ? 'No Supplier' : getSupplierName(sid),
      ...data,
      avgBuyRate: data.buyVol > 0 ? data.buyVal / data.buyVol : 0,
      avgSellRate: data.sellVol > 0 ? data.sellVal / data.sellVol : 0,
    }));
  }, [buyTransactions, sellTransactions, getSupplierName]);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayBuys = useMemo(() => buyTransactions.filter(t => t.createdAt.startsWith(todayStr)), [buyTransactions, todayStr]);
  const todaySells = useMemo(() => sellTransactions.filter(t => t.createdAt.startsWith(todayStr)), [sellTransactions, todayStr]);
  const todayBuyVol = todayBuys.reduce((s, t) => s + t.volume, 0);
  const todaySellVol = todaySells.reduce((s, t) => s + t.sellVolume, 0);
  const todayProfit = todaySells.reduce((s, t) => s + t.profitMargin, 0);

  const totalBuyValue = buyTransactions.reduce((s, t) => s + t.volume * t.rate, 0);
  const totalSellValue = sellTransactions.reduce((s, t) => s + t.sellVolume * t.rate, 0);

  const maxBuyVol = Math.max(...(supplierStats.map(s => s.buyVol)), 1);

  const bankingStats = useMemo(() => {
    const verifiedDeposits = deposits.filter(d => d.isVerified);
    const unverifiedDeposits = deposits.filter(d => !d.isVerified);
    const linkedWithdrawals = withdrawals.filter(w => w.depositCode);
    const unlinkedWithdrawals = withdrawals.filter(w => !w.depositCode);

    const depositByMode = new Map<string, number>();
    deposits.forEach(d => {
      depositByMode.set(d.mode, (depositByMode.get(d.mode) ?? 0) + d.amount);
    });

    const withdrawByMode = new Map<string, number>();
    withdrawals.forEach(w => {
      withdrawByMode.set(w.mode, (withdrawByMode.get(w.mode) ?? 0) + w.amount);
    });

    const profitAdjusted = stats.totalProfit - (stats.totalWithdrawn * 0);

    return {
      verifiedCount: verifiedDeposits.length,
      unverifiedCount: unverifiedDeposits.length,
      verifiedAmount: verifiedDeposits.reduce((s, d) => s + d.amount, 0),
      unverifiedAmount: unverifiedDeposits.reduce((s, d) => s + d.amount, 0),
      linkedCount: linkedWithdrawals.length,
      unlinkedCount: unlinkedWithdrawals.length,
      linkedAmount: linkedWithdrawals.reduce((s, w) => s + w.amount, 0),
      depositByMode: Array.from(depositByMode.entries()),
      withdrawByMode: Array.from(withdrawByMode.entries()),
      profitAdjusted,
    };
  }, [deposits, withdrawals, stats]);

  const maxDepMode = Math.max(...bankingStats.depositByMode.map(([, v]) => v), 1);
  const maxWthMode = Math.max(...bankingStats.withdrawByMode.map(([, v]) => v), 1);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>{"Today's Summary"}</Text>
      <View style={styles.todayRow}>
        <View style={[styles.todayCard, { backgroundColor: Colors.buyLight }]}>
          <TrendingDown size={18} color={Colors.buy} />
          <Text style={[styles.todayValue, { color: Colors.buy }]}>{todayBuyVol.toLocaleString()}</Text>
          <Text style={[styles.todayLabel, { color: Colors.buy }]}>Bought</Text>
        </View>
        <View style={[styles.todayCard, { backgroundColor: Colors.sellLight }]}>
          <TrendingUp size={18} color={Colors.sell} />
          <Text style={[styles.todayValue, { color: Colors.sell }]}>{todaySellVol.toLocaleString()}</Text>
          <Text style={[styles.todayLabel, { color: Colors.sell }]}>Sold</Text>
        </View>
        <View style={[styles.todayCard, { backgroundColor: Colors.accentLight }]}>
          <DollarSign size={18} color={Colors.accent} />
          <Text style={[styles.todayValue, { color: Colors.accent }]}>₹{todayProfit.toFixed(0)}</Text>
          <Text style={[styles.todayLabel, { color: Colors.accent }]}>Profit</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Overall Trading Stats</Text>
      <View style={styles.overallCard}>
        <View style={styles.overallRow}>
          <Text style={styles.overallLabel}>Total Buy Volume</Text>
          <Text style={styles.overallValue}>{stats.totalBuyVolume.toLocaleString()} USDT</Text>
        </View>
        <View style={styles.overallDivider} />
        <View style={styles.overallRow}>
          <Text style={styles.overallLabel}>Total Buy Value</Text>
          <Text style={styles.overallValue}>₹{totalBuyValue.toLocaleString()}</Text>
        </View>
        <View style={styles.overallDivider} />
        <View style={styles.overallRow}>
          <Text style={styles.overallLabel}>Avg Buy Rate</Text>
          <Text style={styles.overallValue}>₹{stats.avgBuyRate.toFixed(2)}</Text>
        </View>
        <View style={styles.overallDivider} />
        <View style={styles.overallRow}>
          <Text style={styles.overallLabel}>Total Sell Volume</Text>
          <Text style={styles.overallValue}>{stats.totalSellVolume.toLocaleString()} USDT</Text>
        </View>
        <View style={styles.overallDivider} />
        <View style={styles.overallRow}>
          <Text style={styles.overallLabel}>Total Sell Value</Text>
          <Text style={styles.overallValue}>₹{totalSellValue.toLocaleString()}</Text>
        </View>
        <View style={styles.overallDivider} />
        <View style={styles.overallRow}>
          <Text style={styles.overallLabel}>Avg Sell Rate</Text>
          <Text style={styles.overallValue}>₹{stats.avgSellRate.toFixed(2)}</Text>
        </View>
        <View style={styles.overallDivider} />
        <View style={styles.overallRow}>
          <Text style={styles.overallLabel}>Total Profit</Text>
          <Text style={[styles.overallValue, { color: Colors.accent, fontWeight: '800' as const }]}>₹{stats.totalProfit.toLocaleString()}</Text>
        </View>
        <View style={styles.overallDivider} />
        <View style={styles.overallRow}>
          <Text style={styles.overallLabel}>Balance Volume</Text>
          <Text style={styles.overallValue}>{stats.balanceVolume.toLocaleString()} USDT</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Banking Overview</Text>
      <View style={styles.bankingSummaryRow}>
        <View style={[styles.bankingCard, { borderLeftColor: Colors.deposit }]}>
          <Landmark size={20} color={Colors.deposit} />
          <Text style={styles.bankingCardValue}>₹{stats.totalDeposited.toLocaleString()}</Text>
          <Text style={styles.bankingCardLabel}>Total Deposited</Text>
          <View style={styles.bankingCardMeta}>
            <Text style={styles.bankingMetaText}>{deposits.length} entries</Text>
          </View>
        </View>
        <View style={[styles.bankingCard, { borderLeftColor: Colors.withdraw }]}>
          <Banknote size={20} color={Colors.withdraw} />
          <Text style={styles.bankingCardValue}>₹{stats.totalWithdrawn.toLocaleString()}</Text>
          <Text style={styles.bankingCardLabel}>Total Withdrawn</Text>
          <View style={styles.bankingCardMeta}>
            <Text style={styles.bankingMetaText}>{withdrawals.length} entries</Text>
          </View>
        </View>
      </View>

      <View style={styles.netFundsCard}>
        <View style={styles.netFundsHeader}>
          <ArrowDownUp size={18} color={Colors.info} />
          <Text style={styles.netFundsTitle}>Net Bank Funds</Text>
        </View>
        <Text style={[styles.netFundsValue, { color: stats.netBankFunds >= 0 ? Colors.accent : Colors.danger }]}>
          ₹{stats.netBankFunds.toLocaleString()}
        </Text>
        <View style={styles.netFundsDetails}>
          <View style={styles.netFundsRow}>
            <Text style={styles.netFundsLabel}>Verified Deposits</Text>
            <Text style={styles.netFundsDetailValue}>₹{bankingStats.verifiedAmount.toLocaleString()} ({bankingStats.verifiedCount})</Text>
          </View>
          <View style={styles.netFundsRow}>
            <Text style={[styles.netFundsLabel, { color: Colors.warning }]}>Unverified Deposits</Text>
            <Text style={styles.netFundsDetailValue}>₹{bankingStats.unverifiedAmount.toLocaleString()} ({bankingStats.unverifiedCount})</Text>
          </View>
          <View style={styles.netFundsRow}>
            <Text style={styles.netFundsLabel}>Linked Withdrawals</Text>
            <Text style={styles.netFundsDetailValue}>₹{bankingStats.linkedAmount.toLocaleString()} ({bankingStats.linkedCount})</Text>
          </View>
          <View style={styles.netFundsRow}>
            <Text style={styles.netFundsLabel}>Unlinked Withdrawals</Text>
            <Text style={styles.netFundsDetailValue}>{bankingStats.unlinkedCount} entries</Text>
          </View>
        </View>
      </View>

      {bankingStats.depositByMode.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Deposits by Mode</Text>
          <View style={styles.modeCard}>
            {bankingStats.depositByMode.map(([mode, amount]) => (
              <View key={mode} style={styles.modeRow}>
                <View style={styles.modeLabel}>
                  <Text style={styles.modeLabelText}>{mode}</Text>
                </View>
                <View style={styles.modeBarTrack}>
                  <View style={[styles.modeBarFill, { width: `${(amount / maxDepMode) * 100}%`, backgroundColor: Colors.deposit }]} />
                </View>
                <Text style={styles.modeValue}>₹{amount.toLocaleString()}</Text>
              </View>
            ))}
          </View>
        </>
      )}

      {bankingStats.withdrawByMode.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Withdrawals by Mode</Text>
          <View style={styles.modeCard}>
            {bankingStats.withdrawByMode.map(([mode, amount]) => (
              <View key={mode} style={styles.modeRow}>
                <View style={styles.modeLabel}>
                  <Text style={styles.modeLabelText}>{mode}</Text>
                </View>
                <View style={styles.modeBarTrack}>
                  <View style={[styles.modeBarFill, { width: `${(amount / maxWthMode) * 100}%`, backgroundColor: Colors.withdraw }]} />
                </View>
                <Text style={styles.modeValue}>₹{amount.toLocaleString()}</Text>
              </View>
            ))}
          </View>
        </>
      )}

      <Text style={styles.sectionTitle}>Supplier-wise Breakdown</Text>
      {supplierStats.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No data available</Text>
        </View>
      ) : (
        supplierStats.map((s, i) => (
          <View key={i} style={styles.supplierCard}>
            <View style={styles.supplierHeader}>
              <Text style={styles.supplierName}>{s.name}</Text>
              <View style={styles.rateCompare}>
                <Text style={[styles.rateText, { color: Colors.buy }]}>₹{s.avgBuyRate.toFixed(2)}</Text>
                <ArrowRight size={12} color={Colors.textMuted} />
                <Text style={[styles.rateText, { color: Colors.sell }]}>₹{s.avgSellRate.toFixed(2)}</Text>
              </View>
            </View>
            <View style={styles.barRow}>
              <View style={styles.barLabel}>
                <Text style={styles.barLabelText}>Buy</Text>
              </View>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${(s.buyVol / maxBuyVol) * 100}%`, backgroundColor: Colors.buy }]} />
              </View>
              <Text style={styles.barValue}>{s.buyVol.toLocaleString()}</Text>
            </View>
            <View style={styles.barRow}>
              <View style={styles.barLabel}>
                <Text style={styles.barLabelText}>Sell</Text>
              </View>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${(s.sellVol / maxBuyVol) * 100}%`, backgroundColor: Colors.sell }]} />
              </View>
              <Text style={styles.barValue}>{s.sellVol.toLocaleString()}</Text>
            </View>
            {s.avgSellRate > 0 && s.avgBuyRate > 0 && (
              <View style={styles.priceDiffRow}>
                <Text style={styles.priceDiffLabel}>Price Difference</Text>
                <Text style={[styles.priceDiffValue, { color: s.avgSellRate > s.avgBuyRate ? Colors.accent : Colors.danger }]}>
                  ₹{(s.avgSellRate - s.avgBuyRate).toFixed(2)} per USDT
                </Text>
              </View>
            )}
          </View>
        ))
      )}

      <View style={styles.bottomPad} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  content: { padding: 20 },
  sectionTitle: { fontSize: 17, fontWeight: '700' as const, color: Colors.text, marginBottom: 12, marginTop: 8 },
  todayRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  todayCard: {
    flex: 1,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
  },
  todayValue: { fontSize: 18, fontWeight: '700' as const, marginTop: 6 },
  todayLabel: { fontSize: 11, fontWeight: '600' as const, marginTop: 2 },
  overallCard: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 16,
    marginBottom: 8,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  overallRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  overallLabel: { fontSize: 14, color: Colors.textSecondary },
  overallValue: { fontSize: 15, fontWeight: '700' as const, color: Colors.text },
  overallDivider: { height: 1, backgroundColor: Colors.borderLight },
  bankingSummaryRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  bankingCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  bankingCardValue: { fontSize: 18, fontWeight: '800' as const, color: Colors.text, marginTop: 10 },
  bankingCardLabel: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  bankingCardMeta: { marginTop: 8 },
  bankingMetaText: { fontSize: 11, color: Colors.textSecondary, fontWeight: '500' as const },
  netFundsCard: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 18,
    marginBottom: 8,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  netFundsHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  netFundsTitle: { fontSize: 15, fontWeight: '700' as const, color: Colors.text },
  netFundsValue: { fontSize: 28, fontWeight: '800' as const, marginBottom: 12 },
  netFundsDetails: { borderTopWidth: 1, borderTopColor: Colors.borderLight, paddingTop: 10 },
  netFundsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  netFundsLabel: { fontSize: 13, color: Colors.textSecondary },
  netFundsDetailValue: { fontSize: 13, fontWeight: '600' as const, color: Colors.text },
  modeCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  modeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  modeLabel: { width: 70 },
  modeLabelText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' as const },
  modeBarTrack: { flex: 1, height: 10, backgroundColor: Colors.surface, borderRadius: 5, overflow: 'hidden', marginHorizontal: 10 },
  modeBarFill: { height: 10, borderRadius: 5 },
  modeValue: { fontSize: 12, fontWeight: '700' as const, color: Colors.text, width: 80, textAlign: 'right' as const },
  supplierCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  supplierHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  supplierName: { fontSize: 15, fontWeight: '600' as const, color: Colors.text },
  rateCompare: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rateText: { fontSize: 12, fontWeight: '600' as const },
  barRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  barLabel: { width: 32 },
  barLabelText: { fontSize: 11, color: Colors.textMuted, fontWeight: '500' as const },
  barTrack: { flex: 1, height: 8, backgroundColor: Colors.surface, borderRadius: 4, overflow: 'hidden', marginHorizontal: 8 },
  barFill: { height: 8, borderRadius: 4 },
  barValue: { fontSize: 12, fontWeight: '600' as const, color: Colors.text, width: 50, textAlign: 'right' as const },
  priceDiffRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: Colors.borderLight },
  priceDiffLabel: { fontSize: 12, color: Colors.textMuted },
  priceDiffValue: { fontSize: 12, fontWeight: '700' as const },
  emptyState: { alignItems: 'center', paddingVertical: 32 },
  emptyText: { fontSize: 15, color: Colors.textMuted },
  bottomPad: { height: 20 },
});
