import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ActivityIndicator, TextInput } from 'react-native';
import { CheckCircle, Search, Trash2, Plus, X, Edit3, HandCoins, User, Target, MessageSquare } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { formatINR, INR_SYMBOL } from '@/constants/currency';
import { useAuth } from '@/contexts/AuthContext';
import { useData, generateId } from '@/contexts/DataContext';
import { FormInput, Dropdown } from '@/components/FormInput';
import { CashInHand } from '@/types';
import { HOLD_PURPOSES } from '@/mocks/data';

export default function CashInHandScreen() {
  const { currentUser } = useAuth();
  const { cashInHand, clients, addCashInHand, updateCashInHand, deleteCashInHand, addHistoryEntry } = useData();

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<CashInHand | null>(null);
  const [cashierName, setCashierName] = useState('');
  const [cashAmount, setCashAmount] = useState('');
  const [clientAssign, setClientAssign] = useState('');
  const [holdPurpose, setHoldPurpose] = useState('');
  const [remarks, setRemarks] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const purposeOptions = HOLD_PURPOSES.map(p => ({ label: p, value: p }));
  const clientOptions = useMemo(() => clients.map(c => ({ label: c.name, value: c.name })), [clients]);

  const totalCashHeld = useMemo(() => cashInHand.reduce((sum, c) => sum + c.cashAmount, 0), [cashInHand]);

  const filteredCash = useMemo(() => {
    if (!searchQuery.trim()) return cashInHand;
    const q = searchQuery.toLowerCase();
    return cashInHand.filter(c =>
      c.cashierName.toLowerCase().includes(q) ||
      c.clientAssign.toLowerCase().includes(q) ||
      c.holdPurpose.toLowerCase().includes(q) ||
      c.remarks.toLowerCase().includes(q)
    );
  }, [cashInHand, searchQuery]);

  const resetForm = useCallback(() => {
    setCashierName('');
    setCashAmount('');
    setClientAssign('');
    setHoldPurpose('');
    setRemarks('');
    setSuccess(false);
    setEditingItem(null);
  }, []);

  const openEditForm = useCallback((item: CashInHand) => {
    setEditingItem(item);
    setCashierName(item.cashierName);
    setCashAmount(item.cashAmount.toString());
    setClientAssign(item.clientAssign);
    setHoldPurpose(item.holdPurpose);
    setRemarks(item.remarks);
    setShowForm(true);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!cashierName.trim() || !cashAmount.trim() || !clientAssign.trim() || !holdPurpose) {
      Alert.alert('Missing Fields', 'Please fill in Cashier Name, Amount, Client Assign, and Hold Purpose');
      return;
    }
    setSaving(true);
    try {
      if (editingItem) {
        const updated: CashInHand = {
          ...editingItem,
          cashierName: cashierName.trim(),
          cashAmount: parseFloat(cashAmount),
          clientAssign: clientAssign.trim(),
          holdPurpose: holdPurpose.trim(),
          remarks: remarks.trim(),
        };
        await updateCashInHand(updated);
        await addHistoryEntry(
          'CashInHand', 'Update', updated.id, `${updated.cashierName} - ${formatINR(updated.cashAmount)}`,
          currentUser?.id ?? '', currentUser?.name ?? '',
          JSON.stringify({ cashierName: editingItem.cashierName, cashAmount: editingItem.cashAmount }),
          JSON.stringify({ cashierName: updated.cashierName, cashAmount: updated.cashAmount })
        );
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        const entry: CashInHand = {
          id: generateId('cash'),
          cashierName: cashierName.trim(),
          cashAmount: parseFloat(cashAmount),
          clientAssign: clientAssign.trim(),
          holdPurpose: holdPurpose.trim(),
          remarks: remarks.trim(),
          createdAt: new Date().toISOString(),
          createdBy: currentUser?.id ?? '',
        };
        await addCashInHand(entry);
        await addHistoryEntry(
          'CashInHand', 'Create', entry.id, `${entry.cashierName} - ${formatINR(entry.cashAmount)}`,
          currentUser?.id ?? '', currentUser?.name ?? ''
        );
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      setSuccess(true);
    } catch {
      Alert.alert('Error', 'Failed to save cash entry');
    } finally {
      setSaving(false);
    }
  }, [cashierName, cashAmount, clientAssign, holdPurpose, remarks, currentUser, addCashInHand, updateCashInHand, addHistoryEntry, editingItem]);

  const handleDelete = useCallback((item: CashInHand) => {
    Alert.alert('Delete Entry', `Remove cash entry for ${item.cashierName}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteCashInHand(item.id);
          await addHistoryEntry(
            'CashInHand', 'Delete', item.id, `${item.cashierName} - ${formatINR(item.cashAmount)}`,
            currentUser?.id ?? '', currentUser?.name ?? ''
          );
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        },
      },
    ]);
  }, [deleteCashInHand, addHistoryEntry, currentUser]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  if (success) {
    return (
      <View style={styles.successContainer}>
        <View style={styles.successCard}>
          <View style={styles.successIconWrap}>
            <CheckCircle size={56} color={Colors.cash} />
          </View>
          <Text style={styles.successTitle}>{editingItem ? 'Entry Updated!' : 'Cash Entry Added!'}</Text>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>Cashier</Text>
            <Text style={styles.summaryValue}>{cashierName}</Text>
            <Text style={styles.summaryLabel}>Amount</Text>
            <Text style={styles.summaryAmount}>{formatINR(parseFloat(cashAmount))}</Text>
          </View>
          <View style={styles.successActions}>
            <TouchableOpacity style={styles.newEntryBtn} onPress={() => { resetForm(); setShowForm(true); }}>
              <Text style={styles.newEntryText}>New Entry</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.viewListBtn} onPress={() => { resetForm(); setShowForm(false); }}>
              <Text style={styles.viewListText}>View All</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  if (showForm) {
    return (
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.formCard}>
            <View style={styles.cardHeader}>
              <View style={styles.headerLeft}>
                <View style={[styles.badge, { backgroundColor: Colors.cashLight }]}>
                  <Text style={[styles.badgeText, { color: Colors.cash }]}>{editingItem ? 'EDIT' : 'NEW'}</Text>
                </View>
                <Text style={styles.cardTitle}>{editingItem ? 'Edit Cash Entry' : 'New Cash Entry'}</Text>
              </View>
              <TouchableOpacity onPress={() => { resetForm(); setShowForm(false); }} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <X size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            <FormInput label="Cashier Name" value={cashierName} onChangeText={setCashierName} placeholder="Enter cashier name" testID="cash-name" />
            <FormInput label={`Cash Amount (${INR_SYMBOL})`} value={cashAmount} onChangeText={setCashAmount} placeholder="e.g. 250000" keyboardType="numeric" testID="cash-amount" />
            <Dropdown label="Client Assign" value={clientAssign} options={clientOptions} onSelect={setClientAssign} placeholder="Select or enter client" />
            <Dropdown label="Hold Purpose" value={holdPurpose} options={purposeOptions} onSelect={setHoldPurpose} placeholder="Select purpose" />
            <FormInput label="Remarks" value={remarks} onChangeText={setRemarks} placeholder="Optional notes..." multiline testID="cash-remarks" />
          </View>

          <View style={styles.buttonsRow}>
            <TouchableOpacity
              style={[styles.submitBtn, saving && styles.disabledBtn]}
              onPress={handleSubmit}
              disabled={saving}
              activeOpacity={0.8}
            >
              {saving ? <ActivityIndicator color={Colors.textLight} /> : <Text style={styles.submitText}>{editingItem ? 'Update Entry' : 'Add Entry'}</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.resetBtn} onPress={resetForm} activeOpacity={0.7}>
              <Text style={styles.resetText}>Clear</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.bottomPad} />
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.summaryStrip}>
        <View style={styles.stripLeft}>
          <HandCoins size={18} color={Colors.cash} />
          <Text style={styles.stripLabel}>Total Cash Held</Text>
        </View>
        <Text style={styles.stripValue}>{formatINR(totalCashHeld)}</Text>
      </View>

      <View style={styles.listHeader}>
        <View style={styles.searchWrap}>
          <Search size={16} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search cashier, client, purpose..."
            placeholderTextColor={Colors.textMuted}
            testID="cash-search"
          />
        </View>
        <TouchableOpacity style={styles.addFab} onPress={() => setShowForm(true)} activeOpacity={0.8}>
          <Plus size={20} color={Colors.textLight} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.flex} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        {filteredCash.length === 0 ? (
          <View style={styles.emptyState}>
            <HandCoins size={40} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No cash entries found</Text>
            <Text style={styles.emptySubtext}>Add a new cash-in-hand entry to get started</Text>
          </View>
        ) : (
          filteredCash.map(item => (
            <View key={item.id} style={styles.cashCard}>
              <View style={styles.cashTop}>
                <View style={styles.cashNameRow}>
                  <View style={styles.cashierAvatar}>
                    <Text style={styles.cashierAvatarText}>{item.cashierName.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={styles.cashierInfo}>
                    <Text style={styles.cashierName}>{item.cashierName}</Text>
                    <Text style={styles.cashDate}>{formatDate(item.createdAt)}</Text>
                  </View>
                </View>
                <Text style={styles.cashAmountText}>{formatINR(item.cashAmount)}</Text>
              </View>

              <View style={styles.cashDetails}>
                <View style={styles.detailRow}>
                  <User size={13} color={Colors.textMuted} />
                  <Text style={styles.detailLabel}>Client:</Text>
                  <Text style={styles.detailValue}>{item.clientAssign}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Target size={13} color={Colors.textMuted} />
                  <Text style={styles.detailLabel}>Purpose:</Text>
                  <View style={[styles.purposeTag, { backgroundColor: Colors.cashLight }]}>
                    <Text style={[styles.purposeTagText, { color: Colors.cash }]}>{item.holdPurpose}</Text>
                  </View>
                </View>
                {item.remarks ? (
                  <View style={styles.detailRow}>
                    <MessageSquare size={13} color={Colors.textMuted} />
                    <Text style={styles.detailLabel}>Note:</Text>
                    <Text style={[styles.detailValue, styles.remarkText]} numberOfLines={2}>{item.remarks}</Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.cashBottom}>
                <TouchableOpacity
                  style={styles.editBtn}
                  onPress={() => openEditForm(item)}
                  activeOpacity={0.7}
                >
                  <Edit3 size={14} color={Colors.cash} />
                  <Text style={styles.editBtnText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)} activeOpacity={0.7}>
                  <Trash2 size={14} color={Colors.danger} />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
        <View style={styles.bottomPad} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: Colors.surface },
  content: { padding: 20 },
  listContent: { paddingHorizontal: 20, paddingBottom: 20 },
  summaryStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.cashLight,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  stripLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stripLabel: { fontSize: 13, fontWeight: '600' as const, color: Colors.textSecondary },
  stripValue: { fontSize: 18, fontWeight: '800' as const, color: Colors.cash },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 8,
    gap: 10,
  },
  searchWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    fontSize: 14,
    color: Colors.text,
  },
  addFab: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: Colors.cash,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 20,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginRight: 10 },
  badgeText: { fontSize: 11, fontWeight: '800' as const, letterSpacing: 0.5 },
  cardTitle: { fontSize: 18, fontWeight: '700' as const, color: Colors.text },
  buttonsRow: { flexDirection: 'row', marginTop: 16, gap: 12 },
  submitBtn: {
    flex: 2,
    backgroundColor: Colors.cash,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  disabledBtn: { opacity: 0.6 },
  submitText: { color: Colors.textLight, fontSize: 16, fontWeight: '700' as const },
  resetBtn: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  resetText: { color: Colors.textSecondary, fontSize: 15, fontWeight: '600' as const },
  successContainer: { flex: 1, backgroundColor: Colors.surface, justifyContent: 'center', padding: 24 },
  successCard: {
    backgroundColor: Colors.card,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  successIconWrap: { marginBottom: 4 },
  successTitle: { fontSize: 22, fontWeight: '700' as const, color: Colors.text, marginTop: 12 },
  summaryBox: {
    backgroundColor: Colors.cashLight,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 14,
    marginTop: 16,
    alignItems: 'center',
    width: '100%',
  },
  summaryLabel: { fontSize: 11, fontWeight: '600' as const, color: Colors.cash, letterSpacing: 0.5 },
  summaryValue: { fontSize: 16, fontWeight: '700' as const, color: Colors.text, marginBottom: 6 },
  summaryAmount: { fontSize: 22, fontWeight: '800' as const, color: Colors.cash, marginTop: 2 },
  successActions: { flexDirection: 'row', gap: 12, marginTop: 24 },
  newEntryBtn: {
    backgroundColor: Colors.cash,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  newEntryText: { color: Colors.textLight, fontSize: 15, fontWeight: '700' as const },
  viewListBtn: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  viewListText: { color: Colors.textSecondary, fontSize: 15, fontWeight: '600' as const },
  cashCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  cashTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cashNameRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 },
  cashierAvatar: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Colors.cashLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cashierAvatarText: { fontSize: 16, fontWeight: '700' as const, color: Colors.cash },
  cashierInfo: { flexShrink: 1 },
  cashierName: { fontSize: 15, fontWeight: '700' as const, color: Colors.text },
  cashDate: { fontSize: 11, color: Colors.textMuted, marginTop: 1 },
  cashAmountText: { fontSize: 18, fontWeight: '800' as const, color: Colors.cash },
  cashDetails: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    padding: 12,
    gap: 8,
    marginBottom: 12,
  },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailLabel: { fontSize: 12, color: Colors.textMuted, minWidth: 52 },
  detailValue: { fontSize: 13, fontWeight: '600' as const, color: Colors.text, flex: 1 },
  remarkText: { fontWeight: '400' as const, color: Colors.textSecondary },
  purposeTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  purposeTagText: { fontSize: 11, fontWeight: '700' as const },
  cashBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: 10,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: Colors.cashLight,
  },
  editBtnText: { fontSize: 13, fontWeight: '600' as const, color: Colors.cash },
  deleteBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Colors.dangerLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: { alignItems: 'center', paddingVertical: 48, gap: 8 },
  emptyText: { fontSize: 15, fontWeight: '600' as const, color: Colors.textSecondary },
  emptySubtext: { fontSize: 13, color: Colors.textMuted },
  bottomPad: { height: 20 },
});
