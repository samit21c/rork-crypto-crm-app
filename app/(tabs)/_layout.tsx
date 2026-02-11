import React, { useEffect } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { LayoutDashboard, ArrowDownCircle, ArrowUpCircle, Landmark, Banknote, FileText, Menu } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';

export default function TabLayout() {
  const { currentUser, isReady } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isReady && !currentUser) {
      router.replace('/login');
    }
  }, [isReady, currentUser, router]);

  if (!isReady || !currentUser) {
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
          backgroundColor: Colors.card,
          borderTopColor: Colors.borderLight,
          borderTopWidth: 1,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600' as const,
        },
      }}
    >
      <Tabs.Screen
        name="(dashboard)"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => <LayoutDashboard size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="buy"
        options={{
          title: 'Buy',
          tabBarIcon: ({ color, size }) => <ArrowDownCircle size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="sell"
        options={{
          title: 'Sell',
          tabBarIcon: ({ color, size }) => <ArrowUpCircle size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="deposits"
        options={{
          title: 'Deposits',
          tabBarIcon: ({ color, size }) => <Landmark size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="withdrawals"
        options={{
          title: 'Withdraw',
          tabBarIcon: ({ color, size }) => <Banknote size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: 'History',
          tabBarIcon: ({ color, size }) => <FileText size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          tabBarIcon: ({ color, size }) => <Menu size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
