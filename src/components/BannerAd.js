import React, { useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

// Banner reklam birimi ID'si
const BANNER_AD_UNIT_ID = __DEV__
  ? TestIds.ADAPTIVE_BANNER
  : 'ca-app-pub-1312596055663310/9209358606';

const BannerAdComponent = ({ style }) => {
  const [adError, setAdError] = useState(false);

  const onAdFailedToLoad = useCallback((error) => {
    console.warn('[BannerAd] Reklam yüklenemedi:', error?.message || error);
    setAdError(true);
  }, []);

  const onAdLoaded = useCallback(() => {
    setAdError(false);
  }, []);

  if (adError) {
    return <View style={[styles.placeholder, style]} />;
  }

  return (
    <View style={[styles.container, style]}>
      <BannerAd
        unitId={BANNER_AD_UNIT_ID}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true,
        }}
        onAdLoaded={onAdLoaded}
        onAdFailedToLoad={onAdFailedToLoad}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  placeholder: {
    height: 0,
    width: '100%',
  },
});

export default BannerAdComponent;
