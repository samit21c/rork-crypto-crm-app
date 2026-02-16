import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Users, BarChart3, Shield, User, LogOut, ChevronRight, Building2, Clock, Landmark, Banknote, FileText } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';

export default function MoreScreen() {
  const router = useRouter();
  const { currentUser, isAdmin, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.replace('/login' as any);
  };

  const menuItems = [
    { label: 'Deposits', sublabel: 'Bank deposit entries', icon: Landmark, color: Colors.deposit, bg: Colors.depositLight, route: '/deposits' as const },
    { label: 'Withdrawals', sublabel: 'Bank withdrawal entries', icon: Banknote, color: Colors.withdraw, bg: Colors.withdrawLight, route: '/withdrawals' as const },
    { label: 'Transactions', sublabel: 'Buy & sell history', icon: FileText, color: Colors.textSecondary, bg: Colors.surface, route: '/transactions' as const },
    { label: 'Company Banks', sublabel: 'Manage bank accounts', icon: Building2, color: Colors.bank, bg: Colors.bankLight, route: '/company-banks' as const },
    { label: 'Suppliers', sublabel: 'Manage your suppliers', icon: Users, color: Colors.warning, bg: Colors.warningLight, route: '/suppliers' as const },
    { label: 'Trading Insights', sublabel: 'Analytics & summaries', icon: BarChart3, color: Colors.accent, bg: Colors.accentLight, route: '/insights' as const },
    { label: 'Audit History', sublabel: 'All changes & logs', icon: Clock, color: Colors.history, bg: Colors.historyLight, route: '/histories' as const },
    ...(isAdmin ? [{ label: 'Admin Panel', sublabel: 'Manage team members', icon: Shield, color: Colors.info, bg: Colors.infoLight, route: '/admin' as const }] : []),
    { label: 'Profile', sublabel: 'Account settings', icon: User, color: Colors.textSecondary, bg: Colors.surface, route: '/profile' as const },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.profileCard}>
        <View style={styles.avatarLarge}>
          <Text style={styles.avatarText}>{currentUser?.name?.charAt(0)?.toUpperCase() ?? 'U'}</Text>
        </View>
        <Text style={styles.profileName}>{currentUser?.name}</Text>
        <Text style={styles.profileEmail}>{currentUser?.email}</Text>
        <View style={[styles.roleBadge, isAdmin ? styles.adminBadge : styles.memberBadge]}>
          <Text style={[styles.roleText, isAdmin ? styles.adminText : styles.memberText]}>
            {isAdmin ? 'Admin' : 'Member'}
          </Text>
        </View>
      </View>

      <View style={styles.menuCard}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={item.label}
            style={[styles.menuItem, index < menuItems.length - 1 && styles.menuBorder]}
            onPress={() => router.push(item.route as any)}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIcon, { backgroundColor: item.bg }]}>
              <item.icon size={20} color={item.color} />
            </View>
            <View style={styles.menuInfo}>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Text style={styles.menuSublabel}>{item.sublabel}</Text>
            </View>
            <ChevronRight size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        ))}
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
  profileCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  avatarLarge: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: { fontSize: 28, fontWeight: '700' as const, color: Colors.textLight },
  profileName: { fontSize: 20, fontWeight: '700' as const, color: Colors.text },
  profileEmail: { fontSize: 14, color: Colors.textMuted, marginTop: 2 },
  roleBadge: { marginTop: 10, paddingHorizontal: 14, paddingVertical: 4, borderRadius: 12 },
  adminBadge: { backgroundColor: Colors.infoLight },
  memberBadge: { backgroundColor: Colors.surface },
  roleText: { fontSize: 12, fontWeight: '700' as const },
  adminText: { color: Colors.info },
  memberText: { color: Colors.textSecondary },
  menuCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  menuBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  menuIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  menuInfo: { flex: 1 },
  menuLabel: { fontSize: 15, fontWeight: '600' as const, color: Colors.text },
  menuSublabel: { fontSize: 12, color: Colors.textMuted, marginTop: 1 },
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
