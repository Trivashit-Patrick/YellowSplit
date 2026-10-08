import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { useDataStore } from '../../src/store/dataStore';

export default function ProfileScreen() {
  const { user, profile, signOut } = useAuthStore();
  const { groups } = useDataStore();
  const [notifOn, setNotifOn] = useState(true);
  const [reminderOn, setReminderOn] = useState(true);
  const floatAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -3, duration: 1500, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const getInitials = () => {
    if (profile?.full_name) {
      return profile.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return (user?.email || 'U').slice(0, 2).toUpperCase();
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out', style: 'destructive',
        onPress: async () => { await signOut(); router.replace('/(auth)/login'); },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => { await signOut(); router.replace('/(auth)/login'); },
        },
      ]
    );
  };

  const Toggle = ({ value, onToggle }: { value: boolean; onToggle: () => void }) => {
    const anim = useRef(new Animated.Value(value ? 1 : 0)).current;
    const toggle = () => {
      Animated.timing(anim, { toValue: value ? 0 : 1, duration: 250, useNativeDriver: false }).start();
      onToggle();
    };
    const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 18] });
    return (
      <TouchableOpacity onPress={toggle} style={[styles.toggleWrap, value && styles.toggleWrapOn]}>
        <Animated.View style={[styles.toggleKnob, { transform: [{ translateX }] }, value && styles.toggleKnobOn]} />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.topBar}>
          <Text style={styles.pageTitle}>
            My <Text style={styles.pageTitleYellow}>Profile</Text>
          </Text>
          <TouchableOpacity>
            <Ionicons name="create-outline" size={22} color="#F5C800" />
          </TouchableOpacity>
        </View>

        {/* Profile Hero Card */}
        <View style={styles.profileHero}>
          <Animated.View style={[styles.avatarRing, { transform: [{ translateY: floatAnim }] }]}>
            <View style={styles.avatarInner}>
              <Text style={styles.avatarText}>{getInitials()}</Text>
            </View>
          </Animated.View>

          <View style={styles.badge}>
            <Text style={styles.badgeText}>⭐ Top Splitter</Text>
          </View>

          <Text style={styles.profileName}>
            {profile?.full_name || user?.email?.split('@')[0] || 'User'}
          </Text>
          <Text style={styles.profileEmail}>{profile?.email || user?.email}</Text>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statVal}>{groups.length}</Text>
              <Text style={styles.statLabel}>Groups</Text>
            </View>
            <View style={[styles.stat, styles.statBorder]}>
              <Text style={styles.statVal}>{profile?.expense_count || 0}</Text>
              <Text style={styles.statLabel}>Expenses</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statVal}>₹0</Text>
              <Text style={styles.statLabel}>Total split</Text>
            </View>
          </View>
        </View>

        {/* Account */}
        <View style={styles.menuSection}>
          <Text style={styles.menuTitle}>Account</Text>
          <View style={styles.menuCard}>
            {[
              { icon: 'person-outline', label: 'Edit profile', onPress: () => {} },
              { icon: 'wallet-outline', label: 'UPI ID', onPress: () => {} },
              { icon: 'key-outline', label: 'Change password', onPress: () => {} },
            ].map((item, i, arr) => (
              <TouchableOpacity
                key={item.label}
                style={[styles.menuRow, i < arr.length - 1 && styles.menuRowBorder]}
                onPress={item.onPress}
                activeOpacity={0.7}
              >
                <View style={styles.menuIcon}>
                  <Ionicons name={item.icon as any} size={16} color="#F5C800" />
                </View>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Ionicons name="chevron-forward" size={14} color="#333" />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Preferences */}
        <View style={styles.menuSection}>
          <Text style={styles.menuTitle}>Preferences</Text>
          <View style={styles.menuCard}>
            <View style={[styles.menuRow, styles.menuRowBorder]}>
              <View style={styles.menuIcon}>
                <Ionicons name="notifications-outline" size={16} color="#F5C800" />
              </View>
              <Text style={[styles.menuLabel, { flex: 1 }]}>Push notifications</Text>
              <Toggle value={notifOn} onToggle={() => setNotifOn(!notifOn)} />
            </View>
            <View style={[styles.menuRow, styles.menuRowBorder]}>
              <View style={styles.menuIcon}>
                <Ionicons name="alarm-outline" size={16} color="#F5C800" />
              </View>
              <Text style={[styles.menuLabel, { flex: 1 }]}>Expense reminders</Text>
              <Toggle value={reminderOn} onToggle={() => setReminderOn(!reminderOn)} />
            </View>
            <TouchableOpacity style={styles.menuRow} activeOpacity={0.7}>
              <View style={styles.menuIcon}>
                <Ionicons name="globe-outline" size={16} color="#F5C800" />
              </View>
              <Text style={[styles.menuLabel, { flex: 1 }]}>Currency</Text>
              <Text style={styles.menuVal}>₹ INR</Text>
              <Ionicons name="chevron-forward" size={14} color="#333" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Data */}
        <View style={styles.menuSection}>
          <Text style={styles.menuTitle}>Data</Text>
          <View style={styles.menuCard}>
            <TouchableOpacity style={[styles.menuRow, styles.menuRowBorder]} activeOpacity={0.7}>
              <View style={styles.menuIcon}>
                <Ionicons name="download-outline" size={16} color="#F5C800" />
              </View>
              <Text style={[styles.menuLabel, { flex: 1 }]}>Export my data</Text>
              <Text style={styles.menuVal}>CSV</Text>
              <Ionicons name="chevron-forward" size={14} color="#333" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.menuRow, styles.menuRowBorder]}
              onPress={() => router.push('/legal/privacy')}
              activeOpacity={0.7}
            >
              <View style={styles.menuIcon}>
                <Ionicons name="document-outline" size={16} color="#F5C800" />
              </View>
              <Text style={[styles.menuLabel, { flex: 1 }]}>Privacy policy</Text>
              <Ionicons name="chevron-forward" size={14} color="#333" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => router.push('/legal/terms')}
              activeOpacity={0.7}
            >
              <View style={styles.menuIcon}>
                <Ionicons name="checkmark-circle-outline" size={16} color="#F5C800" />
              </View>
              <Text style={[styles.menuLabel, { flex: 1 }]}>Terms of service</Text>
              <Ionicons name="chevron-forward" size={14} color="#333" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Danger Zone */}
        <View style={styles.menuSection}>
          <Text style={styles.menuTitle}>Danger zone</Text>
          <View style={styles.menuCard}>
            <TouchableOpacity
              style={[styles.menuRow, styles.menuRowBorder]}
              onPress={handleLogout}
              activeOpacity={0.7}
            >
              <View style={styles.menuIconDanger}>
                <Ionicons name="log-out-outline" size={16} color="#FF6B6B" />
              </View>
              <Text style={styles.menuLabelDanger}>Log out</Text>
              <Ionicons name="chevron-forward" size={14} color="#FF6B6B" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuRow}
              onPress={handleDeleteAccount}
              activeOpacity={0.7}
            >
              <View style={styles.menuIconDanger}>
                <Ionicons name="trash-outline" size={16} color="#FF6B6B" />
              </View>
              <Text style={styles.menuLabelDanger}>Delete account</Text>
              <Ionicons name="chevron-forward" size={14} color="#FF6B6B" />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.versionTag}>YellowSplit v1.0.0 · Made with love in India</Text>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111111' },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 100 },

  topBar: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12,
  },
  pageTitle: { color: '#f5f5f5', fontSize: 22, fontWeight: '700' },
  pageTitleYellow: { color: '#F5C800' },

  profileHero: {
    marginHorizontal: 16, marginBottom: 14,
    backgroundColor: '#1E1E1E', borderRadius: 22,
    padding: 20, borderWidth: 0.5, borderColor: '#2c2c2c',
    alignItems: 'center', overflow: 'hidden',
  },
  avatarRing: {
    width: 72, height: 72, borderRadius: 36,
    borderWidth: 3, borderColor: '#F5C800',
    padding: 3, marginBottom: 12,
  },
  avatarInner: {
    width: '100%', height: '100%', borderRadius: 36,
    backgroundColor: '#F5C800', alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#111', fontSize: 24, fontWeight: '700' },
  badge: {
    backgroundColor: '#F5C800', paddingHorizontal: 12,
    paddingVertical: 3, borderRadius: 99, marginBottom: 12,
  },
  badgeText: { color: '#111', fontSize: 10, fontWeight: '700' },
  profileName: { color: '#f5f5f5', fontSize: 18, fontWeight: '700', marginBottom: 2 },
  profileEmail: { color: '#555', fontSize: 12, marginBottom: 14 },
  statsRow: {
    flexDirection: 'row', width: '100%',
    borderTopWidth: 0.5, borderTopColor: '#2c2c2c', paddingTop: 14,
  },
  stat: { flex: 1, alignItems: 'center' },
  statBorder: { borderLeftWidth: 0.5, borderRightWidth: 0.5, borderColor: '#2c2c2c' },
  statVal: { color: '#F5C800', fontSize: 18, fontWeight: '700' },
  statLabel: { color: '#555', fontSize: 10, marginTop: 2 },

  menuSection: { paddingHorizontal: 16, marginBottom: 10 },
  menuTitle: {
    color: '#444', fontSize: 11, fontWeight: '600',
    letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8,
  },
  menuCard: {
    backgroundColor: '#1E1E1E', borderRadius: 18,
    overflow: 'hidden', borderWidth: 0.5, borderColor: '#2c2c2c',
  },
  menuRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 12, padding: 14,
  },
  menuRowBorder: { borderBottomWidth: 0.5, borderBottomColor: '#2a2a2a' },
  menuIcon: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: '#1a1a1a',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  menuIconDanger: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: 'rgba(255,107,107,0.08)',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  menuLabel: { color: '#f5f5f5', fontSize: 14, flex: 1 },
  menuLabelDanger: { color: '#FF6B6B', fontSize: 14, flex: 1 },
  menuVal: { color: '#555', fontSize: 12, marginRight: 4 },

  toggleWrap: {
    width: 44, height: 26, backgroundColor: '#2c2c2c',
    borderRadius: 13, padding: 3,
  },
  toggleWrapOn: { backgroundColor: '#F5C800' },
  toggleKnob: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: '#f5f5f5',
  },
  toggleKnobOn: { backgroundColor: '#111' },

  versionTag: {
    textAlign: 'center', color: '#333',
    fontSize: 11, paddingVertical: 10,
  },
});