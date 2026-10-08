import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Group, GroupMember, Expense, ExpenseSplit, Settlement, Activity, Balance, Debt, Profile } from '../types';

interface GroupWithDetails extends Group {
  members: GroupMember[];
  memberCount: number;
  expenseCount: number;
  userBalance: number;
  hasNewActivity: boolean;
}

interface DataState {
  groups: GroupWithDetails[];
  currentGroup: GroupWithDetails | null;
  expenses: Expense[];
  balances: Balance[];
  debts: Debt[];
  activities: Activity[];
  isLoading: boolean;

  // Groups
  
  fetchGroups: (userId: string) => Promise<void>;
  fetchGroupDetails: (groupId: string) => Promise<void>;
  createGroup: (name: string, emoji: string, userId: string) => Promise<{ error: any; data: Group | null }>;
  joinGroup: (inviteCode: string, userId: string) => Promise<{ error: any }>;

  // Expenses
  fetchExpenses: (groupId: string) => Promise<void>;
  addExpense: (expense: Partial<Expense>, splits: { userId: string; amount: number }[]) => Promise<{ error: any }>;
  deleteExpense: (expenseId: string) => Promise<{ error: any }>;

  // Balances
  calculateBalances: (groupId: string) => Promise<void>;
  simplifyDebts: (groupId: string) => Debt[];

  // Settlements
  settleDebt: (fromUserId: string, toUserId: string, amount: number, groupId: string, paymentMethod: string) => Promise<{ error: any }>;

  // Activities
  fetchActivities: (userId: string) => Promise<void>;
  markActivityRead: (activityId: string) => Promise<void>;

  // Analytics
  getAnalytics: (userId: string, period: 'week' | 'month' | 'year') => Promise<any>;
}

