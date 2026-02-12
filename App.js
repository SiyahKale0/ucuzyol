import React, { useEffect } from "react";
import { StatusBar, Platform, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { Provider as PaperProvider, MD3LightTheme, configureFonts } from "react-native-paper";
import mobileAds from "react-native-google-mobile-ads";

import AppNavigator from "./src/navigation/AppNavigator";
import { AramaProvider } from "./src/context/AramaContext";
import { renkler, genelStiller } from "./src/styles/GenelStiller";
import ErrorBoundary from "./src/components/ErrorBoundary";
import NetworkStatusBar from "./src/components/NetworkStatusBar";
import { useNetworkStatus } from "./src/hooks/useNetworkStatus";

// Modern font configuration for MD3
const fontConfig = {
  displaySmall: {
    fontFamily: Platform.select({
      web: 'system-ui, -apple-system, sans-serif',
      ios: 'System',
      android: 'sans-serif',
    }),
    fontWeight: '400',
  },
};

const theme = {
  ...MD3LightTheme,
  fonts: configureFonts({ config: fontConfig }),
  roundness: 4,
  colors: {
    ...MD3LightTheme.colors,
    primary: renkler.anaRenk,
    secondary: renkler.ikinciRenk,
    tertiary: renkler.uyariRenk,
    background: renkler.arkaPlan,
    surface: renkler.kartArkaPlan,
    error: renkler.hataRenk,
  },
};

// Ana uygulama içeriği - network status için ayrı component
const AppContent = () => {
  const { isOffline, refresh } = useNetworkStatus();

  // AdMob SDK'yı başlat
  useEffect(() => {
    mobileAds()
      .initialize()
      .then((adapterStatuses) => {
        console.log("✅ AdMob başlatıldı:", adapterStatuses);
      })
      .catch((error) => {
        console.warn("⚠️ AdMob başlatma hatası:", error);
      });
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <NavigationContainer>
        <AppNavigator />
        <StatusBar
          barStyle="light-content"
          backgroundColor={renkler.anaRenk}
          translucent={Platform.OS === "android"}
        />
      </NavigationContainer>
      <NetworkStatusBar isOffline={isOffline} onRetry={refresh} />
    </View>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <ErrorBoundary showDetails={__DEV__}>
        <PaperProvider theme={theme}>
          <AramaProvider>
            <AppContent />
          </AramaProvider>
        </PaperProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
