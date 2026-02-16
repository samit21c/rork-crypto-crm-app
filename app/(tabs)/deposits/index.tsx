import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ActivityIndicator, TextInput } from 'react-native';
import { CheckCircle, Search, Trash2, ShieldCheck, ShieldOff, Plus, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { formatINR, INR_SYMBOL } from '@/constants/currency';
import { useAuth } from '@/contexts/AuthContext';
import { useData, generateDepositCode } from '@/contexts/DataContext';
import { FormInput, Dropdown } from '@/components/FormInput';
import { BankDeposit, DepositMode } from '@/types';
import { DEPOSIT_MODES } from '@/mocks/data';

export default function DepositsScreen() {
  const { currentUser } = useAuth();
  const { deposits, addDeposit, updateDeposit, deleteDeposit } = useData();

  const [showForm, setShowForm] = useState(false);
  const [depositorName, setDepositorName] = useState('');
  const [depositorBank, setDepositorBank] = useState('');
  const [amount, setAmount] = useState('');
  const [mode, setMode] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [lastCode, setLastCode] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const modeOptions = DEPOSIT_MODES.map(m => ({ label: m, value: m }));

  const filteredDeposits = useMemo(() => {
    if (!searchQuery.trim()) return deposits;
    const q = searchQuery.toLowerCase();
    return deposits.filter(d =>
      d.code.toLowerCase().includes(q) ||
      d.depositorName.toLowerCase().includes(q) ||
      d.depositorBank.toLowerCase().includes(q) ||
      d.createdAt.split('T')[0].includes(q)
    );
  }, [deposits, searchQuery]);

  const resetForm = useCallback(() => {
    setDepositorName('');
    setDepositorBank('');
    setAmount('');
    setMode('');
    setSuccess(false);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!depositorName.trim() || !depositorBank.trim() || !amount.trim() || !mode) {
      Alert.alert('Missing Fields', 'Please fill in all required fields');
      return;
    }
    setSaving(true);
    try {
      const code = generateDepositCode();
      const deposit: BankDeposit = {
        id: `dep-${Date.now()}`,
        code,
        depositorName: depositorName.trim(),
        depositorBank: depositorBank.trim(),
        amount: parseFloat(amount),
        mode: mode as DepositMode,
        isVerified: false,
        createdAt: new Date().toISOString(),
        createdBy: currentUser?.id ?? '',
      };
      await addDeposit(deposit);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setLastCode(code);
      setSuccess(true);
    } catch {
      Alert.alert('Error', 'Failed to save deposit');
    } finally {
      setSaving(false);
    }
  }, [depositorName, depositorBank, amount, mode, currentUser, addDeposit]);

  const handleVerify = useCallback(async (deposit: BankDeposit) => {
    const updated: BankDeposit = {
      ...deposit,
      isVerified: !deposit.isVerified,
      verifiedBy: !deposit.isVerified ? currentUser?.id : undefined,
    };
    await updateDeposit(updated);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [currentUser, updateDeposit]);

  const handleDelete = useCallback((id: string) => {
    Alert.alert('Delete Deposit', 'Are you sure you want to delete this deposit entry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteDeposit(id);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        },
      },
    ]);
  }, [deleteDeposit]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  if (success) {
    return (
      <View style={styles.successContainer}>
        <View style={styles.successCard}>
          <CheckCircle size={56} color={Colors.deposit} />
          <Text style={styles.successTitle}>Deposit Added!</Text>
          <View style={styles.codeBox}>
            <Text style={styles.codeLabel}>Unique Code</Text>
            <Text style={styles.codeValue}>{lastCode}</Text>
          </View>
          <Text style={styles.successSubtext}>{formatINR(parseFloat(amount))} deposited by {depositorName}</Text>
          <View style={styles.successActions}>
            <TouchableOpacity style={styles.newEntryBtn} onPress={() => { resetForm(); setShowForm(true); }}>
              <Text style={styles.newEntryText}>New Deposit</Text>
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
                <View style={[styles.badge, { backgroundColor: Colors.depositLight }]}>
                  <Text style={[styles.badgeText, { color: Colors.deposit }]}>DEPOSIT</Text>
                </View>
                <Text style={styles.cardTitle}>New Deposit</Text>
              </View>
              <TouchableOpacity onPress={() => setShowForm(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <X size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            <FormInput label="Depositor Name" value={depositorName} onChangeText={setDepositorName} placeholder="Enter depositor name" testID="dep-name" />
            <FormInput label="Depositor Bank" value={depositorBank} onChangeText={setDepositorBank} placeholder="e.g. HDFC Bank" testID="dep-bank" />
            <FormInput label={`Amount (${INR_SYMBOL})`} value={amount} onChangeText={setAmount} placeholder="e.g. 500000" keyboardType="numeric" testID="dep-amount" />
            <Dropdown label="Mode" value={mode} options={modeOptions} onSelect={setMode} placeholder="Select deposit mode" />
          </View>

          <View style={styles.buttonsRow}>
            <TouchableOpacity
              style={[styles.submitBtn, saving && styles.disabledBtn]}
              onPress={handleSubmit}
              disabled={saving}
              activeOpacity={0.8}
            >
              {saving ? <ActivityIndicator color={Colors.textLight} /> : <Text style={styles.submitText}>Add Deposit</Text>}
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
            placeholder="Search by code, name, date..."
            placeholderTextColor={Colors.textMuted}
            testID="dep-search"
          />
        </View>
        <TouchableOpacity style={styles.addFab} onPress={() => setShowForm(true)} activeOpacity={0.8}>
          <Plus size={20} color={Colors.textLight} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.flex} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        {filteredDeposits.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No deposits found</Text>
            <Text style={styles.emptySubtext}>Add a new deposit to get started</Text>
          </View>
        ) : (
          filteredDeposits.map(dep => (
            <View key={dep.id} style={styles.depositCard}>
              <View style={styles.depositTop}>
                <View style={styles.depositCodeWrap}>
                  <Text style={styles.depositCode}>{dep.code}</Text>
                  <View style={[styles.modeTag, { backgroundColor: Colors.depositLight }]}>
                    <Text style={[styles.modeTagText, { color: Colors.deposit }]}>{dep.mode}</Text>
                  </View>
                </View>
                <Text style={styles.depositAmount}>{formatINR(dep.amount)}</Text>
              </View>

              <View style={styles.depositMid}>
                <View style={styles.depositDetail}>
                  <Text style={styles.detailLabel}>Depositor</Text>
                  <Text style={styles.detailValue}>{dep.depositorName}</Text>
                </View>
                <View style={styles.depositDetail}>
                  <Text style={styles.detailLabel}>Bank</Text>
                  <Text style={styles.detailValue}>{dep.depositorBank}</Text>
                </View>
                <View style={styles.depositDetail}>
                  <Text style={styles.detailLabel}>Date</Text>
                  <Text style={styles.detailValue}>{formatDate(dep.createdAt)}</Text>
                </View>
              </View>

              <View style={styles.depositBottom}>
                <TouchableOpacity
                  style={[styles.verifyBtn, dep.isVerified && styles.verifiedBtn]}
                  onPress={() => handleVerify(dep)}
                  activeOpacity={0.7}
                >
                  {dep.isVerified ? (
                    <ShieldCheck size={14} color={Colors.accent} />
                  ) : (
                    <ShieldOff size={14} color={Colors.textMuted} />
                  )}
                  <Text style={[styles.verifyText, dep.isVerified && styles.verifiedText]}>
                    {dep.isVerified ? 'Verified' : 'Mark Verified'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(dep.id)} activeOpacity={0.7}>
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
    backgroundColor: Colors.deposit,
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
    backgroundColor: Colors.deposit,
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
  codeBox: {
    backgroundColor: Colors.depositLight,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginTop: 16,
    alignItems: 'center',
  },
  codeLabel: { fontSize: 11, fontWeight: '600' as const, color: Colors.deposit, letterSpacing: 0.5 },
  codeValue: { fontSize: 18, fontWeight: '800' as const, color: Colors.deposit, marginTop: 2, letterSpacing: 1 },
  successSubtext: { fontSize: 14, color: Colors.textMuted, marginTop: 12, textAlign: 'center' as const },
  successActions: { flexDirection: 'row', gap: 12, marginTop: 24 },
  newEntryBtn: {
    backgroundColor: Colors.deposit,
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
  depositCard: {
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
  depositTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  depositCodeWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  depositCode: { fontSize: 13, fontWeight: '700' as const, color: Colors.deposit, letterSpacing: 0.3 },
  modeTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  modeTagText: { fontSize: 10, fontWeight: '700' as const },
  depositAmount: { fontSize: 18, fontWeight: '800' as const, color: Colors.text },
  depositMid: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  depositDetail: { flex: 1 },
  detailLabel: { fontSize: 11, color: Colors.textMuted, marginBottom: 2 },
  detailValue: { fontSize: 13, fontWeight: '600' as const, color: Colors.text },
  depositBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: 10,
  },
  verifyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Colors.surface,
  },
  verifiedBtn: { backgroundColor: Colors.accentLight },
  verifyText: { fontSize: 12, fontWeight: '600' as const, color: Colors.textMuted },
  verifiedText: { color: Colors.accent },
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