export const useDataStore = create<DataState>((set, get) => ({
  groups: [],
  currentGroup: null,
  expenses: [],
  balances: [],
  debts: [],
  activities: [],
  isLoading: false,

  fetchGroups: async (userId: string) => {
    set({ isLoading: true });
    try {
      // Get groups where user is a member
      const { data: memberData, error: memberError } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', userId);

      if (memberError) throw memberError;

      const groupIds = memberData?.map(m => m.group_id) || [];
      if (groupIds.length === 0) {
        set({ groups: [], isLoading: false });
        return;
      }

      // Get group details
      const { data: groupsData, error: groupsError } = await supabase
        .from('groups')
        .select('*')
        .in('id', groupIds);

      if (groupsError) throw groupsError;

      // Get members, expenses, activities for each group
      const groupsWithDetails: GroupWithDetails[] = await Promise.all(
        (groupsData || []).map(async (group) => {
          // Get members
          const { data: members } = await supabase
            .from('group_members')
            .select('*, profile:profiles(*)')
            .eq('group_id', group.id);

          // Get expense count
          const { count: expenseCount } = await supabase
            .from('expenses')
            .select('*', { count: 'exact', head: true })
            .eq('group_id', group.id);

          // Calculate user balance
          const balance = await calculateUserBalance(group.id, userId);

          // Check for new activity
          const { count: unreadCount } = await supabase
            .from('activities')
            .select('*', { count: 'exact', head: true })
            .eq('group_id', group.id)
            .eq('is_read', false)
            .neq('user_id', userId);

          return {
            ...group,
            members: members || [],
            memberCount: members?.length || 0,
            expenseCount: expenseCount || 0,
            userBalance: balance,
            hasNewActivity: (unreadCount || 0) > 0,
          };
        })
      );

      set({ groups: groupsWithDetails });
    } catch (error) {
      console.error('Fetch groups error:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchGroupDetails: async (groupId: string) => {
    set({ isLoading: true, expenses: [], balances: [], debts: [] });
    try {
      const { data: group, error } = await supabase
        .from('groups')
        .select('*')
        .eq('id', groupId)
        .single();

      if (error) throw error;

      const { data: members } = await supabase
        .from('group_members')
        .select('*, profile:profiles(*)')
        .eq('group_id', groupId);

      const { count: expenseCount } = await supabase
        .from('expenses')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', groupId);

      set({
        currentGroup: {
          ...group,
          members: members || [],
          memberCount: members?.length || 0,
          expenseCount: expenseCount || 0,
          userBalance: 0,
          hasNewActivity: false,
        },
      });

      // Fetch expenses and balances for this group
      await get().fetchExpenses(groupId);
      await get().calculateBalances(groupId);
    } catch (error) {
      console.error('Fetch group details error:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  createGroup: async (name: string, emoji: string, userId: string) => {
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const { data: group, error } = await supabase
      .from('groups')
      .insert({
        name,
        emoji,
        created_by: userId,
        invite_code: inviteCode,
      })
      .select()
      .single();

    if (error) return { error, data: null };

    // Add creator as member
    await supabase.from('group_members').insert({
      group_id: group.id,
      user_id: userId,
    });

    // Create activity
    await supabase.from('activities').insert({
      user_id: userId,
      group_id: group.id,
      action_type: 'group_created',
      description: `created group "${name}"`,
    });

    await get().fetchGroups(userId);
    return { error: null, data: group };
  },

  joinGroup: async (inviteCode: string, userId: string) => {
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select('*')
      .eq('invite_code', inviteCode.toUpperCase())
      .single();

    if (groupError) return { error: new Error('Invalid invite code') };

    // Check if already member
    const { data: existing } = await supabase
      .from('group_members')
      .select('*')
      .eq('group_id', group.id)
      .eq('user_id', userId)
      .single();

    if (existing) return { error: new Error('Already a member') };

    const { error } = await supabase.from('group_members').insert({
      group_id: group.id,
      user_id: userId,
    });

    if (!error) {
      await supabase.from('activities').insert({
        user_id: userId,
        group_id: group.id,
        action_type: 'member_joined',
        description: 'joined the group',
      });
      await get().fetchGroups(userId);
    }

    return { error };
  },

  fetchExpenses: async (groupId: string) => {
    const { data, error } = await supabase
      .from('expenses')
      .select('*, paid_by_profile:profiles!paid_by_user_id(*)')
      .eq('group_id', groupId)
      .order('date', { ascending: false });

    if (!error) {
      set({ expenses: data || [] });
    }
  },

  addExpense: async (expense: Partial<Expense>, splits: { userId: string; amount: number }[]) => {
    const { data: newExpense, error } = await supabase
      .from('expenses')
      .insert(expense)
      .select()
      .single();

    if (error) return { error };

    // Add splits
    const splitInserts = splits.map(s => ({
      expense_id: newExpense.id,
      user_id: s.userId,
      amount: s.amount,
    }));

    await supabase.from('expense_splits').insert(splitInserts);

    // Create activity
    await supabase.from('activities').insert({
      user_id: expense.paid_by_user_id,
      group_id: expense.group_id,
      action_type: 'expense_added',
      description: `added expense "${expense.title}" for ₹${expense.amount}`,
      expense_id: newExpense.id,
    });

    if (expense.group_id) {
      await get().fetchExpenses(expense.group_id);
      await get().calculateBalances(expense.group_id);
    }

    return { error: null };
  },

  deleteExpense: async (expenseId: string) => {
    const expense = get().expenses.find(e => e.id === expenseId);
    
    // Delete splits first
    await supabase.from('expense_splits').delete().eq('expense_id', expenseId);
    
    const { error } = await supabase.from('expenses').delete().eq('id', expenseId);

    if (!error && expense?.group_id) {
      await get().fetchExpenses(expense.group_id);
      await get().calculateBalances(expense.group_id);
    }

    return { error };
  },

  calculateBalances: async (groupId: string) => {
    const { currentGroup } = get();
    if (!currentGroup) return;

    const balances: Map<string, number> = new Map();

    // Initialize balances for all members
    currentGroup.members.forEach(m => {
      balances.set(m.user_id, 0);
    });

    // Get all expenses with splits
    const { data: expenses } = await supabase
      .from('expenses')
      .select('*, expense_splits(*)')
      .eq('group_id', groupId);

    // Calculate balances from expenses
    expenses?.forEach(expense => {
      // Add to payer's balance (they are owed money)
      const currentPayer = balances.get(expense.paid_by_user_id) || 0;
      balances.set(expense.paid_by_user_id, currentPayer + expense.amount);

      // Subtract from each person's balance (they owe money)
      expense.expense_splits?.forEach((split: ExpenseSplit) => {
        const current = balances.get(split.user_id) || 0;
        balances.set(split.user_id, current - split.amount);
      });
    });

    // Get settlements
    const { data: settlements } = await supabase
      .from('settlements')
      .select('*')
      .eq('group_id', groupId);

    // Apply settlements
    settlements?.forEach(settlement => {
      const fromBalance = balances.get(settlement.from_user_id) || 0;
      const toBalance = balances.get(settlement.to_user_id) || 0;
      balances.set(settlement.from_user_id, fromBalance + settlement.amount);
      balances.set(settlement.to_user_id, toBalance - settlement.amount);
    });

    // Convert to array with profiles
    const balanceArray: Balance[] = [];
    for (const [userId, netBalance] of balances) {
      const member = currentGroup.members.find(m => m.user_id === userId);
      balanceArray.push({
        user_id: userId,
        net_balance: netBalance,
        profile: member?.profile as Profile,
      });
    }

    set({ balances: balanceArray });

    // Calculate debts
    const debts = get().simplifyDebts(groupId);
    set({ debts });
  },

  simplifyDebts: (groupId: string): Debt[] => {
    const { balances, currentGroup } = get();
    
    // Separate creditors (positive balance) and debtors (negative balance)
    const creditors: { userId: string; amount: number }[] = [];
    const debtors: { userId: string; amount: number }[] = [];

    balances.forEach(b => {
      if (b.net_balance > 0.01) {
        creditors.push({ userId: b.user_id, amount: b.net_balance });
      } else if (b.net_balance < -0.01) {
        debtors.push({ userId: b.user_id, amount: Math.abs(b.net_balance) });
      }
    });

    // Sort by amount (descending)
    creditors.sort((a, b) => b.amount - a.amount);
    debtors.sort((a, b) => b.amount - a.amount);

    const debts: Debt[] = [];

    // Match debtors with creditors
    while (debtors.length > 0 && creditors.length > 0) {
      const debtor = debtors[0];
      const creditor = creditors[0];

      const amount = Math.min(debtor.amount, creditor.amount);

      if (amount > 0.01) {
        const debtorMember = currentGroup?.members.find(m => m.user_id === debtor.userId);
        const creditorMember = currentGroup?.members.find(m => m.user_id === creditor.userId);

        debts.push({
          from_user_id: debtor.userId,
          to_user_id: creditor.userId,
          amount: Math.round(amount * 100) / 100,
          from_profile: debtorMember?.profile as Profile,
          to_profile: creditorMember?.profile as Profile,
        });
      }

      debtor.amount -= amount;
      creditor.amount -= amount;

      if (debtor.amount < 0.01) debtors.shift();
      if (creditor.amount < 0.01) creditors.shift();
    }

    return debts;
  },

  settleDebt: async (fromUserId: string, toUserId: string, amount: number, groupId: string, paymentMethod: string) => {
    const { error } = await supabase.from('settlements').insert({
      from_user_id: fromUserId,
      to_user_id: toUserId,
      amount,
      group_id: groupId,
      payment_method: paymentMethod,
    });

    if (!error) {
      await supabase.from('activities').insert({
        user_id: fromUserId,
        group_id: groupId,
        action_type: 'settlement',
        description: `settled ₹${amount}`,
      });

      await get().calculateBalances(groupId);
    }

    return { error };
  },

  fetchActivities: async (userId: string) => {
    // Get user's groups
    const { data: memberData } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', userId);

    const groupIds = memberData?.map(m => m.group_id) || [];

    if (groupIds.length === 0) {
      set({ activities: [] });
      return;
    }

    const { data, error } = await supabase
      .from('activities')
      .select('*, profile:profiles!user_id(*), group:groups(*)')
      .in('group_id', groupIds)
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error) {
      set({ activities: data || [] });
    }
  },

  markActivityRead: async (activityId: string) => {
    await supabase
      .from('activities')
      .update({ is_read: true })
      .eq('id', activityId);

    set(state => ({
      activities: state.activities.map(a =>
        a.id === activityId ? { ...a, is_read: true } : a
      ),
    }));
  },

  getAnalytics: async (userId: string, period: 'week' | 'month' | 'year') => {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
    }

    // Get user's groups
    const { data: memberData } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', userId);

    const groupIds = memberData?.map(m => m.group_id) || [];

    if (groupIds.length === 0) {
      return {
        totalSpent: 0,
        categoryBreakdown: [],
        monthlyTrend: [],
        topSpenders: [],
      };
    }

    // Get expenses in period
    const { data: expenses } = await supabase
      .from('expenses')
      .select('*, expense_splits(*)')
      .in('group_id', groupIds)
      .gte('date', startDate.toISOString())
      .lte('date', now.toISOString());

    // Calculate user's share of spending
    let totalSpent = 0;
    const categoryTotals: Map<string, number> = new Map();
    const monthlyTotals: Map<string, number> = new Map();

    expenses?.forEach(expense => {
      const userSplit = expense.expense_splits?.find((s: ExpenseSplit) => s.user_id === userId);
      if (userSplit) {
        totalSpent += userSplit.amount;
        
        // Category breakdown
        const catTotal = categoryTotals.get(expense.category) || 0;
        categoryTotals.set(expense.category, catTotal + userSplit.amount);

        // Monthly trend
        const month = new Date(expense.date).toLocaleString('default', { month: 'short' });
        const monthTotal = monthlyTotals.get(month) || 0;
        monthlyTotals.set(month, monthTotal + userSplit.amount);
      }
    });

    return {
      totalSpent,
      categoryBreakdown: Array.from(categoryTotals.entries()).map(([category, amount]) => ({
        category,
        amount,
        percentage: totalSpent > 0 ? (amount / totalSpent) * 100 : 0,
      })),
      monthlyTrend: Array.from(monthlyTotals.entries()).map(([month, amount]) => ({
        month,
        amount,
      })),
    };
  },
}));

// Helper function to calculate user balance in a group
async function calculateUserBalance(groupId: string, userId: string): Promise<number> {
  let balance = 0;

  // Get expenses
  const { data: expenses } = await supabase
    .from('expenses')
    .select('*, expense_splits(*)')
    .eq('group_id', groupId);

  expenses?.forEach(expense => {
    if (expense.paid_by_user_id === userId) {
      balance += expense.amount;
    }
    const userSplit = expense.expense_splits?.find((s: ExpenseSplit) => s.user_id === userId);
    if (userSplit) {
      balance -= userSplit.amount;
    }
  });

  // Get settlements
  const { data: settlements } = await supabase
    .from('settlements')
    .select('*')
    .eq('group_id', groupId);

  settlements?.forEach(settlement => {
    if (settlement.from_user_id === userId) {
      balance += settlement.amount;
    }
    if (settlement.to_user_id === userId) {
      balance -= settlement.amount;
    }
  });

  return balance;
}
