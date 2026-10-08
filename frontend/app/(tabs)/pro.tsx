import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { Card, Button } from '../../src/components/ui';
import { colors, spacing, typography, borderRadius } from '../../src/lib/theme';

export default function ProScreen() {
  const { profile } = useAuthStore();
  const isPro = profile?.is_pro || false;

  if (isPro) {
    return <ProActiveScreen profile={profile} />;
  }

  return <ProUpsellScreen />;
}

function ProUpsellScreen() {
  const features = [
    'Unlimited expense entries',
    'Receipt photo scanning',
    'Full spending analytics',
    'Export expenses to CSV',
    'Recurring expense automation',
    'Simplify debts algorithm',
  ];

  const comparison = [
    { feature: 'Expenses', free: '3', pro: 'Unlimited' },
    { feature: 'Receipt scanning', free: 'No', pro: 'Yes' },
    { feature: 'Analytics', free: 'Basic', pro: 'Full' },
    { feature: 'Export data', free: 'No', pro: 'Yes' },
    { feature: 'Recurring expenses', free: 'No', pro: 'Yes' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>YellowSplit Pro</Text>
          <Text style={styles.subtitle}>Unlock everything • ₹11/year</Text>
        </View>

        {/* Hero Card */}
        <Card variant="yellow" style={styles.heroCard}>
          <View style={styles.heroStarContainer}>
            <Ionicons name="star" size={40} color={colors.textOnYellow} />
          </View>
          <Text style={styles.heroPrice}>₹11/year</Text>
          <Text style={styles.heroSubtext}>Less than ₹1/month</Text>

          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>∞</Text>
              <Text style={styles.heroStatLabel}>Expenses</Text>
            </View>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>0</Text>
              <Text style={styles.heroStatLabel}>Ads</Text>
            </View>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>All</Text>
              <Text style={styles.heroStatLabel}>Features</Text>
            </View>
          </View>
        </Card>

        {/* Features List */}
        <Card style={styles.featuresCard}>
          <Text style={styles.featuresTitle}>What you get</Text>
          {features.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </Card>

        {/* Comparison */}
        <Card style={styles.comparisonCard}>
          <Text style={styles.comparisonTitle}>Free vs Pro</Text>
          <View style={styles.comparisonHeader}>
            <Text style={[styles.comparisonCell, styles.comparisonFeature]}>Feature</Text>
            <Text style={styles.comparisonCell}>Free</Text>
            <Text style={[styles.comparisonCell, styles.comparisonPro]}>Pro</Text>
          </View>
          {comparison.map((row, index) => (
            <View key={index} style={styles.comparisonRow}>
              <Text style={[styles.comparisonCell, styles.comparisonFeature]}>
                {row.feature}
              </Text>
              <Text style={[styles.comparisonCell, styles.comparisonFreeValue]}>
                {row.free}
              </Text>
              <Text style={[styles.comparisonCell, styles.comparisonProValue]}>
                {row.pro}
              </Text>
            </View>
          ))}
        </Card>

        {/* CTA Button */}
        <Button
          title="Unlock Pro for ₹11/year"
          onPress={() => router.push('/payment')}
          fullWidth
          size="large"
          style={styles.ctaButton}
        />

        <Text style={styles.paymentMethods}>
          Payments via UPI • GPay • PhonePe • Card
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function ProActiveScreen({ profile }: { profile: any }) {
  const expiresAt = profile?.pro_expires_at
    ? new Date(profile.pro_expires_at).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'N/A';

  const features = [
    'Unlimited expense entries',
    'Receipt photo scanning',
    'Full spending analytics',
    'Export expenses to CSV',
    'Recurring expense automation',
    'Simplify debts algorithm',
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>YellowSplit Pro</Text>
          <View style={styles.activeRow}>
            <View style={styles.activeBadge}>
              <Text style={styles.activeBadgeText}>Active</Text>
            </View>
            <Text style={styles.renewsText}>Renews {expiresAt}</Text>
          </View>
        </View>

        {/* Membership Card */}
        <Card variant="highlight" style={styles.membershipCard}>
          <View style={styles.membershipRow}>
            <View style={styles.membershipStarContainer}>
              <Ionicons name="star" size={28} color={colors.textOnYellow} />
            </View>
            <View style={styles.membershipInfo}>
              <Text style={styles.membershipTitle}>Pro Member</Text>
              <Text style={styles.membershipName}>{profile?.full_name}</Text>
              <Text style={styles.membershipMeta}>
                Joined {new Date().toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })} • ₹11 paid
              </Text>
            </View>
          </View>

          <View style={styles.membershipStats}>
            <View style={styles.membershipStat}>
              <Text style={styles.membershipStatValue}>{profile?.expense_count || 0}</Text>
              <Text style={styles.membershipStatLabel}>Expenses added</Text>
            </View>
            <View style={styles.membershipStat}>
              <Text style={styles.membershipStatValue}>365</Text>
              <Text style={styles.membershipStatLabel}>Days remaining</Text>
            </View>
            <View style={styles.membershipStat}>
              <Text style={styles.membershipStatValue}>₹11</Text>
              <Text style={styles.membershipStatLabel}>Total paid</Text>
            </View>
          </View>
        </Card>

        {/* Features */}
        <Card style={styles.featuresCard}>
          <Text style={styles.featuresTitle}>Your Pro Features</Text>
          {features.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </Card>

        {/* Auto-renew */}
        <Card style={styles.autoRenewCard}>
          <View style={styles.autoRenewRow}>
            <View style={styles.autoRenewLeft}>
              <Ionicons name="refresh" size={24} color={colors.primary} />
              <View style={styles.autoRenewInfo}>
                <Text style={styles.autoRenewTitle}>Auto-renew</Text>
                <Text style={styles.autoRenewSubtext}>Renews on {expiresAt}</Text>
              </View>
            </View>
            <View style={styles.toggle}>
              <View style={styles.toggleThumb} />
            </View>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 100,
  },
  header: {
    paddingVertical: spacing.lg,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textMuted,
    marginTop: 4,
  },
  activeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  activeBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  activeBadgeText: {
    ...typography.caption,
    color: colors.textOnYellow,
    fontWeight: '600',
  },
  renewsText: {
    ...typography.bodySmall,
    color: colors.textMuted,
    marginLeft: spacing.sm,
  },
  heroCard: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    marginBottom: spacing.xl,
    borderRadius: borderRadius.xxl,
  },
  heroStarContainer: {
    width: 72,
    height: 72,
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  heroPrice: {
    fontSize: 48,
    fontWeight: '700',
    color: colors.textOnYellow,
  },
  heroSubtext: {
    ...typography.body,
    color: colors.textDark,
  },
  heroStats: {
    flexDirection: 'row',
    marginTop: spacing.xl,
    width: '100%',
  },
  heroStat: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    marginHorizontal: spacing.xs,
  },
  heroStatValue: {
    ...typography.h3,
    color: colors.textOnYellow,
  },
  heroStatLabel: {
    ...typography.caption,
    color: colors.textDark,
  },
  featuresCard: {
    marginBottom: spacing.lg,
  },
  featuresTitle: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  featureText: {
    ...typography.body,
    color: colors.textPrimary,
    marginLeft: spacing.md,
  },
  comparisonCard: {
    marginBottom: spacing.xl,
  },
  comparisonTitle: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  comparisonHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    paddingBottom: spacing.sm,
    marginBottom: spacing.sm,
  },
  comparisonRow: {
    flexDirection: 'row',
    paddingVertical: spacing.xs,
  },
  comparisonCell: {
    flex: 1,
    ...typography.bodySmall,
    color: colors.textPrimary,
  },
  comparisonFeature: {
    flex: 2,
  },
  comparisonPro: {
    color: colors.primary,
    fontWeight: '600',
  },
  comparisonFreeValue: {
    color: colors.textMuted,
  },
  comparisonProValue: {
    color: colors.primary,
    fontWeight: '600',
  },
  ctaButton: {
    marginBottom: spacing.md,
  },
  paymentMethods: {
    ...typography.caption,
    color: '#333',
    textAlign: 'center',
  },
  membershipCard: {
    marginBottom: spacing.xl,
    borderRadius: borderRadius.xxl,
  },
  membershipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  membershipStarContainer: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  membershipInfo: {
    flex: 1,
  },
  membershipTitle: {
    ...typography.body,
    color: colors.textPrimary,
  },
  membershipName: {
    ...typography.h3,
    color: colors.primary,
  },
  membershipMeta: {
    ...typography.caption,
    color: colors.textMuted,
  },
  membershipStats: {
    flexDirection: 'row',
  },
  membershipStat: {
    flex: 1,
    alignItems: 'center',
  },
  membershipStatValue: {
    ...typography.h3,
    color: colors.primary,
  },
  membershipStatLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  autoRenewCard: {
    padding: spacing.md,
  },
  autoRenewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  autoRenewLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  autoRenewInfo: {
    marginLeft: spacing.md,
  },
  autoRenewTitle: {
    ...typography.body,
    color: colors.textPrimary,
  },
  autoRenewSubtext: {
    ...typography.caption,
    color: colors.textMuted,
  },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    padding: 2,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.textOnYellow,
  },
});
