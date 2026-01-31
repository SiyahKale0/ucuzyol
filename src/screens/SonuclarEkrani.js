import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Modal,
  ScrollView,
  Linking,
  Share,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Feather from "react-native-vector-icons/Feather";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useArama } from "../context/AramaContext";
import BiletKarti from "../components/BiletKarti";
import BannerAd from "../components/BannerAd";
import { SonuclarListesiSkeleton } from "../components/LoadingSkeleton";
import { renkler } from "../styles/GenelStiller";
import { sehirKoordinatlari } from "../constants/SehirKoordinatlari";

const SonuclarEkrani = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const {
    aramaSonuclari,
    yukleniyor,
    hataMesaji,
    kalkisSehri,
    varisSehri,
    formatliTarih,
    seciliTarih,
    aramaIstatistikleri,
    siralama,
    setSiralama,
    sonuclariSirala,
  } = useArama();

  const [refreshing, setRefreshing] = useState(false);
  const [aktifFiltre, setAktifFiltre] = useState("hepsi");
  const [seciliRota, setSeciliRota] = useState(null);
  const [modalGorunur, setModalGorunur] = useState(false);

  // Detay modal aç - memoized
  const detayAc = useCallback((rota) => {
    setSeciliRota(rota);
    setModalGorunur(true);
  }, []);

  // Modal kapat
  const modalKapat = useCallback(() => {
    setModalGorunur(false);
    setSeciliRota(null);
  }, []);

  // Süre formatla
  const sureFormatla = (dakika) => {
    if (!dakika || dakika <= 0) return "—";
    const saat = Math.floor(dakika / 60);
    const dk = dakika % 60;
    if (saat === 0) return `${dk} dk`;
    if (dk === 0) return `${saat} sa`;
    return `${saat} sa ${dk} dk`;
  };

  // Saat string'inden dakika hesapla (ör: "14:30" -> 870)
  const saattenDakika = (saatStr) => {
    if (!saatStr) return null;
    const [saat, dakika] = saatStr.split(':').map(Number);
    return saat * 60 + dakika;
  };

  // İki saat arasındaki farkı hesapla (dakika cinsinden)
  const sureFarkiHesapla = (kalkis, varis) => {
    if (!kalkis || !varis) return null;
    const kalkisDk = saattenDakika(kalkis);
    const varisDk = saattenDakika(varis);
    if (kalkisDk === null || varisDk === null) return null;
    
    let fark = varisDk - kalkisDk;
    // Gece geçişi (varış ertesi gün)
    if (fark < 0) fark += 24 * 60;
    return fark;
  };

  // Haversine formülü ile mesafe hesapla (km)
  const mesafeHesapla = (sehir1, sehir2) => {
    const k1 = sehirKoordinatlari[sehir1];
    const k2 = sehirKoordinatlari[sehir2];
    if (!k1 || !k2) return null;

    const R = 6371; // Dünya yarıçapı (km)
    const dLat = (k2.lat - k1.lat) * Math.PI / 180;
    const dLon = (k2.lng - k1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(k1.lat * Math.PI / 180) * Math.cos(k2.lat * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const kusUcusu = R * c;
    // Karayolu faktörü ~1.3
    return Math.round(kusUcusu * 1.3);
  };

  // Rota için toplam süre hesapla
  const rotaSuresiHesapla = (rota) => {
    if (rota.toplam_sure) return rota.toplam_sure;
    
    if (rota.tip === "direct") {
      return sureFarkiHesapla(rota.kalkis_saati, rota.varis_saati);
    } else {
      // Aktarmalı: bacak1 süresi + bekleme + bacak2 süresi
      const bacak1Sure = sureFarkiHesapla(rota.bacak1?.kalkis, rota.bacak1?.varis);
      const bacak2Sure = sureFarkiHesapla(rota.bacak2?.kalkis, rota.bacak2?.varis);
      const bekleme = rota.bekleme_suresi || sureFarkiHesapla(rota.bacak1?.varis, rota.bacak2?.kalkis) || 60;
      
      if (bacak1Sure && bacak2Sure) {
        return bacak1Sure + bekleme + bacak2Sure;
      }
    }
    return null;
  };

  // Rota için toplam mesafe hesapla
  const rotaMesafesiHesapla = (rota) => {
    if (rota.toplam_mesafe) return rota.toplam_mesafe;
    
    const kalkis = rota.kalkis_sehir || rota.bacak1?.kalkis_sehir;
    const varis = rota.varis_sehir || rota.bacak2?.varis_sehir || rota.varis_sehir;
    
    if (rota.tip === "direct") {
      return mesafeHesapla(kalkis, varis);
    } else {
      // Aktarmalı: bacak1 + bacak2
      const mesafe1 = mesafeHesapla(kalkis, rota.aktarma_sehri);
      const mesafe2 = mesafeHesapla(rota.aktarma_sehri, varis);
      if (mesafe1 && mesafe2) {
        return mesafe1 + mesafe2;
      }
    }
    return null;
  };

  // Filtrelenmiş sonuçlar - memoized
  const filtrelenmis = useMemo(() => {
    let sonuclar = [...aramaSonuclari];
    if (aktifFiltre === "direkt") {
      sonuclar = sonuclar.filter((s) => s.tip === "direct");
    } else if (aktifFiltre === "aktarmali") {
      sonuclar = sonuclar.filter((s) => s.tip !== "direct");
    }
    return sonuclariSirala(sonuclar, siralama);
  }, [aramaSonuclari, aktifFiltre, siralama, sonuclariSirala]);

  // Refresh handler - memoized
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  }, []);

  // Paylaş fonksiyonu
  const rotaPaylas = useCallback(async (rota) => {
    try {
      const mesaj = `${rota.kalkis_sehir || rota.bacak1?.kalkis_sehir} → ${rota.varis_sehir || rota.bacak2?.varis_sehir}
📅 ${rota.tarih || formatliTarih(seciliTarih)}
💰 ${rota.toplam_fiyat} ₺
🚌 ${rota.firma || rota.bacak1?.firma}
${rota.tip !== "direct" ? `🔄 Aktarma: ${rota.aktarma_sehri}` : "🚀 Direkt Sefer"}

ucuzyol uygulamasıyla bulundu.`;

      await Share.share({
        message: mesaj,
        title: 'Bilet Bilgisi',
      });
    } catch (error) {
      // Sessizce devam et
    }
  }, [formatliTarih, seciliTarih]);

  // Sıralama değiştir handler
  const siralamaToggle = useCallback(() => {
    setSiralama(siralama === "fiyat" ? "aktarma" : "fiyat");
  }, [siralama, setSiralama]);

  // renderItem memoized - TÜM HOOK'LAR EARLY RETURN'DEN ÖNCE OLMALI
  const renderItem = useCallback(({ item }) => (
    <BiletKarti rota={item} onPress={() => detayAc(item)} />
  ), [detayAc]);

  // keyExtractor
  const keyExtractor = useCallback((item, i) => item.id || `r-${i}`, []);

  // Yükleniyor - Skeleton Loading
  if (yukleniyor) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header Skeleton */}
        <View style={styles.header}>
          <Text style={styles.headerBaslik}>
            {kalkisSehri || "..."} → {varisSehri || "..."}
          </Text>
          <Text style={styles.headerAlt}>
            {formatliTarih(seciliTarih)} • Aranıyor...
          </Text>
        </View>
        
        {/* Skeleton Cards */}
        <SonuclarListesiSkeleton count={4} />
      </View>
    );
  }

  // Hata veya boş
  if (hataMesaji && aramaSonuclari.length === 0) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
        <Feather name="alert-circle" size={40} color={renkler.hataRenk} />
        <Text style={styles.hataBaslik}>Arama Başarısız</Text>
        <Text style={styles.hataMetin}>{hataMesaji}</Text>
        <TouchableOpacity style={styles.buton} onPress={() => navigation.navigate("Arama")}>
          <Text style={styles.butonMetin}>Yeni Arama</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (aramaSonuclari.length === 0) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
        <Feather name="map-pin" size={40} color={renkler.metinAcik} />
        <Text style={styles.bosBaslik}>Henüz Arama Yapmadınız</Text>
        <Text style={styles.bosMetin}>Bilet aramak için şehir ve tarih seçin</Text>
        <TouchableOpacity 
          style={styles.buton} 
          onPress={() => navigation.navigate("Arama")}
          accessibilityLabel="Bilet ara"
        >
          <Text style={styles.butonMetin}>Bilet Ara</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerBaslik}>
          {kalkisSehri} → {varisSehri}
        </Text>
        <Text style={styles.headerAlt}>
          {formatliTarih(seciliTarih)} • {filtrelenmis.length} sefer
        </Text>
      </View>

      {/* Filtreler */}
      <View style={styles.filtreBar}>
        {["hepsi", "direkt", "aktarmali"].map((f) => {
          const label = f === "hepsi" ? "Tümü" : f === "direkt" ? "Direkt" : "Aktarmalı";
          const count =
            f === "hepsi"
              ? aramaSonuclari.length
              : f === "direkt"
              ? aramaIstatistikleri?.direktSayisi || 0
              : (aramaIstatistikleri?.tekAktarmaliSayisi || 0) +
                (aramaIstatistikleri?.cokluAktarmaliSayisi || 0);

          if (count === 0 && f !== "hepsi") return null;

          return (
            <TouchableOpacity
              key={f}
              style={[styles.filtreButon, aktifFiltre === f && styles.filtreAktif]}
              onPress={() => setAktifFiltre(f)}
            >
              <Text style={[styles.filtreMetin, aktifFiltre === f && styles.filtreMetinAktif]}>
                {label} ({count})
              </Text>
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity
          style={styles.siralaButon}
          onPress={siralamaToggle}
          accessibilityLabel={`Sıralama: ${siralama === "fiyat" ? "Fiyat" : "Aktarma"}`}
        >
          <Feather name="bar-chart-2" size={14} color={renkler.anaRenk} />
          <Text style={styles.siralaMetin}>{siralama === "fiyat" ? "Fiyat" : "Aktarma"}</Text>
        </TouchableOpacity>
      </View>

      {/* Liste */}
      <FlatList
        data={filtrelenmis}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.liste}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[renkler.anaRenk]} />
        }
        initialNumToRender={5}
        maxToRenderPerBatch={5}
        windowSize={5}
        removeClippedSubviews={Platform.OS === 'android'}
        ListEmptyComponent={
          <View style={styles.bosFiltre}>
            <Text style={styles.bosMetin}>Bu filtreye uygun sonuç yok</Text>
            <TouchableOpacity onPress={() => setAktifFiltre("hepsi")}>
              <Text style={styles.temizle}>Filtreyi Temizle</Text>
            </TouchableOpacity>
          </View>
        }
        ListFooterComponent={<View style={{ height: 70 + insets.bottom }} />}
      />

      {/* Banner */}
      <View style={[styles.banner, { paddingBottom: Math.max(insets.bottom - 16, 0) }]}>
        <BannerAd />
      </View>

      {/* Detay Modal */}
      <Modal
        visible={modalGorunur}
        animationType="slide"
        transparent={true}
        onRequestClose={modalKapat}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 16 }]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalBaslik}>Sefer Detayları</Text>
              <View style={styles.modalHeaderActions}>
                {seciliRota && (
                  <TouchableOpacity 
                    onPress={() => rotaPaylas(seciliRota)} 
                    style={styles.paylasButon}
                    accessibilityLabel="Paylaş"
                  >
                    <Feather name="share-2" size={20} color={renkler.anaRenk} />
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={modalKapat} style={styles.kapatButon}>
                  <Feather name="x" size={24} color={renkler.metinKoyu} />
                </TouchableOpacity>
              </View>
            </View>

            {seciliRota && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Güzergah Özeti */}
                <View style={styles.modalSection}>
                  <View style={styles.guzergahOzet}>
                    <View style={styles.guzergahNokta}>
                      <View style={[styles.noktaIcon, { backgroundColor: renkler.anaRenk }]} />
                      <Text style={styles.guzergahSehir}>
                        {seciliRota.kalkis_sehir || seciliRota.bacak1?.kalkis_sehir}
                      </Text>
                    </View>
                    <Feather name="arrow-right" size={20} color={renkler.metinAcik} style={{ marginHorizontal: 12 }} />
                    {seciliRota.aktarma_sehri && (
                      <>
                        <View style={styles.guzergahNokta}>
                          <View style={[styles.noktaIcon, { backgroundColor: "#F59E0B" }]} />
                          <Text style={styles.guzergahSehir}>{seciliRota.aktarma_sehri}</Text>
                        </View>
                        <Feather name="arrow-right" size={20} color={renkler.metinAcik} style={{ marginHorizontal: 12 }} />
                      </>
                    )}
                    <View style={styles.guzergahNokta}>
                      <View style={[styles.noktaIcon, { backgroundColor: "#16A34A" }]} />
                      <Text style={styles.guzergahSehir}>
                        {seciliRota.varis_sehir || seciliRota.bacak2?.varis_sehir}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Fiyat */}
                <View style={styles.fiyatBox}>
                  <Text style={styles.fiyatLabel}>Toplam Fiyat</Text>
                  <Text style={styles.fiyatDeger}>{seciliRota.toplam_fiyat} ₺</Text>
                </View>

                {/* Sefer Bilgileri */}
                <View style={styles.modalSection}>
                  <Text style={styles.sectionBaslik}>Sefer Bilgileri</Text>
                  
                  <View style={styles.bilgiSatir}>
                    <Feather name="calendar" size={18} color={renkler.metinAcik} />
                    <Text style={styles.bilgiLabel}>Tarih</Text>
                    <Text style={styles.bilgiDeger}>{seciliRota.tarih || formatliTarih(seciliTarih)}</Text>
                  </View>

                  <View style={styles.bilgiSatir}>
                    <Feather name="clock" size={18} color={renkler.metinAcik} />
                    <Text style={styles.bilgiLabel}>Toplam Süre</Text>
                    <Text style={styles.bilgiDeger}>{sureFormatla(rotaSuresiHesapla(seciliRota))}</Text>
                  </View>

                  <View style={styles.bilgiSatir}>
                    <Feather name="map-pin" size={18} color={renkler.metinAcik} />
                    <Text style={styles.bilgiLabel}>Mesafe</Text>
                    <Text style={styles.bilgiDeger}>
                      {(() => {
                        const mesafe = rotaMesafesiHesapla(seciliRota);
                        return mesafe ? `${mesafe} km` : "—";
                      })()}
                    </Text>
                  </View>

                  <View style={styles.bilgiSatir}>
                    <Feather name="layers" size={18} color={renkler.metinAcik} />
                    <Text style={styles.bilgiLabel}>Sefer Tipi</Text>
                    <Text style={styles.bilgiDeger}>
                      {seciliRota.tip === "direct" ? "Direkt Sefer" : "Aktarmalı Sefer"}
                    </Text>
                  </View>
                </View>

                {/* Firma Bilgileri */}
                <View style={styles.modalSection}>
                  <Text style={styles.sectionBaslik}>Firma Bilgileri</Text>
                  
                  {seciliRota.tip === "direct" ? (
                    <View style={styles.firmaKart}>
                      <MaterialCommunityIcons name="bus" size={24} color={renkler.anaRenk} />
                      <View style={styles.firmaDetay}>
                        <Text style={styles.firmaAdi}>{seciliRota.firma || "—"}</Text>
                        <Text style={styles.firmaBilgi}>
                          Kalkış: {seciliRota.kalkis_saati || "—"} • Varış: {seciliRota.varis_saati || "—"}
                        </Text>
                        <Text style={styles.firmaBilgi}>
                          {seciliRota.musait_koltuk || 0} koltuk müsait
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <>
                      {/* Bacak 1 */}
                      <View style={styles.firmaKart}>
                        <View style={styles.bacakNumara}>
                          <Text style={styles.bacakNo}>1</Text>
                        </View>
                        <View style={styles.firmaDetay}>
                          <Text style={styles.firmaAdi}>{seciliRota.bacak1?.firma || "—"}</Text>
                          <Text style={styles.firmaBilgi}>
                            {seciliRota.bacak1?.kalkis_sehir} → {seciliRota.aktarma_sehri}
                          </Text>
                          <Text style={styles.firmaBilgi}>
                            Kalkış: {seciliRota.bacak1?.kalkis || "—"} • Varış: {seciliRota.bacak1?.varis || "—"}
                          </Text>
                          <Text style={styles.firmaBilgi}>
                            Fiyat: {seciliRota.bacak1?.fiyat || 0} ₺ • Süre: {sureFormatla(sureFarkiHesapla(seciliRota.bacak1?.kalkis, seciliRota.bacak1?.varis))}
                          </Text>
                        </View>
                      </View>

                      {/* Bekleme */}
                      {(() => {
                        const bekleme = seciliRota.bekleme_suresi || sureFarkiHesapla(seciliRota.bacak1?.varis, seciliRota.bacak2?.kalkis);
                        if (bekleme && bekleme > 0) {
                          return (
                            <View style={styles.beklemeBox}>
                              <Feather name="coffee" size={16} color="#F59E0B" />
                              <Text style={styles.beklemeText}>
                                {seciliRota.aktarma_sehri}'de {sureFormatla(bekleme)} bekleme
                              </Text>
                            </View>
                          );
                        }
                        return null;
                      })()}

                      {/* Bacak 2 */}
                      <View style={styles.firmaKart}>
                        <View style={[styles.bacakNumara, { backgroundColor: "#16A34A" }]}>
                          <Text style={styles.bacakNo}>2</Text>
                        </View>
                        <View style={styles.firmaDetay}>
                          <Text style={styles.firmaAdi}>{seciliRota.bacak2?.firma || "—"}</Text>
                          <Text style={styles.firmaBilgi}>
                            {seciliRota.aktarma_sehri} → {seciliRota.bacak2?.varis_sehir}
                          </Text>
                          <Text style={styles.firmaBilgi}>
                            Kalkış: {seciliRota.bacak2?.kalkis || "—"} • Varış: {seciliRota.bacak2?.varis || "—"}
                          </Text>
                          <Text style={styles.firmaBilgi}>
                            Fiyat: {seciliRota.bacak2?.fiyat || 0} ₺ • Süre: {sureFormatla(sureFarkiHesapla(seciliRota.bacak2?.kalkis, seciliRota.bacak2?.varis))}
                          </Text>
                        </View>
                      </View>
                    </>
                  )}
                </View>

                {/* Koltuk Durumu */}
                <View style={styles.modalSection}>
                  <Text style={styles.sectionBaslik}>Koltuk Durumu</Text>
                  <View style={styles.koltukDurum}>
                    {(() => {
                      const koltuk = seciliRota.tip === "direct" 
                        ? seciliRota.musait_koltuk 
                        : Math.min(seciliRota.bacak1?.musait_koltuk || 0, seciliRota.bacak2?.musait_koltuk || 0);
                      const renk = koltuk <= 3 ? "#DC2626" : koltuk <= 10 ? "#F59E0B" : "#16A34A";
                      const durum = koltuk <= 3 ? "Az koltuk kaldı!" : koltuk <= 10 ? "Orta doluluk" : "Bol koltuk mevcut";
                      return (
                        <>
                          <View style={[styles.koltukBar, { backgroundColor: renk + "20" }]}>
                            <View style={[styles.koltukDolu, { width: `${Math.min(100, (45 - koltuk) / 45 * 100)}%`, backgroundColor: renk }]} />
                          </View>
                          <View style={styles.koltukInfo}>
                            <Feather name="users" size={16} color={renk} />
                            <Text style={[styles.koltukSayi, { color: renk }]}>{koltuk} koltuk müsait</Text>
                            <Text style={styles.koltukDurumText}>({durum})</Text>
                          </View>
                        </>
                      );
                    })()}
                  </View>
                </View>

                {/* Not */}
                <View style={styles.notBox}>
                  <Feather name="info" size={16} color={renkler.metinAcik} />
                  <Text style={styles.notText}>
                    Fiyatlar ve koltuk durumu anlık olarak değişebilir. Satın alma işlemi için firma ile iletişime geçiniz.
                  </Text>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: renkler.arkaPlan,
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  yukleniyorMetin: {
    marginTop: 12,
    fontSize: 15,
    color: renkler.metinKoyu,
  },
  hataBaslik: {
    marginTop: 12,
    fontSize: 17,
    fontWeight: "600",
    color: renkler.metinKoyu,
  },
  hataMetin: {
    marginTop: 6,
    fontSize: 14,
    color: renkler.metinAcik,
    textAlign: "center",
  },
  bosBaslik: {
    marginTop: 12,
    fontSize: 17,
    fontWeight: "600",
    color: renkler.metinKoyu,
  },
  bosMetin: {
    marginTop: 6,
    fontSize: 14,
    color: renkler.metinAcik,
    textAlign: "center",
  },
  buton: {
    marginTop: 20,
    backgroundColor: renkler.anaRenk,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
  },
  butonMetin: {
    color: renkler.beyaz,
    fontSize: 15,
    fontWeight: "600",
  },
  header: {
    backgroundColor: renkler.beyaz,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerBaslik: {
    fontSize: 18,
    fontWeight: "700",
    color: renkler.metinKoyu,
  },
  headerAlt: {
    marginTop: 2,
    fontSize: 14,
    color: renkler.metinAcik,
  },
  filtreBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: renkler.beyaz,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  filtreButon: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 4,
    backgroundColor: "#F3F4F6",
    marginRight: 8,
  },
  filtreAktif: {
    backgroundColor: renkler.anaRenk,
  },
  filtreMetin: {
    fontSize: 13,
    color: renkler.metinKoyu,
  },
  filtreMetinAktif: {
    color: renkler.beyaz,
  },
  siralaButon: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: "auto",
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  siralaMetin: {
    fontSize: 13,
    color: renkler.anaRenk,
    marginLeft: 4,
  },
  liste: {
    paddingTop: 8,
    paddingHorizontal: 12,
  },
  bosFiltre: {
    alignItems: "center",
    padding: 40,
  },
  temizle: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: "600",
    color: renkler.anaRenk,
  },
  banner: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: renkler.beyaz,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 8,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: renkler.beyaz,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
    paddingHorizontal: 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  paylasButon: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: renkler.anaRenk + "10",
  },
  modalBaslik: {
    fontSize: 18,
    fontWeight: "700",
    color: renkler.metinKoyu,
  },
  kapatButon: {
    padding: 4,
  },
  modalSection: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  sectionBaslik: {
    fontSize: 14,
    fontWeight: "600",
    color: renkler.metinAcik,
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  guzergahOzet: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  guzergahNokta: {
    alignItems: "center",
  },
  noktaIcon: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 4,
  },
  guzergahSehir: {
    fontSize: 14,
    fontWeight: "600",
    color: renkler.metinKoyu,
  },
  fiyatBox: {
    backgroundColor: renkler.anaRenk + "10",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginVertical: 12,
  },
  fiyatLabel: {
    fontSize: 12,
    color: renkler.metinAcik,
    marginBottom: 4,
  },
  fiyatDeger: {
    fontSize: 28,
    fontWeight: "700",
    color: renkler.anaRenk,
  },
  bilgiSatir: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F9FAFB",
  },
  bilgiLabel: {
    flex: 1,
    fontSize: 14,
    color: renkler.metinKoyu,
    marginLeft: 12,
  },
  bilgiDeger: {
    fontSize: 14,
    fontWeight: "600",
    color: renkler.metinKoyu,
  },
  firmaKart: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  firmaDetay: {
    flex: 1,
    marginLeft: 12,
  },
  firmaAdi: {
    fontSize: 15,
    fontWeight: "600",
    color: renkler.metinKoyu,
  },
  firmaBilgi: {
    fontSize: 13,
    color: renkler.metinAcik,
    marginTop: 2,
  },
  bacakNumara: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: renkler.anaRenk,
    justifyContent: "center",
    alignItems: "center",
  },
  bacakNo: {
    fontSize: 14,
    fontWeight: "700",
    color: renkler.beyaz,
  },
  beklemeBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    marginBottom: 8,
  },
  beklemeText: {
    fontSize: 13,
    color: "#F59E0B",
    marginLeft: 6,
    fontWeight: "500",
  },
  koltukDurum: {
    paddingTop: 4,
  },
  koltukBar: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  koltukDolu: {
    height: "100%",
    borderRadius: 4,
  },
  koltukInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  koltukSayi: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
  koltukDurumText: {
    fontSize: 13,
    color: renkler.metinAcik,
    marginLeft: 4,
  },
  notBox: {
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    padding: 12,
    borderRadius: 8,
    marginVertical: 16,
  },
  notText: {
    flex: 1,
    fontSize: 12,
    color: renkler.metinAcik,
    marginLeft: 8,
    lineHeight: 18,
  },
});

export default SonuclarEkrani;
