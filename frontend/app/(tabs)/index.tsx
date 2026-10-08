import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Animated,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { useDataStore } from '../../src/store/dataStore';
import { LoadingSpinner } from '../../src/components/ui';

export default function HomeScreen() {
  const { user, profile } = useAuthStore();
  const { groups, activities, fetchGroups, fetchActivities, isLoading } = useDataStore();
  const [refreshing, setRefreshing] = useState(false);
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (user?.id) {
      fetchGroups(user.id);
      fetchActivities(user.id);
    }
  }, [user?.id]);

  useEffect(() => {
    const animate = () => {
      shimmerAnim.setValue(0);
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }).start(() => {
        setTimeout(animate, 1500);
      });
    };
    animate();
  }, []);

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-50, 380],
  });

  const onRefresh = async () => {
    setRefreshing(true);
    if (user?.id) {
      await fetchGroups(user.id);
      await fetchActivities(user.id);
    }
    setRefreshing(false);
  };

  const totalBalance = groups.reduce((sum, g) => sum + g.userBalance, 0);
  const youGet = groups.filter(g => g.userBalance > 0).reduce((sum, g) => sum + g.userBalance, 0);
  const youOwe = groups.filter(g => g.userBalance < 0).reduce((sum, g) => sum + Math.abs(g.userBalance), 0);
  const settled = groups.filter(g => Math.abs(g.userBalance) < 1).length;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning,';
    if (hour < 17) return 'Good afternoon,';
    return 'Good evening,';
  };

  const firstName = profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'User';

  const getInitials = () => {
    if (profile?.full_name) {
      return profile.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return (user?.email || 'U').slice(0, 2).toUpperCase();
  };

  const handleDeleteGroup = (groupId: string, groupName: string) => {
    Alert.alert(
      'Delete Group',
      `Are you sure you want to delete "${groupName}"? All expenses and data will be permanently deleted.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { supabase } = await import('../../src/lib/supabase');
              await supabase.from('expense_splits').delete().in(
                'expense_id',
                (await supabase.from('expenses').select('id').eq('group_id', groupId)).data?.map(e => e.id) || []
              );
              await supabase.from('expenses').delete().eq('group_id', groupId);
              await supabase.from('settlements').delete().eq('group_id', groupId);
              await supabase.from('activities').delete().eq('group_id', groupId);
              await supabase.from('activity_feed').delete().eq('group_id', groupId);
              await supabase.from('group_members').delete().eq('group_id', groupId);
              await supabase.from('groups').delete().eq('id', groupId);
              if (user?.id) await fetchGroups(user.id);
            } catch {
              Alert.alert('Error', 'Failed to delete group. Please try again.');
            }
          },
        },
      ]
    );
  };

  const recentActivities = activities.slice(0, 5);

  const handleAnalyticsPress = () => {
    try {
      router.push('/analytics' as any);
    } catch {
      router.push('/(tabs)/analytics' as any);
    }
  };

  if (isLoading && groups.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F5C800" />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greetingSub}>{getGreeting()}</Text>
            <Text style={styles.greetingName}>{firstName}</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/profile')}
            style={styles.avatarWrapper}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitials()}</Text>
            </View>
            <View style={styles.avatarDot} />
          </TouchableOpacity>
        </View>

        {/* Balance Hero Card */}
        <View style={styles.balanceCard}>
          <Animated.View
            style={{
              position: 'absolute',
              top: -10, bottom: -10, width: 40,
              backgroundColor: 'rgba(255,255,255,0.3)',
              transform: [{ translateX: shimmerTranslate }],
              zIndex: 1, opacity: 0.7,
            }}
          />
          <View style={styles.cardIcon}>
            <Ionicons name="time-outline" size={18} color="#111" />
          </View>
          <Text style={styles.balanceLabel}>Total balance overview</Text>
          <Text style={styles.balanceAmount}>
            {totalBalance >= 0 ? '+' : ''}₹{Math.abs(totalBalance).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </Text>
          <Text style={styles.balanceSub}>Across {groups.length} active groups</Text>
          <View style={styles.balanceRow}>
            <View style={styles.balancePill}>
              <Text style={styles.pillLabel}>You owe</Text>
              <Text style={[styles.pillVal, { color: '#c0392b' }]}>
                ₹{Math.round(youOwe).toLocaleString('en-IN')}
              </Text>
            </View>
            <View style={styles.balancePill}>
              <Text style={styles.pillLabel}>You get</Text>
              <Text style={[styles.pillVal, { color: '#1a6b2f' }]}>
                ₹{Math.round(youGet).toLocaleString('en-IN')}
              </Text>
            </View>
            <View style={styles.balancePill}>
              <Text style={styles.pillLabel}>Settled</Text>
              <Text style={styles.pillVal}>{settled}</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick actions</Text>
        </View>
        <View style={styles.quickActions}>
          {[
            { icon: 'add', label: 'Add expense', onPress: () => router.push('/add-expense') },
            { icon: 'people', label: 'New group', onPress: () => router.push('/new-group') },
            { icon: 'checkmark-circle', label: 'Settle up', onPress: () => router.push('/settle-up') },
            { icon: 'analytics', label: 'Analytics', onPress: handleAnalyticsPress },
          ].map((action, i) => (
            <TouchableOpacity
              key={i}
              style={styles.qaBtn}
              onPress={action.onPress}
              activeOpacity={0.75}
            >
              <View style={styles.qaIcon}>
                <Ionicons name={action.icon as any} size={16} color="#111" />
              </View>
              <Text style={styles.qaLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Groups */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your groups</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/groups')}>
            <Text style={styles.sectionLink}>See all</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.groupsScroll}>
          {groups.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="people-outline" size={36} color="#555" />
              <Text style={styles.emptyText}>No groups yet</Text>
              <Text style={styles.emptySubtext}>Create a group to start splitting</Text>
            </View>
          ) : (
            groups.map((group, index) => (
              <TouchableOpacity
                key={group.id}
                activeOpacity={0.82}
                onPress={() => router.push(`/group/${group.id}`)}
                onLongPress={() => handleDeleteGroup(group.id, group.name)}
                delayLongPress={800}
                style={[styles.groupCard, index === 0 && styles.groupCardHighlight]}
              >
                {group.hasNewActivity && (
                  <View style={styles.newBadge}>
                    <Text style={styles.newBadgeText}>new</Text>
                  </View>
                )}
                <View style={styles.groupAvatar}>
                  <Text style={styles.groupEmoji}>{group.emoji}</Text>
                </View>
                <View style={styles.groupInfo}>
                  <Text style={styles.groupName}>{group.name}</Text>
                  <View style={styles.membersRow}>
                    {group.members.slice(0, 5).map((m, i) => (
                      <View
                        key={(m as any).id || i}
                        style={[
                          styles.memberDot,
                          { backgroundColor: ['#F5C800', '#CE93D8', '#FF8A65', '#64B5F6', '#4CAF50'][i % 5] },
                        ]}
                      >
                        <Text style={styles.memberDotText}>
                          {((m as any).profile?.full_name || '?')[0].toUpperCase()}
                        </Text>
                      </View>
                    ))}
                    {group.memberCount > 5 && (
                      <View style={[styles.memberDot, { backgroundColor: '#2c2c2c' }]}>
                        <Text style={[styles.memberDotText, { color: '#888' }]}>
                          +{group.memberCount - 5}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.groupMeta}>
                    {group.memberCount} members · {group.expenseCount} expenses
                  </Text>
                </View>
                <View style={styles.groupAmount}>
                  <Text style={[
                    styles.groupAmtVal,
                    group.userBalance > 0 ? styles.amtGet :
                    group.userBalance < 0 ? styles.amtOwe : styles.amtClear,
                  ]}>
                    {group.userBalance > 0 ? '+' : group.userBalance < 0 ? '-' : ''}
                    ₹{Math.abs(Math.round(group.userBalance)).toLocaleString('en-IN')}
                  </Text>
                  <Text style={styles.groupAmtLabel}>
                    {group.userBalance > 0 ? 'you get back' :
                     group.userBalance < 0 ? 'you owe' : 'all clear'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Recent Activity */}
        <View style={[styles.sectionHeader, { marginTop: -6 }]}>
          <Text style={styles.sectionTitle}>Recent activity</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/activity')}>
            <Text style={styles.sectionLink}>View all</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.activitySection}>
          {recentActivities.length === 0 ? (
            <Text style={styles.emptySubtext}>No activity yet</Text>
          ) : (
            recentActivities.map((activity, i) => (
              <View key={activity.id} style={[
                styles.activityItem,
                i === recentActivities.length - 1 && { borderBottomWidth: 0 },
              ]}>
                <View style={[
                  styles.actDot,
                  {
                    backgroundColor:
                      (activity as any).action_type === 'expense_added' ? '#F5C800' :
                      (activity as any).action_type === 'settled' ? '#4CAF50' : '#FF6B6B',
                  },
                ]} />
                <Text style={styles.actText}>
                  <Text style={styles.actName}>
                    {(activity as any).profile?.full_name?.split(' ')[0] || 'Someone'}
                  </Text>
                  {' '}{activity.description}
                </Text>
                <Text style={styles.actTime}>
                  {formatActivityTime(activity.created_at)}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function formatActivityTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111111' },
  loadingContainer: { flex: 1, backgroundColor: '#111111', alignItems: 'center', justifyContent: 'center' },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 100 },

  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 20,
    paddingTop: 8, paddingBottom: 12,
  },
  greetingSub: { color: '#888', fontSize: 12 },
  greetingName: { color: '#F5C800', fontSize: 18, fontWeight: '600', marginTop: 2 },
  avatarWrapper: { position: 'relative' },
  avatar: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#F5C800', alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#111', fontSize: 14, fontWeight: '700' },
  avatarDot: {
    position: 'absolute', top: 1, right: 1,
    width: 9, height: 9, borderRadius: 5,
    backgroundColor: '#4CAF50', borderWidth: 2, borderColor: '#111',
  },

  balanceCard: {
    marginHorizontal: 16, marginBottom: 14,
    backgroundColor: '#F5C800', borderRadius: 22,
    padding: 18, position: 'relative', overflow: 'hidden',
  },
  cardIcon: {
    position: 'absolute', right: 18, top: 18,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center', justifyContent: 'center', zIndex: 2,
  },
  balanceLabel: { color: '#7a6000', fontSize: 12, fontWeight: '500', zIndex: 2 },
  balanceAmount: {
    color: '#111', fontSize: 34, fontWeight: '700',
    marginTop: 4, marginBottom: 2, letterSpacing: -1, zIndex: 2,
  },
  balanceSub: { color: '#7a6000', fontSize: 12, marginBottom: 14, zIndex: 2 },
  balanceRow: { flexDirection: 'row', justifyContent: 'space-between', zIndex: 2 },
  balancePill: {
    backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 6,
    alignItems: 'center', flex: 1, marginHorizontal: 3,
  },
  pillLabel: { color: '#7a6000', fontSize: 10 },
  pillVal: { color: '#111', fontSize: 14, fontWeight: '700', marginTop: 1 },

  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 20, marginBottom: 10,
  },
  sectionTitle: { color: '#f5f5f5', fontSize: 15, fontWeight: '600' },
  sectionLink: { color: '#F5C800', fontSize: 12, fontWeight: '500' },

  quickActions: {
    flexDirection: 'row', gap: 10,
    paddingHorizontal: 16, marginBottom: 16,
  },
  qaBtn: {
    flex: 1, backgroundColor: '#1E1E1E',
    borderRadius: 14, padding: 12, alignItems: 'center',
    borderWidth: 0.5, borderColor: '#2c2c2c',
  },
  qaIcon: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: '#F5C800', alignItems: 'center',
    justifyContent: 'center', marginBottom: 6,
  },
  qaLabel: { color: '#f5f5f5', fontSize: 11, fontWeight: '500', textAlign: 'center' },

  groupsScroll: {
    paddingHorizontal: 16, marginBottom: 16,
    flexDirection: 'column', gap: 10,
  },
  emptyCard: {
    backgroundColor: '#1E1E1E', borderRadius: 18,
    padding: 32, alignItems: 'center',
    borderWidth: 0.5, borderColor: '#2c2c2c',
  },
  emptyText: { color: '#f5f5f5', fontSize: 15, fontWeight: '600', marginTop: 10 },
  emptySubtext: { color: '#888', fontSize: 12, marginTop: 4 },
  groupCard: {
    backgroundColor: '#1E1E1E', borderRadius: 18,
    padding: 14, flexDirection: 'row',
    alignItems: 'center', gap: 12,
    borderWidth: 0.5, borderColor: '#2c2c2c',
    position: 'relative', overflow: 'hidden',
  },
  groupCardHighlight: { borderColor: '#F5C800', borderWidth: 1 },
  newBadge: {
    position: 'absolute', top: 10, right: 12,
    backgroundColor: '#F5C800', paddingHorizontal: 6,
    paddingVertical: 2, borderRadius: 99,
  },
  newBadgeText: { color: '#111', fontSize: 9, fontWeight: '700' },
  groupAvatar: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: '#F5C800', alignItems: 'center',
    justifyContent: 'center', flexShrink: 0,
  },
  groupEmoji: { fontSize: 22 },
  groupInfo: { flex: 1 },
  groupName: { color: '#f5f5f5', fontSize: 14, fontWeight: '600', marginBottom: 3 },
  membersRow: { flexDirection: 'row', marginTop: 3, marginBottom: 3 },
  memberDot: {
    width: 16, height: 16, borderRadius: 8,
    borderWidth: 1.5, borderColor: '#1E1E1E',
    marginRight: -4, alignItems: 'center', justifyContent: 'center',
  },
  memberDotText: { color: '#111', fontSize: 7, fontWeight: '700' },
  groupMeta: { color: '#888', fontSize: 11 },
  groupAmount: { alignItems: 'flex-end' },
  groupAmtVal: { fontSize: 14, fontWeight: '700' },
  amtGet: { color: '#F5C800' },
  amtOwe: { color: '#FF6B6B' },
  amtClear: { color: '#888' },
  groupAmtLabel: { color: '#888', fontSize: 10, marginTop: 2 },

  activitySection: { paddingHorizontal: 16, marginBottom: 20 },
  activityItem: {
    flexDirection: 'row', alignItems: 'center',
    gap: 10, paddingVertical: 10,
    borderBottomWidth: 0.5, borderBottomColor: '#1e1e1e',
  },
  actDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  actText: { color: '#888', fontSize: 12, flex: 1, lineHeight: 17 },
  actName: { color: '#f5f5f5', fontWeight: '600' },
  actTime: { color: '#555', fontSize: 10, flexShrink: 0 },
});