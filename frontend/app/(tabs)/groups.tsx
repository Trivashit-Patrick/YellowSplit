import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { useDataStore } from '../../src/store/dataStore';
import { supabase } from '../../src/lib/supabase';

export default function GroupsScreen() {
  const { user } = useAuthStore();
  const { groups, fetchGroups } = useDataStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user?.id) fetchGroups(user.id);
  }, [user?.id]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (user?.id) await fetchGroups(user.id);
    setRefreshing(false);
  };

  const handleDeleteGroup = (groupId: string, groupName: string) => {
    Alert.alert(
      'Delete Group',
      `Delete "${groupName}"? All data will be permanently deleted.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            try {
              const { data: expData } = await supabase.from('expenses').select('id').eq('group_id', groupId);
              const expIds = expData?.map(e => e.id) || [];
              if (expIds.length > 0) await supabase.from('expense_splits').delete().in('expense_id', expIds);
              await supabase.from('expenses').delete().eq('group_id', groupId);
              await supabase.from('settlements').delete().eq('group_id', groupId);
              await supabase.from('activities').delete().eq('group_id', groupId);
              await supabase.from('group_members').delete().eq('group_id', groupId);
              await supabase.from('groups').delete().eq('id', groupId);
              if (user?.id) await fetchGroups(user.id);
            } catch {
              Alert.alert('Error', 'Failed to delete group.');
            }
          },
        },
      ]
    );
  };

  const totalOwe = groups.filter(g => g.userBalance < 0).reduce((s, g) => s + Math.abs(g.userBalance), 0);
  const totalGet = groups.filter(g => g.userBalance > 0).reduce((s, g) => s + g.userBalance, 0);

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
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>
              Your <Text style={styles.headerYellow}>Groups</Text>
            </Text>
            <Text style={styles.headerSub}>
              {groups.length} active group{groups.length !== 1 ? 's' : ''}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.newGroupBtn}
            onPress={() => router.push('/new-group')}
          >
            <Ionicons name="add" size={18} color="#111" />
            <Text style={styles.newGroupTxt}>New</Text>
          </TouchableOpacity>
        </View>

        {/* Summary pills */}
        {groups.length > 0 && (
          <View style={styles.summaryRow}>
            <View style={styles.summaryPill}>
              <Text style={styles.summaryLbl}>Total groups</Text>
              <Text style={styles.summaryVal}>{groups.length}</Text>
            </View>
            <View style={styles.summaryPill}>
              <Text style={styles.summaryLbl}>You owe</Text>
              <Text style={[styles.summaryVal, { color: '#FF6B6B' }]}>
                ₹{Math.round(totalOwe).toLocaleString('en-IN')}
              </Text>
            </View>
            <View style={styles.summaryPill}>
              <Text style={styles.summaryLbl}>You get</Text>
              <Text style={[styles.summaryVal, { color: '#F5C800' }]}>
                ₹{Math.round(totalGet).toLocaleString('en-IN')}
              </Text>
            </View>
          </View>
        )}

        {/* Groups list */}
        {groups.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="people-outline" size={48} color="#555" />
            <Text style={styles.emptyTitle}>No groups yet</Text>
            <Text style={styles.emptySub}>Create a group to start splitting expenses</Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => router.push('/new-group')}
            >
              <Text style={styles.emptyBtnTxt}>Create your first group</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.groupsList}>
            {groups.map((group) => (
              <TouchableOpacity
                key={group.id}
                style={[
                  styles.groupCard,
                  group.userBalance !== 0 && styles.groupCardActive,
                ]}
                onPress={() => router.push(`/group/${group.id}`)}
                onLongPress={() => handleDeleteGroup(group.id, group.name)}
                delayLongPress={800}
                activeOpacity={0.8}
              >
                {group.hasNewActivity && (
                  <View style={styles.newBadge}>
                    <Text style={styles.newBadgeTxt}>new</Text>
                  </View>
                )}

                <View style={styles.groupLeft}>
                  <View style={styles.groupEmoji}>
                    <Text style={styles.groupEmojiTxt}>{group.emoji}</Text>
                  </View>
                  <View style={styles.groupInfo}>
                    <Text style={styles.groupName}>{group.name}</Text>
                    <View style={styles.membersRow}>
                      {group.members.slice(0, 4).map((m, i) => (
                        <View
                          key={(m as any).id || i}
                          style={[
                            styles.memberDot,
                            { backgroundColor: ['#F5C800', '#FF6B6B', '#64B5F6', '#CE93D8'][i % 4] },
                          ]}
                        >
                          <Text style={styles.memberDotTxt}>
                            {((m as any).profile?.full_name || '?')[0].toUpperCase()}
                          </Text>
                        </View>
                      ))}
                      {group.memberCount > 4 && (
                        <View style={[styles.memberDot, { backgroundColor: '#2c2c2c' }]}>
                          <Text style={[styles.memberDotTxt, { color: '#888' }]}>
                            +{group.memberCount - 4}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.groupMeta}>
                      {group.memberCount} members · {group.expenseCount} expenses
                    </Text>
                  </View>
                </View>

                <View style={styles.groupRight}>
                  <Text style={[
                    styles.groupAmt,
                    group.userBalance > 0 ? styles.amtGet :
                    group.userBalance < 0 ? styles.amtOwe : styles.amtClear,
                  ]}>
                    {group.userBalance > 0 ? '+' : group.userBalance < 0 ? '-' : ''}
                    ₹{Math.abs(Math.round(group.userBalance)).toLocaleString('en-IN')}
                  </Text>
                  <Text style={styles.groupAmtLbl}>
                    {group.userBalance > 0 ? 'you get back' :
                     group.userBalance < 0 ? 'you owe' : 'all clear'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Create new group button */}
        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => router.push('/new-group')}
        >
          <Ionicons name="add-circle-outline" size={18} color="#F5C800" />
          <Text style={styles.createBtnTxt}>Create new group</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111111' },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 100 },

  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', paddingHorizontal: 20,
    paddingTop: 8, paddingBottom: 16,
  },
  headerTitle: { color: '#f5f5f5', fontSize: 26, fontWeight: '700' },
  headerYellow: { color: '#F5C800' },
  headerSub: { color: '#555', fontSize: 12, marginTop: 2 },
  newGroupBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#F5C800', borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 8,
  },
  newGroupTxt: { color: '#111', fontSize: 13, fontWeight: '700' },

  summaryRow: {
    flexDirection: 'row', gap: 8,
    paddingHorizontal: 16, marginBottom: 16,
  },
  summaryPill: {
    flex: 1, backgroundColor: '#1E1E1E', borderRadius: 12,
    padding: 10, alignItems: 'center',
    borderWidth: 0.5, borderColor: '#2c2c2c',
  },
  summaryLbl: { color: '#555', fontSize: 10, marginBottom: 3 },
  summaryVal: { color: '#f5f5f5', fontSize: 15, fontWeight: '700' },

  emptyCard: {
    margin: 20, backgroundColor: '#1E1E1E', borderRadius: 22,
    padding: 40, alignItems: 'center',
    borderWidth: 0.5, borderColor: '#2c2c2c',
  },
  emptyTitle: { color: '#f5f5f5', fontSize: 18, fontWeight: '700', marginTop: 16, marginBottom: 6 },
  emptySub: { color: '#555', fontSize: 13, textAlign: 'center', marginBottom: 20 },
  emptyBtn: {
    backgroundColor: '#F5C800', borderRadius: 12,
    paddingHorizontal: 20, paddingVertical: 10,
  },
  emptyBtnTxt: { color: '#111', fontSize: 14, fontWeight: '700' },

  groupsList: { paddingHorizontal: 16, gap: 10, flexDirection: 'column' },
  groupCard: {
    backgroundColor: '#1E1E1E', borderRadius: 18, padding: 14,
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 0.5, borderColor: '#2c2c2c',
    position: 'relative', overflow: 'hidden',
  },
  groupCardActive: { borderColor: '#F5C800', borderWidth: 1 },
  newBadge: {
    position: 'absolute', top: 10, right: 12,
    backgroundColor: '#F5C800', paddingHorizontal: 6,
    paddingVertical: 2, borderRadius: 99,
  },
  newBadgeTxt: { color: '#111', fontSize: 9, fontWeight: '700' },
  groupLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  groupEmoji: {
    width: 46, height: 46, borderRadius: 14,
    backgroundColor: '#F5C800', alignItems: 'center',
    justifyContent: 'center', flexShrink: 0,
  },
  groupEmojiTxt: { fontSize: 22 },
  groupInfo: { flex: 1 },
  groupName: { color: '#f5f5f5', fontSize: 15, fontWeight: '600', marginBottom: 4 },
  membersRow: { flexDirection: 'row', marginBottom: 3 },
  memberDot: {
    width: 18, height: 18, borderRadius: 9,
    borderWidth: 1.5, borderColor: '#1E1E1E',
    marginRight: -4, alignItems: 'center', justifyContent: 'center',
  },
  memberDotTxt: { color: '#111', fontSize: 7, fontWeight: '700' },
  groupMeta: { color: '#555', fontSize: 11 },
  groupRight: { alignItems: 'flex-end', flexShrink: 0 },
  groupAmt: { fontSize: 15, fontWeight: '700' },
  amtGet: { color: '#F5C800' },
  amtOwe: { color: '#FF6B6B' },
  amtClear: { color: '#555' },
  groupAmtLbl: { color: '#555', fontSize: 10, marginTop: 2 },

  createBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    justifyContent: 'center', marginTop: 16, padding: 14,
    marginHorizontal: 16, backgroundColor: '#1E1E1E',
    borderRadius: 14, borderWidth: 1,
    borderStyle: 'dashed', borderColor: '#F5C800',
  },
  createBtnTxt: { color: '#F5C800', fontSize: 14, fontWeight: '600' },
});