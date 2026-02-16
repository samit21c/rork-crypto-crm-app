import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ActivityIndicator, TextInput } from 'react-native';
import { Search, Plus, X, Trash2, Edit3, CheckCircle, Clock, AlertCircle, CircleDot } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { formatINR, INR_SYMBOL } from '@/constants/currency';
import { useAuth } from '@/contexts/AuthContext';
import { useData, generateId } from '@/contexts/DataContext';
import { FormInput, Dropdown } from '@/components/FormInput';
import { Dividend, DividendStatus } from '@/types';

function computeNextDueDate(currentDue: string, frequency: string): string {
  const d = new Date(currentDue);
  switch (frequency) {
    case 'Daily': d.setDate(d.getDate() + 1); break;
    case 'Weekly': d.setDate(d.getDate() + 7); break;
    case 'Monthly': d.setMonth(d.getMonth() + 1); break;
    default: d.setMonth(d.getMonth() + 1); break;
  }
  return d.toISOString();
}

export default function DividendsScreen() {
  const { currentUser } = useAuth();
  const { dividends, clients, companyBanks, addDividend, updateDividend, deleteDividend, addHistoryEntry, getClientName, getBankName } = useData();

  const [showForm, setShowForm] = useState(false);
  const [editingDiv, setEditingDiv] = useState<Dividend | null>(null);
  const [clientId, setClientId] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [assignedBankId, setAssignedBankId] = useState('');
  const [remarks, setRemarks] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<DividendStatus | 'All'>('All');

  const clientOptions = useMemo(() =>
    clients.map(c => ({ label: `${c.name} (${c.city || 'N/A'})`, value: c.id })),
    [clients]
  );

  const bankOptions = useMemo(() =>
    companyBanks.map(b => ({ label: `${b.bankName} - ${b.city}`, value: b.id })),
    [companyBanks]
  );

  const selectedClient = useMemo(() => clients.find(c => c.id === clientId), [clients, clientId]);

  const filteredDividends = useMemo(() => {
    let result = dividends;
    if (filterStatus !== 'All') {
      result = result.filter(d => d.status === filterStatus);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(d =>
        getClientName(d.clientId).toLowerCase().includes(q) ||
        d.status.toLowerCase().includes(q) ||
        d.dueDate.split('T')[0].includes(q)
      );
    }
    return result;
  }, [dividends, filterStatus, searchQuery, getClientName]);

  const resetForm = useCallback(() => {
    setClientId('');
    setPaidAmount('');
    setAssignedBankId('');
    setRemarks('');
    setSuccess(false);
    setEditingDiv(null);
  }, []);

  const openEdit = useCallback((div: Dividend) => {
    setEditingDiv(div);
    setClientId(div.clientId);
    setPaidAmount(div.paidAmount.toString());
    setAssignedBankId(div.assignedBankId ?? '');
    setRemarks(div.remarks);
    setShowForm(true);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!clientId) {
      Alert.alert('Missing Fields', 'Please select a client');
      return;
    }
    setSaving(true);
    try {
      const client = clients.find(c => c.id === clientId);
      const paid = parseFloat(paidAmount) || 0;
      const now = new Date().toISOString();

      if (editingDiv) {
        const existingPaidForClient = dividends
          .filter(d => d.clientId === clientId && d.id !== editingDiv.id && d.status === 'Paid')
          .reduce((s, d) => s + d.paidAmount, 0);
        const updated: Dividend = {
          ...editingDiv,
          clientId,
          paidAmount: paid,
          totalPaid: existingPaidForClient + paid,
          assignedBankId: assignedBankId || undefined,
          status: paid > 0 ? 'Paid' : (new Date(editingDiv.dueDate) < new Date() ? 'Overdue' : 'Pending'),
          remarks: remarks.trim(),
        };
        await updateDividend(updated);
        await addHistoryEntry('Dividend', 'Update', updated.id, `${getClientName(clientId)} Dividend`, currentUser?.id ?? '', currentUser?.name ?? '', JSON.stringify(editingDiv), JSON.stringify(updated));
      } else {
        const existingPaidForClient = dividends
          .filter(d => d.clientId === clientId && d.status === 'Paid')
          .reduce((s, d) => s + d.paidAmount, 0);
        const dueDate = now;
        const freq = client?.dueFrequency ?? 'Monthly';
        const dividend: Dividend = {
          id: generateId('div'),
          clientId,
          dueDate,
          paidAmount: paid,
          totalPaid: existingPaidForClient + paid,
          nextDueDate: computeNextDueDate(dueDate, freq),
          assignedBankId: assignedBankId || undefined,
          status: paid > 0 ? 'Paid' : 'Pending',
          remarks: remarks.trim(),
          createdAt: now,
          createdBy: currentUser?.id ?? '',
        };
        await addDividend(dividend);
        await addHistoryEntry('Dividend', 'Create', dividend.id, `${getClientName(clientId)} Dividend`, currentUser?.id ?? '', currentUser?.name ?? '');
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSuccess(true);
    } catch {
      Alert.alert('Error', 'Failed to save dividend');
    } finally {
      setSaving(false);
    }
  }, [clientId, paidAmount, assignedBankId, remarks, editingDiv, clients, dividends, currentUser, addDividend, updateDividend, addHistoryEntry, getClientName]);

  const handleDelete = useCallback((div: Dividend) => {
    Alert.alert('Delete Dividend', 'Are you sure you want to delete this dividend entry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          await deleteDividend(div.id);
          await addHistoryEntry('Dividend', 'Delete', div.id, `${getClientName(div.clientId)} Dividend`, currentUser?.id ?? '', currentUser?.name ?? '');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        },
      },
    ]);
  }, [deleteDividend, addHistoryEntry, getClientName, currentUser]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const isOverdue = (dateStr: string) => new Date(dateStr) < new Date();

  const statusColor = (status: DividendStatus) => {
    switch (status) {
      case 'Paid': return Colors.accent;
      case 'Pending': return Colors.warning;
      case 'Overdue': return Colors.danger;
    }
  };

  const statusBg = (status: DividendStatus) => {
    switch (status) {
      case 'Paid': return Colors.accentLight;
      case 'Pending': return Colors.warningLight;
      case 'Overdue': return Colors.dangerLight;
    }
  };

  const StatusIcon = ({ status }: { status: DividendStatus }) => {
    switch (status) {
      case 'Paid': return <CheckCircle size={13} color={Colors.accent} />;
      case 'Pending': return <Clock size={13} color={Colors.warning} />;
      case 'Overdue': return <AlertCircle size={13} color={Colors.danger} />;
    }
  };

  if (success) {
    return (
      <View style={styles.successContainer}>
        <View style={styles.successCard}>
          <CheckCircle size={56} color={Colors.dividend} />
          <Text style={styles.successTitle}>{editingDiv ? 'Dividend Updated!' : 'Dividend Added!'}</Text>
          <Text style={styles.successSubtext}>{getClientName(clientId)}</Text>
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
                <View style={[styles.badge, { backgroundColor: Colors.dividendLight }]}>
                  <Text style={[styles.badgeText, { color: Colors.dividend }]}>{editingDiv ? 'EDIT' : 'NEW'}</Text>
                </View>
                <Text style={styles.cardTitle}>{editingDiv ? 'Edit Dividend' : 'New Dividend'}</Text>
              </View>
              <TouchableOpacity onPress={() => { resetForm(); setShowForm(false); }}>
                <X size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Dropdown label="Client *" value={clientId} options={clientOptions} onSelect={setClientId} placeholder="Select a client" />

            {selectedClient && (
              <View style={styles.clientPreview}>
                <Text style={styles.previewLabel}>Contract: {formatINR(selectedClient.contractFund)}</Text>
                <Text style={styles.previewLabel}>Dividend Rate: {formatINR(selectedClient.dividendsAmt)} / {selectedClient.dueFrequency}</Text>
              </View>
            )}

            <FormInput label={`Paid Amount (${INR_SYMBOL})`} value={paidAmount} onChangeText={setPaidAmount} placeholder="e.g. 15000" keyboardType="numeric" testID="div-paid" />
            <Dropdown label="Assign Bank" value={assignedBankId} options={bankOptions} onSelect={setAssignedBankId} placeholder="Select company bank" />
            <FormInput label="Remarks" value={remarks} onChangeText={setRemarks} placeholder="Additional notes..." multiline testID="div-remarks" />
          </View>

          <View style={styles.buttonsRow}>
            <TouchableOpacity style={[styles.submitBtn, saving && styles.disabledBtn]} onPress={handleSubmit} disabled={saving} activeOpacity={0.8}>
              {saving ? <ActivityIndicator color={Colors.textLight} /> : <Text style={styles.submitText}>{editingDiv ? 'Update' : 'Add Dividend'}</Text>}
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
            placeholder="Search by client, date..."
            placeholderTextColor={Colors.textMuted}
          />
        </View>
        <TouchableOpacity style={styles.addFab} onPress={() => setShowForm(true)} activeOpacity={0.8}>
          <Plus size={20} color={Colors.textLight} />
        </TouchableOpacity>
      </View>

      <View style={styles.filterRow}>
        {(['All', 'Pending', 'Paid', 'Overdue'] as const).map(status => (
          <TouchableOpacity
            key={status}
            style={[styles.filterChip, filterStatus === status && styles.filterChipActive]}
            onPress={() => setFilterStatus(status)}
          >
            <Text style={[styles.filterChipText, filterStatus === status && styles.filterChipTextActive]}>{status}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.flex} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        {filteredDividends.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No dividends found</Text>
            <Text style={styles.emptySubtext}>Add a dividend entry to track payouts</Text>
          </View>
        ) : (
          filteredDividends.map(div => (
            <View key={div.id} style={styles.divCard}>
              <View style={styles.divTop}>
                <View style={styles.divInfo}>
                  <Text style={styles.divClientName}>{getClientName(div.clientId)}</Text>
                  <View style={[styles.statusTag, { backgroundColor: statusBg(div.status) }]}>
                    <StatusIcon status={div.status} />
                    <Text style={[styles.statusText, { color: statusColor(div.status) }]}>{div.status}</Text>
                  </View>
                </View>
                <View style={styles.divAmtWrap}>
                  <Text style={styles.divAmount}>{formatINR(div.paidAmount)}</Text>
                  <Text style={styles.divAmtLabel}>Paid</Text>
                </View>
              </View>

              <View style={styles.divMid}>
                <View style={styles.divDetail}>
                  <Text style={styles.detailLabel}>Due Date</Text>
                  <Text style={[styles.detailValue, isOverdue(div.dueDate) && div.status !== 'Paid' ? { color: Colors.danger } : {}]}>
                    {formatDate(div.dueDate)}
                  </Text>
                </View>
                <View style={styles.divDetail}>
                  <Text style={styles.detailLabel}>Total Paid</Text>
                  <Text style={styles.detailValue}>{formatINR(div.totalPaid)}</Text>
                </View>
                <View style={styles.divDetail}>
                  <Text style={styles.detailLabel}>Next Due</Text>
                  <Text style={styles.detailValue}>{formatDate(div.nextDueDate)}</Text>
                </View>
              </View>

              {div.assignedBankId && (
                <View style={styles.bankTag}>
                  <CircleDot size={11} color={Colors.bank} />
                  <Text style={styles.bankTagText}>{getBankName(div.assignedBankId)}</Text>
                </View>
              )}

              <View style={styles.divBottom}>
                <Text style={styles.divRemarks} numberOfLines={1}>{div.remarks || 'No remarks'}</Text>
                <View style={styles.divActions}>
                  <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(div)}>
                    <Edit3 size={14} color={Colors.dividend} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(div)}>
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
  listHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingBottom: 8, gap: 10 },
  searchWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: 12, paddingHorizontal: 14, borderWidth: 1, borderColor: Colors.borderLight },
  searchInput: { flex: 1, paddingVertical: 12, paddingHorizontal: 10, fontSize: 14, color: Colors.text },
  addFab: { width: 46, height: 46, borderRadius: 14, backgroundColor: Colors.dividend, alignItems: 'center', justifyContent: 'center' },
  filterRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.borderLight },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterChipText: { fontSize: 12, fontWeight: '600' as const, color: Colors.textSecondary },
  filterChipTextActive: { color: Colors.textLight },
  formCard: { backgroundColor: Colors.card, borderRadius: 20, padding: 20, shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 2, borderWidth: 1, borderColor: Colors.borderLight },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginRight: 10 },
  badgeText: { fontSize: 11, fontWeight: '800' as const, letterSpacing: 0.5 },
  cardTitle: { fontSize: 18, fontWeight: '700' as const, color: Colors.text },
  clientPreview: { backgroundColor: Colors.surface, borderRadius: 12, padding: 12, marginBottom: 16, gap: 4 },
  previewLabel: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' as const },
  buttonsRow: { flexDirection: 'row', marginTop: 16, gap: 12 },
  submitBtn: { flex: 2, backgroundColor: Colors.dividend, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  disabledBtn: { opacity: 0.6 },
  submitText: { color: Colors.textLight, fontSize: 16, fontWeight: '700' as const },
  resetBtn: { flex: 1, backgroundColor: Colors.card, borderRadius: 14, paddingVertical: 16, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  resetText: { color: Colors.textSecondary, fontSize: 15, fontWeight: '600' as const },
  successContainer: { flex: 1, backgroundColor: Colors.surface, justifyContent: 'center', padding: 24 },
  successCard: { backgroundColor: Colors.card, borderRadius: 24, padding: 32, alignItems: 'center', shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 4 },
  successTitle: { fontSize: 22, fontWeight: '700' as const, color: Colors.text, marginTop: 16 },
  successSubtext: { fontSize: 14, color: Colors.textMuted, marginTop: 8 },
  successActions: { flexDirection: 'row', gap: 12, marginTop: 24 },
  newEntryBtn: { backgroundColor: Colors.dividend, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 24 },
  newEntryText: { color: Colors.textLight, fontSize: 15, fontWeight: '700' as const },
  viewListBtn: { backgroundColor: Colors.card, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 24, borderWidth: 1, borderColor: Colors.border },
  viewListText: { color: Colors.textSecondary, fontSize: 15, fontWeight: '600' as const },
  divCard: { backgroundColor: Colors.card, borderRadius: 16, padding: 16, marginBottom: 10, shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1, borderWidth: 1, borderColor: Colors.borderLight },
  divTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  divInfo: { flex: 1, gap: 6 },
  divClientName: { fontSize: 16, fontWeight: '700' as const, color: Colors.text },
  statusTag: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, alignSelf: 'flex-start' },
  statusText: { fontSize: 11, fontWeight: '700' as const },
  divAmtWrap: { alignItems: 'flex-end' },
  divAmount: { fontSize: 18, fontWeight: '800' as const, color: Colors.text },
  divAmtLabel: { fontSize: 10, color: Colors.textMuted, marginTop: 2 },
  divMid: { flexDirection: 'row', gap: 16, marginBottom: 10 },
  divDetail: { flex: 1 },
  detailLabel: { fontSize: 11, color: Colors.textMuted, marginBottom: 2 },
  detailValue: { fontSize: 13, fontWeight: '600' as const, color: Colors.text },
  bankTag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.bankLight, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start', marginBottom: 10 },
  bankTagText: { fontSize: 11, fontWeight: '600' as const, color: Colors.bank },
  divBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: Colors.borderLight, paddingTop: 10 },
  divRemarks: { fontSize: 12, color: Colors.textMuted, flex: 1 },
  divActions: { flexDirection: 'row', gap: 8 },
  editBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: Colors.dividendLight, alignItems: 'center', justifyContent: 'center' },
  deleteBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: Colors.dangerLight, alignItems: 'center', justifyContent: 'center' },
  emptyState: { alignItems: 'center', paddingVertical: 48 },
  emptyText: { fontSize: 15, fontWeight: '600' as const, color: Colors.textSecondary },
  emptySubtext: { fontSize: 13, color: Colors.textMuted, marginTop: 4 },
  bottomPad: { height: 20 },
});
