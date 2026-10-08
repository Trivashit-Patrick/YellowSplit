import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';
import { Button, Input, Card } from '../src/components/ui';
import { colors, spacing, typography, borderRadius } from '../src/lib/theme';

type PaymentMethod = 'gpay' | 'phonepe' | 'upi' | 'card' | null;

export default function PaymentScreen() {
  const { upgradeToPro } = useAuthStore();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(null);
  const [upiId, setUpiId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const amount = 11;

  const paymentMethods = [
    {
      key: 'gpay' as const,
      name: 'Google Pay',
      subtitle: 'Pay via GPay UPI',
      icon: 'logo-google',
      available: true,
    },
    {
      key: 'phonepe' as const,
      name: 'PhonePe',
      subtitle: 'Pay via PhonePe UPI',
      icon: 'phone-portrait',
      available: true,
    },
    {
      key: 'upi' as const,
      name: 'Any UPI App',
      subtitle: 'Enter UPI ID',
      icon: 'qr-code',
      available: true,
    },
    {
      key: 'card' as const,
      name: 'Card / Net Banking',
      subtitle: 'Debit / Credit Card',
      icon: 'card',
      available: true,
    },
  ];

  const handlePay = async () => {
    if (!selectedMethod) return;

    if (selectedMethod === 'upi' && !upiId.trim()) {
      return;
    }

    setIsProcessing(true);

    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Mock payment success
    await upgradeToPro();

    setIsProcessing(false);
    setShowSuccess(true);
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

  if (showSuccess) {
    return (
      <SafeAreaView style={styles.successContainer}>
        <StatusBar style="light" />
        <View style={styles.successContent}>
          <View style={styles.successIconContainer}>
            <Ionicons name="checkmark" size={48} color={colors.textOnYellow} />
          </View>
          <Text style={styles.successTitle}>Payment Successful!</Text>
          <Text style={styles.successSubtitle}>Pro unlocked for 1 year</Text>

          <Button
            title="Start using Pro"
            onPress={() => router.replace('/(tabs)')}
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
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Choose how to pay</Text>
          <Text style={styles.headerSubtitle}>Amount • secure payment</Text>
        </View>
        <View style={{ width: 28 }} />
      </View>

      {/* Amount Card */}
      <Card style={styles.amountCard}>
        <Text style={styles.amountLabel}>Amount to pay</Text>
        <Text style={styles.amountValue}>₹{amount}</Text>
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
                size={24}
                color={method.key === 'card' ? colors.textMuted : colors.textOnYellow}
              />
            </View>
            <Text style={styles.methodName}>{method.name}</Text>
            <Text style={styles.methodSubtitle}>{method.subtitle}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* UPI ID Input (if UPI selected) */}
      {selectedMethod === 'upi' && (
        <View style={styles.upiSection}>
          <Input
            label="Enter UPI ID"
            value={upiId}
            onChangeText={setUpiId}
            placeholder="yourname@upi or @okicici"
          />
          <Text style={styles.upiHint}>e.g. pratik@okicici • pratik@ybl</Text>
        </View>
      )}

      {/* Pay Button */}
      {selectedMethod && (
        <View style={styles.payButtonContainer}>
          <Button
            title={`Pay ₹${amount} via ${getMethodLabel()}`}
            onPress={handlePay}
            loading={isProcessing}
            fullWidth
            size="large"
          />
          <Text style={styles.paySubtitle}>Redirecting to complete payment</Text>
        </View>
      )}

      {/* Security Footer */}
      <View style={styles.securityFooter}>
        <Ionicons name="lock-closed" size={14} color={colors.textMuted} />
        <Text style={styles.securityText}>
          Secured by Cashfree • 256-bit encryption
        </Text>
      </View>

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
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  headerSubtitle: {
    ...typography.caption,
    color: colors.textMuted,
  },
  amountCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  amountLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  amountValue: {
    fontSize: 40,
    fontWeight: '700',
    color: colors.primary,
  },
  methodsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  methodCard: {
    width: '47%',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  methodCardActive: {
    borderColor: colors.primary,
  },
  methodIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  methodIconContainerGray: {
    backgroundColor: colors.divider,
  },
  methodName: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  methodSubtitle: {
    ...typography.caption,
    color: colors.textMuted,
  },
  upiSection: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  upiHint: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: -spacing.sm,
  },
  payButtonContainer: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
  },
  paySubtitle: {
    ...typography.caption,
    color: colors.textDark,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  securityFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
    paddingVertical: spacing.xl,
  },
  securityText: {
    ...typography.caption,
    color: colors.textMuted,
    marginLeft: spacing.xs,
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
