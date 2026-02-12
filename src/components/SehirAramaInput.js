import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  TextInput,
  Platform,
} from 'react-native';
import { Surface } from 'react-native-paper';
import { Feather } from '@expo/vector-icons';
import { sehirListesi } from '../constants/Sehirler';
import { renkler } from '../styles/GenelStiller';
import { useDebounce } from '../hooks/useDebounce';

const { width } = Dimensions.get('window');

// Popüler şehirler
const POPULER_SEHIRLER = ['İstanbul', 'Ankara', 'İzmir', 'Antalya', 'Bursa', 'Adana'];

// Türkçe karakter normalizasyonu (İ↔i, I↔ı, Ş↔ş, Ç↔ç, Ğ↔ğ, Ü↔ü, Ö↔ö)
const turkceNormalize = (str) => {
  return str
    .replace(/İ/g, 'i')
    .replace(/I/g, 'ı')
    .replace(/Ş/g, 'ş')
    .replace(/Ç/g, 'ç')
    .replace(/Ğ/g, 'ğ')
    .replace(/Ü/g, 'ü')
    .replace(/Ö/g, 'ö')
    .toLowerCase();
};

const SehirAramaInput = ({ label, seciliSehir, onSehirSec }) => {
  const [aramaMetni, setAramaMetni] = useState('');
  const [listeGoster, setListeGoster] = useState(false);
  
  // Debounced arama metni - performans için
  const debouncedArama = useDebounce(aramaMetni, 150);

  const animasyonDegeri = useRef(new Animated.Value(0)).current;
  const inputFocus = useRef(new Animated.Value(0)).current;
  const inputRef = useRef(null);

  // Filtrelenmiş şehirler - useMemo ile optimize (Türkçe karakter desteği)
  const filtrelenmisSehirler = useMemo(() => {
    if (debouncedArama.length === 0) {
      return [];
    }
    const normalizedArama = turkceNormalize(debouncedArama);
    return sehirListesi.filter((sehir) =>
      turkceNormalize(sehir).includes(normalizedArama)
    ).slice(0, 10); // Max 10 sonuç göster
  }, [debouncedArama]);

  // Arama değişikliği
  const handleArama = useCallback((text) => {
    setAramaMetni(text);
    if (text.length > 0) {
      setListeGoster(true);
    } else {
      setListeGoster(false);
    }
  }, []);

  const handleSecim = useCallback((sehir) => {
    onSehirSec(sehir);
    setAramaMetni(sehir);
    setListeGoster(false);
    inputRef.current?.blur();

    // Close animation
    Animated.timing(animasyonDegeri, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [onSehirSec, animasyonDegeri]);

  const handleFocus = useCallback(() => {
    Animated.timing(inputFocus, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [inputFocus]);

  const handleBlur = useCallback(() => {
    Animated.timing(inputFocus, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [inputFocus]);

  const handleListeKapat = useCallback(() => {
    Animated.timing(animasyonDegeri, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setListeGoster(false);
    });
  }, [animasyonDegeri]);

  const handleTemizle = useCallback(() => {
    setAramaMetni('');
    setListeGoster(false);
    inputRef.current?.focus();
  }, []);

  // Open animation when list shows
  useEffect(() => {
    if (listeGoster && filtrelenmisSehirler.length > 0) {
      Animated.spring(animasyonDegeri, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    }
  }, [listeGoster, filtrelenmisSehirler.length]);

  const inputBorderColor = inputFocus.interpolate({
    inputRange: [0, 1],
    outputRange: [renkler.golge, renkler.anaRenk],
  });

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <View style={styles.inputWrapper}>
        <Animated.View
          style={[
            styles.inputBorder,
            {
              borderColor: inputBorderColor,
            },
          ]}
        >
          <Feather
            name="search"
            size={20}
            color={aramaMetni.length > 0 ? renkler.anaRenk : renkler.metinAcik}
            style={styles.inputIcon}
          />
          <TextInput
            ref={inputRef}
            placeholder="Şehir ara..."
            placeholderTextColor={renkler.metinAcik}
            onChangeText={handleArama}
            onFocus={handleFocus}
            onBlur={handleBlur}
            value={aramaMetni}
            style={styles.textInput}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            accessibilityLabel={label || "Şehir arama"}
            accessibilityHint="Gitmek istediğiniz şehri yazın"
          />
          {aramaMetni.length > 0 && (
            <TouchableOpacity
              onPress={handleTemizle}
              style={styles.clearButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityLabel="Aramayı temizle"
            >
              <Feather name="x" size={18} color={renkler.metinAcik} />
            </TouchableOpacity>
          )}
        </Animated.View>
      </View>

      {/* Dropdown List */}
      {listeGoster && (
        <Animated.View
          style={[
            styles.dropdownContainer,
            {
              opacity: animasyonDegeri,
              transform: [
                {
                  translateY: animasyonDegeri.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-10, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Surface style={styles.dropdown} elevation={5}>
            <ScrollView
              nestedScrollEnabled={true}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {filtrelenmisSehirler.map((item, index) => {
                const isFirst = index === 0;
                const isLast = index === filtrelenmisSehirler.length - 1;

                return (
                  <TouchableOpacity
                    key={item}
                    onPress={() => handleSecim(item)}
                    style={[
                      styles.listItem,
                      isFirst && styles.listItemFirst,
                      isLast && styles.listItemLast,
                    ]}
                    activeOpacity={0.7}
                  >
                    <View style={styles.listItemContent}>
                      <View style={styles.listItemIcon}>
                        <Feather name="map-pin" size={18} color={renkler.anaRenk} />
                      </View>
                      <Text style={styles.listItemText}>{item}</Text>
                    </View>
                    <Feather
                      name="chevron-right"
                      size={18}
                      color={renkler.metinAcik}
                      style={styles.listItemArrow}
                    />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Dropdown footer */}
            <View style={styles.dropdownFooter}>
              <Text style={styles.dropdownFooterText}>
                {filtrelenmisSehirler.length} sonuç bulundu
              </Text>
            </View>
          </Surface>
        </Animated.View>
      )}

      {/* No results state */}
      {listeGoster && aramaMetni.length > 0 && filtrelenmisSehirler.length === 0 && (
        <Animated.View
          style={[
            styles.noResultsContainer,
            {
              opacity: animasyonDegeri,
            },
          ]}
        >
          <Surface style={styles.noResultsCard} elevation={4}>
            <View style={styles.noResultsIcon}>
              <Feather name="search" size={32} color={renkler.metinAcik} />
            </View>
            <Text style={styles.noResultsTitle}>Şehir bulunamadı</Text>
            <Text style={styles.noResultsSubtitle}>
              Farklı bir arama terimi deneyin
            </Text>
          </Surface>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    zIndex: 1000,
    elevation: 1000,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: renkler.metinKoyu,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    position: 'relative',
    zIndex: 1001,
  },
  inputBorder: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: renkler.arkaPlan,
    borderRadius: 16,
    borderWidth: 2,
    height: 56,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: renkler.metinKoyu,
    fontWeight: '500',
  },
  clearButton: {
    padding: 4,
  },
  dropdownContainer: {
    position: 'absolute',
    top: 56,
    left: 0,
    right: 0,
    marginTop: 8,
    zIndex: 9999,
    elevation: 9999,
  },
  dropdown: {
    borderRadius: 20,
    backgroundColor: renkler.beyaz,
    overflow: 'hidden',
    maxHeight: 250,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: renkler.arkaPlan,
  },
  listItemFirst: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  listItemLast: {
    borderBottomWidth: 0,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  listItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  listItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: renkler.arkaPlan,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  listItemText: {
    fontSize: 16,
    color: renkler.metinKoyu,
    fontWeight: '500',
  },
  listItemArrow: {
    marginLeft: 8,
  },
  dropdownFooter: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: renkler.arkaPlan,
    borderTopWidth: 1,
    borderTopColor: renkler.golge,
  },
  dropdownFooterText: {
    fontSize: 12,
    color: renkler.metinAcik,
    textAlign: 'center',
  },
  noResultsContainer: {
    position: 'absolute',
    top: 56,
    left: 0,
    right: 0,
    marginTop: 8,
    zIndex: 9999,
    elevation: 9999,
  },
  noResultsCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    backgroundColor: renkler.beyaz,
  },
  noResultsIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: renkler.arkaPlan,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  noResultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: renkler.metinKoyu,
    marginBottom: 4,
  },
  noResultsSubtitle: {
    fontSize: 14,
    color: renkler.metinAcik,
    textAlign: 'center',
  },
});

export default SehirAramaInput;
