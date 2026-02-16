import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ActivityIndicator, TextInput } from 'react-native';
import { CheckCircle, Search, Trash2, Plus, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { formatINR, INR_SYMBOL } from '@/constants/currency';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { FormInput, Dropdown } from '@/components/FormInput';
import { BankWithdrawal, WithdrawMode } from '@/types';
import { WITHDRAW_MODES } from '@/mocks/data';

export default function WithdrawalsScreen() {
  const { currentUser } = useAuth();
  const { withdrawals, deposits, addWithdrawal, deleteWithdrawal } = useData();

  const [showForm, setShowForm] = useState(false);
  const [withdrawerName, setWithdrawerName] = useState('');
  const [withdrawBank, setWithdrawBank] = useState('');
  const [withdrawMode, setWithdrawMode] = useState('');
  const [amount, setAmount] = useState('');
  const [beneficiariesName, setBeneficiariesName] = useState('');
  const [depositCode, setDepositCode] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const modeOptions = WITHDRAW_MODES.map(m => ({ label: m, value: m }));
  const depositCodeOptions = useMemo(() =>
    deposits.map(d => ({ label: `${d.code} (${formatINR(d.amount)})`, value: d.code })),
    [deposits]
  );

  const filteredWithdrawals = useMemo(() => {
    if (!searchQuery.trim()) return withdrawals;
    const q = searchQuery.toLowerCase();
    return withdrawals.filter(w =>
      w.withdrawerName.toLowerCase().includes(q) ||
      w.withdrawBank.toLowerCase().includes(q) ||
      (w.depositCode ?? '').toLowerCase().includes(q) ||
      w.createdAt.split('T')[0].includes(q)
    );
  }, [withdrawals, searchQuery]);

  const resetForm = useCallback(() => {
    setWithdrawerName('');
    setWithdrawBank('');
    setWithdrawMode('');
    setAmount('');
    setBeneficiariesName('');
    setDepositCode('');
    setSuccess(false);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!withdrawerName.trim() || !withdrawBank.trim() || !amount.trim() || !withdrawMode) {
      Alert.alert('Missing Fields', 'Please fill in all required fields');
      return;
    }
    if (withdrawMode === 'UPI-Transfer' && !beneficiariesName.trim()) {
      Alert.alert('Missing Field', 'Beneficiaries Name is required for UPI-Transfer');
      return;
    }
    setSaving(true);
    try {
      const withdrawal: BankWithdrawal = {
        id: `wth-${Date.now()}`,
        withdrawerName: withdrawerName.trim(),
        withdrawBank: withdrawBank.trim(),
        mode: withdrawMode as WithdrawMode,
        amount: parseFloat(amount),
        beneficiariesName: withdrawMode === 'UPI-Transfer' ? beneficiariesName.trim() : undefined,
        depositCode: depositCode || undefined,
        createdAt: new Date().toISOString(),
        createdBy: currentUser?.id ?? '',
      };
      await addWithdrawal(withdrawal);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSuccess(true);
    } catch {
      Alert.alert('Error', 'Failed to save withdrawal');
    } finally {
      setSaving(false);
    }
  }, [withdrawerName, withdrawBank, withdrawMode, amount, beneficiariesName, depositCode, currentUser, addWithdrawal]);

  const handleDelete = useCallback((id: string) => {
    Alert.alert('Delete Withdrawal', 'Are you sure you want to delete this withdrawal entry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteWithdrawal(id);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        },
      },
    ]);
  }, [deleteWithdrawal]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  if (success) {
    return (
      <View style={styles.successContainer}>
        <View style={styles.successCard}>
          <CheckCircle size={56} color={Colors.withdraw} />
          <Text style={styles.successTitle}>Withdrawal Added!</Text>
          <Text style={styles.successSubtext}>
            {formatINR(parseFloat(amount))} withdrawn by {withdrawerName}
            {depositCode ? `\nLinked to ${depositCode}` : ''}
          </Text>
          <View style={styles.successActions}>
            <TouchableOpacity style={styles.newEntryBtn} onPress={() => { resetForm(); setShowForm(true); }}>
              <Text style={styles.newEntryText}>New Withdrawal</Text>
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
                <View style={[styles.badge, { backgroundColor: Colors.withdrawLight }]}>
                  <Text style={[styles.badgeText, { color: Colors.withdraw }]}>WITHDRAW</Text>
                </View>
                <Text style={styles.cardTitle}>New Withdrawal</Text>
              </View>
              <TouchableOpacity onPress={() => setShowForm(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <X size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            <FormInput label="Withdrawer Name" value={withdrawerName} onChangeText={setWithdrawerName} placeholder="Enter withdrawer name" testID="wth-name" />
            <FormInput label="Withdraw Bank" value={withdrawBank} onChangeText={setWithdrawBank} placeholder="e.g. HDFC Bank" testID="wth-bank" />
            <FormInput label={`Amount (${INR_SYMBOL})`} value={amount} onChangeText={setAmount} placeholder="e.g. 200000" keyboardType="numeric" testID="wth-amount" />
            <Dropdown label="Mode" value={withdrawMode} options={modeOptions} onSelect={setWithdrawMode} placeholder="Select withdrawal mode" />

            {withdrawMode === 'UPI-Transfer' && (
              <FormInput label="Beneficiaries Name" value={beneficiariesName} onChangeText={setBeneficiariesName} placeholder="Enter beneficiary name" testID="wth-beneficiary" />
            )}

            <Dropdown label="Bank Deposit Code (optional)" value={depositCode} options={depositCodeOptions} onSelect={setDepositCode} placeholder="Link to a deposit code" />
          </View>

          <View style={styles.buttonsRow}>
            <TouchableOpacity
              style={[styles.submitBtn, saving && styles.disabledBtn]}
              onPress={handleSubmit}
              disabled={saving}
              activeOpacity={0.8}
            >
              {saving ? <ActivityIndicator color={Colors.textLight} /> : <Text style={styles.submitText}>Add Withdrawal</Text>}
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
      <View style={styles.listHeader}>
        <View style={styles.searchWrap}>
          <Search size={16} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by name, bank, code..."
            placeholderTextColor={Colors.textMuted}
            testID="wth-search"
          />
        </View>
        <TouchableOpacity style={styles.addFab} onPress={() => setShowForm(true)} activeOpacity={0.8}>
          <Plus size={20} color={Colors.textLight} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.flex} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        {filteredWithdrawals.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No withdrawals found</Text>
            <Text style={styles.emptySubtext}>Add a new withdrawal to get started</Text>
          </View>
        ) : (
          filteredWithdrawals.map(w => (
            <View key={w.id} style={styles.withdrawalCard}>
              <View style={styles.cardTop}>
                <View style={styles.cardTopLeft}>
                  <Text style={styles.withdrawerName}>{w.withdrawerName}</Text>
                  <View style={[styles.modeTag, { backgroundColor: Colors.withdrawLight }]}>
                    <Text style={[styles.modeTagText, { color: Colors.withdraw }]}>{w.mode}</Text>
                  </View>
                </View>
                <Text style={styles.withdrawalAmount}>{formatINR(w.amount)}</Text>
              </View>

              <View style={styles.cardMid}>
                <View style={styles.cardDetail}>
                  <Text style={styles.detailLabel}>Bank</Text>
                  <Text style={styles.detailValue}>{w.withdrawBank}</Text>
                </View>
                <View style={styles.cardDetail}>
                  <Text style={styles.detailLabel}>Date</Text>
                  <Text style={styles.detailValue}>{formatDate(w.createdAt)}</Text>
                </View>
                {w.beneficiariesName ? (
                  <View style={styles.cardDetail}>
                    <Text style={styles.detailLabel}>Beneficiary</Text>
                    <Text style={styles.detailValue}>{w.beneficiariesName}</Text>
                  </View>
                ) : null}
              </View>

              {w.depositCode ? (
                <View style={styles.linkedDeposit}>
                  <Text style={styles.linkedLabel}>Linked Deposit</Text>
                  <Text style={styles.linkedCode}>{w.depositCode}</Text>
                </View>
              ) : null}

              <View style={styles.cardBottom}>
                <View />
                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(w.id)} activeOpacity={0.7}>
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
    backgroundColor: Colors.withdraw,
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
    backgroundColor: Colors.withdraw,
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
  successTitle: { fontSize: 22, fontWeight: '700' as const, color: Colors.text, marginTop: 16 },
  successSubtext: { fontSize: 14, color: Colors.textMuted, marginTop: 12, textAlign: 'center' as const },
  successActions: { flexDirection: 'row', gap: 12, marginTop: 24 },
  newEntryBtn: {
    backgroundColor: Colors.withdraw,
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
  withdrawalCard: {
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
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardTopLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  withdrawerName: { fontSize: 15, fontWeight: '700' as const, color: Colors.text },
  modeTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  modeTagText: { fontSize: 10, fontWeight: '700' as const },
  withdrawalAmount: { fontSize: 18, fontWeight: '800' as const, color: Colors.text },
  cardMid: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  cardDetail: { flex: 1 },
  detailLabel: { fontSize: 11, color: Colors.textMuted, marginBottom: 2 },
  detailValue: { fontSize: 13, fontWeight: '600' as const, color: Colors.text },
  linkedDeposit: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.depositLight,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
  },
  linkedLabel: { fontSize: 11, fontWeight: '600' as const, color: Colors.deposit },
  linkedCode: { fontSize: 13, fontWeight: '700' as const, color: Colors.deposit, letterSpacing: 0.3 },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: 10,
  },
  deleteBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Colors.dangerLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: { alignItems: 'center', paddingVertical: 48 },
  emptyText: { fontSize: 15, fontWeight: '600' as const, color: Colors.textSecondary },
  emptySubtext: { fontSize: 13, color: Colors.textMuted, marginTop: 4 },
  bottomPad: { height: 20 },
});
