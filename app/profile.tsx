import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Mail, Calendar, Shield, LogOut } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';

export default function ProfileScreen() {
  const router = useRouter();
  const { currentUser, isAdmin, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.replace('/login' as any);
  };

  const joined = currentUser?.createdAt
    ? new Date(currentUser.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'N/A';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{currentUser?.name?.charAt(0)?.toUpperCase() ?? 'U'}</Text>
        </View>
        <Text style={styles.name}>{currentUser?.name}</Text>
        <View style={[styles.roleBadge, isAdmin ? styles.adminBadge : styles.memberBadge]}>
          <Text style={[styles.roleText, isAdmin ? styles.adminRoleText : styles.memberRoleText]}>
            {isAdmin ? 'Administrator' : 'Team Member'}
          </Text>
        </View>
      </View>

      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <View style={[styles.infoIcon, { backgroundColor: Colors.buyLight }]}>
            <Mail size={18} color={Colors.buy} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{currentUser?.email}</Text>
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoRow}>
          <View style={[styles.infoIcon, { backgroundColor: Colors.accentLight }]}>
            <Shield size={18} color={Colors.accent} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Role</Text>
            <Text style={styles.infoValue}>{isAdmin ? 'Admin' : 'Member'}</Text>
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoRow}>
          <View style={[styles.infoIcon, { backgroundColor: Colors.warningLight }]}>
            <Calendar size={18} color={Colors.warning} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Joined</Text>
            <Text style={styles.infoValue}>{joined}</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
        <LogOut size={18} color={Colors.danger} />
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  content: { padding: 20 },
  avatarSection: { alignItems: 'center', marginBottom: 24, marginTop: 8 },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  avatarText: { fontSize: 36, fontWeight: '700' as const, color: Colors.textLight },
  name: { fontSize: 22, fontWeight: '700' as const, color: Colors.text },
  roleBadge: { marginTop: 8, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 14 },
  adminBadge: { backgroundColor: Colors.infoLight },
  memberBadge: { backgroundColor: Colors.surface },
  roleText: { fontSize: 13, fontWeight: '700' as const },
  adminRoleText: { color: Colors.info },
  memberRoleText: { color: Colors.textSecondary },
  infoCard: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: 24,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  infoIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 12, color: Colors.textMuted, fontWeight: '500' as const },
  infoValue: { fontSize: 15, fontWeight: '600' as const, color: Colors.text, marginTop: 2 },
  divider: { height: 1, backgroundColor: Colors.borderLight, marginHorizontal: 16 },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.dangerLight,
    borderRadius: 14,
    paddingVertical: 16,
    gap: 8,
  },
  logoutText: { fontSize: 16, fontWeight: '600' as const, color: Colors.danger },
});
