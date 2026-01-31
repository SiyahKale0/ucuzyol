import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { renkler } from '../styles/GenelStiller';

const BannerAdComponent = ({ style }) => {
  // Expo Go test modu - mock banner
  return (
    <View style={[styles.container, styles.mockBanner, style]}>
      <Text style={styles.mockText}>📢 Reklam Alanı</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: renkler.beyaz,
  },
  mockBanner: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    height: 50,
    width: '100%',
  },
  mockText: {
    color: '#888',
    fontSize: 12,
  },
});

export default BannerAdComponent;
