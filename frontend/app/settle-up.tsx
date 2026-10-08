import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';
import { useDataStore } from '../src/store/dataStore';
import { Card, Avatar, Button, LoadingSpinner, Input } from '../src/components/ui';
import { colors, spacing, typography, borderRadius } from '../src/lib/theme';
import type { Debt } from '../src/types';

type PaymentMethod = 'gpay' | 'phonepe' | 'upi' | 'card' | null;

export default function SettleUpScreen() {
  const { user } = useAuthStore();
  const { groups, debts, currentGroup, fetchGroupDetails, settleDebt, fetchGroups } = useDataStore();
  
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [showPaymentSheet, setShowPaymentSheet] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(null);
  const [upiId, setUpiId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user?.id]);

  const loadData = async () => {
    if (user?.id) {
      await fetchGroups(user.id);
      if (groups.length > 0) {
        setSelectedGroupId(groups[0].id);
        await fetchGroupDetails(groups[0].id);
      }
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (selectedGroupId) {
      fetchGroupDetails(selectedGroupId);
    }
  }, [selectedGroupId]);

  const handleSettleUp = (debt: Debt) => {
    setSelectedDebt(debt);
    setShowPaymentSheet(true);
  };

  const handlePay = async () => {
    if (!selectedMethod || !selectedDebt || !selectedGroupId) return;

    if (selectedMethod === 'upi' && !upiId.trim()) {
      return;
    }

    setIsProcessing(true);

    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Record settlement
    await settleDebt(
      selectedDebt.from_user_id,
      selectedDebt.to_user_id,
      selectedDebt.amount,
      selectedGroupId,
      selectedMethod
    );

    setIsProcessing(false);
    setShowPaymentSheet(false);
    setShowSuccess(true);

    // Refresh data
    await fetchGroupDetails(selectedGroupId);
  };

  const getMethodLabel = () => {
    switch (selectedMethod) {
      case 'gpay': return 'Google Pay';
      case 'phonepe': return 'PhonePe';
      case 'upi': return 'UPI';
      case 'card': return 'Card';
      default: return '';
    }
  };

  const paymentMethods = [
    { key: 'gpay' as const, name: 'Google Pay', subtitle: 'Pay via GPay UPI', icon: 'logo-google' },
    { key: 'phonepe' as const, name: 'PhonePe', subtitle: 'Pay via PhonePe UPI', icon: 'phone-portrait' },
    { key: 'upi' as const, name: 'Any UPI App', subtitle: 'Enter UPI ID', icon: 'qr-code' },
    { key: 'card' as const, name: 'Card / Net Banking', subtitle: 'Debit / Credit Card', icon: 'card' },
  ];

  // Filter debts where user owes
  const userDebts = debts.filter(d => d.from_user_id === user?.id);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner size="large" />
      </View>
    );
  }

  if (showSuccess) {
    return (
      <SafeAreaView style={styles.successContainer}>
        <StatusBar style="light" />
        <View style={styles.successContent}>
          <View style={styles.successIconContainer}>
            <Ionicons name="checkmark" size={48} color={colors.textOnYellow} />
          </View>
          <Text style={styles.successTitle}>Payment Successful!</Text>
          <Text style={styles.successSubtitle}>Debt settled with {selectedDebt?.to_profile?.full_name}</Text>

          <Button
            title="Done"
            onPress={() => {
              setShowSuccess(false);
              setSelectedDebt(null);
              setSelectedMethod(null);
            }}
            fullWidth
            size="large"
            style={styles.successButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />

      {/* Handle bar */}
      <View style={styles.handleBar} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={28} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settle Up</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Group Selector */}
        <View style={styles.section}>
          <Text style={styles.label}>Select group</Text>
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

        {/* Debts List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>You owe</Text>
          
          {userDebts.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Ionicons name="checkmark-circle" size={48} color={colors.primary} />
              <Text style={styles.emptyText}>You're all settled up!</Text>
              <Text style={styles.emptySubtext}>No pending payments in this group</Text>
            </Card>
          ) : (
            userDebts.map((debt, index) => (
              <Card key={index} style={styles.debtCard}>
                <View style={styles.debtRow}>
                  <View style={styles.debtLeft}>
                    <Avatar name={debt.from_profile?.full_name || 'U'} size="medium" />
                    <View style={styles.debtArrow}>
                      <Ionicons name="arrow-forward" size={16} color={colors.textMuted} />
                    </View>
                    <Avatar name={debt.to_profile?.full_name || 'U'} size="medium" />
                    <View style={styles.debtInfo}>
                      <Text style={styles.debtText}>You owe</Text>
                      <Text style={styles.debtName}>
                        {debt.to_profile?.full_name?.split(' ')[0]}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.debtAmount}>₹{debt.amount.toFixed(0)}</Text>
                </View>
                <Button
                  title="Settle Up"
                  onPress={() => handleSettleUp(debt)}
                  fullWidth
                  style={styles.settleButton}
                />
              </Card>
            ))
          )}
        </View>

        {/* Others Owe You */}
        {debts.filter(d => d.to_user_id === user?.id).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Others owe you</Text>
            {debts.filter(d => d.to_user_id === user?.id).map((debt, index) => (
              <Card key={index} style={styles.debtCard}>
                <View style={styles.debtRow}>
                  <View style={styles.debtLeft}>
                    <Avatar name={debt.from_profile?.full_name || 'U'} size="medium" />
                    <View style={styles.debtInfo}>
                      <Text style={styles.debtName}>
                        {debt.from_profile?.full_name?.split(' ')[0]}
                      </Text>
                      <Text style={styles.debtText}>owes you</Text>
                    </View>
                  </View>
                  <Text style={styles.debtAmountPositive}>₹{debt.amount.toFixed(0)}</Text>
                </View>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Payment Bottom Sheet */}
      <Modal visible={showPaymentSheet} animationType="slide" transparent>
        <View style={styles.paymentOverlay}>
          <View style={styles.paymentSheet}>
            <View style={styles.handleBar} />
            
            <View style={styles.paymentHeader}>
              <Text style={styles.paymentTitle}>Choose how to pay</Text>
              <Text style={styles.paymentSubtitle}>Amount • secure payment</Text>
            </View>

            {/* Amount Card */}
            <Card style={styles.amountCard}>
              <Text style={styles.amountLabel}>Amount to pay</Text>
              <Text style={styles.amountValue}>₹{selectedDebt?.amount.toFixed(0)}</Text>
            </Card>

            {/* Payment Methods Grid */}
            <View style={styles.methodsGrid}>
              {paymentMethods.map((method) => (
                <TouchableOpacity
                  key={method.key}
                  style={[
                    styles.methodCard,
                    selectedMethod === method.key && styles.methodCardActive,
                  ]}
                  onPress={() => setSelectedMethod(method.key)}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.methodIconContainer,
                      method.key === 'card' && styles.methodIconContainerGray,
                    ]}
                  >
                    <Ionicons
                      name={method.icon as any}
                      size={20}
                      color={method.key === 'card' ? colors.textMuted : colors.textOnYellow}
                    />
                  </View>
                  <Text style={styles.methodName}>{method.name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* UPI ID Input */}
            {selectedMethod === 'upi' && (
              <View style={styles.upiSection}>
                <Input
                  value={upiId}
                  onChangeText={setUpiId}
                  placeholder="yourname@upi or @okicici"
                />
              </View>
            )}

            {/* Pay Button */}
            {selectedMethod && (
              <Button
                title={`Pay ₹${selectedDebt?.amount.toFixed(0)} via ${getMethodLabel()}`}
                onPress={handlePay}
                loading={isProcessing}
                fullWidth
                size="large"
                style={styles.payButton}
              />
            )}

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setShowPaymentSheet(false);
                setSelectedMethod(null);
              }}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Processing Modal */}
      <Modal visible={isProcessing} transparent>
        <View style={styles.processingOverlay}>
          <View style={styles.processingCard}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.processingText}>Processing payment...</Text>
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
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
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
    paddingBottom: spacing.xxl,
  },
  section: {
    marginBottom: spacing.xl,
  },
  label: {
    ...typography.bodySmall,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: spacing.md,
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
  emptyCard: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    ...typography.body,
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  emptySubtext: {
    ...typography.bodySmall,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  debtCard: {
    marginBottom: spacing.md,
  },
  debtRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  debtLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  debtArrow: {
    marginHorizontal: spacing.xs,
  },
  debtInfo: {
    marginLeft: spacing.sm,
  },
  debtText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  debtName: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  debtAmount: {
    ...typography.h3,
    color: colors.error,
  },
  debtAmountPositive: {
    ...typography.h3,
    color: colors.primary,
  },
  settleButton: {
    marginTop: spacing.xs,
  },
  // Payment sheet styles
  paymentOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  paymentSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    padding: spacing.lg,
    paddingBottom: 40,
  },
  paymentHeader: {
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  paymentTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  paymentSubtitle: {
    ...typography.caption,
    color: colors.textMuted,
  },
  amountCard: {
    alignItems: 'center',
    backgroundColor: colors.background,
    marginBottom: spacing.lg,
  },
  amountLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  amountValue: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.primary,
  },
  methodsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  methodCard: {
    width: '48%',
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  methodCardActive: {
    borderColor: colors.primary,
  },
  methodIconContainer: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  methodIconContainerGray: {
    backgroundColor: colors.divider,
  },
  methodName: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  upiSection: {
    marginBottom: spacing.md,
  },
  payButton: {
    marginBottom: spacing.md,
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  cancelText: {
    ...typography.body,
    color: colors.textMuted,
  },
  processingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  processingCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.xxl,
    alignItems: 'center',
  },
  processingText: {
    ...typography.body,
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  // Success screen
  successContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  successContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  successIconContainer: {
    width: 96,
    height: 96,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  successTitle: {
    ...typography.h2,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  successSubtitle: {
    ...typography.body,
    color: colors.textMuted,
    marginBottom: spacing.xxl,
  },
  successButton: {
    marginTop: spacing.xl,
  },
});
