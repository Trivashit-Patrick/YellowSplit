import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { useDataStore } from '../../src/store/dataStore';
import { supabase } from '../../src/lib/supabase';
import { LoadingSpinner } from '../../src/components/ui';
import type { Expense } from '../../src/types';

interface FoundUser {
  id: string;
  email: string;
  full_name: string | null;
}

const CATEGORY_COLORS: Record<string, string> = {
  food: '#F5C800',
  travel: '#64B5F6',
  rent: '#CE93D8',
  utilities: '#4CAF50',
  other: '#FF8A65',
};

const MEMBER_COLORS = ['#F5C800', '#FF6B6B', '#64B5F6', '#CE93D8', '#4CAF50', '#FF8A65'];

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const { currentGroup, expenses, balances, debts, fetchGroupDetails, deleteExpense, isLoading } = useDataStore();
  const [refreshing, setRefreshing] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [memberEmail, setMemberEmail] = useState('');
  const [searchingEmail, setSearchingEmail] = useState(false);
  const [foundUser, setFoundUser] = useState<FoundUser | null>(null);
  const [emailError, setEmailError] = useState('');
  const [addedMembers, setAddedMembers] = useState<FoundUser[]>([]);
  const [addingMembers, setAddingMembers] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (id) fetchGroupDetails(id);
  }, [id]);

  useEffect(() => {
    const shimmerLoop = () => {
      shimmerAnim.setValue(0);
      Animated.timing(shimmerAnim, { toValue: 1, duration: 1200, useNativeDriver: false })
        .start(() => setTimeout(shimmerLoop, 1800));
    };
    shimmerLoop();
  }, []);

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 400],
  });

  const onRefresh = async () => {
    setRefreshing(true);
    if (id) await fetchGroupDetails(id);
    setRefreshing(false);
  };

  const handleDeleteExpense = (expenseId: string, title: string) => {
    Alert.alert('Delete Expense', `Delete "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deleteExpense(expenseId); } },
    ]);
  };

  const handleSearchEmail = async () => {
    if (!memberEmail.trim()) return;
    if (memberEmail.trim().toLowerCase() === user?.email?.toLowerCase()) {
      setEmailError('You are already in this group');
      setFoundUser(null);
      return;
    }
    const alreadyInPending = addedMembers.find(m => m.email.toLowerCase() === memberEmail.trim().toLowerCase());
    if (alreadyInPending) {
      setEmailError('This member is already added');
      setFoundUser(null);
      return;
    }
    setSearchingEmail(true);
    setEmailError('');
    setFoundUser(null);
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles').select('id, email, full_name').ilike('email', memberEmail.trim()).single();
      if (profileError || !profileData) { setEmailError('No user found with this email'); return; }
      const { data: existingMember } = await supabase
        .from('group_members').select('id').eq('group_id', id).eq('user_id', profileData.id);
      if (existingMember && existingMember.length > 0) { setEmailError('This user is already in the group'); return; }
      setFoundUser(profileData);
    } catch { setEmailError('Error searching for user'); }
    finally { setSearchingEmail(false); }
  };

  const handleAddMember = () => {
    if (!foundUser) return;
    setAddedMembers(prev => [...prev, foundUser]);
    setFoundUser(null); setMemberEmail(''); setEmailError('');
  };

  const handleRemoveMember = (memberId: string) => {
    setAddedMembers(prev => prev.filter(m => m.id !== memberId));
  };

  const handleConfirmAddMembers = async () => {
    if (addedMembers.length === 0) {
      if (emailError === 'This user is already in the group') {
        setShowAddMember(false);
        setTimeout(() => Alert.alert('User already in group', 'This user is already present in the group.'), 400);
        return;
      }
      setShowAddMember(false); return;
    }
    setAddingMembers(true);
    try {
      const alreadyExisting: string[] = [];
      const toAdd: FoundUser[] = [];
      for (const member of addedMembers) {
        const { data: existingMember } = await supabase
          .from('group_members').select('id').eq('group_id', id).eq('user_id', member.id);
        if (existingMember && existingMember.length > 0) alreadyExisting.push(member.full_name || member.email);
        else toAdd.push(member);
      }
      if (alreadyExisting.length > 0 && toAdd.length === 0) {
        Alert.alert('Already in group', `${alreadyExisting.join(', ')} already present in the group.`);
        setAddingMembers(false); return;
      }
      for (const member of toAdd) {
        await supabase.from('group_members').insert({ group_id: id, user_id: member.id });
      }
      setAddedMembers([]); setMemberEmail(''); setShowAddMember(false);
      if (id) await fetchGroupDetails(id);
      if (toAdd.length > 0) Alert.alert('Success', `${toAdd.length} member(s) added!`);
    } catch { Alert.alert('Error', 'Failed to add members.'); }
    finally { setAddingMembers(false); }
  };

  const handleDeleteGroup = () => {
    setShowMenu(false);
    setTimeout(() => {
      Alert.alert('Delete Group', `Delete "${currentGroup?.name}"? All data will be permanently deleted.`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            try {
              const expenses_data = await supabase.from('expenses').select('id').eq('group_id', id);
              const expenseIds = expenses_data.data?.map(e => e.id) || [];
              if (expenseIds.length > 0) await supabase.from('expense_splits').delete().in('expense_id', expenseIds);
              await supabase.from('expenses').delete().eq('group_id', id);
              await supabase.from('settlements').delete().eq('group_id', id);
              await supabase.from('activities').delete().eq('group_id', id);
              await supabase.from('activity_feed').delete().eq('group_id', id);
              await supabase.from('group_members').delete().eq('group_id', id);
              await supabase.from('groups').delete().eq('id', id);
              router.back();
            } catch { Alert.alert('Error', 'Failed to delete group.'); }
          },
        },
      ]);
    }, 300);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'food': return 'restaurant';
      case 'travel': return 'car';
      case 'rent': return 'home';
      case 'utilities': return 'flash';
      default: return 'ellipsis-horizontal';
    }
  };

  const groupExpensesByMonth = (items: Expense[]) => {
    const groups: { [key: string]: Expense[] } = {};
    items.forEach(expense => {
      const date = new Date(expense.date);
      const key = date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
      if (!groups[key]) groups[key] = [];
      groups[key].push(expense);
    });
    return groups;
  };

  const getInitials = (name: string) =>
    (name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const getUserBalance = () => {
    const myBalance = balances.find(b => b.user_id === user?.id);
    return myBalance?.net_balance || 0;
  };

  const getOwedToOthers = () => {
    return debts.filter(d => d.from_user_id === user?.id);
  };

  if (!currentGroup && isLoading) {
    return <View style={styles.loadingContainer}><LoadingSpinner size="large" /></View>;
  }

  if (!currentGroup) {
    return <View style={styles.loadingContainer}><LoadingSpinner size="large" /></View>;
  }

  const groupedExpenses = groupExpensesByMonth(expenses);
  const myNetBalance = getUserBalance();
  const owedToOthers = getOwedToOthers();
  const totalSpent = expenses.reduce((sum, e) => sum + (parseFloat(String(e.amount)) || 0), 0);
  const perPerson = currentGroup.memberCount > 0 ? totalSpent / currentGroup.memberCount : 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />
      <View style={{ flex: 1 }}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#111" />}
        >
          {/* HERO BANNER */}
          <View style={styles.hero}>
            <Animated.View style={[styles.heroShimmer, { transform: [{ translateX: shimmerTranslate }] }]} />

            <View style={styles.heroTopRow}>
              <TouchableOpacity onPress={() => router.back()} style={styles.heroBackBtn}>
                <Ionicons name="arrow-back" size={20} color="#7a6000" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowMenu(true)} style={styles.heroSettingsBtn}>
                <Ionicons name="settings-outline" size={18} color="#7a6000" />
              </TouchableOpacity>
            </View>

            <Text style={styles.heroEmoji}>{currentGroup.emoji}</Text>
            <Text style={styles.heroTitle}>{currentGroup.name}</Text>

            <View style={styles.heroPills}>
              <View style={styles.heroPill}>
                <Ionicons name="calendar-outline" size={12} color="#111" />
                <Text style={styles.heroPillText}>
                  {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </Text>
              </View>
              <View style={styles.heroPill}>
                <Ionicons name="people-outline" size={12} color="#111" />
                <Text style={styles.heroPillText}>{currentGroup.memberCount} people</Text>
              </View>
            </View>

            {/* TOTAL SPENT — shows inside yellow card when expenses exist */}
            {totalSpent > 0 && (
              <>
                <View style={styles.heroDivider} />
                <View style={styles.heroStats}>
                  <View>
                    <Text style={styles.heroStatsLabel}>Total spent on trip</Text>
                    <Text style={styles.heroStatsVal}>
                      ₹{Math.round(totalSpent).toLocaleString('en-IN')}
                    </Text>
                    <Text style={styles.heroStatsSub}>
                      {expenses.length} expense{expenses.length !== 1 ? 's' : ''}
                    </Text>
                  </View>
                  <View style={styles.heroMiniStats}>
                    <View style={styles.heroMiniStat}>
                      <Text style={styles.heroMiniStatLbl}>Per person</Text>
                      <Text style={styles.heroMiniStatVal}>
                        ₹{Math.round(perPerson).toLocaleString('en-IN')}
                      </Text>
                    </View>
                    <View style={styles.heroMiniStat}>
                      <Text style={styles.heroMiniStatLbl}>Expenses</Text>
                      <Text style={styles.heroMiniStatVal}>{expenses.length}</Text>
                    </View>
                  </View>
                </View>
              </>
            )}
          </View>

          {/* YOU OWE / GET BACK BANNER */}
          {myNetBalance < 0 && (
            <View style={styles.oweBanner}>
              <Text style={styles.oweTotalText}>
                You owe <Text style={styles.oweAmt}>₹{Math.abs(Math.round(myNetBalance)).toLocaleString('en-IN')}</Text> overall
              </Text>
              {owedToOthers.map((debt, i) => (
                <View key={i} style={styles.oweRow}>
                  <Text style={styles.oweRowName}>
                    You owe {debt.to_profile?.full_name?.split(' ')[0] || 'someone'}
                  </Text>
                  <Text style={styles.oweRowAmt}>₹{Math.round(debt.amount).toLocaleString('en-IN')}</Text>
                </View>
              ))}
            </View>
          )}

          {myNetBalance > 0 && (
            <View style={[styles.oweBanner, { borderLeftColor: '#F5C800' }]}>
              <Text style={styles.oweTotalText}>
                You get back <Text style={[styles.oweAmt, { color: '#F5C800' }]}>
                  ₹{Math.abs(Math.round(myNetBalance)).toLocaleString('en-IN')}
                </Text> overall
              </Text>
            </View>
          )}

          {/* ACTION BUTTONS */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionBtnPrimary} onPress={() => router.push('/settle-up')}>
              <Text style={styles.actionBtnPrimaryTxt}>Settle up</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtnOutline} onPress={() => setShowAddMember(true)}>
              <Text style={styles.actionBtnOutlineTxt}>Add member</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtnOutline}>
              <Text style={styles.actionBtnOutlineTxt}>Charts</Text>
            </TouchableOpacity>
          </View>

          {/* EXPENSES */}
          {expenses.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="receipt-outline" size={40} color="#555" />
              <Text style={styles.emptyText}>No expenses yet</Text>
              <Text style={styles.emptySubtext}>Tap + to add your first expense</Text>
            </View>
          ) : (
            Object.entries(groupedExpenses).map(([month, items]) => (
              <View key={month}>
                <Text style={styles.monthLabel}>{month}</Text>
                {items.map((expense, idx) => {
                  const mySplit = (expense as any).expense_splits?.find((s: any) => s.user_id === user?.id);
                  const iPaid = (expense as any).paid_by_user_id === user?.id;
                  const catColor = CATEGORY_COLORS[expense.category] || '#F5C800';
                  return (
                    <TouchableOpacity
                      key={expense.id}
                      style={styles.expenseItem}
                      onPress={() => router.push(`/group/expense-detail?expenseId=${expense.id}&groupId=${id}`)}
                      onLongPress={() => handleDeleteExpense(expense.id, expense.title)}
                      activeOpacity={0.75}
                    >
                      <View style={[styles.expenseIcon, { backgroundColor: `${catColor}18` }]}>
                        <Ionicons name={getCategoryIcon(expense.category) as any} size={20} color={catColor} />
                      </View>
                      <View style={styles.expenseInfo}>
                        <Text style={styles.expenseTitle}>{expense.title}</Text>
                        <Text style={styles.expenseMeta}>
                          {iPaid ? 'You paid' : `${(expense as any).paid_by_profile?.full_name?.split(' ')[0] || 'Someone'} paid`} ₹{expense.amount.toLocaleString('en-IN')}
                        </Text>
                      </View>
                      <View style={styles.expenseRight}>
                        {iPaid ? (
                          <>
                            <Text style={styles.lentLabel}>you lent</Text>
                            <Text style={[styles.expenseAmt, { color: '#F5C800' }]}>
                              +₹{mySplit ? Math.round(expense.amount - mySplit.amount).toLocaleString('en-IN') : Math.round(expense.amount).toLocaleString('en-IN')}
                            </Text>
                          </>
                        ) : (
                          <>
                            <Text style={styles.borrowLabel}>you borrowed</Text>
                            <Text style={[styles.expenseAmt, { color: '#FF6B6B' }]}>
                              ₹{mySplit ? Math.round(mySplit.amount).toLocaleString('en-IN') : Math.round(expense.amount / currentGroup.memberCount).toLocaleString('en-IN')}
                            </Text>
                          </>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))
          )}
        </ScrollView>

        {/* ADD EXPENSE FAB */}
        <TouchableOpacity
          style={styles.addExpenseFab}
          onPress={() => router.push(`/add-expense?groupId=${id}`)}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={20} color="#111" />
          <Text style={styles.addExpenseFabTxt}>Add expense</Text>
        </TouchableOpacity>
      </View>

      {/* ADD MEMBER MODAL */}
      <Modal visible={showAddMember} animationType="slide" transparent onRequestClose={() => setShowAddMember(false)}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setShowAddMember(false)} />
          <View style={styles.modalSheet}>
            <View style={styles.handleBar} />
            <Text style={styles.sheetTitle}>Add member</Text>
            <Text style={styles.sheetSub}>Search by their YellowSplit email</Text>
            <View style={styles.searchRow}>
              <TextInput
                style={styles.searchInput}
                value={memberEmail}
                onChangeText={(t) => { setMemberEmail(t); setEmailError(''); setFoundUser(null); }}
                placeholder="friend@email.com"
                placeholderTextColor="#555"
                keyboardType="email-address"
                autoCapitalize="none"
                onSubmitEditing={handleSearchEmail}
              />
              <TouchableOpacity style={styles.searchBtn} onPress={handleSearchEmail} disabled={searchingEmail}>
                {searchingEmail ? <ActivityIndicator size="small" color="#111" /> : <Ionicons name="search" size={18} color="#111" />}
              </TouchableOpacity>
            </View>
            {emailError ? (
              <View style={styles.errorRow}>
                <Ionicons name="close-circle" size={14} color="#FF4444" />
                <Text style={styles.errorText}>{emailError}</Text>
              </View>
            ) : null}
            {foundUser && (
              <View style={styles.foundCard}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{getInitials(foundUser.full_name || foundUser.email)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.foundName}>{foundUser.full_name || 'YellowSplit User'}</Text>
                  <Text style={styles.foundEmail}>{foundUser.email}</Text>
                </View>
                <TouchableOpacity style={styles.addBtn} onPress={handleAddMember}>
                  <Text style={styles.addBtnText}>+ Add</Text>
                </TouchableOpacity>
              </View>
            )}
            {addedMembers.length > 0 && (
              <View style={styles.addedSection}>
                <Text style={styles.addedLabel}>Added ({addedMembers.length})</Text>
                <View style={styles.addedList}>
                  {addedMembers.map(member => (
                    <View key={member.id} style={styles.addedRow}>
                      <View style={[styles.avatar, { width: 28, height: 28, borderRadius: 14 }]}>
                        <Text style={[styles.avatarText, { fontSize: 10 }]}>{getInitials(member.full_name || member.email)}</Text>
                      </View>
                      <Text style={styles.addedName}>{member.full_name || member.email}</Text>
                      <TouchableOpacity onPress={() => handleRemoveMember(member.id)}>
                        <Ionicons name="close-circle" size={20} color="#FF4444" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>
            )}
            <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirmAddMembers} disabled={addingMembers}>
              {addingMembers ? <ActivityIndicator size="small" color="#111" /> :
                <Text style={styles.confirmBtnText}>{addedMembers.length > 0 ? `Add ${addedMembers.length} member(s)` : 'Done'}</Text>}
            </TouchableOpacity>
            <Text style={styles.secureText}>Members must have a YellowSplit account</Text>
          </View>
        </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* THREE DOTS MENU */}
      <Modal visible={showMenu} transparent animationType="fade" onRequestClose={() => setShowMenu(false)}>
        <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }} onPress={() => setShowMenu(false)} />
        <View style={styles.menuDropdown}>
          <TouchableOpacity style={styles.menuItem} onPress={() => { setShowMenu(false); setShowAddMember(true); }}>
            <Ionicons name="person-add-outline" size={18} color="#F5C800" />
            <Text style={styles.menuItemText}>Add member</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 0 }]} onPress={handleDeleteGroup}>
            <Ionicons name="trash-outline" size={18} color="#FF6B6B" />
            <Text style={[styles.menuItemText, { color: '#FF6B6B' }]}>Delete group</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111111' },
  loadingContainer: { flex: 1, backgroundColor: '#111111', alignItems: 'center', justifyContent: 'center' },
  scrollView: { flex: 1, backgroundColor: '#111111' },
  scrollContent: { paddingBottom: 100 },

  hero: { backgroundColor: '#F5C800', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24, position: 'relative', overflow: 'hidden', borderRadius: 28, marginHorizontal: 16, marginTop: 10, marginBottom: 4 },
  heroShimmer: { position: 'absolute', top: 0, bottom: 0, width: 60, backgroundColor: 'rgba(255,255,255,0.25)' },
  heroTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, marginTop: -4 },
  heroBackBtn: { width: 34, height: 34, backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  heroSettingsBtn: { width: 34, height: 34, backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  heroEmoji: { fontSize: 36, marginBottom: 6 },
  heroTitle: { color: '#111', fontSize: 28, fontWeight: '800', letterSpacing: -0.5, fontStyle: 'italic', marginBottom: 12 },
  heroPills: { flexDirection: 'row', gap: 8 },
  heroPill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: 99, paddingHorizontal: 12, paddingVertical: 5 },
  heroPillText: { color: '#111', fontSize: 12, fontWeight: '600' },
  heroDivider: { height: 0.5, backgroundColor: 'rgba(0,0,0,0.15)', marginTop: 12, marginBottom: 12 },
  heroStats: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  heroStatsLabel: { color: '#7a6000', fontSize: 10, fontWeight: '500', marginBottom: 2 },
  heroStatsVal: { color: '#111', fontSize: 26, fontWeight: '800', letterSpacing: -1 },
  heroStatsSub: { color: '#7a6000', fontSize: 10, marginTop: 1 },
  heroMiniStats: { flexDirection: 'row', gap: 6 },
  heroMiniStat: { backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: 10, padding: 8, alignItems: 'center', minWidth: 56 },
  heroMiniStatLbl: { color: '#7a6000', fontSize: 9 },
  heroMiniStatVal: { color: '#111', fontSize: 13, fontWeight: '700', marginTop: 2 },

  oweBanner: { backgroundColor: '#1E1E1E', marginHorizontal: 16, marginTop: 12, borderRadius: 14, padding: 14, borderLeftWidth: 3, borderLeftColor: '#FF6B6B' },
  oweTotalText: { color: '#f5f5f5', fontSize: 14, fontWeight: '600', marginBottom: 6 },
  oweAmt: { color: '#FF6B6B', fontWeight: '700' },
  oweRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
  oweRowName: { color: '#888', fontSize: 12 },
  oweRowAmt: { color: '#FF6B6B', fontSize: 12, fontWeight: '600' },

  actionRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginTop: 12, marginBottom: 4 },
  actionBtnPrimary: { flex: 1, backgroundColor: '#F5C800', borderRadius: 12, padding: 11, alignItems: 'center' },
  actionBtnPrimaryTxt: { color: '#111', fontSize: 13, fontWeight: '700' },
  actionBtnOutline: { flex: 1, backgroundColor: '#1E1E1E', borderRadius: 12, padding: 11, alignItems: 'center', borderWidth: 0.5, borderColor: '#2c2c2c' },
  actionBtnOutlineTxt: { color: '#f5f5f5', fontSize: 13, fontWeight: '600' },

  monthLabel: { color: '#555', fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, paddingHorizontal: 16, marginTop: 16, marginBottom: 8 },
  expenseItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E1E1E', marginHorizontal: 16, borderRadius: 14, padding: 13, marginBottom: 8, borderWidth: 1, borderColor: '#F5C800' },
  expenseIcon: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginRight: 12, flexShrink: 0 },
  expenseInfo: { flex: 1 },
  expenseTitle: { color: '#f5f5f5', fontSize: 14, fontWeight: '600', marginBottom: 3 },
  expenseMeta: { color: '#555', fontSize: 11 },
  expenseRight: { alignItems: 'flex-end' },
  expenseAmt: { fontSize: 14, fontWeight: '700' },
  borrowLabel: { color: '#FF6B6B', fontSize: 10, marginBottom: 2 },
  lentLabel: { color: '#F5C800', fontSize: 10, marginBottom: 2 },

  emptyCard: { backgroundColor: '#1E1E1E', borderRadius: 16, margin: 16, padding: 32, alignItems: 'center', gap: 6, borderWidth: 0.5, borderColor: '#2c2c2c' },
  emptyText: { color: '#f5f5f5', fontSize: 13, fontWeight: '500', marginTop: 6 },
  emptySubtext: { color: '#555', fontSize: 11 },

  addExpenseFab: { position: 'absolute', bottom: 24, left: 16, right: 16, backgroundColor: '#F5C800', borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, elevation: 8 },
  addExpenseFabTxt: { color: '#111', fontSize: 15, fontWeight: '700' },

  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F5C800', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#111', fontSize: 12, fontWeight: '700' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#1a1a1a', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 36, borderTopWidth: 0.5, borderTopColor: '#2c2c2c' },
  handleBar: { width: 36, height: 4, backgroundColor: '#333', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  sheetTitle: { color: '#f5f5f5', fontSize: 16, fontWeight: '700', marginBottom: 4 },
  sheetSub: { color: '#555', fontSize: 12, marginBottom: 16 },
  searchRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  searchInput: { flex: 1, backgroundColor: '#111', borderWidth: 1, borderColor: '#2c2c2c', borderRadius: 10, padding: 11, color: '#f5f5f5', fontSize: 13 },
  searchBtn: { width: 44, height: 44, backgroundColor: '#F5C800', borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  errorText: { color: '#FF4444', fontSize: 12 },
  foundCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', borderWidth: 1, borderColor: '#F5C800', borderRadius: 12, padding: 12, marginBottom: 12, gap: 10 },
  foundName: { color: '#f5f5f5', fontSize: 13, fontWeight: '600' },
  foundEmail: { color: '#555', fontSize: 11, marginTop: 2 },
  addBtn: { backgroundColor: '#F5C800', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  addBtnText: { color: '#111', fontSize: 12, fontWeight: '700' },
  addedSection: { marginBottom: 12 },
  addedLabel: { color: '#888', fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  addedList: { backgroundColor: '#111', borderRadius: 10, padding: 8 },
  addedRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: '#1e1e1e' },
  addedName: { color: '#f5f5f5', fontSize: 12, flex: 1 },
  confirmBtn: { backgroundColor: '#F5C800', borderRadius: 14, padding: 14, alignItems: 'center', marginTop: 4 },
  confirmBtnText: { color: '#111', fontSize: 15, fontWeight: '700' },
  secureText: { color: '#444', fontSize: 11, textAlign: 'center', marginTop: 10 },

  menuDropdown: { position: 'absolute', top: 80, right: 16, backgroundColor: '#1E1E1E', borderRadius: 14, borderWidth: 0.5, borderColor: '#2c2c2c', overflow: 'hidden', minWidth: 180 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderBottomWidth: 0.5, borderBottomColor: '#2c2c2c' },
  menuItemText: { color: '#f5f5f5', fontSize: 14 },
});