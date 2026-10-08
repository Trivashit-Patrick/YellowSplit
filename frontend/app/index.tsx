import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function SplashScreen() {
  const scaleAnim = useRef(new Animated.Value(0.4)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const taglineAnim = useRef(new Animated.Value(0)).current;
  const loaderAnim = useRef(new Animated.Value(0)).current;
  const ringAnim1 = useRef(new Animated.Value(1)).current;
  const ringOpacity1 = useRef(new Animated.Value(0.6)).current;
  const ringAnim2 = useRef(new Animated.Value(1)).current;
  const ringOpacity2 = useRef(new Animated.Value(0.4)).current;
  const exitScale = useRef(new Animated.Value(1)).current;
  const exitOpacity = useRef(new Animated.Value(1)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const ringLoop = () => {
      Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(ringAnim1, { toValue: 2.2, duration: 2000, useNativeDriver: true }),
            Animated.timing(ringAnim1, { toValue: 1, duration: 0, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(ringOpacity1, { toValue: 0, duration: 2000, useNativeDriver: true }),
            Animated.timing(ringOpacity1, { toValue: 0.6, duration: 0, useNativeDriver: true }),
          ]),
        ])
      ).start();

      Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.delay(500),
            Animated.timing(ringAnim2, { toValue: 2.2, duration: 2000, useNativeDriver: true }),
            Animated.timing(ringAnim2, { toValue: 1, duration: 0, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.delay(500),
            Animated.timing(ringOpacity2, { toValue: 0, duration: 2000, useNativeDriver: true }),
            Animated.timing(ringOpacity2, { toValue: 0.4, duration: 0, useNativeDriver: true }),
          ]),
        ])
      ).start();
    };

    ringLoop();

    const shimmerLoop = () => {
      shimmerAnim.setValue(0);
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }).start(() => setTimeout(shimmerLoop, 1500));
    };
    shimmerLoop();

    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 120,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    setTimeout(() => {
      Animated.timing(taglineAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }, 600);

    setTimeout(() => {
      Animated.timing(loaderAnim, {
        toValue: 1,
        duration: 1400,
        easing: Easing.linear,
        useNativeDriver: false,
      }).start();
    }, 800);

    setTimeout(async () => {
      try {
        const { useAuthStore } = await import('../src/store/authStore');
        const store = useAuthStore.getState();
        await store.initialize();

        Animated.parallel([
          Animated.timing(exitScale, {
            toValue: 1.4,
            duration: 500,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(exitOpacity, {
            toValue: 0,
            duration: 450,
            useNativeDriver: true,
          }),
        ]).start(() => {
          const currentStore = useAuthStore.getState();
          if (currentStore.user) {
            router.replace('/(tabs)');
          } else {
            router.replace('/(auth)/login');
          }
        });
      } catch (error) {
        Animated.parallel([
          Animated.timing(exitScale, {
            toValue: 1.4,
            duration: 500,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(exitOpacity, {
            toValue: 0,
            duration: 450,
            useNativeDriver: true,
          }),
        ]).start(() => {
          router.replace('/(auth)/login');
        });
      }
    }, 2600);
  }, []);

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-60, 120],
  });

  const loaderWidth = loaderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const taglineTranslate = taglineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [20, 0],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ scale: exitScale }],
          opacity: exitOpacity,
        },
      ]}
    >
      <StatusBar style="light" />

      {/* Pulse rings */}
      <Animated.View style={[
        styles.ring,
        {
          transform: [{ scale: ringAnim1 }],
          opacity: ringOpacity1,
        },
      ]} />
      <Animated.View style={[
        styles.ring,
        styles.ring2,
        {
          transform: [{ scale: ringAnim2 }],
          opacity: ringOpacity2,
        },
      ]} />

      {/* Logo */}
      <Animated.View style={[
        styles.logoWrap,
        {
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        },
      ]}>
        {/* Icon */}
        <View style={styles.iconWrap}>
          <Animated.View style={[
            styles.iconShimmer,
            { transform: [{ translateX: shimmerTranslate }] },
          ]} />
          <Text style={styles.iconText}>₹</Text>
        </View>

        {/* App name */}
        <View style={styles.nameRow}>
          <Text style={styles.nameYellow}>Yellow</Text>
          <Text style={styles.nameWhite}>Split</Text>
        </View>

        {/* Tagline */}
        <Animated.Text style={[
          styles.tagline,
          {
            opacity: taglineAnim,
            transform: [{ translateY: taglineTranslate }],
          },
        ]}>
          Split smarter · Pay faster
        </Animated.Text>
      </Animated.View>

      {/* Loader bar */}
      <View style={styles.loaderTrack}>
        <Animated.View style={[styles.loaderFill, { width: loaderWidth }]} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 1,
    borderColor: 'rgba(245,200,0,0.3)',
  },
  ring2: {
    width: 220,
    height: 220,
    borderRadius: 110,
    borderColor: 'rgba(245,200,0,0.15)',
  },
  logoWrap: {
    alignItems: 'center',
    gap: 16,
  },
  iconWrap: {
    width: 90,
    height: 90,
    borderRadius: 28,
    backgroundColor: '#F5C800',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  iconShimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  iconText: {
    fontSize: 44,
    fontWeight: '800',
    color: '#111',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  nameYellow: {
    fontSize: 36,
    fontWeight: '800',
    color: '#F5C800',
    letterSpacing: -1,
  },
  nameWhite: {
    fontSize: 36,
    fontWeight: '800',
    color: '#F5F5F5',
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 13,
    color: '#555',
    fontWeight: '500',
    letterSpacing: 1,
  },
  loaderTrack: {
    position: 'absolute',
    bottom: 80,
    width: 60,
    height: 4,
    backgroundColor: '#1E1E1E',
    borderRadius: 2,
    overflow: 'hidden',
  },
  loaderFill: {
    height: '100%',
    backgroundColor: '#F5C800',
    borderRadius: 2,
  },
});
