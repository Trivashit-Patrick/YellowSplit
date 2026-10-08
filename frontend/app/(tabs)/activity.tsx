import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';
import { useDataStore } from '../../src/store/dataStore';
import { LoadingSpinner } from '../../src/components/ui';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'expense_added', label: 'Expenses' },
  { key: 'settlement', label: 'Settlements' },
  { key: 'group_created', label: 'Groups' },
  { key: 'member_joined', label: 'Members' },
];

const ACTION_COLORS: Record<string, string> = {
  expense_added: '#F5C800',
  settlement: '#4CAF50',
  group_created: '#64B5F6',
  member_joined: '#CE93D8',
};

export default function ActivityScreen() {
  const { user } = useAuthStore();
  const { activities, fetchActivities, markActivityRead, isLoading } = useDataStore();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [showBanner, setShowBanner] = useState(true);

  useEffect(() => {
    if (user?.id) fetchActivities(user.id);
  }, [user?.id]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (user?.id) await fetchActivities(user.id);
    setRefreshing(false);
  };

  const filteredActivities = filter === 'all'
    ? activities
    : activities.filter((a: any) => a.action_type === filter);

  const groupByDate = (items: any[]) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const groups: Record<string, any[]> = { Today: [], Yesterday: [], 'This week': [], Earlier: [] };
    items.forEach(a => {
      const d = new Date(a.created_at);
      if (d.toDateString() === today.toDateString()) groups.Today.push(a);
      else if (d.toDateString() === yesterday.toDateString()) groups.Yesterday.push(a);
      else if (d > weekAgo) groups['This week'].push(a);
      else groups.Earlier.push(a);
    });
    return groups;
  };

  const grouped = groupByDate(filteredActivities);
  const unreadCount = activities.filter((a: any) => !a.is_read).length;

  const getInitials = (name: string) =>
    (name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const getAvatarColor = (name: string) => {
    const colors = ['#F5C800', '#FF6B6B', '#64B5F6', '#CE93D8', '#4CAF50', '#FF8A65'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  if (isLoading && activities.length === 0) {
    return <View style={styles.loadingContainer}><LoadingSpinner size="large" /></View>;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F5C800" />}
      >
        {/* Header */}
        <View style={styles.topBar}>
          <Text style={styles.pageTitle}>
            Activity <Text style={styles.pageTitleYellow}>Feed</Text>
          </Text>
          <TouchableOpacity style={styles.bellBtn}>
            <Ionicons name="notifications-outline" size={16} color="#f5f5f5" />
            {unreadCount > 0 && <View style={styles.bellDot} />}
          </TouchableOpacity>
        </View>

        {/* Notification Banner */}
        {showBanner && unreadCount > 0 && (
          <View style={styles.notifBanner}>
            <View style={styles.notifIcon}>
              <Ionicons name="flash" size={16} color="#111" />
            </View>
            <Text style={styles.notifText}>
              You have <Text style={styles.notifHighlight}>{unreadCount} new</Text> activities
            </Text>
            <TouchableOpacity onPress={() => setShowBanner(false)}>
              <Text style={styles.notifClose}>×</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {FILTERS.map(f => (
            <TouchableOpacity
              key={f.key}
              style={[styles.fChip, filter === f.key && styles.fChipActive]}
              onPress={() => setFilter(f.key)}
            >
              <Text style={[styles.fChipText, filter === f.key && styles.fChipTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Activity List */}
        {filteredActivities.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="time-outline" size={40} color="#555" />
            <Text style={styles.emptyText}>No activities yet</Text>
            <Text style={styles.emptySubtext}>Activities from your groups will appear here</Text>
          </View>
        ) : (
          Object.entries(grouped).map(([group, items]) => {
            if (!items || items.length === 0) return null;
            return (
              <View key={group} style={styles.actList}>
                <Text style={styles.actGroupLabel}>{group}</Text>
                {items.map((activity: any, i: number) => {
                  const name = activity.profile?.full_name || activity.profile?.email || 'Someone';
                  const avatarColor = getAvatarColor(name);
                  const actionColor = ACTION_COLORS[activity.action_type] || '#888';
                  return (
                    <TouchableOpacity
                      key={activity.id}
                      style={[styles.actItem, i === items.length - 1 && { borderBottomWidth: 0 }]}
                      onPress={() => markActivityRead(activity.id)}
                      activeOpacity={0.7}
                    >
                      {!activity.is_read && <View style={styles.unreadDot} />}
                      <View style={[styles.actAv, { backgroundColor: avatarColor }]}>
                        <Text style={styles.actAvText}>{getInitials(name)}</Text>
                        <View style={[styles.actAvBadge, { backgroundColor: actionColor }]}>
                          <Ionicons
                            name={
                              activity.action_type === 'expense_added' ? 'receipt' :
                              activity.action_type === 'settlement' ? 'checkmark' :
                              activity.action_type === 'group_created' ? 'people' : 'person-add'
                            }
                            size={6}
                            color="#111"
                          />
                        </View>
                      </View>
                      <View style={styles.actBody}>
                        <Text style={styles.actTitle}>
                          <Text style={styles.actName}>{name.split(' ')[0]}</Text>
                          {' '}{activity.description}
                        </Text>
                        <Text style={styles.actMeta}>
                          {(activity as any).group?.name || 'YellowSplit'} · {formatTime(activity.created_at)}
                        </Text>
                      </View>
                      <View style={styles.actRight}>
                        <Text style={[
                          styles.actAmt,
                          activity.action_type === 'expense_added' ? styles.amtNeg :
                          activity.action_type === 'settlement' ? styles.amtPos : styles.amtNeu,
                        ]}>
                          {activity.action_type === 'expense_added' ? '-₹' :
                           activity.action_type === 'settlement' ? '+₹' : ''}
                          {activity.action_type !== 'group_created' && activity.action_type !== 'member_joined' ? '—' : ''}
                        </Text>
                        <Text style={styles.actTime}>{formatTime(activity.created_at)}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function formatTime(dateString: string): string {
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

  topBar: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12,
  },
  pageTitle: { color: '#f5f5f5', fontSize: 22, fontWeight: '700' },
  pageTitleYellow: { color: '#F5C800' },
  bellBtn: {
    width: 34, height: 34, backgroundColor: '#1E1E1E',
    borderRadius: 10, borderWidth: 0.5, borderColor: '#2c2c2c',
    alignItems: 'center', justifyContent: 'center', position: 'relative',
  },
  bellDot: {
    position: 'absolute', top: 6, right: 6,
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: '#F5C800', borderWidth: 1.5, borderColor: '#1E1E1E',
  },

  notifBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 16, marginBottom: 12,
    backgroundColor: '#1E1E1E', borderRadius: 14,
    padding: 12, borderWidth: 0.5, borderColor: '#F5C800',
  },
  notifIcon: {
    width: 32, height: 32, backgroundColor: '#F5C800',
    borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  notifText: { color: '#f5f5f5', fontSize: 12, flex: 1 },
  notifHighlight: { color: '#F5C800', fontWeight: '600' },
  notifClose: { color: '#555', fontSize: 18 },

  filterRow: { paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  fChip: {
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 99, backgroundColor: '#1E1E1E',
    borderWidth: 0.5, borderColor: '#2c2c2c',
  },
  fChipActive: { backgroundColor: '#F5C800', borderColor: '#F5C800' },
  fChipText: { color: '#888', fontSize: 12, fontWeight: '600' },
  fChipTextActive: { color: '#111' },

  emptyCard: {
    margin: 16, backgroundColor: '#1E1E1E',
    borderRadius: 18, padding: 40, alignItems: 'center',
    borderWidth: 0.5, borderColor: '#2c2c2c',
  },
  emptyText: { color: '#f5f5f5', fontSize: 14, fontWeight: '500', marginTop: 12 },
  emptySubtext: { color: '#555', fontSize: 12, marginTop: 4, textAlign: 'center' },

  actList: { paddingHorizontal: 16, marginBottom: 8 },
  actGroupLabel: {
    color: '#555', fontSize: 11, fontWeight: '600',
    letterSpacing: 0.5, paddingVertical: 10, textTransform: 'uppercase',
  },
  actItem: {
    flexDirection: 'row', alignItems: 'flex-start',
    gap: 12, paddingVertical: 12,
    borderBottomWidth: 0.5, borderBottomColor: '#1e1e1e', position: 'relative',
  },
  unreadDot: {
    position: 'absolute', right: 0, top: 16,
    width: 7, height: 7, borderRadius: 4, backgroundColor: '#F5C800',
  },
  actAv: {
    width: 40, height: 40, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, position: 'relative',
  },
  actAvText: { color: '#111', fontSize: 14, fontWeight: '700' },
  actAvBadge: {
    position: 'absolute', bottom: -2, right: -2,
    width: 14, height: 14, borderRadius: 7,
    borderWidth: 2, borderColor: '#111',
    alignItems: 'center', justifyContent: 'center',
  },
  actBody: { flex: 1 },
  actTitle: { color: '#f5f5f5', fontSize: 13, fontWeight: '500', lineHeight: 18, marginBottom: 3 },
  actName: { color: '#F5C800' },
  actMeta: { color: '#555', fontSize: 11 },
  actRight: { alignItems: 'flex-end', flexShrink: 0 },
  actAmt: { fontSize: 13, fontWeight: '700' },
  amtPos: { color: '#F5C800' },
  amtNeg: { color: '#FF6B6B' },
  amtNeu: { color: '#555' },
  actTime: { color: '#444', fontSize: 10, marginTop: 3 },
});