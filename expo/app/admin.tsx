import React, { useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { UserCheck, UserX, Trash2, Users } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { User } from '@/types';

export default function AdminScreen() {
  const { users, currentUser, isAdmin, toggleUserActive, removeUser } = useAuth();

  const activeCount = useMemo(() => users.filter(u => u.isActive).length, [users]);
  const memberUsers = useMemo(() => users.filter(u => u.id !== currentUser?.id), [users, currentUser]);

  const handleToggle = useCallback(async (user: User) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await toggleUserActive(user.id);
  }, [toggleUserActive]);

  const handleRemove = useCallback((user: User) => {
    Alert.alert('Remove User', `Remove ${user.name} permanently?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          await removeUser(user.id);
        },
      },
    ]);
  }, [removeUser]);

  if (!isAdmin) {
    return (
      <View style={styles.restricted}>
        <Text style={styles.restrictedText}>Admin access required</Text>
      </View>
    );
  }

  const renderItem = ({ item }: { item: User }) => (
    <View style={styles.userCard}>
      <View style={[styles.userAvatar, { backgroundColor: item.isActive ? Colors.accentLight : Colors.surfaceAlt }]}>
        <Text style={[styles.userInitial, { color: item.isActive ? Colors.accent : Colors.textMuted }]}>
          {item.name.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name}</Text>
        <Text style={styles.userEmail}>{item.email}</Text>
        <View style={styles.userMeta}>
          <View style={[styles.statusDot, { backgroundColor: item.isActive ? Colors.accent : Colors.textMuted }]} />
          <Text style={styles.statusText}>{item.isActive ? 'Active' : 'Inactive'}</Text>
          <Text style={styles.rolePill}>{item.role}</Text>
        </View>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: item.isActive ? Colors.warningLight : Colors.accentLight }]} onPress={() => handleToggle(item)}>
          {item.isActive ? <UserX size={16} color={Colors.warning} /> : <UserCheck size={16} color={Colors.accent} />}
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.dangerLight }]} onPress={() => handleRemove(item)}>
          <Trash2 size={16} color={Colors.danger} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Users size={18} color={Colors.buy} />
          <Text style={styles.statValue}>{users.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <UserCheck size={18} color={Colors.accent} />
          <Text style={styles.statValue}>{activeCount}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <UserX size={18} color={Colors.textMuted} />
          <Text style={styles.statValue}>{users.length - activeCount}</Text>
          <Text style={styles.statLabel}>Inactive</Text>
        </View>
      </View>

      <FlatList
        data={memberUsers}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No other team members</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  restricted: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  restrictedText: { fontSize: 16, color: Colors.textMuted },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '700' as const, color: Colors.text, marginTop: 4 },
  statLabel: { fontSize: 11, color: Colors.textMuted, fontWeight: '500' as const },
  statDivider: { width: 1, backgroundColor: Colors.borderLight },
  listContent: { padding: 20, paddingTop: 16 },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  userAvatar: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  userInitial: { fontSize: 18, fontWeight: '700' as const },
  userInfo: { flex: 1 },
  userName: { fontSize: 15, fontWeight: '600' as const, color: Colors.text },
  userEmail: { fontSize: 12, color: Colors.textMuted, marginTop: 1 },
  userMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 4 },
  statusText: { fontSize: 11, color: Colors.textMuted, marginRight: 8 },
  rolePill: { fontSize: 10, color: Colors.textSecondary, backgroundColor: Colors.surface, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, fontWeight: '600' as const, textTransform: 'capitalize' as const },
  actions: { gap: 6 },
  actionBtn: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 15, color: Colors.textMuted },
});
