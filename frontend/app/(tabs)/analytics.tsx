import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Svg, { G, Path, Circle, Text as SvgText } from 'react-native-svg';
import { useAuthStore } from '../../src/store/authStore';
import { useDataStore } from '../../src/store/dataStore';

const { width } = Dimensions.get('window');

const CATEGORY_COLORS: Record<string, string> = {
  food: '#F5C800',
  travel: '#64B5F6',
  rent: '#CE93D8',
  utilities: '#4CAF50',
  other: '#FF8A65',
};

const CATEGORY_ICONS: Record<string, string> = {
  food: 'restaurant',
  travel: 'car',
  rent: 'home',
  utilities: 'flash',
  other: 'ellipsis-horizontal',
};

const PERIODS = ['Week', 'Month', 'Year'];

function PieChart({ data, size = 180 }: { data: { label: string; value: number; color: string }[]; size?: number }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return null;

  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 16;

  let startAngle = -Math.PI / 2;
  const slices = data.map(d => {
    const angle = (d.value / total) * 2 * Math.PI;
    const endAngle = startAngle + angle;
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const largeArc = angle > Math.PI ? 1 : 0;
    const path = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    const slice = { ...d, path, startAngle, endAngle };
    startAngle = endAngle;
    return slice;
  });

  return (
    <Svg width={size} height={size}>
      <G>
        {slices.map((slice, i) => (
          <Path key={i} d={slice.path} fill={slice.color} />
        ))}
        <Circle cx={cx} cy={cy} r={r * 0.55} fill="#111" />
      </G>
    </Svg>
  );
}

