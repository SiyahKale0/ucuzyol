import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
  ActivityIndicator,
  Vibration,
  Keyboard,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import Feather from "react-native-vector-icons/Feather";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useArama, ARAMA_MODLARI } from "../context/AramaContext";
import { enUcuzRotalariBulApi, cokluBacakliRotaBulApi } from "../api/apiServisleri";
import { renkler } from "../styles/GenelStiller";
import SehirAramaInput from "../components/SehirAramaInput";
import BannerAd from "../components/BannerAd";
import useInterstitialAd from "../hooks/useInterstitialAd";
import { useRecentSearches } from "../hooks/useAsyncStorage";

// Hafif titreşim için
const hapticFeedback = () => {
  if (Platform.OS === 'ios') {
    // iOS için HapticFeedback kullanılabilir
  } else {
    Vibration.vibrate(10);
  }
};

const AramaEkrani = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const {
    kalkisSehri,
    setKalkisSehri,
    varisSehri,
    setVarisSehri,
    seciliTarih,
    setSeciliTarih,
    formatliTarih,
    setAramaSonuclari,
    setYukleniyor,
    setHataMesaji,
    yukleniyor,
    aramaModu,
    setAramaModu,
    maksAktarmaSayisi,
    setMaksAktarmaSayisi,
    aramaySifirla,
  } = useArama();

  const [tarihSeciciGoster, setTarihSeciciGoster] = useState(false);
  const { showAd } = useInterstitialAd();
  const { addSearch } = useRecentSearches();

  // Tarih değiştir - memoized
  const tarihDegistir = useCallback((event, selectedDate) => {
    const guncel = selectedDate || seciliTarih;
    setTarihSeciciGoster(Platform.OS === "ios");
    const bugun = new Date();
    bugun.setHours(0, 0, 0, 0);
    if (guncel >= bugun) {
      setSeciliTarih(guncel);
      hapticFeedback();
    } else {
      Alert.alert("Geçersiz Tarih", "Geçmiş tarih seçemezsiniz.");
    }
    if (Platform.OS === "android") setTarihSeciciGoster(false);
  }, [seciliTarih, setSeciliTarih]);

  // Şehir değiştir - memoized
  const sehirDegistir = useCallback(() => {
    const temp = kalkisSehri;
    setKalkisSehri(varisSehri);
    setVarisSehri(temp);
    hapticFeedback();
  }, [kalkisSehri, varisSehri, setKalkisSehri, setVarisSehri]);

  // Form validasyonu
  const formGecerliMi = useMemo(() => {
    return kalkisSehri && varisSehri && kalkisSehri !== varisSehri;
  }, [kalkisSehri, varisSehri]);

  // Bilet ara - memoized
  const biletAra = useCallback(async () => {
    Keyboard.dismiss();
    
    if (!kalkisSehri || !varisSehri) {
      Alert.alert("Eksik Bilgi", "Lütfen şehirleri seçin.");
      return;
    }
    if (kalkisSehri === varisSehri) {
      Alert.alert("Hata", "Kalkış ve varış aynı olamaz.");
      return;
    }

    hapticFeedback();
    setYukleniyor(true);
    setHataMesaji(null);
    aramaySifirla();

    // Son aramaları kaydet
    try {
      await addSearch({
        kalkis: kalkisSehri,
        varis: varisSehri,
        tarih: formatliTarih(seciliTarih),
        timestamp: Date.now(),
      });
    } catch (e) {
      // Sessizce devam et
    }

    try {
      let rotalar = [];

      const standart = await enUcuzRotalariBulApi(kalkisSehri, varisSehri, formatliTarih(seciliTarih), 10);
      rotalar = [...standart];

      if (aramaModu === ARAMA_MODLARI.COKLU_AKTARMA) {
        try {
          const coklu = await cokluBacakliRotaBulApi(
            kalkisSehri,
            varisSehri,
            formatliTarih(seciliTarih),
            maksAktarmaSayisi,
            5
          );
          if (coklu?.length > 0) {
            const mevcutIdler = new Set(rotalar.map((r) => r.id));
            rotalar = [...rotalar, ...coklu.filter((r) => !mevcutIdler.has(r.id))];
          }
        } catch (e) {}
      }

      if (aramaModu === ARAMA_MODLARI.SADECE_DIREKT) {
        rotalar = rotalar.filter((r) => r.tip === "direct");
      }

      rotalar.sort((a, b) => a.toplam_fiyat - b.toplam_fiyat);

      const benzersiz = [];
      const gorulenler = new Set();
      for (const rota of rotalar) {
        let firma, koltuk;
        if (rota.tip === "direct") {
          firma = rota.firma;
          koltuk = rota.musait_koltuk;
        } else {
          firma = rota.bacak1?.firma;
          koltuk = Math.min(rota.bacak1?.musait_koltuk || 0, rota.bacak2?.musait_koltuk || 0);
        }
        if (!firma || koltuk <= 0) continue;

        const anahtar = `${rota.tip}-${rota.aktarma_sehri || "d"}-${rota.toplam_fiyat}`;
        if (!gorulenler.has(anahtar)) {
          gorulenler.add(anahtar);
          benzersiz.push(rota);
        }
      }

      setAramaSonuclari(benzersiz);
      if (benzersiz.length === 0) {
        setHataMesaji("Uygun sefer bulunamadı.");
      }

      try {
        await showAd();
      } catch (e) {}

      navigation.navigate("Sonuçlar");
    } catch (error) {
      setHataMesaji("Arama sırasında hata oluştu.");
      Alert.alert("Hata", "Bilet arama başarısız.");
    } finally {
      setYukleniyor(false);
    }
  }, [
    kalkisSehri, 
    varisSehri, 
    seciliTarih, 
    aramaModu, 
    maksAktarmaSayisi, 
    navigation,
    formatliTarih,
    setYukleniyor,
    setHataMesaji,
    aramaySifirla,
    setAramaSonuclari,
    showAd,
    addSearch,
  ]);

  // Mod bilgileri - memoized
  const modlar = useMemo(() => [
    { 
      key: ARAMA_MODLARI.STANDART, 
      label: "Hızlı", 
      icon: "zap",
      color: "#3B82F6",
      aciklama: "Popüler rotalar"
    },
    { 
      key: ARAMA_MODLARI.COKLU_AKTARMA, 
      label: "Detaylı", 
      icon: "git-merge",
      color: "#8B5CF6",
      aciklama: "Aktarmalı rotalar"
    },
    { 
      key: ARAMA_MODLARI.SADECE_DIREKT, 
      label: "Direkt", 
      icon: "arrow-right",
      color: "#10B981",
      aciklama: "Aktarmasız"
    },
  ], []);

  // Aktarma sayısı değiştir handler
  const aktarmaSayisiDegistir = useCallback((num) => {
    if (__DEV__) console.log(`🔄 Aktarma sayısı değiştirildi: ${num}`);
    setMaksAktarmaSayisi(num);
    hapticFeedback();
  }, [setMaksAktarmaSayisi]);

  // Mod değiştir handler
  const modDegistir = useCallback((mod) => {
    if (__DEV__) console.log(`🔄 Arama modu değiştirildi: ${mod}`);
    setAramaModu(mod);
    hapticFeedback();
  }, [setAramaModu]);

  // Tarih picker göster
  const tarihSeciciAc = useCallback(() => {
    Keyboard.dismiss();
    setTarihSeciciGoster(true);
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIcerik}>
          <MaterialCommunityIcons name="bus" size={28} color={renkler.beyaz} />
          <View style={styles.headerMetin}>
            <Text style={styles.headerBaslik}>ucuzyol</Text>
            <Text style={styles.headerAlt}>Otobüs bileti karşılaştır</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Ana Arama Kartı */}
        <View style={styles.anaKart}>
          {/* Şehir Seçimi */}
          <View style={styles.sehirAlani}>
            {/* Kalkış */}
            <View style={[styles.sehirSatir, { zIndex: 2000 }]}>
              <View style={styles.sehirIkon}>
                <View style={[styles.nokta, { backgroundColor: renkler.anaRenk }]} />
              </View>
              <View style={styles.sehirInput}>
                <Text style={styles.sehirLabel}>NEREDEN</Text>
                <SehirAramaInput
                  label=""
                  seciliSehir={kalkisSehri}
                  onSehirSec={setKalkisSehri}
                />
              </View>
            </View>

            {/* Değiştir Butonu */}
            <TouchableOpacity style={styles.degistirButon} onPress={sehirDegistir}>
              <Feather name="repeat" size={16} color={renkler.anaRenk} />
            </TouchableOpacity>

            {/* Çizgi */}
            <View style={styles.dikeyCizgi} />

            {/* Varış */}
            <View style={[styles.sehirSatir, { zIndex: 1000 }]}>
              <View style={styles.sehirIkon}>
                <View style={[styles.nokta, { backgroundColor: "#10B981" }]} />
              </View>
              <View style={styles.sehirInput}>
                <Text style={styles.sehirLabel}>NEREYE</Text>
                <SehirAramaInput
                  label=""
                  seciliSehir={varisSehri}
                  onSehirSec={setVarisSehri}
                />
              </View>
            </View>
          </View>

          {/* Tarih */}
          <TouchableOpacity 
            style={styles.tarihButon} 
            onPress={tarihSeciciAc}
            accessibilityLabel="Yolculuk tarihi seç"
            accessibilityRole="button"
          >
            <View style={styles.tarihIkon}>
              <Feather name="calendar" size={20} color={renkler.anaRenk} />
            </View>
            <View style={styles.tarihIcerik}>
              <Text style={styles.tarihLabel}>YOLCULUK TARİHİ</Text>
              <Text style={styles.tarihDeger}>{formatliTarih(seciliTarih)}</Text>
            </View>
            <Feather name="chevron-right" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          {tarihSeciciGoster && (
            <DateTimePicker
              value={seciliTarih}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={tarihDegistir}
              minimumDate={new Date()}
            />
          )}
        </View>

        {/* Arama Modu Kartı */}
        <View style={styles.modKart}>
          <Text style={styles.modBaslik}>Arama Modu</Text>
          
          {/* Mod Seçici */}
          <View style={styles.modSecici}>
            {modlar.map((mod) => {
              const aktif = aramaModu === mod.key;
              return (
                <TouchableOpacity
                  key={mod.key}
                  style={[
                    styles.modButon,
                    aktif && { backgroundColor: mod.color + "15", borderColor: mod.color }
                  ]}
                  onPress={() => modDegistir(mod.key)}
                  activeOpacity={0.7}
                  accessibilityLabel={`${mod.label} arama modu`}
                  accessibilityState={{ selected: aktif }}
                >
                  <View style={[
                    styles.modIkonContainer,
                    aktif && { backgroundColor: mod.color }
                  ]}>
                    <Feather
                      name={mod.icon}
                      size={18}
                      color={aktif ? "#FFF" : "#9CA3AF"}
                    />
                  </View>
                  <Text style={[
                    styles.modLabel,
                    aktif && { color: mod.color, fontWeight: "600" }
                  ]}>
                    {mod.label}
                  </Text>
                  <Text style={[
                    styles.modAciklama,
                    aktif && { color: mod.color }
                  ]}>
                    {mod.aciklama}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Aktarma Sayısı - Sadece Detaylı modda */}
          {aramaModu === ARAMA_MODLARI.COKLU_AKTARMA && (
            <View style={styles.aktarmaAlani}>
              <View style={styles.aktarmaHeader}>
                <Feather name="git-branch" size={16} color="#8B5CF6" />
                <Text style={styles.aktarmaBaslik}>Maksimum Aktarma</Text>
              </View>
              <View style={styles.aktarmaButonlar}>
                {[1, 2, 3].map((num) => {
                  const aktif = maksAktarmaSayisi === num;
                  return (
                    <TouchableOpacity
                      key={num}
                      style={[
                        styles.aktarmaSayiButon,
                        aktif && styles.aktarmaSayiAktif
                      ]}
                      onPress={() => aktarmaSayisiDegistir(num)}
                      accessibilityLabel={`Maksimum ${num} aktarma`}
                      accessibilityState={{ selected: aktif }}
                    >
                      <Text style={[
                        styles.aktarmaSayiMetin,
                        aktif && styles.aktarmaSayiMetinAktif
                      ]}>
                        {num}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
        </View>

        {/* Ara Butonu */}
        <TouchableOpacity
          style={[
            styles.araButon, 
            yukleniyor && styles.araButonDisabled,
            !formGecerliMi && !yukleniyor && styles.araButonInactive
          ]}
          onPress={biletAra}
          disabled={yukleniyor}
          activeOpacity={0.8}
          accessibilityLabel="Bilet ara"
          accessibilityRole="button"
          accessibilityState={{ disabled: yukleniyor }}
        >
          {yukleniyor ? (
            <ActivityIndicator color={renkler.beyaz} size="small" />
          ) : (
            <>
              <Feather name="search" size={22} color={renkler.beyaz} />
              <Text style={styles.araMetin}>Bilet Ara</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Banner */}
        <View style={styles.bannerAlani}>
          <BannerAd />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F1F5F9",
  },
  
  // Header
  header: {
    backgroundColor: renkler.anaRenk,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerIcerik: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerMetin: {
    marginLeft: 12,
  },
  headerBaslik: {
    fontSize: 24,
    fontWeight: "700",
    color: renkler.beyaz,
    letterSpacing: -0.5,
  },
  headerAlt: {
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },
  
  // Scroll
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 20,
    paddingBottom: 100,
  },
  
  // Ana Kart
  anaKart: {
    backgroundColor: renkler.beyaz,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  
  // Şehir Alanı
  sehirAlani: {
    position: "relative",
  },
  sehirSatir: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  sehirIkon: {
    width: 32,
    alignItems: "center",
    paddingTop: 20,
  },
  nokta: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  sehirInput: {
    flex: 1,
  },
  sehirLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#9CA3AF",
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  dikeyCizgi: {
    position: "absolute",
    left: 15,
    top: 36,
    bottom: 36,
    width: 2,
    backgroundColor: "#E5E7EB",
    borderRadius: 1,
  },
  degistirButon: {
    position: "absolute",
    right: 0,
    top: "50%",
    marginTop: -16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  
  // Tarih
  tarihButon: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  tarihIkon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
  },
  tarihIcerik: {
    flex: 1,
    marginLeft: 12,
  },
  tarihLabel: {
    fontSize: 11,
    color: "#9CA3AF",
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  tarihDeger: {
    fontSize: 15,
    fontWeight: "600",
    color: renkler.metinKoyu,
    marginTop: 2,
  },
  
  // Mod Kartı
  modKart: {
    backgroundColor: renkler.beyaz,
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  modBaslik: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  
  // Mod Seçici
  modSecici: {
    flexDirection: "row",
    gap: 10,
  },
  modButon: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
  },
  modIkonContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  modLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
    marginBottom: 2,
  },
  modAciklama: {
    fontSize: 10,
    color: "#9CA3AF",
  },
  
  // Aktarma Alanı
  aktarmaAlani: {
    marginTop: 16,
    paddingTop: 16,
    paddingHorizontal: 12,
    paddingBottom: 12,
    backgroundColor: "#F3E8FF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#DDD6FE",
  },
  aktarmaHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  aktarmaBaslik: {
    fontSize: 14,
    fontWeight: "500",
    color: renkler.metinKoyu,
  },
  aktarmaButonlar: {
    flexDirection: "row",
    gap: 10,
  },
  aktarmaSayiButon: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: "#F9FAFB",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    alignItems: "center",
  },
  aktarmaSayiAktif: {
    backgroundColor: "#8B5CF6",
    borderColor: "#8B5CF6",
  },
  aktarmaSayiMetin: {
    fontSize: 18,
    fontWeight: "700",
    color: "#6B7280",
  },
  aktarmaSayiMetinAktif: {
    color: renkler.beyaz,
  },
  
  // Ara Butonu
  araButon: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: renkler.anaRenk,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 20,
    gap: 10,
    shadowColor: renkler.anaRenk,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  araButonDisabled: {
    opacity: 0.7,
  },
  araButonInactive: {
    backgroundColor: "#9CA3AF",
    shadowOpacity: 0.1,
  },
  araMetin: {
    fontSize: 17,
    fontWeight: "700",
    color: renkler.beyaz,
  },
  
  // Banner
  bannerAlani: {
    marginTop: 20,
  },
});

export default AramaEkrani;

