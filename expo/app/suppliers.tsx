import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Plus, Trash2, Edit3, Phone, X, Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useData } from '@/contexts/DataContext';
import { Supplier } from '@/types';

export default function SuppliersScreen() {
  const { suppliers, addSupplier, updateSupplier, deleteSupplier } = useData();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const resetForm = useCallback(() => {
    setName('');
    setPhone('');
    setEditId(null);
    setShowForm(false);
  }, []);

  const handleSave = useCallback(async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Supplier name is required');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (editId) {
      await updateSupplier({ id: editId, name: name.trim(), phone: phone.trim() });
    } else {
      await addSupplier({ id: `sup-${Date.now()}`, name: name.trim(), phone: phone.trim() });
    }
    resetForm();
  }, [name, phone, editId, addSupplier, updateSupplier, resetForm]);

  const handleEdit = useCallback((s: Supplier) => {
    setEditId(s.id);
    setName(s.name);
    setPhone(s.phone);
    setShowForm(true);
  }, []);

  const handleDelete = useCallback((s: Supplier) => {
    Alert.alert('Delete Supplier', `Remove "${s.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          await deleteSupplier(s.id);
        },
      },
    ]);
  }, [deleteSupplier]);

  const renderItem = ({ item }: { item: Supplier }) => (
    <View style={styles.supplierCard}>
      <View style={styles.supplierAvatar}>
        <Text style={styles.supplierInitial}>{item.name.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.supplierInfo}>
        <Text style={styles.supplierName}>{item.name}</Text>
        {item.phone ? (
          <View style={styles.phoneRow}>
            <Phone size={12} color={Colors.textMuted} />
            <Text style={styles.supplierPhone}>{item.phone}</Text>
          </View>
        ) : null}
      </View>
      <TouchableOpacity style={[styles.iconBtn, { backgroundColor: Colors.infoLight }]} onPress={() => handleEdit(item)}>
        <Edit3 size={15} color={Colors.info} />
      </TouchableOpacity>
      <TouchableOpacity style={[styles.iconBtn, { backgroundColor: Colors.dangerLight }]} onPress={() => handleDelete(item)}>
        <Trash2 size={15} color={Colors.danger} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {showForm && (
        <View style={styles.formCard}>
          <View style={styles.formHeader}>
            <Text style={styles.formTitle}>{editId ? 'Edit Supplier' : 'New Supplier'}</Text>
            <TouchableOpacity onPress={resetForm}>
              <X size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Supplier Name"
            placeholderTextColor={Colors.textMuted}
          />
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="Phone Number"
            placeholderTextColor={Colors.textMuted}
            keyboardType="phone-pad"
          />
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8}>
            <Check size={18} color={Colors.textLight} />
            <Text style={styles.saveBtnText}>{editId ? 'Update' : 'Add Supplier'}</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={suppliers}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No suppliers yet</Text>
            <Text style={styles.emptySubtext}>Add your first supplier to get started</Text>
          </View>
        }
      />

      {!showForm && (
        <TouchableOpacity style={styles.fab} onPress={() => setShowForm(true)} activeOpacity={0.8}>
          <Plus size={24} color={Colors.textLight} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  formCard: {
    backgroundColor: Colors.card,
    margin: 20,
    marginBottom: 8,
    borderRadius: 18,
    padding: 18,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  formHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  formTitle: { fontSize: 17, fontWeight: '700' as const, color: Colors.text },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: 10,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  saveBtnText: { color: Colors.textLight, fontSize: 15, fontWeight: '700' as const },
  listContent: { padding: 20, paddingTop: 12 },
  supplierCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  supplierAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.warningLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  supplierInitial: { fontSize: 18, fontWeight: '700' as const, color: Colors.warning },
  supplierInfo: { flex: 1 },
  supplierName: { fontSize: 15, fontWeight: '600' as const, color: Colors.text },
  phoneRow: { flexDirection: 'row', alignItems: 'center', marginTop: 3, gap: 4 },
  supplierPhone: { fontSize: 12, color: Colors.textMuted },
  iconBtn: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginLeft: 6 },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 16, fontWeight: '600' as const, color: Colors.textSecondary },
  emptySubtext: { fontSize: 13, color: Colors.textMuted, marginTop: 4 },
});
