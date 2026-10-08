import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors, spacing, typography, borderRadius } from '../../src/lib/theme';

export default function TermsOfServiceScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms of Service</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.lastUpdated}>Last updated: January 2025</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
          <Text style={styles.sectionText}>
            By using YellowSplit, you agree to these Terms of Service. If you do not agree 
            to these terms, please do not use the app.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Description of Service</Text>
          <Text style={styles.sectionText}>
            YellowSplit is an expense splitting application that helps users track and 
            settle shared expenses with friends, roommates, and groups. The service includes 
            both free and paid (Pro) features.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. User Accounts</Text>
          <Text style={styles.sectionText}>
            You are responsible for:
            {"\n"}• Maintaining the security of your account
            {"\n"}• All activities that occur under your account
            {"\n"}• Providing accurate information
            {"\n"}• Keeping your password confidential
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Pro Subscription</Text>
          <Text style={styles.sectionText}>
            YellowSplit Pro is available for ₹11/year. Subscriptions automatically renew 
            unless cancelled. Refunds are available within 7 days of purchase if you 
            haven't used any Pro features.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Acceptable Use</Text>
          <Text style={styles.sectionText}>
            You agree not to:
            {"\n"}• Use the service for illegal purposes
            {"\n"}• Attempt to gain unauthorized access
            {"\n"}• Interfere with other users' enjoyment
            {"\n"}• Upload malicious content or spam
            {"\n"}• Violate any applicable laws
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Limitation of Liability</Text>
          <Text style={styles.sectionText}>
            YellowSplit is provided "as is" without warranties. We are not responsible for 
            any disputes between users regarding expenses or payments. Users should verify 
            all financial calculations independently.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Dispute Resolution</Text>
          <Text style={styles.sectionText}>
            Any disputes related to these terms will be resolved through arbitration in 
            India, in accordance with Indian law. By using YellowSplit, you agree to this 
            dispute resolution process.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Contact</Text>
          <Text style={styles.sectionText}>
            For questions about these Terms, contact us at:
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
