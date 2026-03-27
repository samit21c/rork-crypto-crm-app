import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { Search, Clock, Plus, Pencil, Trash2, Filter } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useData } from '@/contexts/DataContext';
import { HistorySection, HistoryAction } from '@/types';

const SECTION_COLORS: Record<HistorySection, { color: string; bg: string }> = {
  Client: { color: Colors.client, bg: Colors.clientLight },
  CompanyBank: { color: Colors.bank, bg: Colors.bankLight },
  Deposit: { color: Colors.deposit, bg: Colors.depositLight },
  Withdrawal: { color: Colors.withdraw, bg: Colors.withdrawLight },
  BuyTrade: { color: Colors.buy, bg: Colors.buyLight },
  SellTrade: { color: Colors.sell, bg: Colors.sellLight },
  Dividend: { color: Colors.dividend, bg: Colors.dividendLight },
  Supplier: { color: Colors.warning, bg: Colors.warningLight },
  CashInHand: { color: Colors.cash, bg: Colors.cashLight },
};

const ACTION_ICONS: Record<HistoryAction, typeof Plus> = {
  Create: Plus,
  Update: Pencil,
  Delete: Trash2,
};

export default function HistoriesScreen() {
  const { history } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSection, setFilterSection] = useState<HistorySection | 'All'>('All');

  const sections: (HistorySection | 'All')[] = ['All', 'Client', 'CompanyBank', 'Deposit', 'Withdrawal', 'BuyTrade', 'SellTrade', 'Dividend', 'Supplier'];

  const filteredHistory = useMemo(() => {
    let result = history;
    if (filterSection !== 'All') {
      result = result.filter(h => h.section === filterSection);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(h =>
        h.entityLabel.toLowerCase().includes(q) ||
        h.userName.toLowerCase().includes(q) ||
        h.section.toLowerCase().includes(q) ||
        h.action.toLowerCase().includes(q) ||
        h.timestamp.split('T')[0].includes(q)
      );
    }
    return result.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [history, filterSection, searchQuery]);

  const formatDateTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const actionColor = (action: HistoryAction) => {
    switch (action) {
      case 'Create': return Colors.accent;
      case 'Update': return Colors.info;
      case 'Delete': return Colors.danger;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.listHeader}>
        <View style={styles.searchWrap}>
          <Search size={16} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search history..."
            placeholderTextColor={Colors.textMuted}
          />
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
        {sections.map(sec => (
          <TouchableOpacity
            key={sec}
            style={[styles.filterChip, filterSection === sec && styles.filterChipActive]}
            onPress={() => setFilterSection(sec)}
          >
            <Text style={[styles.filterChipText, filterSection === sec && styles.filterChipTextActive]}>
              {sec === 'CompanyBank' ? 'Bank' : sec === 'BuyTrade' ? 'Buy' : sec === 'SellTrade' ? 'Sell' : sec}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.flex} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        {filteredHistory.length === 0 ? (
          <View style={styles.emptyState}>
            <Clock size={40} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No history entries</Text>
            <Text style={styles.emptySubtext}>Changes will be tracked here automatically</Text>
          </View>
        ) : (
          filteredHistory.map(entry => {
            const sectionStyle = SECTION_COLORS[entry.section];
            const ActionIcon = ACTION_ICONS[entry.action];
            return (
              <View key={entry.id} style={styles.historyCard}>
                <View style={styles.historyLeft}>
                  <View style={[styles.actionIconWrap, { backgroundColor: sectionStyle.bg }]}>
                    <ActionIcon size={14} color={actionColor(entry.action)} />
                  </View>
                  <View style={styles.timeline} />
                </View>
                <View style={styles.historyRight}>
                  <View style={styles.historyTop}>
                    <View style={[styles.sectionTag, { backgroundColor: sectionStyle.bg }]}>
                      <Text style={[styles.sectionTagText, { color: sectionStyle.color }]}>{entry.section}</Text>
                    </View>
                    <View style={[styles.actionTag, { backgroundColor: actionColor(entry.action) + '18' }]}>
                      <Text style={[styles.actionTagText, { color: actionColor(entry.action) }]}>{entry.action}</Text>
                    </View>
                  </View>
                  <Text style={styles.entityLabel}>{entry.entityLabel}</Text>
                  <View style={styles.historyMeta}>
                    <Text style={styles.metaUser}>{entry.userName}</Text>
                    <Text style={styles.metaDot}>·</Text>
                    <Text style={styles.metaTime}>{formatDateTime(entry.timestamp)}</Text>
                  </View>
                  {entry.before && entry.after && (
                    <View style={styles.changeBlock}>
                      <Text style={styles.changeTitle}>Changes:</Text>
                      <Text style={styles.changeText} numberOfLines={2}>Before: {entry.before}</Text>
                      <Text style={styles.changeText} numberOfLines={2}>After: {entry.after}</Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })
        )}
        <View style={styles.bottomPad} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: Colors.surface },
  listHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingBottom: 8, gap: 10 },
  searchWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: 12, paddingHorizontal: 14, borderWidth: 1, borderColor: Colors.borderLight },
  searchInput: { flex: 1, paddingVertical: 12, paddingHorizontal: 10, fontSize: 14, color: Colors.text },
  filterScroll: { maxHeight: 44 },
  filterContent: { paddingHorizontal: 16, gap: 8, alignItems: 'center' },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.borderLight },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterChipText: { fontSize: 12, fontWeight: '600' as const, color: Colors.textSecondary },
  filterChipTextActive: { color: Colors.textLight },
  listContent: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20 },
  historyCard: { flexDirection: 'row', marginBottom: 4 },
  historyLeft: { alignItems: 'center', width: 36 },
  actionIconWrap: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  timeline: { flex: 1, width: 2, backgroundColor: Colors.borderLight, marginTop: 4, marginBottom: -4 },
  historyRight: { flex: 1, marginLeft: 12, backgroundColor: Colors.card, borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: Colors.borderLight },
  historyTop: { flexDirection: 'row', gap: 6, marginBottom: 6 },
  sectionTag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  sectionTagText: { fontSize: 10, fontWeight: '700' as const },
  actionTag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  actionTagText: { fontSize: 10, fontWeight: '700' as const },
  entityLabel: { fontSize: 14, fontWeight: '600' as const, color: Colors.text, marginBottom: 4 },
  historyMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaUser: { fontSize: 11, color: Colors.textSecondary, fontWeight: '500' as const },
  metaDot: { fontSize: 11, color: Colors.textMuted },
  metaTime: { fontSize: 11, color: Colors.textMuted },
  changeBlock: { marginTop: 8, backgroundColor: Colors.surface, borderRadius: 8, padding: 8 },
  changeTitle: { fontSize: 11, fontWeight: '600' as const, color: Colors.textSecondary, marginBottom: 4 },
  changeText: { fontSize: 10, color: Colors.textMuted, marginBottom: 2 },
  emptyState: { alignItems: 'center', paddingVertical: 48, gap: 8 },
  emptyText: { fontSize: 15, fontWeight: '600' as const, color: Colors.textSecondary },
  emptySubtext: { fontSize: 13, color: Colors.textMuted },
  bottomPad: { height: 20 },
});
