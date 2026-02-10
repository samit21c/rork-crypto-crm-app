import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User } from '@/types';
import { SAMPLE_USERS } from '@/mocks/data';

const USERS_KEY = '@usdt_crm_users';
const CURRENT_USER_KEY = '@usdt_crm_current_user';

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isReady, setIsReady] = useState(false);
  const queryClient = useQueryClient();

  const usersQuery = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(USERS_KEY);
      if (stored) {
        return JSON.parse(stored) as User[];
      }
      await AsyncStorage.setItem(USERS_KEY, JSON.stringify(SAMPLE_USERS));
      return SAMPLE_USERS;
    },
  });

  const currentUserQuery = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(CURRENT_USER_KEY);
      if (stored) {
        return JSON.parse(stored) as User;
      }
      return null;
    },
  });

  useEffect(() => {
    if (currentUserQuery.data !== undefined) {
      setCurrentUser(currentUserQuery.data);
      setIsReady(true);
    }
  }, [currentUserQuery.data]);

  const saveUsers = useCallback(async (users: User[]) => {
    await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
    queryClient.setQueryData(['users'], users);
  }, [queryClient]);

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const users = usersQuery.data ?? [];
      const user = users.find(u => u.email === email && u.password === password);
      if (!user) throw new Error('Invalid email or password');
      if (!user.isActive) throw new Error('Account is deactivated');
      await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
      return user;
    },
    onSuccess: (user) => {
      setCurrentUser(user);
      queryClient.setQueryData(['currentUser'], user);
    },
  });

  const registerMutation = useMutation({
    mutationFn: async ({ name, email, password }: { name: string; email: string; password: string }) => {
      const users = usersQuery.data ?? [];
      const exists = users.find(u => u.email === email);
      if (exists) throw new Error('Email already registered');
      const newUser: User = {
        id: `user-${Date.now()}`,
        name,
        email,
        password,
        role: 'member',
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      const updated = [...users, newUser];
      await saveUsers(updated);
      return newUser;
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await AsyncStorage.removeItem(CURRENT_USER_KEY);
    },
    onSuccess: () => {
      setCurrentUser(null);
      queryClient.setQueryData(['currentUser'], null);
    },
  });

  const toggleUserActiveMutation = useMutation({
    mutationFn: async (userId: string) => {
      const users = usersQuery.data ?? [];
      const updated = users.map(u => u.id === userId ? { ...u, isActive: !u.isActive } : u);
      await saveUsers(updated);
      return updated;
    },
  });

  const removeUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const users = usersQuery.data ?? [];
      const updated = users.filter(u => u.id !== userId);
      await saveUsers(updated);
      return updated;
    },
  });

  return {
    currentUser,
    users: usersQuery.data ?? [],
    isReady,
    isAdmin: currentUser?.role === 'admin',
    login: loginMutation.mutateAsync,
    loginPending: loginMutation.isPending,
    loginError: loginMutation.error?.message ?? null,
    register: registerMutation.mutateAsync,
    registerPending: registerMutation.isPending,
    registerError: registerMutation.error?.message ?? null,
    logout: logoutMutation.mutate,
    toggleUserActive: toggleUserActiveMutation.mutateAsync,
    removeUser: removeUserMutation.mutateAsync,
  };
});
