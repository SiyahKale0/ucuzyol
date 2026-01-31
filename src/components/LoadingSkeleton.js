// src/components/LoadingSkeleton.js
// Yükleme iskelet animasyonu bileşenleri

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { renkler } from '../styles/GenelStiller';

// Temel shimmer efekti
const Shimmer = ({ width, height, borderRadius = 4, style }) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, [shimmerAnim]);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.shimmer,
        {
          width,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
};

// Bilet kartı skeleton
export const BiletKartiSkeleton = () => {
  return (
    <View style={styles.biletKart}>
      {/* Header */}
      <View style={styles.biletHeader}>
        <View style={styles.biletHeaderLeft}>
          <Shimmer width={150} height={18} borderRadius={4} />
          <Shimmer width={80} height={14} borderRadius={4} style={{ marginTop: 6 }} />
        </View>
        <View style={styles.biletHeaderRight}>
          <Shimmer width={70} height={24} borderRadius={4} />
          <Shimmer width={60} height={20} borderRadius={4} style={{ marginTop: 6 }} />
        </View>
      </View>

      {/* Timeline */}
      <View style={styles.timeline}>
        <View style={styles.timelineRow}>
          <Shimmer width={10} height={10} borderRadius={5} />
          <Shimmer width={120} height={16} borderRadius={4} style={{ marginLeft: 12 }} />
          <Shimmer width={50} height={16} borderRadius={4} style={{ marginLeft: 'auto' }} />
        </View>
        <View style={[styles.timelineRow, { marginTop: 16 }]}>
          <Shimmer width={10} height={10} borderRadius={5} />
          <Shimmer width={100} height={16} borderRadius={4} style={{ marginLeft: 12 }} />
          <Shimmer width={50} height={16} borderRadius={4} style={{ marginLeft: 'auto' }} />
        </View>
      </View>

      {/* Footer */}
      <View style={styles.biletFooter}>
        <Shimmer width={100} height={14} borderRadius={4} />
        <Shimmer width={60} height={14} borderRadius={4} />
      </View>
    </View>
  );
};

// Arama sonuçları listesi skeleton
export const SonuclarListesiSkeleton = ({ count = 3 }) => {
  return (
    <View style={styles.liste}>
      {Array.from({ length: count }).map((_, index) => (
        <BiletKartiSkeleton key={index} />
      ))}
    </View>
  );
};

// Arama formu skeleton
export const AramaFormuSkeleton = () => {
  return (
    <View style={styles.aramaForm}>
      {/* Şehir inputları */}
      <View style={styles.sehirAlani}>
        <Shimmer width={'100%'} height={56} borderRadius={12} />
        <Shimmer width={'100%'} height={56} borderRadius={12} style={{ marginTop: 16 }} />
      </View>

      {/* Tarih */}
      <Shimmer width={'100%'} height={56} borderRadius={12} style={{ marginTop: 16 }} />

      {/* Mod seçici */}
      <View style={styles.modSecici}>
        <Shimmer width={'30%'} height={80} borderRadius={12} />
        <Shimmer width={'30%'} height={80} borderRadius={12} />
        <Shimmer width={'30%'} height={80} borderRadius={12} />
      </View>

      {/* Arama butonu */}
      <Shimmer width={'100%'} height={52} borderRadius={12} style={{ marginTop: 20 }} />
    </View>
  );
};

// İstatistik kartı skeleton
export const IstatistikKartiSkeleton = () => {
  return (
    <View style={styles.istatistikKart}>
      <Shimmer width={40} height={40} borderRadius={20} />
      <View style={{ marginLeft: 12, flex: 1 }}>
        <Shimmer width={60} height={20} borderRadius={4} />
        <Shimmer width={100} height={14} borderRadius={4} style={{ marginTop: 4 }} />
      </View>
    </View>
  );
};

// Genel yükleme göstergesi
export const LoadingOverlay = ({ visible, message = 'Yükleniyor...' }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: visible ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [visible, fadeAnim]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
      <View style={styles.overlayContent}>
        <View style={styles.spinner}>
          <Shimmer width={60} height={60} borderRadius={30} />
        </View>
        <Shimmer width={100} height={16} borderRadius={4} style={{ marginTop: 16 }} />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  shimmer: {
    backgroundColor: '#E5E7EB',
  },
  biletKart: {
    backgroundColor: renkler.beyaz,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  biletHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  biletHeaderLeft: {},
  biletHeaderRight: {
    alignItems: 'flex-end',
  },
  timeline: {
    marginBottom: 16,
    paddingVertical: 8,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  biletFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  liste: {
    paddingTop: 8,
  },
  aramaForm: {
    padding: 16,
  },
  sehirAlani: {},
  modSecici: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  istatistikKart: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: renkler.beyaz,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  overlayContent: {
    backgroundColor: renkler.beyaz,
    padding: 32,
    borderRadius: 20,
    alignItems: 'center',
  },
  spinner: {},
});

export { Shimmer };
export default BiletKartiSkeleton;
