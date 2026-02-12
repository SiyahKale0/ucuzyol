import React, { useCallback } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Platform, View, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import AramaEkrani from "../screens/AramaEkrani";
import SonuclarEkrani from "../screens/SonuclarEkrani";
import { renkler } from "../styles/GenelStiller";

const Tab = createBottomTabNavigator();

// Tab bar icon component - memoized
const TabBarIcon = ({ name, color, focused }) => (
  <View style={[styles.iconContainer, focused && styles.iconContainerFocused]}>
    <Feather name={name} size={22} color={color} />
  </View>
);

const AppNavigator = () => {
  const insets = useSafeAreaInsets();

  // Screen listeners for analytics
  const screenListeners = useCallback(({ route }) => ({
    state: (e) => {
      // Screen tracking için - production'da analytics servisine gönderilir
      if (__DEV__) {
        console.log(`📱 Screen: ${route.name}`);
      }
    },
    tabPress: (e) => {
      // Tab press event
      if (__DEV__) {
        console.log(`👆 Tab pressed: ${route.name}`);
      }
    },
  }), []);

  return (
    <Tab.Navigator
      initialRouteName="Arama"
      screenListeners={screenListeners}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: renkler.anaRenk,
        tabBarInactiveTintColor: renkler.metinAcik,
        tabBarStyle: {
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom + 8,
          paddingTop: 8,
          backgroundColor: renkler.beyaz,
          borderTopWidth: 1,
          borderTopColor: "#E5E7EB",
          elevation: 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
          marginTop: 2,
        },
        tabBarItemStyle: {
          paddingTop: 4,
        },
      }}
    >
      <Tab.Screen
        name="Arama"
        component={AramaEkrani}
        options={{
          tabBarLabel: "Ara",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="search" color={color} focused={focused} />
          ),
          tabBarAccessibilityLabel: "Bilet arama ekranı",
        }}
      />
      <Tab.Screen
        name="Sonuçlar"
        component={SonuclarEkrani}
        options={{
          tabBarLabel: "Sonuçlar",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="list" color={color} focused={focused} />
          ),
          tabBarAccessibilityLabel: "Arama sonuçları ekranı",
          // Sonuç yoksa badge gösterebilir
          // tabBarBadge: sonucSayisi > 0 ? sonucSayisi : undefined,
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 28,
    borderRadius: 14,
  },
  iconContainerFocused: {
    backgroundColor: renkler.anaRenk + '15',
  },
});

export default AppNavigator;
