import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ActivityIndicator, TextInput } from 'react-native';
import { Search, Plus, X, Trash2, Edit3, CheckCircle, Building2, RefreshCw } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { useData, generateId } from '@/contexts/DataContext';
import { FormInput } from '@/components/FormInput';
import { CompanyBank } from '@/types';

export default function CompanyBanksScreen() {
  const { currentUser } = useAuth();
  const { companyBanks, addCompanyBank, updateCompanyBank, deleteCompanyBank, addHistoryEntry } = useData();

  const [showForm, setShowForm] = useState(false);
  const [editingBank, setEditingBank] = useState<CompanyBank | null>(null);
  const [bankName, setBankName] = useState('');
  const [city, setCity] = useState('');
  const [accountNo, setAccountNo] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [closingBalance, setClosingBalance] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredBanks = useMemo(() => {
    if (!searchQuery.trim()) return companyBanks;
    const q = searchQuery.toLowerCase();
    return companyBanks.filter(b =>
      b.bankName.toLowerCase().includes(q) ||
      b.city.toLowerCase().includes(q) ||
      b.accountNo.toLowerCase().includes(q)
    );
  }, [companyBanks, searchQuery]);

  const totalBalance = useMemo(() => companyBanks.reduce((s, b) => s + b.closingBalance, 0), [companyBanks]);

  const resetForm = useCallback(() => {
    setBankName('');
    setCity('');
    setAccountNo('');
    setIfsc('');
    setClosingBalance('');
    setSuccess(false);
    setEditingBank(null);
  }, []);

  const openEdit = useCallback((bank: CompanyBank) => {
    setEditingBank(bank);
    setBankName(bank.bankName);
    setCity(bank.city);
    setAccountNo(bank.accountNo);
    setIfsc(bank.ifsc);
    setClosingBalance(bank.closingBalance.toString());
    setShowForm(true);
  }, []);

  const validateIFSC = (val: string) => /^[A-Z]{4}0[A-Z0-9]{6}$/.test(val.toUpperCase());

  const handleSubmit = useCallback(async () => {
    if (!bankName.trim() || !accountNo.trim()) {
      Alert.alert('Missing Fields', 'Bank name and account number are required');
      return;
    }
    if (ifsc.trim() && !validateIFSC(ifsc.trim())) {
      Alert.alert('Invalid IFSC', 'IFSC code format should be like HDFC0001234');
      return;
    }
    setSaving(true);
    try {
      const maskedAcct = accountNo.length > 4 ? '****' + accountNo.slice(-4) : accountNo;
      if (editingBank) {
        const updated: CompanyBank = {
          ...editingBank,
          bankName: bankName.trim(),
          city: city.trim(),
          accountNo: maskedAcct,
          ifsc: ifsc.trim().toUpperCase(),
          closingBalance: parseFloat(closingBalance) || 0,
          lastBalanceUpdate: new Date().toISOString(),
        };
        await updateCompanyBank(updated);
        await addHistoryEntry('CompanyBank', 'Update', updated.id, updated.bankName, currentUser?.id ?? '', currentUser?.name ?? '', JSON.stringify(editingBank), JSON.stringify(updated));
      } else {
        const bank: CompanyBank = {
          id: generateId('cbank'),
          bankName: bankName.trim(),
          city: city.trim(),
          accountNo: maskedAcct,
          ifsc: ifsc.trim().toUpperCase(),
          closingBalance: parseFloat(closingBalance) || 0,
          lastBalanceUpdate: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          createdBy: currentUser?.id ?? '',
        };
        await addCompanyBank(bank);
        await addHistoryEntry('CompanyBank', 'Create', bank.id, bank.bankName, currentUser?.id ?? '', currentUser?.name ?? '');
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSuccess(true);
    } catch {
      Alert.alert('Error', 'Failed to save bank');
    } finally {
      setSaving(false);
    }
  }, [bankName, city, accountNo, ifsc, closingBalance, editingBank, currentUser, addCompanyBank, updateCompanyBank, addHistoryEntry]);

  const handleDelete = useCallback((bank: CompanyBank) => {
    Alert.alert('Delete Bank', `Remove ${bank.bankName}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          await deleteCompanyBank(bank.id);
          await addHistoryEntry('CompanyBank', 'Delete', bank.id, bank.bankName, currentUser?.id ?? '', currentUser?.name ?? '');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        },
      },
    ]);
  }, [deleteCompanyBank, addHistoryEntry, currentUser]);

  const handleRefreshBalance = useCallback(async (bank: CompanyBank) => {
    const updated: CompanyBank = { ...bank, lastBalanceUpdate: new Date().toISOString() };
    await updateCompanyBank(updated);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [updateCompanyBank]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  if (success) {
    return (
      <View style={styles.successContainer}>
        <View style={styles.successCard}>
          <CheckCircle size={56} color={Colors.bank} />
          <Text style={styles.successTitle}>{editingBank ? 'Bank Updated!' : 'Bank Added!'}</Text>
          <Text style={styles.successSubtext}>{bankName}</Text>
          <View style={styles.successActions}>
            <TouchableOpacity style={styles.newEntryBtn} onPress={() => { resetForm(); setShowForm(true); }}>
              <Text style={styles.newEntryText}>Add Another</Text>
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
                <View style={[styles.badge, { backgroundColor: Colors.bankLight }]}>
                  <Text style={[styles.badgeText, { color: Colors.bank }]}>{editingBank ? 'EDIT' : 'NEW'}</Text>
                </View>
                <Text style={styles.cardTitle}>{editingBank ? 'Edit Bank' : 'New Bank Account'}</Text>
              </View>
              <TouchableOpacity onPress={() => { resetForm(); setShowForm(false); }}>
                <X size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            <FormInput label="Bank Name *" value={bankName} onChangeText={setBankName} placeholder="e.g. HDFC Bank" testID="bank-name" />
            <FormInput label="City" value={city} onChangeText={setCity} placeholder="e.g. Mumbai" testID="bank-city" />
            <FormInput label="Account Number *" value={accountNo} onChangeText={setAccountNo} placeholder="Enter account number" testID="bank-acct" />
            <FormInput label="IFSC Code" value={ifsc} onChangeText={setIfsc} placeholder="e.g. HDFC0001234" testID="bank-ifsc" />
            <FormInput label="Closing Balance (₹)" value={closingBalance} onChangeText={setClosingBalance} placeholder="e.g. 2500000" keyboardType="numeric" testID="bank-bal" />
          </View>

          <View style={styles.buttonsRow}>
            <TouchableOpacity style={[styles.submitBtn, saving && styles.disabledBtn]} onPress={handleSubmit} disabled={saving} activeOpacity={0.8}>
              {saving ? <ActivityIndicator color={Colors.textLight} /> : <Text style={styles.submitText}>{editingBank ? 'Update' : 'Add Bank'}</Text>}
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
      <View style={styles.totalCard}>
        <Building2 size={20} color={Colors.bank} />
        <View style={styles.totalInfo}>
          <Text style={styles.totalLabel}>Total Company Balance</Text>
          <Text style={styles.totalValue}>₹{totalBalance.toLocaleString()}</Text>
        </View>
        <Text style={styles.bankCount}>{companyBanks.length} accounts</Text>
      </View>

      <View style={styles.listHeader}>
        <View style={styles.searchWrap}>
          <Search size={16} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search banks..."
            placeholderTextColor={Colors.textMuted}
          />
        </View>
        <TouchableOpacity style={styles.addFab} onPress={() => setShowForm(true)} activeOpacity={0.8}>
          <Plus size={20} color={Colors.textLight} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.flex} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        {filteredBanks.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No bank accounts</Text>
            <Text style={styles.emptySubtext}>Add a company bank account</Text>
          </View>
        ) : (
          filteredBanks.map(bank => (
            <View key={bank.id} style={styles.bankCard}>
              <View style={styles.bankTop}>
                <View style={styles.bankIcon}>
                  <Building2 size={20} color={Colors.bank} />
                </View>
                <View style={styles.bankInfo}>
                  <Text style={styles.bankNameText}>{bank.bankName}</Text>
                  <Text style={styles.bankCity}>{bank.city} | {bank.accountNo}</Text>
                </View>
                <Text style={styles.bankBalance}>₹{bank.closingBalance.toLocaleString()}</Text>
              </View>

              <View style={styles.bankMid}>
                <Text style={styles.ifscText}>IFSC: {bank.ifsc || 'N/A'}</Text>
                <View style={styles.lastUpdateRow}>
                  <Text style={styles.lastUpdate}>Updated: {formatDate(bank.lastBalanceUpdate)}</Text>
                  <TouchableOpacity onPress={() => handleRefreshBalance(bank)} style={styles.refreshBtn}>
                    <RefreshCw size={12} color={Colors.bank} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.bankBottom}>
                <Text style={styles.bankId}>ID: {bank.id}</Text>
                <View style={styles.bankActions}>
                  <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(bank)}>
                    <Edit3 size={14} color={Colors.bank} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(bank)}>
                    <Trash2 size={14} color={Colors.danger} />
                  </TouchableOpacity>
                </View>
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
  totalCard: {
    flexDirection: 'row', alignItems: 'center', margin: 16, marginBottom: 0, padding: 16,
    backgroundColor: Colors.bankLight, borderRadius: 16, gap: 12,
  },
  totalInfo: { flex: 1 },
  totalLabel: { fontSize: 12, color: Colors.bank, fontWeight: '600' as const },
  totalValue: { fontSize: 22, fontWeight: '800' as const, color: Colors.text, marginTop: 2 },
  bankCount: { fontSize: 12, color: Colors.textMuted, fontWeight: '500' as const },
  listHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingBottom: 8, gap: 10 },
  searchWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: 12, paddingHorizontal: 14, borderWidth: 1, borderColor: Colors.borderLight },
  searchInput: { flex: 1, paddingVertical: 12, paddingHorizontal: 10, fontSize: 14, color: Colors.text },
  addFab: { width: 46, height: 46, borderRadius: 14, backgroundColor: Colors.bank, alignItems: 'center', justifyContent: 'center' },
  formCard: { backgroundColor: Colors.card, borderRadius: 20, padding: 20, shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 2, borderWidth: 1, borderColor: Colors.borderLight },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginRight: 10 },
  badgeText: { fontSize: 11, fontWeight: '800' as const, letterSpacing: 0.5 },
  cardTitle: { fontSize: 18, fontWeight: '700' as const, color: Colors.text },
  buttonsRow: { flexDirection: 'row', marginTop: 16, gap: 12 },
  submitBtn: { flex: 2, backgroundColor: Colors.bank, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  disabledBtn: { opacity: 0.6 },
  submitText: { color: Colors.textLight, fontSize: 16, fontWeight: '700' as const },
  resetBtn: { flex: 1, backgroundColor: Colors.card, borderRadius: 14, paddingVertical: 16, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  resetText: { color: Colors.textSecondary, fontSize: 15, fontWeight: '600' as const },
  successContainer: { flex: 1, backgroundColor: Colors.surface, justifyContent: 'center', padding: 24 },
  successCard: { backgroundColor: Colors.card, borderRadius: 24, padding: 32, alignItems: 'center', shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 4 },
  successTitle: { fontSize: 22, fontWeight: '700' as const, color: Colors.text, marginTop: 16 },
  successSubtext: { fontSize: 14, color: Colors.textMuted, marginTop: 8 },
  successActions: { flexDirection: 'row', gap: 12, marginTop: 24 },
  newEntryBtn: { backgroundColor: Colors.bank, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 24 },
  newEntryText: { color: Colors.textLight, fontSize: 15, fontWeight: '700' as const },
  viewListBtn: { backgroundColor: Colors.card, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 24, borderWidth: 1, borderColor: Colors.border },
  viewListText: { color: Colors.textSecondary, fontSize: 15, fontWeight: '600' as const },
  bankCard: { backgroundColor: Colors.card, borderRadius: 16, padding: 16, marginBottom: 10, shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1, borderWidth: 1, borderColor: Colors.borderLight },
  bankTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 12 },
  bankIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: Colors.bankLight, alignItems: 'center', justifyContent: 'center' },
  bankInfo: { flex: 1 },
  bankNameText: { fontSize: 15, fontWeight: '700' as const, color: Colors.text },
  bankCity: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  bankBalance: { fontSize: 17, fontWeight: '800' as const, color: Colors.bank },
  bankMid: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  ifscText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' as const },
  lastUpdateRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  lastUpdate: { fontSize: 11, color: Colors.textMuted },
  refreshBtn: { padding: 4 },
  bankBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: Colors.borderLight, paddingTop: 10 },
  bankId: { fontSize: 11, color: Colors.textMuted },
  bankActions: { flexDirection: 'row', gap: 8 },
  editBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: Colors.bankLight, alignItems: 'center', justifyContent: 'center' },
  deleteBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: Colors.dangerLight, alignItems: 'center', justifyContent: 'center' },
  emptyState: { alignItems: 'center', paddingVertical: 48 },
  emptyText: { fontSize: 15, fontWeight: '600' as const, color: Colors.textSecondary },
  emptySubtext: { fontSize: 13, color: Colors.textMuted, marginTop: 4 },
  bottomPad: { height: 20 },
});
