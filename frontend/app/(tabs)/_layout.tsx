import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';
import { router } from 'expo-router';

export default function TabLayout() {
  const { profile, user } = useAuthStore();
  const spinValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const spin = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    );
    spin.start();
    return () => spin.stop();
  }, []);

  const getInitials = () => {
    if (profile?.full_name) {
      return profile.full_name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return (user?.email || 'U').slice(0, 2).toUpperCase();
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#F5C800',
        tabBarInactiveTintColor: '#555555',
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarItemStyle: styles.tabBarItem,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={22} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="groups"
        options={{
          title: 'Groups',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'people' : 'people-outline'} size={22} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="add"
        options={{
          title: '',
          tabBarItemStyle: styles.fabTabItem,
          tabBarIcon: () => (
            <View style={styles.fabWrapper}>
              <View style={styles.fab}>
                <Ionicons name="add" size={28} color="#111111" />
              </View>
            </View>
          ),
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            router.push('/add-expense');
          },
        }}
      />

      <Tabs.Screen
        name="activity"
        options={{
          title: 'Activity',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'notifications' : 'notifications-outline'} size={22} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.avatarCircle, focused && styles.avatarCircleActive]}>
              <Text style={[styles.avatarText, focused && styles.avatarTextActive]}>
                {getInitials()}
              </Text>
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="analytics"
        options={{
          title: '',
          tabBarItemStyle: styles.hiddenTab,
          tabBarIcon: () => <View style={{ width: 0, height: 0 }} />,
        }}
      />

      <Tabs.Screen
        name="pro"
        options={{
          title: '',
          tabBarItemStyle: styles.hiddenTab,
          tabBarIcon: () => <View style={{ width: 0, height: 0 }} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#1a1a1a',
    borderTopWidth: 0.5,
    borderTopColor: '#2a2a2a',
    height: 65,
    paddingBottom: 10,
    paddingTop: 6,
    paddingHorizontal: 0,
    elevation: 8,
  },
  tabBarItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabBarLabel: { fontSize: 11, fontWeight: '500', marginTop: 2 },
  fabTabItem: { flex: 1, alignItems: 'center', justifyContent: 'center', overflow: 'visible' },
  fabWrapper: { alignItems: 'center', justifyContent: 'center', marginBottom: 22 },
  fab: {
    width: 54, height: 54, borderRadius: 16,
    backgroundColor: '#F5C800', alignItems: 'center', justifyContent: 'center', elevation: 8,
  },
  hiddenTab: { display: 'none', width: 0, height: 0, overflow: 'hidden' },
  avatarCircle: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: '#F5C800', alignItems: 'center', justifyContent: 'center',
  },
  avatarCircleActive: { borderWidth: 2, borderColor: '#F5C800', backgroundColor: '#1a1a1a' },
  avatarText: { color: '#111111', fontSize: 11, fontWeight: '700' },
  avatarTextActive: { color: '#F5C800' },
});