export default function AnalyticsScreen() {
  const { user } = useAuthStore();
  const { groups, fetchGroups, getAnalytics } = useDataStore();
  const [period, setPeriod] = useState('Month');
  const [analytics, setAnalytics] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchGroups(user.id);
      loadAnalytics();
    }
  }, [user?.id, period]);

  const loadAnalytics = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const p = period.toLowerCase() as 'week' | 'month' | 'year';
      const data = await getAnalytics(user.id, p);
      setAnalytics(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAnalytics();
    setRefreshing(false);
  };

  const totalOwe = groups.filter(g => g.userBalance < 0).reduce((s, g) => s + Math.abs(g.userBalance), 0);
  const totalGet = groups.filter(g => g.userBalance > 0).reduce((s, g) => s + g.userBalance, 0);
  const totalSpent = analytics?.totalSpent || 0;
  const categoryBreakdown: { category: string; amount: number; percentage: number }[] =
    analytics?.categoryBreakdown || [];

  const pieData = categoryBreakdown
    .filter(c => c.amount > 0)
    .map(c => ({
      label: c.category,
      value: c.amount,
      color: CATEGORY_COLORS[c.category] || '#888',
    }));

  const topCategory = categoryBreakdown.length > 0
    ? categoryBreakdown.reduce((a, b) => a.amount > b.amount ? a : b)
    : null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F5C800" />}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>
            Spending <Text style={styles.titleYellow}>Analytics</Text>
          </Text>
        </View>

        {/* Period Toggle */}
        <View style={styles.periodRow}>
          {PERIODS.map(p => (
            <TouchableOpacity
              key={p}
              style={[styles.periodBtn, period === p && styles.periodBtnActive]}
              onPress={() => setPeriod(p)}
            >
              <Text style={[styles.periodTxt, period === p && styles.periodTxtActive]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Hero Spend Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroLeft}>
            <Text style={styles.heroLabel}>Total spent this {period.toLowerCase()}</Text>
            <Text style={styles.heroAmt}>₹{Math.round(totalSpent).toLocaleString('en-IN')}</Text>
            <Text style={styles.heroSub}>Across {groups.length} group{groups.length !== 1 ? 's' : ''}</Text>
          </View>
          <View style={styles.heroRight}>
            <View style={styles.heroPill}>
              <Text style={styles.heroPillLbl}>You owe</Text>
              <Text style={[styles.heroPillVal, { color: '#FF6B6B' }]}>
                ₹{Math.round(totalOwe).toLocaleString('en-IN')}
              </Text>
            </View>
            <View style={styles.heroPill}>
              <Text style={styles.heroPillLbl}>You get</Text>
              <Text style={[styles.heroPillVal, { color: '#F5C800' }]}>
                ₹{Math.round(totalGet).toLocaleString('en-IN')}
              </Text>
            </View>
          </View>
        </View>

        {/* Pie Chart + Legend */}
        {pieData.length > 0 ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Spending by category</Text>
            <View style={styles.pieSection}>
              <View style={styles.pieWrap}>
                <PieChart data={pieData} size={170} />
                <View style={styles.pieCenter}>
                  <Text style={styles.pieCenterLbl}>top</Text>
                  <Text style={styles.pieCenterVal}>
                    {topCategory ? topCategory.category : '—'}
                  </Text>
                </View>
              </View>
              <View style={styles.legend}>
                {pieData.map((d, i) => (
                  <View key={i} style={styles.legendRow}>
                    <View style={[styles.legendDot, { backgroundColor: d.color }]} />
                    <Text style={styles.legendLabel}>
                      {d.label.charAt(0).toUpperCase() + d.label.slice(1)}
                    </Text>
                    <Text style={styles.legendPct}>
                      {Math.round((d.value / pieData.reduce((s, x) => s + x.value, 0)) * 100)}%
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.emptyChart}>
            <Ionicons name="pie-chart-outline" size={40} color="#333" />
            <Text style={styles.emptyChartTxt}>No spending data for this period</Text>
          </View>
        )}

        {/* Category Breakdown */}
        {categoryBreakdown.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Category breakdown</Text>
            {categoryBreakdown
              .filter(c => c.amount > 0)
              .sort((a, b) => b.amount - a.amount)
              .map((cat, i) => (
                <View key={i} style={styles.catRow}>
                  <View style={[styles.catIcon, { backgroundColor: `${CATEGORY_COLORS[cat.category]}18` }]}>
                    <Ionicons
                      name={CATEGORY_ICONS[cat.category] as any}
                      size={16}
                      color={CATEGORY_COLORS[cat.category] || '#888'}
                    />
                  </View>
                  <View style={styles.catInfo}>
                    <View style={styles.catTopRow}>
                      <Text style={styles.catName}>
                        {cat.category.charAt(0).toUpperCase() + cat.category.slice(1)}
                      </Text>
                      <Text style={styles.catAmt}>
                        ₹{Math.round(cat.amount).toLocaleString('en-IN')}
                      </Text>
                    </View>
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.barFill,
                          {
                            width: `${Math.round(cat.percentage)}%` as any,
                            backgroundColor: CATEGORY_COLORS[cat.category] || '#F5C800',
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.catPct}>{Math.round(cat.percentage)}% of total</Text>
                  </View>
                </View>
              ))}
          </View>
        )}

        {/* Group Balances */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Group balances</Text>
          {groups.length === 0 ? (
            <Text style={styles.emptyTxt}>No groups yet</Text>
          ) : (
            groups.map((group, i) => (
              <View
                key={group.id}
                style={[styles.groupRow, i === groups.length - 1 && { borderBottomWidth: 0 }]}
              >
                <View style={styles.groupEmoji}>
                  <Text style={styles.groupEmojiTxt}>{group.emoji}</Text>
                </View>
                <View style={styles.groupInfo}>
                  <Text style={styles.groupName}>{group.name}</Text>
                  <Text style={styles.groupMeta}>{group.expenseCount} expenses</Text>
                </View>
                <Text style={[
                  styles.groupAmt,
                  group.userBalance > 0 ? styles.amtGet :
                  group.userBalance < 0 ? styles.amtOwe : styles.amtClear,
                ]}>
                  {group.userBalance > 0 ? '+' : group.userBalance < 0 ? '-' : ''}
                  ₹{Math.abs(Math.round(group.userBalance)).toLocaleString('en-IN')}
                </Text>
              </View>
            ))
          )}
        </View>

        {/* Quick Stats */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Ionicons name="people-outline" size={22} color="#F5C800" />
            <Text style={styles.statVal}>{groups.length}</Text>
            <Text style={styles.statLbl}>Active groups</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="receipt-outline" size={22} color="#64B5F6" />
            <Text style={styles.statVal}>
              {groups.reduce((s, g) => s + g.expenseCount, 0)}
            </Text>
            <Text style={styles.statLbl}>Total expenses</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="checkmark-circle-outline" size={22} color="#4CAF50" />
            <Text style={styles.statVal}>
              {groups.filter(g => Math.abs(g.userBalance) < 1).length}
            </Text>
            <Text style={styles.statLbl}>Settled groups</Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111111' },
  scrollContent: { paddingBottom: 100 },

  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 14 },
  title: { color: '#f5f5f5', fontSize: 24, fontWeight: '700' },
  titleYellow: { color: '#F5C800' },

  periodRow: {
    flexDirection: 'row', marginHorizontal: 16,
    backgroundColor: '#1E1E1E', borderRadius: 12,
    padding: 4, marginBottom: 14, borderWidth: 0.5, borderColor: '#2c2c2c',
  },
  periodBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
  periodBtnActive: { backgroundColor: '#F5C800' },
  periodTxt: { color: '#555', fontSize: 13, fontWeight: '600' },
  periodTxtActive: { color: '#111' },

  heroCard: {
    marginHorizontal: 16, backgroundColor: '#1E1E1E',
    borderRadius: 18, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: '#F5C800',
    flexDirection: 'row', justifyContent: 'space-between',
  },
  heroLeft: { flex: 1 },
  heroLabel: { color: '#7a6000', fontSize: 11, marginBottom: 4 },
  heroAmt: { color: '#F5C800', fontSize: 30, fontWeight: '800', letterSpacing: -1 },
  heroSub: { color: '#555', fontSize: 11, marginTop: 3 },
  heroRight: { justifyContent: 'center', gap: 8 },
  heroPill: {
    backgroundColor: '#111', borderRadius: 10,
    padding: 8, alignItems: 'center', minWidth: 80,
  },
  heroPillLbl: { color: '#555', fontSize: 10 },
  heroPillVal: { fontSize: 14, fontWeight: '700', marginTop: 2 },

  card: {
    marginHorizontal: 16, backgroundColor: '#1E1E1E',
    borderRadius: 18, padding: 16, marginBottom: 12,
    borderWidth: 0.5, borderColor: '#2c2c2c',
  },
  cardTitle: { color: '#f5f5f5', fontSize: 14, fontWeight: '700', marginBottom: 14 },

  pieSection: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  pieWrap: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  pieCenter: { position: 'absolute', alignItems: 'center' },
  pieCenterLbl: { color: '#555', fontSize: 9, textTransform: 'uppercase', letterSpacing: 1 },
  pieCenterVal: { color: '#f5f5f5', fontSize: 13, fontWeight: '700', textTransform: 'capitalize' },
  legend: { flex: 1, gap: 8 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  legendLabel: { color: '#f5f5f5', fontSize: 12, flex: 1, textTransform: 'capitalize' },
  legendPct: { color: '#888', fontSize: 11 },

  emptyChart: {
    marginHorizontal: 16, backgroundColor: '#1E1E1E',
    borderRadius: 18, padding: 32, marginBottom: 12,
    alignItems: 'center', borderWidth: 0.5, borderColor: '#2c2c2c',
  },
  emptyChartTxt: { color: '#555', fontSize: 13, marginTop: 10 },

  catRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  catIcon: {
    width: 38, height: 38, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  catInfo: { flex: 1 },
  catTopRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  catName: { color: '#f5f5f5', fontSize: 13, fontWeight: '600' },
  catAmt: { color: '#f5f5f5', fontSize: 13, fontWeight: '700' },
  barTrack: {
    height: 4, backgroundColor: '#2c2c2c',
    borderRadius: 2, overflow: 'hidden', marginBottom: 3,
  },
  barFill: { height: '100%', borderRadius: 2 },
  catPct: { color: '#555', fontSize: 10 },

  groupRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: '#2c2c2c',
  },
  groupEmoji: {
    width: 36, height: 36, borderRadius: 11,
    backgroundColor: '#F5C800', alignItems: 'center', justifyContent: 'center',
  },
  groupEmojiTxt: { fontSize: 18 },
  groupInfo: { flex: 1 },
  groupName: { color: '#f5f5f5', fontSize: 13, fontWeight: '600' },
  groupMeta: { color: '#555', fontSize: 11, marginTop: 1 },
  groupAmt: { fontSize: 14, fontWeight: '700' },
  amtGet: { color: '#F5C800' },
  amtOwe: { color: '#FF6B6B' },
  amtClear: { color: '#555' },

  statsGrid: {
    flexDirection: 'row', gap: 10,
    marginHorizontal: 16, marginBottom: 12,
  },
  statCard: {
    flex: 1, backgroundColor: '#1E1E1E', borderRadius: 16,
    padding: 14, alignItems: 'center', gap: 6,
    borderWidth: 0.5, borderColor: '#2c2c2c',
  },
  statVal: { color: '#f5f5f5', fontSize: 22, fontWeight: '800' },
  statLbl: { color: '#555', fontSize: 10, textAlign: 'center' },
  emptyTxt: { color: '#555', fontSize: 12 },
});