import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { supabase } from '../../src/lib/supabase';
import { LoadingSpinner } from '../../src/components/ui';

const MEMBER_COLORS = ['#FF6B6B', '#CE93D8', '#64B5F6', '#F5C800', '#4CAF50', '#FF8A65'];

const CATEGORY_ICONS: Record<string, string> = {
  food: 'restaurant',
  travel: 'car',
  rent: 'home',
  utilities: 'flash',
  other: 'ellipsis-horizontal',
};

const CATEGORY_COLORS: Record<string, string> = {
  food: '#F5C800',
  travel: '#64B5F6',
  rent: '#CE93D8',
  utilities: '#4CAF50',
  other: '#FF8A65',
};

export default function ExpenseDetailScreen() {
  const { expenseId, groupId } = useLocalSearchParams<{ expenseId: string; groupId: string }>();
  const { user } = useAuthStore();
  const [expense, setExpense] = useState<any>(null);
  const [splits, setSplits] = useState<any[]>([]);
  const [payer, setPayer] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const barAnims = useRef(Array.from({ length: 10 }, () => new Animated.Value(0))).current;

  useEffect(() => {
    loadExpenseDetail();
  }, [expenseId]);

  const loadExpenseDetail = async () => {
    try {
      const { data: expData } = await supabase
        .from('expenses')
        .select('*')
        .eq('id', expenseId)
        .single();

      if (!expData) return;
      setExpense(expData);

      const { data: splitsData } = await supabase
        .from('expense_splits')
        .select('*, profile:profiles(id, full_name, email)')
        .eq('expense_id', expenseId);

      setSplits(splitsData || []);

      const { data: payerData } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('id', expData.paid_by_user_id)
        .single();

      setPayer(payerData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, tension: 100, friction: 10, useNativeDriver: true }),
      ]).start(() => {
        Animated.stagger(80, barAnims.map(a =>
          Animated.spring(a, { toValue: 1, tension: 120, friction: 8, useNativeDriver: false })
        )).start();
      });
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Expense', `Delete "${expense?.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          await supabase.from('expense_splits').delete().eq('expense_id', expenseId);
          await supabase.from('expenses').delete().eq('id', expenseId);
          router.back();
        },
      },
    ]);
  };

  const getInitials = (name: string) =>
    (name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const getMySplit = () => splits.find(s => s.user_id === user?.id);
  const iPaid = expense?.paid_by_user_id === user?.id;
  const mySplit = getMySplit();
  const catColor = CATEGORY_COLORS[expense?.category] || '#F5C800';
  const catIcon = CATEGORY_ICONS[expense?.category] || 'ellipsis-horizontal';

  if (loading) {
    return <View style={styles.loadingContainer}><LoadingSpinner size="large" /></View>;
  }

  if (!expense) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ color: '#888' }}>Expense not found</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={20} color="#F5C800" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Expense detail</Text>
        <TouchableOpacity onPress={handleDelete} style={styles.headerBtn}>
          <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          {/* Expense header card */}
          <View style={styles.expHeaderCard}>
            <View style={[styles.expIconLarge, { backgroundColor: `${catColor}18` }]}>
              <Ionicons name={catIcon as any} size={32} color={catColor} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.expTitle}>{expense.title}</Text>
              <Text style={styles.expAmount}>
                ₹{parseFloat(expense.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </Text>
              <Text style={styles.expMeta}>
                Added by {payer?.full_name?.split(' ')[0] || 'Someone'} on{' '}
                {new Date(expense.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </Text>
            </View>
          </View>

          {/* You owe tag */}
          {!iPaid && mySplit && (
            <View style={styles.youOweTag}>
              <Ionicons name="alert-circle" size={14} color="#FF6B6B" />
              <Text style={styles.youOweTagText}>
                You owe ₹{parseFloat(mySplit.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })} for this
              </Text>
            </View>
          )}

          {iPaid && (
            <View style={[styles.youOweTag, { backgroundColor: 'rgba(245,200,0,0.1)', borderColor: '#F5C800' }]}>
              <Ionicons name="checkmark-circle" size={14} color="#F5C800" />
              <Text style={[styles.youOweTagText, { color: '#F5C800' }]}>
                You paid this expense
              </Text>
            </View>
          )}

          {/* Paid by + splits */}
          <View style={styles.paidCard}>
            {/* Payer row */}
            <View style={styles.payerRow}>
              <View style={[styles.payerAv, { backgroundColor: '#F5C800' }]}>
                <Text style={styles.payerAvText}>{getInitials(payer?.full_name || payer?.email || 'U')}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.payerName}>
                  {iPaid ? 'You paid' : `${payer?.full_name?.split(' ')[0] || 'Someone'} paid`}
                </Text>
                <Text style={styles.payerSub}>Full amount upfront</Text>
              </View>
              <View style={styles.payerAmtBadge}>
                <Text style={styles.payerAmtText}>
                  ₹{parseFloat(expense.amount).toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                </Text>
              </View>
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Splits label */}
            <Text style={styles.splitsLabel}>
              Split equally among {splits.length} {splits.length === 1 ? 'person' : 'people'}
            </Text>

            {/* Split rows with timeline */}
            <View style={styles.splitLineWrap}>
              <View style={styles.splitLine} />
              {splits.map((split, i) => {
                const isMe = split.user_id === user?.id;
                const isPayerSplit = split.user_id === expense.paid_by_user_id;
                const color = MEMBER_COLORS[i % MEMBER_COLORS.length];
                const barWidth = barAnims[i] ? barAnims[i].interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }) : '100%';

                return (
                  <View key={split.id || i} style={styles.splitRow}>
                    <View style={[styles.splitDot, { backgroundColor: color, borderColor: '#111' }]} />
                    <View style={[styles.splitAv, { backgroundColor: color }]}>
                      <Text style={styles.splitAvText}>
                        {isMe ? 'You' : getInitials(split.profile?.full_name || split.profile?.email || 'U')}
                      </Text>
                    </View>
                    <Text style={styles.splitName}>
                      {isMe ? 'You' : split.profile?.full_name?.split(' ')[0] || split.profile?.email?.split('@')[0] || 'Someone'}
                    </Text>
                    <View style={styles.splitBarWrap}>
                      <Animated.View style={[styles.splitBarFill, { width: barWidth, backgroundColor: color }]} />
                    </View>
                    <View style={styles.splitAmtCol}>
                      <Text style={[styles.splitAmt, { color }]}>
                        ₹{parseFloat(split.amount).toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                      </Text>
                      <Text style={styles.splitLbl}>
                        {isPayerSplit ? 'paid' : isMe ? 'you owe' : 'owes'}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Action buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.settleBtn}
              onPress={() => router.push('/settle-up')}
            >
              <Text style={styles.settleBtnTxt}>Settle up</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
              <Ionicons name="trash-outline" size={18} color="#888" />
            </TouchableOpacity>
          </View>

        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111111' },
  loadingContainer: { flex: 1, backgroundColor: '#111111', alignItems: 'center', justifyContent: 'center' },
  scrollContent: { paddingBottom: 40 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  headerBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#f5f5f5', fontSize: 16, fontWeight: '700' },

  expHeaderCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 14,
    backgroundColor: '#1E1E1E', marginHorizontal: 16, borderRadius: 18,
    padding: 16, marginBottom: 10, borderWidth: 0.5, borderColor: '#2c2c2c',
  },
  expIconLarge: {
    width: 60, height: 60, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  expTitle: { color: '#f5f5f5', fontSize: 18, fontWeight: '700', marginBottom: 4 },
  expAmount: { color: '#F5C800', fontSize: 28, fontWeight: '800', letterSpacing: -1, marginBottom: 4 },
  expMeta: { color: '#555', fontSize: 11 },

  youOweTag: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,107,107,0.1)',
    borderWidth: 0.5, borderColor: '#FF6B6B',
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7,
    marginHorizontal: 16, marginBottom: 10, alignSelf: 'flex-start',
  },
  youOweTagText: { color: '#FF6B6B', fontSize: 12, fontWeight: '600' },

  paidCard: {
    backgroundColor: '#1E1E1E', marginHorizontal: 16, borderRadius: 18,
    padding: 16, marginBottom: 14, borderWidth: 0.5, borderColor: '#2c2c2c',
  },
  payerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  payerAv: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  payerAvText: { color: '#111', fontSize: 13, fontWeight: '700' },
  payerName: { color: '#f5f5f5', fontSize: 14, fontWeight: '600' },
  payerSub: { color: '#555', fontSize: 11, marginTop: 1 },
  payerAmtBadge: {
    backgroundColor: 'rgba(245,200,0,0.12)', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 5, borderWidth: 0.5, borderColor: '#F5C800',
  },
  payerAmtText: { color: '#F5C800', fontSize: 13, fontWeight: '700' },
  divider: { height: 0.5, backgroundColor: '#2c2c2c', marginBottom: 12 },
  splitsLabel: { color: '#555', fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },

  splitLineWrap: { position: 'relative', paddingLeft: 18 },
  splitLine: { position: 'absolute', left: 6, top: 8, bottom: 8, width: 1, backgroundColor: '#2c2c2c' },
  splitRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 9, borderBottomWidth: 0.5, borderBottomColor: '#1e1e1e', position: 'relative' },
  splitDot: { position: 'absolute', left: -22, width: 9, height: 9, borderRadius: 5, borderWidth: 2 },
  splitAv: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginRight: 8 },
  splitAvText: { color: '#111', fontSize: 10, fontWeight: '700' },
  splitName: { color: '#f5f5f5', fontSize: 13, flex: 1 },
  splitBarWrap: { width: 60, height: 3, backgroundColor: '#2c2c2c', borderRadius: 2, overflow: 'hidden', marginRight: 10 },
  splitBarFill: { height: '100%', borderRadius: 2 },
  splitAmtCol: { alignItems: 'flex-end', minWidth: 56 },
  splitAmt: { fontSize: 13, fontWeight: '700' },
  splitLbl: { color: '#555', fontSize: 10, marginTop: 1 },

  actionRow: { flexDirection: 'row', gap: 10, marginHorizontal: 16 },
  settleBtn: { flex: 1, backgroundColor: '#F5C800', borderRadius: 14, padding: 14, alignItems: 'center' },
  settleBtnTxt: { color: '#111', fontSize: 15, fontWeight: '700' },
  deleteBtn: { width: 48, height: 48, backgroundColor: '#1E1E1E', borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 0.5, borderColor: '#2c2c2c' },
});