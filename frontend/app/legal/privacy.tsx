import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors, spacing, typography, borderRadius } from '../../src/lib/theme';

export default function PrivacyPolicyScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.lastUpdated}>Last updated: January 2025</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Information We Collect</Text>
          <Text style={styles.sectionText}>
            YellowSplit collects information you provide directly, including:
            {"\n"}• Account information (name, email)
            {"\n"}• Expense data you enter
            {"\n"}• Group and sharing preferences
            {"\n"}• Payment information for Pro subscriptions
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. How We Use Your Information</Text>
          <Text style={styles.sectionText}>
            We use your information to:
            {"\n"}• Provide and improve the YellowSplit service
            {"\n"}• Calculate and track shared expenses
            {"\n"}• Send notifications about group activity
            {"\n"}• Process Pro subscription payments
            {"\n"}• Provide customer support
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Data Storage</Text>
          <Text style={styles.sectionText}>
            Your data is securely stored using industry-standard encryption. We use Supabase 
            for our database, which provides enterprise-grade security. Your financial data 
            is never shared with third parties without your explicit consent.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Data Sharing</Text>
          <Text style={styles.sectionText}>
            We do not sell your personal data. We only share your information:
            {"\n"}• With other members of groups you join
            {"\n"}• With payment processors for Pro subscriptions
            {"\n"}• When required by law
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Your Rights</Text>
          <Text style={styles.sectionText}>
            You have the right to:
            {"\n"}• Access your personal data
            {"\n"}• Export your expense data
            {"\n"}• Delete your account and all associated data
            {"\n"}• Opt out of marketing communications
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Contact Us</Text>
          <Text style={styles.sectionText}>
            If you have questions about this Privacy Policy, please contact us at:
            {"\n"}support@yellowsplit.com
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    color: colors.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  lastUpdated: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.xl,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  sectionText: {
    ...typography.body,
    color: colors.textPrimary,
    lineHeight: 24,
  },
});
