import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Image as ImageIcon, CheckCircle } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { formatINR, formatUSDT, INR_SYMBOL, USDT_SYMBOL } from '@/constants/currency';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { FormInput, Dropdown } from '@/components/FormInput';
import { BuyTransaction, PaymentMode } from '@/types';
import { PAYMENT_MODES } from '@/mocks/data';

export default function BuyScreen() {
  const { currentUser } = useAuth();
  const { suppliers, addBuy } = useData();
  const [volume, setVolume] = useState('');
  const [rate, setRate] = useState('');
  const [senderName, setSenderName] = useState('');
  const [paymentMode, setPaymentMode] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [remarks, setRemarks] = useState('');
  const [attachment, setAttachment] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const supplierOptions = suppliers.map(s => ({ label: s.name, value: s.id }));
  const paymentOptions = PAYMENT_MODES.map(m => ({ label: m, value: m }));

  const resetForm = useCallback(() => {
    setVolume('');
    setRate('');
    setSenderName('');
    setPaymentMode('');
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
    if (!volume.trim() || !rate.trim() || !senderName.trim() || !paymentMode) {
      Alert.alert('Missing Fields', 'Please fill in Volume, Rate, Sender Name, and Payment Mode');
      return;
    }
    setSaving(true);
    try {
      const tx: BuyTransaction = {
        id: `buy-${Date.now()}`,
        type: 'buy',
        volume: parseFloat(volume),
        rate: parseFloat(rate),
        senderName: senderName.trim(),
        paymentMode: paymentMode as PaymentMode,
        supplierId: supplierId || undefined,
        remarks: remarks.trim(),
        attachmentUri: attachment || undefined,
        createdAt: new Date().toISOString(),
        createdBy: currentUser?.id ?? '',
      };
      await addBuy(tx);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSuccess(true);
    } catch {
      Alert.alert('Error', 'Failed to save transaction');
    } finally {
      setSaving(false);
    }
  }, [volume, rate, senderName, paymentMode, supplierId, remarks, attachment, currentUser, addBuy]);

  if (success) {
    return (
      <View style={styles.successContainer}>
        <View style={styles.successCard}>
          <CheckCircle size={56} color={Colors.accent} />
          <Text style={styles.successTitle}>Entry Added!</Text>
          <Text style={styles.successSubtext}>Buy transaction of {USDT_SYMBOL}{volume} USDT at {INR_SYMBOL}{rate} saved successfully.</Text>
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
            <View style={[styles.badge, { backgroundColor: Colors.buyLight }]}>
              <Text style={[styles.badgeText, { color: Colors.buy }]}>BUY</Text>
            </View>
            <Text style={styles.cardTitle}>New Buy Entry</Text>
          </View>

          <FormInput label={`Volume (${USDT_SYMBOL} USDT)`} value={volume} onChangeText={setVolume} placeholder="e.g. 5000" keyboardType="numeric" testID="buy-volume" />
          <FormInput label={`Rate (${INR_SYMBOL})`} value={rate} onChangeText={setRate} placeholder="e.g. 85.50" keyboardType="numeric" testID="buy-rate" />
          <FormInput label="Sender Name" value={senderName} onChangeText={setSenderName} placeholder="Enter sender name" testID="buy-sender" />
          <Dropdown label="Payment Mode" value={paymentMode} options={paymentOptions} onSelect={setPaymentMode} placeholder="Select payment mode" />
          <Dropdown label="Supplier" value={supplierId} options={supplierOptions} onSelect={setSupplierId} placeholder="Select supplier (optional)" />
          <FormInput label="Remarks" value={remarks} onChangeText={setRemarks} placeholder="Add notes..." multiline testID="buy-remarks" />

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
