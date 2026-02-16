import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ActivityIndicator, TextInput } from 'react-native';
import { Search, Plus, X, MapPin, Wallet, Calendar, ChevronRight, Trash2, Edit3, CheckCircle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { formatINR, INR_SYMBOL } from '@/constants/currency';
import { useAuth } from '@/contexts/AuthContext';
import { useData, generateId } from '@/contexts/DataContext';
import { FormInput, Dropdown } from '@/components/FormInput';
import { Client, DueFrequency } from '@/types';
import { DUE_FREQUENCIES } from '@/mocks/data';

export default function ClientsScreen() {
  const { currentUser } = useAuth();
  const { clients, deposits, addClient, updateClient, deleteClient, addHistoryEntry } = useData();

  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [contractFund, setContractFund] = useState('');
  const [depositUID, setDepositUID] = useState('');
  const [tradingFund, setTradingFund] = useState('');
  const [dividendsAmt, setDividendsAmt] = useState('');
  const [dueFrequency, setDueFrequency] = useState('');
  const [remarks, setRemarks] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [lastClientName, setLastClientName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const depositOptions = useMemo(() =>
    deposits.map(d => ({ label: `${d.code} (${formatINR(d.amount)})`, value: d.code })),
    [deposits]
  );

  const freqOptions = DUE_FREQUENCIES.map(f => ({ label: f, value: f }));

  const filteredClients = useMemo(() => {
    if (!searchQuery.trim()) return clients;
    const q = searchQuery.toLowerCase();
    return clients.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.city.toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q) ||
      (c.depositUID ?? '').toLowerCase().includes(q)
    );
  }, [clients, searchQuery]);

  const resetForm = useCallback(() => {
    setName('');
    setCity('');
    setContractFund('');
    setDepositUID('');
    setTradingFund('');
    setDividendsAmt('');
    setDueFrequency('');
    setRemarks('');
    setSuccess(false);
    setEditingClient(null);
  }, []);

  const openEdit = useCallback((client: Client) => {
    setEditingClient(client);
    setName(client.name);
    setCity(client.city);
    setContractFund(client.contractFund.toString());
    setDepositUID(client.depositUID ?? '');
    setTradingFund(client.tradingFund.toString());
    setDividendsAmt(client.dividendsAmt.toString());
    setDueFrequency(client.dueFrequency);
    setRemarks(client.remarks);
    setShowForm(true);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!name.trim()) {
      Alert.alert('Missing Fields', 'Client name is required');
      return;
    }
    setSaving(true);
    try {
      if (editingClient) {
        const updated: Client = {
          ...editingClient,
          name: name.trim(),
          city: city.trim(),
          contractFund: parseFloat(contractFund) || 0,
          depositUID: depositUID || undefined,
          tradingFund: parseFloat(tradingFund) || 0,
          dividendsAmt: parseFloat(dividendsAmt) || 0,
          dueFrequency: (dueFrequency as DueFrequency) || 'Monthly',
          remarks: remarks.trim(),
        };
        await updateClient(updated);
        await addHistoryEntry('Client', 'Update', updated.id, updated.name, currentUser?.id ?? '', currentUser?.name ?? '', JSON.stringify(editingClient), JSON.stringify(updated));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        const client: Client = {
          id: generateId('cli'),
          name: name.trim(),
          city: city.trim(),
          contractFund: parseFloat(contractFund) || 0,
          depositUID: depositUID || undefined,
          tradingFund: parseFloat(tradingFund) || 0,
          dividendsAmt: parseFloat(dividendsAmt) || 0,
          dueFrequency: (dueFrequency as DueFrequency) || 'Monthly',
          remarks: remarks.trim(),
          createdAt: new Date().toISOString(),
          createdBy: currentUser?.id ?? '',
        };
        await addClient(client);
        await addHistoryEntry('Client', 'Create', client.id, client.name, currentUser?.id ?? '', currentUser?.name ?? '');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setLastClientName(client.name);
      }
      setSuccess(true);
    } catch {
      Alert.alert('Error', 'Failed to save client');
    } finally {
      setSaving(false);
    }
  }, [name, city, contractFund, depositUID, tradingFund, dividendsAmt, dueFrequency, remarks, editingClient, currentUser, addClient, updateClient, addHistoryEntry]);

  const handleDelete = useCallback((client: Client) => {
    Alert.alert('Delete Client', `Are you sure you want to delete ${client.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          await deleteClient(client.id);
          await addHistoryEntry('Client', 'Delete', client.id, client.name, currentUser?.id ?? '', currentUser?.name ?? '');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        },
      },
    ]);
  }, [deleteClient, addHistoryEntry, currentUser]);

  const formatCurrency = (num: number) => formatINR(num, true);

  if (success) {
    return (
      <View style={styles.successContainer}>
        <View style={styles.successCard}>
          <CheckCircle size={56} color={Colors.client} />
          <Text style={styles.successTitle}>{editingClient ? 'Client Updated!' : 'Client Added!'}</Text>
          <Text style={styles.successSubtext}>{editingClient ? editingClient.name : lastClientName}</Text>
          <View style={styles.successActions}>
            <TouchableOpacity style={styles.newEntryBtn} onPress={() => { resetForm(); setShowForm(true); }}>
              <Text style={styles.newEntryText}>New Client</Text>
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
                <View style={[styles.badge, { backgroundColor: Colors.clientLight }]}>
                  <Text style={[styles.badgeText, { color: Colors.client }]}>{editingClient ? 'EDIT' : 'NEW'}</Text>
                </View>
                <Text style={styles.cardTitle}>{editingClient ? 'Edit Client' : 'New Client'}</Text>
              </View>
              <TouchableOpacity onPress={() => { resetForm(); setShowForm(false); }}>
                <X size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            <FormInput label="Name *" value={name} onChangeText={setName} placeholder="Client full name" testID="cli-name" />
            <FormInput label="City" value={city} onChangeText={setCity} placeholder="e.g. Mumbai" testID="cli-city" />
            <FormInput label={`Contract Fund (${INR_SYMBOL})`} value={contractFund} onChangeText={setContractFund} placeholder="e.g. 1000000" keyboardType="numeric" testID="cli-fund" />
            <Dropdown label="Deposit UID" value={depositUID} options={depositOptions} onSelect={setDepositUID} placeholder="Link to bank deposit" />
            <FormInput label={`Trading Fund (${INR_SYMBOL})`} value={tradingFund} onChangeText={setTradingFund} placeholder="e.g. 500000" keyboardType="numeric" testID="cli-trading" />
            <FormInput label={`Dividends Amount (${INR_SYMBOL})`} value={dividendsAmt} onChangeText={setDividendsAmt} placeholder="e.g. 15000" keyboardType="numeric" testID="cli-div" />
            <Dropdown label="Due Date Frequency" value={dueFrequency} options={freqOptions} onSelect={setDueFrequency} placeholder="Select frequency" />
            <FormInput label="Remarks" value={remarks} onChangeText={setRemarks} placeholder="Additional notes..." multiline testID="cli-remarks" />
          </View>

          <View style={styles.buttonsRow}>
            <TouchableOpacity style={[styles.submitBtn, saving && styles.disabledBtn]} onPress={handleSubmit} disabled={saving} activeOpacity={0.8}>
              {saving ? <ActivityIndicator color={Colors.textLight} /> : <Text style={styles.submitText}>{editingClient ? 'Update Client' : 'Save Client'}</Text>}
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
            placeholder="Search by name, city, UID..."
            placeholderTextColor={Colors.textMuted}
            testID="cli-search"
          />
        </View>
        <TouchableOpacity style={styles.addFab} onPress={() => setShowForm(true)} activeOpacity={0.8}>
          <Plus size={20} color={Colors.textLight} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.flex} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        {filteredClients.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No clients found</Text>
            <Text style={styles.emptySubtext}>Add your first client to get started</Text>
          </View>
        ) : (
          filteredClients.map(client => (
            <TouchableOpacity key={client.id} style={styles.clientCard} activeOpacity={0.7} onPress={() => openEdit(client)}>
              <View style={styles.clientTop}>
                <View style={styles.clientInfo}>
                  <Text style={styles.clientName}>{client.name}</Text>
                  <View style={styles.cityRow}>
                    <MapPin size={12} color={Colors.textMuted} />
                    <Text style={styles.cityText}>{client.city || 'No city'}</Text>
                  </View>
                </View>
                <View style={styles.clientFundWrap}>
                  <Text style={styles.clientFund}>{formatCurrency(client.contractFund)}</Text>
                  <Text style={styles.fundLabel}>Contract</Text>
                </View>
              </View>

              <View style={styles.clientMid}>
                <View style={styles.clientStat}>
                  <Wallet size={13} color={Colors.client} />
                  <Text style={styles.statText}>{formatCurrency(client.tradingFund)}</Text>
                  <Text style={styles.statLabel}>Trading</Text>
                </View>
                <View style={styles.clientStat}>
                  <Calendar size={13} color={Colors.dividend} />
                  <Text style={styles.statText}>{formatCurrency(client.dividendsAmt)}</Text>
                  <Text style={styles.statLabel}>{client.dueFrequency}</Text>
                </View>
                {client.depositUID ? (
                  <View style={styles.uidTag}>
                    <Text style={styles.uidText} numberOfLines={1}>{client.depositUID}</Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.clientBottom}>
                <Text style={styles.clientId}>ID: {client.id}</Text>
                <View style={styles.clientActions}>
                  <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(client)}>
                    <Edit3 size={14} color={Colors.client} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(client)}>
                    <Trash2 size={14} color={Colors.danger} />
                  </TouchableOpacity>
                  <ChevronRight size={16} color={Colors.textMuted} />
                </View>
              </View>
            </TouchableOpacity>
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
  addFab: { width: 46, height: 46, borderRadius: 14, backgroundColor: Colors.client, alignItems: 'center', justifyContent: 'center' },
  formCard: { backgroundColor: Colors.card, borderRadius: 20, padding: 20, shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 2, borderWidth: 1, borderColor: Colors.borderLight },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginRight: 10 },
  badgeText: { fontSize: 11, fontWeight: '800' as const, letterSpacing: 0.5 },
  cardTitle: { fontSize: 18, fontWeight: '700' as const, color: Colors.text },
  buttonsRow: { flexDirection: 'row', marginTop: 16, gap: 12 },
  submitBtn: { flex: 2, backgroundColor: Colors.client, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  disabledBtn: { opacity: 0.6 },
  submitText: { color: Colors.textLight, fontSize: 16, fontWeight: '700' as const },
  resetBtn: { flex: 1, backgroundColor: Colors.card, borderRadius: 14, paddingVertical: 16, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  resetText: { color: Colors.textSecondary, fontSize: 15, fontWeight: '600' as const },
  successContainer: { flex: 1, backgroundColor: Colors.surface, justifyContent: 'center', padding: 24 },
  successCard: { backgroundColor: Colors.card, borderRadius: 24, padding: 32, alignItems: 'center', shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 4 },
  successTitle: { fontSize: 22, fontWeight: '700' as const, color: Colors.text, marginTop: 16 },
  successSubtext: { fontSize: 14, color: Colors.textMuted, marginTop: 8 },
  successActions: { flexDirection: 'row', gap: 12, marginTop: 24 },
  newEntryBtn: { backgroundColor: Colors.client, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 24 },
  newEntryText: { color: Colors.textLight, fontSize: 15, fontWeight: '700' as const },
  viewListBtn: { backgroundColor: Colors.card, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 24, borderWidth: 1, borderColor: Colors.border },
  viewListText: { color: Colors.textSecondary, fontSize: 15, fontWeight: '600' as const },
  clientCard: { backgroundColor: Colors.card, borderRadius: 16, padding: 16, marginBottom: 10, shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1, borderWidth: 1, borderColor: Colors.borderLight },
  clientTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  clientInfo: { flex: 1 },
  clientName: { fontSize: 16, fontWeight: '700' as const, color: Colors.text },
  cityRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  cityText: { fontSize: 12, color: Colors.textMuted },
  clientFundWrap: { alignItems: 'flex-end' },
  clientFund: { fontSize: 18, fontWeight: '800' as const, color: Colors.client },
  fundLabel: { fontSize: 10, color: Colors.textMuted, marginTop: 2 },
  clientMid: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap' },
  clientStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: 13, fontWeight: '600' as const, color: Colors.text },
  statLabel: { fontSize: 11, color: Colors.textMuted },
  uidTag: { backgroundColor: Colors.depositLight, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, maxWidth: 160 },
  uidText: { fontSize: 10, fontWeight: '600' as const, color: Colors.deposit },
  clientBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: Colors.borderLight, paddingTop: 10 },
  clientId: { fontSize: 11, color: Colors.textMuted, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  clientActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  editBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: Colors.clientLight, alignItems: 'center', justifyContent: 'center' },
  deleteBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: Colors.dangerLight, alignItems: 'center', justifyContent: 'center' },
  emptyState: { alignItems: 'center', paddingVertical: 48 },
  emptyText: { fontSize: 15, fontWeight: '600' as const, color: Colors.textSecondary },
  emptySubtext: { fontSize: 13, color: Colors.textMuted, marginTop: 4 },
  bottomPad: { height: 20 },
});
