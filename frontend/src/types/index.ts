export interface Profile {
  id: string;
  email: string;
  full_name: string;
  expense_count: number;
  is_pro: boolean;
  pro_expires_at: string | null;
  avatar_url: string | null;
  upi_id: string | null;
  created_at: string;
}

export interface Group {
  id: string;
  name: string;
  emoji: string;
  created_by: string;
  created_at: string;
  invite_code: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  joined_at: string;
  profile?: Profile;
}

export interface Expense {
  id: string;
  group_id: string;
  title: string;
  amount: number;
  category: 'food' | 'travel' | 'rent' | 'utilities' | 'other';
  paid_by_user_id: string;
  split_type: 'equal' | 'percentage' | 'exact' | 'shares';
  date: string;
  receipt_url: string | null;
  is_recurring: boolean;
  recurring_type: 'weekly' | 'monthly' | null;
  created_at: string;
  paid_by_profile?: Profile;
}

export interface ExpenseSplit {
  id: string;
  expense_id: string;
  user_id: string;
  amount: number;
  percentage: number | null;
  shares: number | null;
  profile?: Profile;
}

export interface Settlement {
  id: string;
  from_user_id: string;
  to_user_id: string;
  amount: number;
  group_id: string;
  payment_method: string | null;
  created_at: string;
  from_profile?: Profile;
  to_profile?: Profile;
}

export interface Activity {
  id: string;
  user_id: string;
  group_id: string | null;
  action_type: 'expense_added' | 'expense_deleted' | 'settlement' | 'group_created' | 'member_joined';
  description: string;
  expense_id: string | null;
  settlement_id: string | null;
  created_at: string;
  is_read: boolean;
  profile?: Profile;
  group?: Group;
}

export interface Balance {
  user_id: string;
  net_balance: number;
  profile?: Profile;
}

export interface Debt {
  from_user_id: string;
  to_user_id: string;
  amount: number;
  from_profile?: Profile;
  to_profile?: Profile;
}

export type CategoryType = 'food' | 'travel' | 'rent' | 'utilities' | 'other';
export type SplitType = 'equal' | 'percentage' | 'exact' | 'shares';
export type PaymentMethod = 'gpay' | 'phonepe' | 'upi' | 'card';
