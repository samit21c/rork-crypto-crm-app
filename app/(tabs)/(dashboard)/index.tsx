import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { TrendingUp, TrendingDown, DollarSign, Users, ArrowDownCircle, ArrowUpCircle, Package, BarChart3, User, Landmark, Banknote, UserCheck, Building2, Heart, Clock } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import StatCard from '@/components/StatCard';
import TransactionCard from '@/components/TransactionCard';

export default function DashboardScreen() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const { stats, allTransactions, getSupplierName, dividends } = useData();
  const [refreshing, setRefreshing] = React.useState(false);

  const recentTransactions = useMemo(() => allTransactions.slice(0, 5), [allTransactions]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  }, []);

  const formatNumber = (num: number) => {
    if (num >= 10000000) return `₹${(num / 10000000).toFixed(1)}Cr`;
    if (num >= 100000) return `₹${(num / 100000).toFixed(1)}L`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  const overdueDividends = useMemo(() => dividends.filter(d => d.status === 'Overdue').length, [dividends]);

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>{currentUser?.name ?? 'User'}</Text>
          </View>
          <TouchableOpacity style={styles.avatarWrap} onPress={() => router.push('/profile' as any)}>
            <User size={20} color={Colors.textLight} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.heroRow}>
          <View style={[styles.heroCard, { backgroundColor: Colors.clientLight }]}>
            <UserCheck size={18} color={Colors.client} />
            <Text style={[styles.heroValue, { color: Colors.client }]}>{stats.totalClients}</Text>
            <Text style={styles.heroLabel}>Clients</Text>
          </View>
          <View style={[styles.heroCard, { backgroundColor: Colors.accentLight }]}>
            <DollarSign size={18} color={Colors.accent} />
            <Text style={[styles.heroValue, { color: Colors.accent }]}>₹{formatNumber(stats.totalContractFunds)}</Text>
            <Text style={styles.heroLabel}>Total Funds</Text>
          </View>
          <View style={[styles.heroCard, { backgroundColor: overdueDividends > 0 ? Colors.dangerLight : Colors.dividendLight }]}>
            <Heart size={18} color={overdueDividends > 0 ? Colors.danger : Colors.dividend} />
            <Text style={[styles.heroValue, { color: overdueDividends > 0 ? Colors.danger : Colors.dividend }]}>{stats.pendingDividends}</Text>
            <Text style={styles.heroLabel}>Div. Due</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <StatCard
            title="Buy Volume"
            value={formatNumber(stats.totalBuyVolume)}
            subtitle={`Avg ₹${stats.avgBuyRate.toFixed(2)}`}
            icon={<TrendingDown size={18} color={Colors.buy} />}
            accentColor={Colors.buy}
            accentBg={Colors.buyLight}
          />
          <View style={styles.statsGap} />
          <StatCard
            title="Sell Volume"
            value={formatNumber(stats.totalSellVolume)}
            subtitle={`Avg ₹${stats.avgSellRate.toFixed(2)}`}
            icon={<TrendingUp size={18} color={Colors.sell} />}
            accentColor={Colors.sell}
            accentBg={Colors.sellLight}
          />
        </View>

        <View style={styles.statsRow}>
          <StatCard
            title="Total Profit"
            value={`₹${formatNumber(stats.totalProfit)}`}
            icon={<DollarSign size={18} color={Colors.accent} />}
            accentColor={Colors.accent}
            accentBg={Colors.accentLight}
          />
          <View style={styles.statsGap} />
          <StatCard
            title="Bank Balance"
            value={`₹${formatNumber(stats.totalBankBalance)}`}
            subtitle={`Net: ₹${formatNumber(stats.netBankFunds)}`}
            icon={<Building2 size={18} color={Colors.bank} />}
            accentColor={Colors.bank}
            accentBg={Colors.bankLight}
          />
        </View>

        <View style={styles.statsRow}>
          <StatCard
            title="Deposited"
            value={`₹${formatNumber(stats.totalDeposited)}`}
            icon={<Landmark size={18} color={Colors.deposit} />}
            accentColor={Colors.deposit}
            accentBg={Colors.depositLight}
          />
          <View style={styles.statsGap} />
          <StatCard
            title="Div. Paid"
            value={`₹${formatNumber(stats.totalDividendsPaid)}`}
            subtitle={`${stats.pendingDividends} pending`}
            icon={<Heart size={18} color={Colors.dividend} />}
            accentColor={Colors.dividend}
            accentBg={Colors.dividendLight}
          />
        </View>

        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <View style={styles.actionsRow}>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.buyLight }]} onPress={() => router.push('/buy' as any)}>
              <ArrowDownCircle size={22} color={Colors.buy} />
              <Text style={[styles.actionText, { color: Colors.buy }]}>Buy USDT</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.sellLight }]} onPress={() => router.push('/sell' as any)}>
              <ArrowUpCircle size={22} color={Colors.sell} />
              <Text style={[styles.actionText, { color: Colors.sell }]}>Sell USDT</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.clientLight }]} onPress={() => router.push('/clients' as any)}>
              <UserCheck size={22} color={Colors.client} />
              <Text style={[styles.actionText, { color: Colors.client }]}>Clients</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.actionsRow}>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.depositLight }]} onPress={() => router.push('/deposits' as any)}>
              <Landmark size={22} color={Colors.deposit} />
              <Text style={[styles.actionText, { color: Colors.deposit }]}>Deposit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.dividendLight }]} onPress={() => router.push('/dividends' as any)}>
              <Heart size={22} color={Colors.dividend} />
              <Text style={[styles.actionText, { color: Colors.dividend }]}>Dividends</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.bankLight }]} onPress={() => router.push('/company-banks' as any)}>
              <Building2 size={22} color={Colors.bank} />
              <Text style={[styles.actionText, { color: Colors.bank }]}>Banks</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.actionsRow}>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.withdrawLight }]} onPress={() => router.push('/withdrawals' as any)}>
              <Banknote size={22} color={Colors.withdraw} />
              <Text style={[styles.actionText, { color: Colors.withdraw }]}>Withdraw</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.accentLight }]} onPress={() => router.push('/insights' as any)}>
              <BarChart3 size={22} color={Colors.accent} />
              <Text style={[styles.actionText, { color: Colors.accent }]}>Insights</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.historyLight }]} onPress={() => router.push('/histories' as any)}>
              <Clock size={22} color={Colors.history} />
              <Text style={[styles.actionText, { color: Colors.history }]}>History</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <TouchableOpacity onPress={() => router.push('/transactions' as any)}>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>

        {recentTransactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No transactions yet</Text>
            <Text style={styles.emptySubtext}>Start by adding a buy or sell entry</Text>
          </View>
        ) : (
          recentTransactions.map(tx => (
            <TransactionCard
              key={tx.id}
              transaction={tx}
              supplierName={getSupplierName(tx.supplierId)}
              onPress={() => router.push({ pathname: '/transaction-detail' as any, params: { id: tx.id, type: tx.type } })}
            />
          ))
        )}

        <View style={styles.bottomPad} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  safeTop: {
    backgroundColor: Colors.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: Colors.primary,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  greeting: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.65)',
  },
  userName: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.textLight,
    marginTop: 2,
  },
  avatarWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 20,
  },
  heroRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  heroCard: {
    flex: 1,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
  },
  heroValue: {
    fontSize: 18,
    fontWeight: '800' as const,
    marginTop: 6,
  },
  heroLabel: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  statsGap: {
    width: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    marginTop: 12,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 12,
  },
  viewAll: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.buy,
  },
  actionsGrid: {
    gap: 10,
    marginBottom: 8,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
  },
  actionText: {
    fontSize: 11,
    fontWeight: '600' as const,
    marginTop: 6,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  emptySubtext: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 4,
  },
  bottomPad: {
    height: 20,
  },
});
