import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';
import { useDataStore } from '../src/store/dataStore';
import { Button, Input, Card } from '../src/components/ui';
import { colors, spacing, typography, borderRadius } from '../src/lib/theme';
import type { CategoryType, SplitType } from '../src/types';

export default function AddExpenseScreen() {
  const { user, profile, incrementExpenseCount } = useAuthStore();
  const { groups, currentGroup, addExpense, fetchGroups } = useDataStore();
const { groupId } = useLocalSearchParams<{ groupId?: string }>();
  
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<CategoryType>('food');
  const [splitType, setSplitType] = useState<SplitType>('equal');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchGroups(user.id);
    }
  }, [user?.id]);

  useEffect(() => {
    if (groups.length > 0) {
      if (groupId) {
        setSelectedGroupId(groupId);
      } else if (!selectedGroupId) {
        setSelectedGroupId(groups[0].id);
      }
    }
  }, [groups, groupId]);

  const categories: { key: CategoryType; label: string; icon: string }[] = [
    { key: 'food', label: 'Food', icon: 'restaurant' },
    { key: 'travel', label: 'Travel', icon: 'car' },
    { key: 'rent', label: 'Rent', icon: 'home' },
    { key: 'utilities', label: 'Utilities', icon: 'flash' },
    { key: 'other', label: 'Other', icon: 'ellipsis-horizontal' },
  ];

  const splitTypes: { key: SplitType; label: string }[] = [
    { key: 'equal', label: 'Equal' },
    { key: 'percentage', label: 'Percentage' },
    { key: 'exact', label: 'Exact' },
    { key: 'shares', label: 'Shares' },
  ];

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter an expense title');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (!selectedGroupId) {
      Alert.alert('Error', 'Please select a group');
      return;
    }

    // Check Pro limit
    if (!profile?.is_pro && (profile?.expense_count || 0) >= 3) {
      setShowPaywall(true);
      return;
    }

    setIsLoading(true);

    const selectedGroup = groups.find(g => g.id === selectedGroupId);
    if (!selectedGroup) {
      Alert.alert('Error', 'Group not found');
      setIsLoading(false);
      return;
    }

    // Calculate splits (equal split for simplicity)
    const amountNum = parseFloat(amount);
    const memberCount = selectedGroup.members.length;
    const splitAmount = amountNum / memberCount;

    const splits = selectedGroup.members.map(m => ({
      userId: m.user_id,
      amount: splitAmount,
    }));

    const expense = {
      group_id: selectedGroupId,
      title: title.trim(),
      amount: amountNum,
      category,
      paid_by_user_id: user?.id,
      split_type: splitType,
      date: new Date().toISOString(),
      is_recurring: false,
      recurring_type: null,
    };

    const { error } = await addExpense(expense, splits);

    if (error) {
      Alert.alert('Error', 'Failed to add expense');
    } else {
      await incrementExpenseCount();
      router.back();
    }

    setIsLoading(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Handle bar */}
        <View style={styles.handleBar} />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={28} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Expense</Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Title Input */}
          <Input
            label="What's this expense for?"
            value={title}
            onChangeText={setTitle}
            placeholder="e.g., Dinner at restaurant"
          />

          {/* Amount */}
          <View style={styles.amountSection}>
            <Text style={styles.label}>Amount</Text>
            <View style={styles.amountRow}>
              <Text style={styles.currency}>₹</Text>
              <Text style={styles.amountDisplay}>
                {amount || '0'}
              </Text>
            </View>
            <View style={styles.numpad}>
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'del'].map((key) => (
                <TouchableOpacity
                  key={key}
                  style={styles.numpadKey}
                  onPress={() => {
                    if (key === 'del') {
                      setAmount(amount.slice(0, -1));
                    } else if (key === '.' && amount.includes('.')) {
                      return;
                    } else {
                      setAmount(amount + key);
                    }
                  }}
                >
                  {key === 'del' ? (
                    <Ionicons name="backspace-outline" size={24} color={colors.textPrimary} />
                  ) : (
                    <Text style={styles.numpadText}>{key}</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Group Selector */}
          <View style={styles.section}>
            <Text style={styles.label}>Group</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {groups.map((group) => (
                <TouchableOpacity
                  key={group.id}
                  style={[
                    styles.groupPill,
                    selectedGroupId === group.id && styles.groupPillActive,
                  ]}
                  onPress={() => setSelectedGroupId(group.id)}
                >
                  <Text style={styles.groupEmoji}>{group.emoji}</Text>
                  <Text
                    style={[
                      styles.groupName,
                      selectedGroupId === group.id && styles.groupNameActive,
                    ]}
                  >
                    {group.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Category */}
          <View style={styles.section}>
            <Text style={styles.label}>Category</Text>
            <View style={styles.categoriesRow}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.key}
                  style={[
                    styles.categoryPill,
                    category === cat.key && styles.categoryPillActive,
                  ]}
                  onPress={() => setCategory(cat.key)}
                >
                  <Ionicons
                    name={cat.icon as any}
                    size={18}
                    color={category === cat.key ? colors.textOnYellow : colors.textMuted}
                  />
                  <Text
                    style={[
                      styles.categoryText,
                      category === cat.key && styles.categoryTextActive,
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Split Type */}
          <View style={styles.section}>
            <Text style={styles.label}>Split type</Text>
            <View style={styles.splitRow}>
              {splitTypes.map((split) => (
                <TouchableOpacity
                  key={split.key}
                  style={[
                    styles.splitPill,
                    splitType === split.key && styles.splitPillActive,
                  ]}
                  onPress={() => setSplitType(split.key)}
                >
                  <Text
                    style={[
                      styles.splitText,
                      splitType === split.key && styles.splitTextActive,
                    ]}
                  >
                    {split.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Free expense counter */}
          {!profile?.is_pro && (
            <View style={styles.limitBanner}>
              <Ionicons name="information-circle" size={20} color={colors.primary} />
              <Text style={styles.limitText}>
                {3 - (profile?.expense_count || 0)} free expenses remaining
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Save Button */}
        <View style={styles.footer}>
          <Button
            title="Save Expense"
            onPress={handleSave}
            loading={isLoading}
            fullWidth
            size="large"
          />
        </View>
      </KeyboardAvoidingView>

      {/* Pro Paywall Modal */}
      <Modal visible={showPaywall} animationType="slide" transparent>
        <View style={styles.paywallOverlay}>
          <View style={styles.paywallSheet}>
            <View style={styles.handleBar} />
            
            <View style={styles.paywallStarContainer}>
              <Ionicons name="star" size={40} color={colors.textOnYellow} />
            </View>

            <View style={styles.paywallBadge}>
              <Text style={styles.paywallBadgeText}>You've used all 3 free expenses</Text>
            </View>

            <Text style={styles.paywallTitle}>Go Pro for just ₹11/year</Text>
            <Text style={styles.paywallSubtitle}>
              Less than ₹1 per month. Cheaper than a chai.
            </Text>

            <View style={styles.paywallStats}>
              <View style={styles.paywallStat}>
                <Text style={styles.paywallStatValue}>∞</Text>
                <Text style={styles.paywallStatLabel}>Unlimited</Text>
              </View>
              <View style={styles.paywallStat}>
                <Text style={styles.paywallStatValue}>0</Text>
                <Text style={styles.paywallStatLabel}>Ads</Text>
              </View>
              <View style={styles.paywallStat}>
                <Text style={styles.paywallStatValue}>All</Text>
                <Text style={styles.paywallStatLabel}>Features</Text>
              </View>
            </View>

            <View style={styles.paywallFeatures}>
              {[
                'Unlimited expense entries',
                'Receipt photo scanning',
                'Full spending analytics',
                'Export expenses to CSV',
              ].map((feature, index) => (
                <View key={index} style={styles.paywallFeatureItem}>
                  <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                  <Text style={styles.paywallFeatureText}>{feature}</Text>
                </View>
              ))}
            </View>

            <Button
              title="Get Pro — ₹11 / year"
              onPress={() => {
                setShowPaywall(false);
                router.push('/payment');
              }}
              fullWidth
              size="large"
              style={styles.paywallButton}
            />

            <TouchableOpacity
              style={styles.paywallDismiss}
              onPress={() => setShowPaywall(false)}
            >
              <Text style={styles.paywallDismissText}>
                Maybe later — keep free (3 expense limit)
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  keyboardView: {
    flex: 1,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.divider,
    alignSelf: 'center',
    marginTop: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  label: {
    ...typography.bodySmall,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  amountSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  currency: {
    fontSize: 32,
    color: colors.primary,
    marginRight: spacing.xs,
  },
  amountDisplay: {
    fontSize: 48,
    fontWeight: '700',
    color: colors.primary,
  },
  numpad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 300,
  },
  numpadKey: {
    width: '30%',
    aspectRatio: 1.8,
    alignItems: 'center',
    justifyContent: 'center',
    margin: '1.5%',
  },
  numpadText: {
    fontSize: 28,
    color: colors.textPrimary,
  },
  section: {
    marginBottom: spacing.xl,
  },
  groupPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.card,
    marginRight: spacing.sm,
  },
  groupPillActive: {
    backgroundColor: colors.primary,
  },
  groupEmoji: {
    fontSize: 16,
    marginRight: spacing.xs,
  },
  groupName: {
    ...typography.bodySmall,
    color: colors.textPrimary,
  },
  groupNameActive: {
    color: colors.textOnYellow,
  },
  categoriesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.card,
  },
  categoryPillActive: {
    backgroundColor: colors.primary,
  },
  categoryText: {
    ...typography.bodySmall,
    color: colors.textMuted,
    marginLeft: spacing.xs,
  },
  categoryTextActive: {
    color: colors.textOnYellow,
  },
  splitRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  splitPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.card,
  },
  splitPillActive: {
    backgroundColor: colors.primary,
  },
  splitText: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  splitTextActive: {
    color: colors.textOnYellow,
  },
  limitBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 200, 0, 0.1)',
    borderRadius: borderRadius.sm,
    padding: spacing.md,
  },
  limitText: {
    ...typography.bodySmall,
    color: colors.primary,
    marginLeft: spacing.sm,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  // Paywall styles
  paywallOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  paywallSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    padding: spacing.lg,
    paddingBottom: 40,
  },
  paywallStarContainer: {
    width: 72,
    height: 72,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  paywallBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  paywallBadgeText: {
    ...typography.caption,
    color: colors.textOnYellow,
    fontWeight: '600',
  },
  paywallTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  paywallSubtitle: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  paywallStats: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
  },
  paywallStat: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    marginHorizontal: spacing.xs,
  },
  paywallStatValue: {
    ...typography.h3,
    color: colors.primary,
  },
  paywallStatLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  paywallFeatures: {
    marginBottom: spacing.lg,
  },
  paywallFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  paywallFeatureText: {
    ...typography.body,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
  },
  paywallButton: {
    marginBottom: spacing.md,
  },
  paywallDismiss: {
    alignItems: 'center',
  },
  paywallDismissText: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
});
