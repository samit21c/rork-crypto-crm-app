import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Image as ImageIcon, CheckCircle, Link2 } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { FormInput, Dropdown } from '@/components/FormInput';
import { SellTransaction } from '@/types';

export default function SellScreen() {
  const { currentUser } = useAuth();
  const { suppliers, clients, addSell, buyTransactions, sellTransactions } = useData();

  const [clientId, setClientId] = useState('');
  const [accountCHZbit, setAccountCHZbit] = useState('');
  const [buyTransactionId, setBuyTransactionId] = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [volume, setVolume] = useState('');
  const [rate, setRate] = useState('');
  const [sellVolume, setSellVolume] = useState('');
  const [traderName, setTraderName] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [remarks, setRemarks] = useState('');
  const [attachment, setAttachment] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const clientOptions = useMemo(() =>
    clients.map(c => ({ label: `${c.name} — ₹${c.contractFund.toLocaleString()}`, value: c.id })),
    [clients]
  );

  const buyTxOptions = useMemo(() =>
    buyTransactions.map(t => {
      const supplier = suppliers.find(s => s.id === t.supplierId);
      const supplierLabel = supplier ? ` · ${supplier.name}` : '';
      return {
        label: `${t.volume} USDT @ ₹${t.rate} — ${t.senderName}${supplierLabel}`,
        value: t.id,
      };
    }),
    [buyTransactions, suppliers]
  );

  const supplierOptions = useMemo(() =>
    suppliers.map(s => ({ label: s.name, value: s.id })),
    [suppliers]
  );

  const selectedClient = useMemo(() =>
    clients.find(c => c.id === clientId),
    [clients, clientId]
  );

  const selectedBuyTx = useMemo(() =>
    buyTransactions.find(t => t.id === buyTransactionId),
    [buyTransactions, buyTransactionId]
  );

  const handleClientChange = useCallback((id: string) => {
    setClientId(id);
    const client = clients.find(c => c.id === id);
    if (client) {
      setAccountCHZbit(`CHZ-${client.id.replace('cli-', '').toUpperCase()}`);
      setReceiverName(client.name);
      console.log('[Sell] Client selected:', client.name, '→ CHZbit auto-set');
    }
  }, [clients]);

  const handleBuyTxChange = useCallback((id: string) => {
    setBuyTransactionId(id);
    const tx = buyTransactions.find(t => t.id === id);
    if (tx) {
      setVolume(tx.volume.toString());
      if (tx.supplierId) setSupplierId(tx.supplierId);
      console.log('[Sell] Buy TX linked:', tx.id, '→ volume & supplier auto-set');
    }
  }, [buyTransactions]);

  const avgBuyRate = useMemo(() => {
    const totalValue = buyTransactions.reduce((sum, t) => sum + t.volume * t.rate, 0);
    const totalVol = buyTransactions.reduce((sum, t) => sum + t.volume, 0);
    return totalVol > 0 ? totalValue / totalVol : 0;
  }, [buyTransactions]);

  const totalBuyVol = useMemo(() => buyTransactions.reduce((s, t) => s + t.volume, 0), [buyTransactions]);
  const totalSellVol = useMemo(() => sellTransactions.reduce((s, t) => s + t.sellVolume, 0), [sellTransactions]);

  const profitMargin = useMemo(() => {
    const r = parseFloat(rate) || 0;
    const sv = parseFloat(sellVolume) || 0;
    return (r - avgBuyRate) * sv;
  }, [rate, sellVolume, avgBuyRate]);

  const balanceVolume = useMemo(() => {
    const sv = parseFloat(sellVolume) || 0;
    return totalBuyVol - totalSellVol - sv;
  }, [totalBuyVol, totalSellVol, sellVolume]);

  const resetForm = useCallback(() => {
    setClientId('');
    setAccountCHZbit('');
    setBuyTransactionId('');
    setReceiverName('');
    setVolume('');
    setRate('');
    setSellVolume('');
    setTraderName('');
    setSupplierId('');
    setRemarks('');
    setAttachment('');
    setSuccess(false);
  }, []);

  const pickImage = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setAttachment(result.assets[0].uri);
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!accountCHZbit.trim() || !receiverName.trim() || !volume.trim() || !rate.trim() || !sellVolume.trim() || !traderName.trim()) {
      Alert.alert('Missing Fields', 'Please fill in all required fields');
      return;
    }
    setSaving(true);
    try {
      const tx: SellTransaction = {
        id: `sell-${Date.now()}`,
        type: 'sell',
        accountCHZbit: accountCHZbit.trim(),
        clientId: clientId || undefined,
        buyTransactionId: buyTransactionId || undefined,
        receiverName: receiverName.trim(),
        volume: parseFloat(volume),
        rate: parseFloat(rate),
        sellVolume: parseFloat(sellVolume),
        profitMargin,
        balanceVolume,
        traderName: traderName.trim(),
        supplierId: supplierId || undefined,
        remarks: remarks.trim(),
        attachmentUri: attachment || undefined,
        createdAt: new Date().toISOString(),
        createdBy: currentUser?.id ?? '',
      };
      await addSell(tx);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSuccess(true);
      console.log('[Sell] Transaction saved:', tx.id);
    } catch {
      Alert.alert('Error', 'Failed to save transaction');
    } finally {
      setSaving(false);
    }
  }, [accountCHZbit, clientId, buyTransactionId, receiverName, volume, rate, sellVolume, traderName, supplierId, remarks, attachment, profitMargin, balanceVolume, currentUser, addSell]);

  if (success) {
    return (
      <View style={styles.successContainer}>
        <View style={styles.successCard}>
          <CheckCircle size={56} color={Colors.accent} />
          <Text style={styles.successTitle}>Entry Added!</Text>
          <Text style={styles.successSubtext}>Sell transaction of {sellVolume} USDT at ₹{rate} saved.</Text>
          <TouchableOpacity style={styles.newEntryBtn} onPress={resetForm}>
            <Text style={styles.newEntryText}>New Entry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.formCard}>
          <View style={styles.cardHeader}>
            <View style={[styles.badge, { backgroundColor: Colors.sellLight }]}>  
              <Text style={[styles.badgeText, { color: Colors.sell }]}>SELL</Text>
            </View>
            <Text style={styles.cardTitle}>New Sell Entry</Text>
          </View>

          <View style={styles.sectionLabel}>
            <Link2 size={14} color={Colors.primary} />
            <Text style={styles.sectionLabelText}>Client & Contract</Text>
          </View>

          <Dropdown
            label="CHZbit Client Contract"
            value={clientId}
            options={clientOptions}
            onSelect={handleClientChange}
            placeholder="Select client (auto-fills contract)"
          />

          {selectedClient && (
            <View style={styles.autoFillCard}>
              <Text style={styles.autoFillLabel}>Contract Fund</Text>
              <Text style={styles.autoFillValue}>₹{selectedClient.contractFund.toLocaleString()}</Text>
              <Text style={styles.autoFillLabel}>CHZbit Account</Text>
              <Text style={styles.autoFillValue}>{accountCHZbit}</Text>
              {selectedClient.depositUID && (
                <>
                  <Text style={styles.autoFillLabel}>Deposit UID</Text>
                  <Text style={styles.autoFillValue}>{selectedClient.depositUID}</Text>
                </>
              )}
            </View>
          )}

          <FormInput label="Account CHZbit" value={accountCHZbit} onChangeText={setAccountCHZbit} placeholder="Auto-filled or enter manually" testID="sell-account" />

          <View style={styles.divider} />

          <View style={styles.sectionLabel}>
            <Link2 size={14} color={Colors.primary} />
            <Text style={styles.sectionLabelText}>Buy USDT & Supplier</Text>
          </View>

          <Dropdown
            label="Buy USDT (Link Transaction)"
            value={buyTransactionId}
            options={buyTxOptions}
            onSelect={handleBuyTxChange}
            placeholder="Select buy transaction (optional)"
          />

          {selectedBuyTx && (
            <View style={styles.autoFillCard}>
              <View style={styles.autoFillRow}>
                <View style={styles.autoFillCol}>
                  <Text style={styles.autoFillLabel}>Volume</Text>
                  <Text style={styles.autoFillValue}>{selectedBuyTx.volume.toLocaleString()} USDT</Text>
                </View>
                <View style={styles.autoFillCol}>
                  <Text style={styles.autoFillLabel}>Buy Rate</Text>
                  <Text style={styles.autoFillValue}>₹{selectedBuyTx.rate.toFixed(2)}</Text>
                </View>
              </View>
              <Text style={styles.autoFillLabel}>Sender</Text>
              <Text style={styles.autoFillValue}>{selectedBuyTx.senderName}</Text>
            </View>
          )}

          <Dropdown label="Supplier" value={supplierId} options={supplierOptions} onSelect={setSupplierId} placeholder="Select supplier (optional)" />

          <View style={styles.divider} />

          <View style={styles.sectionLabel}>
            <Link2 size={14} color={Colors.primary} />
            <Text style={styles.sectionLabelText}>Trade Details</Text>
          </View>

          <FormInput label="Receiver Name" value={receiverName} onChangeText={setReceiverName} placeholder="Auto-filled or enter manually" testID="sell-receiver" />
          <FormInput label="Trader Name" value={traderName} onChangeText={setTraderName} placeholder="Enter trader name" testID="sell-trader" />
          <FormInput label="Volume (USDT)" value={volume} onChangeText={setVolume} placeholder="e.g. 3000" keyboardType="numeric" testID="sell-volume" />
          <FormInput label="Selling Rate (₹)" value={rate} onChangeText={setRate} placeholder="e.g. 87.00" keyboardType="numeric" testID="sell-rate" />
          <FormInput label="Sell Volume (USDT)" value={sellVolume} onChangeText={setSellVolume} placeholder="e.g. 3000" keyboardType="numeric" testID="sell-sellvolume" />

          <View style={styles.calcRow}>
            <View style={styles.calcCard}>
              <Text style={styles.calcLabel}>Profit Margin</Text>
              <Text style={[styles.calcValue, { color: profitMargin >= 0 ? Colors.accent : Colors.danger }]}>
                ₹{profitMargin.toFixed(2)}
              </Text>
            </View>
            <View style={styles.calcGap} />
            <View style={styles.calcCard}>
              <Text style={styles.calcLabel}>Balance Volume</Text>
              <Text style={[styles.calcValue, { color: balanceVolume >= 0 ? Colors.text : Colors.danger }]}>
                {balanceVolume.toFixed(0)} USDT
              </Text>
            </View>
          </View>

          <View style={styles.calcInfo}>
            <Text style={styles.calcInfoText}>Avg Buy Rate: ₹{avgBuyRate.toFixed(2)} · Profit = (SellingRate - AvgBuyRate) × SellVolume</Text>
          </View>

          <FormInput label="Remarks" value={remarks} onChangeText={setRemarks} placeholder="Add notes..." multiline testID="sell-remarks" />

          <TouchableOpacity style={styles.attachBtn} onPress={pickImage}>
            <ImageIcon size={18} color={Colors.textSecondary} />
            <Text style={styles.attachText}>{attachment ? 'Image attached ✓' : 'Attach Image'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.buttonsRow}>
          <TouchableOpacity
            style={[styles.submitBtn, saving && styles.disabledBtn]}
            onPress={handleSubmit}
            disabled={saving}
            activeOpacity={0.8}
          >
            {saving ? <ActivityIndicator color={Colors.textLight} /> : <Text style={styles.submitText}>Add Data</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={styles.resetBtn} onPress={resetForm} activeOpacity={0.7}>
            <Text style={styles.resetText}>New Entry</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomPad} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: Colors.surface },
  content: { padding: 20 },
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
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginRight: 10 },
  badgeText: { fontSize: 11, fontWeight: '800' as const, letterSpacing: 0.5 },
  cardTitle: { fontSize: 18, fontWeight: '700' as const, color: Colors.text },
  sectionLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
    marginTop: 4,
  },
  sectionLabelText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.primary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 16,
  },
  autoFillCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  autoFillRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 6,
  },
  autoFillCol: {
    flex: 1,
  },
  autoFillLabel: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.3,
    marginTop: 4,
  },
  autoFillValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  calcRow: { flexDirection: 'row', marginBottom: 16 },
  calcGap: { width: 12 },
  calcCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  calcLabel: { fontSize: 11, color: Colors.textMuted, fontWeight: '600' as const, marginBottom: 4, textTransform: 'uppercase' as const },
  calcValue: { fontSize: 17, fontWeight: '700' as const },
  calcInfo: { backgroundColor: Colors.infoLight, borderRadius: 10, padding: 10, marginBottom: 16 },
  calcInfoText: { fontSize: 11, color: Colors.info, fontWeight: '500' as const },
  attachBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderStyle: 'dashed' as const,
  },
  attachText: { fontSize: 14, color: Colors.textSecondary, marginLeft: 10 },
  buttonsRow: { flexDirection: 'row', marginTop: 16, gap: 12 },
  submitBtn: {
    flex: 2,
    backgroundColor: Colors.primary,
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
  successSubtext: { fontSize: 14, color: Colors.textMuted, marginTop: 8, textAlign: 'center' },
  newEntryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginTop: 24,
  },
  newEntryText: { color: Colors.textLight, fontSize: 16, fontWeight: '700' as const },
  bottomPad: { height: 20 },
});
