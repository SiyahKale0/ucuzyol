import React, { memo, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { renkler } from "../styles/GenelStiller";

// Saat string'inden dakika hesapla (ör: "14:30" -> 870)
const saattenDakika = (saatStr) => {
  if (!saatStr || typeof saatStr !== 'string') return null;
  const parcalar = saatStr.split(':');
  if (parcalar.length !== 2) return null;
  const saat = parseInt(parcalar[0], 10);
  const dakika = parseInt(parcalar[1], 10);
  if (isNaN(saat) || isNaN(dakika)) return null;
  return saat * 60 + dakika;
};

// İki saat arasındaki farkı hesapla (dakika cinsinden)
const sureFarkiHesapla = (baslangic, bitis) => {
  const baslangicDk = saattenDakika(baslangic);
  const bitisDk = saattenDakika(bitis);
  if (baslangicDk === null || bitisDk === null) return null;
  
  let fark = bitisDk - baslangicDk;
  // Gece geçişi varsa (bekleme ertesi güne sarkarsa)
  if (fark < 0) fark += 24 * 60;
  return fark;
};

// Bekleme süresini hesapla (bacak1 varış -> bacak2 kalkış)
const beklemeSuresiHesapla = (bacak1Varis, bacak2Kalkis) => {
  const bekleme = sureFarkiHesapla(bacak1Varis, bacak2Kalkis);
  // Minimum 5 dakika mantıklı bekleme süresi
  if (bekleme !== null && bekleme >= 5) {
    return bekleme;
  }
  return null;
};

// Süre formatla (dakika -> saat dakika)
const sureFormatla = (dakika) => {
  if (!dakika || dakika <= 0) return null;
  const saat = Math.floor(dakika / 60);
  const dk = dakika % 60;
  if (saat === 0) return `${dk} dk`;
  if (dk === 0) return `${saat} sa`;
  return `${saat} sa ${dk} dk`;
};

// Mesafe formatla
const mesafeFormatla = (km) => {
  if (!km || km <= 0) return null;
  return `${Math.round(km)} km`;
};

// Otobüs tipi belirle (fiyata göre)
const otobusTipiBelirle = (fiyat, mesafe) => {
  if (!fiyat || !mesafe) return { tip: "Standart", ikon: "bus" };
  const kmBasiFiyat = fiyat / mesafe;
  if (kmBasiFiyat > 1.5) return { tip: "Lüks 2+1", ikon: "bus-articulated-front" };
  if (kmBasiFiyat > 1.0) return { tip: "Konforlu", ikon: "bus-side" };
  return { tip: "Standart", ikon: "bus" };
};

const BiletKarti = ({ rota, onPress }) => {
  if (!rota) return null;

  const isDirekt = rota.tip === "direct";
  const isMultiTransfer = rota.tip === "multi-transfer";
  const isAktarmali = !isDirekt && !isMultiTransfer; // Tek aktarmalı
  
  // Firma ve koltuk bilgisi
  const firma = isDirekt ? rota.firma : (isMultiTransfer ? rota.bacaklar?.[0]?.firma : rota.bacak1?.firma);
  const firma2 = isMultiTransfer 
    ? (rota.bacaklar?.length > 1 ? rota.bacaklar[rota.bacaklar.length - 1]?.firma : null)
    : (!isDirekt ? rota.bacak2?.firma : null);
  const koltuk = isDirekt 
    ? rota.musait_koltuk 
    : isMultiTransfer
      ? Math.min(...(rota.bacaklar?.map(b => b.musait_koltuk || 99) || [0]))
      : Math.min(rota.bacak1?.musait_koltuk || 0, rota.bacak2?.musait_koltuk || 0);

  // Firma veya koltuk yoksa gösterme
  if (!firma || koltuk <= 0) return null;

  // Kalkış/Varış bilgileri
  const kalkisSehir = rota.kalkis_sehir || (isMultiTransfer ? rota.bacaklar?.[0]?.kalkis_sehir : rota.bacak1?.kalkis_sehir);
  const varisSehir = rota.varis_sehir || (isMultiTransfer ? rota.bacaklar?.[rota.bacaklar?.length - 1]?.varis_sehir : (rota.bacak2?.varis_sehir || rota.varis_sehir));
  const kalikisSaati = rota.kalkis_saati || (isMultiTransfer ? rota.bacaklar?.[0]?.kalkis : rota.bacak1?.kalkis) || null;
  const varisSaati = rota.varis_saati || (isMultiTransfer ? rota.bacaklar?.[rota.bacaklar?.length - 1]?.varis : rota.bacak2?.varis) || null;

  // Aktarma bilgileri
  const aktarmaSehri = rota.aktarma_sehri;
  const aktarmaSehirleri = isMultiTransfer ? rota.aktarma_sehirleri : (aktarmaSehri ? [aktarmaSehri] : []);
  // Bekleme süresini hesapla: önce rota'dan al, yoksa bacak1 varış - bacak2 kalkış hesapla
  const aktarmaBekleme = rota.bekleme_suresi || 
    beklemeSuresiHesapla(rota.bacak1?.varis, rota.bacak2?.kalkis);

  // Süre hesapla - rota'da yoksa saat bilgilerinden hesapla
  let toplamSure = rota.toplam_sure || rota.sure || null;
  if (!toplamSure) {
    if (isDirekt) {
      // Direkt sefer: kalkış -> varış
      toplamSure = sureFarkiHesapla(kalikisSaati, varisSaati);
    } else {
      // Aktarmalı: bacak1 + bekleme + bacak2
      const bacak1Sure = sureFarkiHesapla(rota.bacak1?.kalkis, rota.bacak1?.varis);
      const bacak2Sure = sureFarkiHesapla(rota.bacak2?.kalkis, rota.bacak2?.varis);
      const bekleme = aktarmaBekleme || 60; // varsayılan 1 saat
      if (bacak1Sure && bacak2Sure) {
        toplamSure = bacak1Sure + bekleme + bacak2Sure;
      }
    }
  }

  // Mesafe - rota'dan al (koordinat hesabı SonuclarEkrani'nda)
  const toplamMesafe = rota.toplam_mesafe || rota.mesafe || null;

  // Otobüs tipi
  const otobusTipi = otobusTipiBelirle(rota.toplam_fiyat, toplamMesafe);

  // Koltuk durumu
  const koltukDurumu = koltuk <= 3 ? "az" : koltuk <= 10 ? "orta" : "cok";
  const koltukRenk = koltukDurumu === "az" ? "#DC2626" : koltukDurumu === "orta" ? "#F59E0B" : "#16A34A";

  return (
    <TouchableOpacity style={styles.kart} activeOpacity={0.7} onPress={onPress}>
      {/* HEADER: Firma + Badge + Fiyat */}
      <View style={styles.header}>
        <View style={styles.headerSol}>
          <View style={styles.firmaRow}>
            <MaterialCommunityIcons 
              name={otobusTipi.ikon} 
              size={18} 
              color={renkler.anaRenk} 
              style={styles.firmaIkon}
            />
            <Text style={styles.firmaAdi} numberOfLines={1}>{firma}</Text>
          </View>
          {!isDirekt && firma2 && firma2 !== firma && (
            <Text style={styles.firma2}>+ {firma2}</Text>
          )}
        </View>
        <View style={styles.headerSag}>
          <Text style={styles.fiyat}>{rota.toplam_fiyat} ₺</Text>
          <View style={[
            styles.badge, 
            isDirekt ? styles.direktBadge : (isMultiTransfer ? styles.multiTransferBadge : styles.aktarmaBadge)
          ]}>
            <Text style={[
              styles.badgeMetin, 
              isDirekt ? styles.direktMetin : (isMultiTransfer ? styles.multiTransferMetin : styles.aktarmaMetin)
            ]}>
              {isDirekt ? "Direkt" : isMultiTransfer ? `${aktarmaSehirleri.length} Aktarma` : "Aktarmalı"}
            </Text>
          </View>
        </View>
      </View>

      {/* GÜZERGAH TIMELINE */}
      <View style={styles.timeline}>
        {/* Direkt sefer timeline */}
        {isDirekt && (
          <>
            <View style={styles.timelineRow}>
              <View style={styles.timelineSol}>
                <View style={[styles.nokta, styles.kalkisNokta]} />
                <View style={styles.cizgi} />
              </View>
              <View style={styles.timelineIcerik}>
                <Text style={styles.sehirAdi}>{kalkisSehir}</Text>
                {kalikisSaati && <Text style={styles.saatText}>{kalikisSaati}</Text>}
              </View>
            </View>
            <View style={[styles.timelineRow, styles.sonRow]}>
              <View style={styles.timelineSol}>
                <View style={[styles.nokta, styles.varisNokta]} />
              </View>
              <View style={styles.timelineIcerik}>
                <Text style={styles.sehirAdi}>{varisSehir}</Text>
                {varisSaati && <Text style={styles.saatText}>{varisSaati}</Text>}
              </View>
            </View>
          </>
        )}

        {/* Tek Aktarmalı sefer - Detaylı bacak bilgileri */}
        {isAktarmali && (
          <>
            {/* Bacak 1 */}
            <View style={styles.bacakKart}>
              <View style={styles.bacakHeader}>
                <View style={styles.bacakNumara}><Text style={styles.bacakNo}>1</Text></View>
                <Text style={styles.bacakFirma}>{rota.bacak1?.firma}</Text>
                <Text style={styles.bacakFiyat}>{rota.bacak1?.fiyat || 0} ₺</Text>
              </View>
              <View style={styles.bacakGuzergah}>
                <View style={styles.bacakNokta}>
                  <View style={[styles.miniNokta, { backgroundColor: renkler.anaRenk }]} />
                  <Text style={styles.bacakSehir}>{rota.bacak1?.kalkis_sehir}</Text>
                  <Text style={styles.bacakSaat}>{rota.bacak1?.kalkis || "—"}</Text>
                </View>
                <View style={styles.bacakOk}>
                  <Feather name="arrow-down" size={12} color="#9CA3AF" />
                </View>
                <View style={styles.bacakNokta}>
                  <View style={[styles.miniNokta, { backgroundColor: "#F59E0B" }]} />
                  <Text style={styles.bacakSehir}>{aktarmaSehri}</Text>
                  <Text style={styles.bacakSaat}>{rota.bacak1?.varis || "—"}</Text>
                </View>
              </View>
              <View style={styles.bacakDetay}>
                <View style={styles.bacakDetayItem}>
                  <Feather name="users" size={12} color={rota.bacak1?.musait_koltuk <= 5 ? "#DC2626" : "#16A34A"} />
                  <Text style={[styles.bacakDetayText, { color: rota.bacak1?.musait_koltuk <= 5 ? "#DC2626" : "#16A34A" }]}>
                    {rota.bacak1?.musait_koltuk || 0} koltuk
                  </Text>
                </View>
              </View>
            </View>

            {/* Aktarma Bekleme */}
            <View style={styles.aktarmaBekleme}>
              <View style={styles.aktarmaCizgi} />
              <View style={styles.aktarmaInfo}>
                <Feather name="clock" size={14} color="#F59E0B" />
                <Text style={styles.aktarmaBeklemeText}>
                  {aktarmaSehri}'de {aktarmaBekleme ? sureFormatla(aktarmaBekleme) : "—"} bekleme
                  {rota.bacak1?.varis && rota.bacak2?.kalkis && (
                    ` (${rota.bacak1.varis} → ${rota.bacak2.kalkis})`
                  )}
                </Text>
              </View>
              <View style={styles.aktarmaCizgi} />
            </View>

            {/* Bacak 2 */}
            <View style={styles.bacakKart}>
              <View style={styles.bacakHeader}>
                <View style={[styles.bacakNumara, { backgroundColor: "#16A34A" }]}><Text style={styles.bacakNo}>2</Text></View>
                <Text style={styles.bacakFirma}>{rota.bacak2?.firma}</Text>
                <Text style={styles.bacakFiyat}>{rota.bacak2?.fiyat || 0} ₺</Text>
              </View>
              <View style={styles.bacakGuzergah}>
                <View style={styles.bacakNokta}>
                  <View style={[styles.miniNokta, { backgroundColor: "#F59E0B" }]} />
                  <Text style={styles.bacakSehir}>{aktarmaSehri}</Text>
                  <Text style={styles.bacakSaat}>{rota.bacak2?.kalkis || "—"}</Text>
                </View>
                <View style={styles.bacakOk}>
                  <Feather name="arrow-down" size={12} color="#9CA3AF" />
                </View>
                <View style={styles.bacakNokta}>
                  <View style={[styles.miniNokta, { backgroundColor: "#16A34A" }]} />
                  <Text style={styles.bacakSehir}>{rota.bacak2?.varis_sehir}</Text>
                  <Text style={styles.bacakSaat}>{rota.bacak2?.varis || "—"}</Text>
                </View>
              </View>
              <View style={styles.bacakDetay}>
                <View style={styles.bacakDetayItem}>
                  <Feather name="users" size={12} color={rota.bacak2?.musait_koltuk <= 5 ? "#DC2626" : "#16A34A"} />
                  <Text style={[styles.bacakDetayText, { color: rota.bacak2?.musait_koltuk <= 5 ? "#DC2626" : "#16A34A" }]}>
                    {rota.bacak2?.musait_koltuk || 0} koltuk
                  </Text>
                </View>
              </View>
            </View>
          </>
        )}

        {/* Multi-Transfer Timeline (2+ aktarma) */}
        {isMultiTransfer && rota.bacaklar && (
          <>
            {rota.bacaklar.map((bacak, index) => {
              const isFirst = index === 0;
              const isLast = index === rota.bacaklar.length - 1;
              const bacakRenk = isFirst ? renkler.anaRenk : isLast ? "#16A34A" : "#F59E0B";
              
              return (
                <React.Fragment key={index}>
                  {/* Bacak Kartı */}
                  <View style={styles.bacakKart}>
                    <View style={styles.bacakHeader}>
                      <View style={[styles.bacakNumara, { backgroundColor: bacakRenk }]}>
                        <Text style={styles.bacakNo}>{index + 1}</Text>
                      </View>
                      <Text style={styles.bacakFirma}>{bacak.firma}</Text>
                      <Text style={styles.bacakFiyat}>{bacak.fiyat || 0} ₺</Text>
                    </View>
                    <View style={styles.bacakGuzergah}>
                      <View style={styles.bacakNokta}>
                        <View style={[styles.miniNokta, { backgroundColor: bacakRenk }]} />
                        <Text style={styles.bacakSehir}>{bacak.kalkis_sehir}</Text>
                        <Text style={styles.bacakSaat}>{bacak.kalkis || "—"}</Text>
                      </View>
                      <View style={styles.bacakOk}>
                        <Feather name="arrow-down" size={12} color="#9CA3AF" />
                      </View>
                      <View style={styles.bacakNokta}>
                        <View style={[styles.miniNokta, { backgroundColor: isLast ? "#16A34A" : "#F59E0B" }]} />
                        <Text style={styles.bacakSehir}>{bacak.varis_sehir}</Text>
                        <Text style={styles.bacakSaat}>{bacak.varis || "—"}</Text>
                      </View>
                    </View>
                    {bacak.musait_koltuk > 0 && (
                      <View style={styles.bacakDetay}>
                        <View style={styles.bacakDetayItem}>
                          <Feather name="users" size={12} color={bacak.musait_koltuk <= 5 ? "#DC2626" : "#16A34A"} />
                          <Text style={[styles.bacakDetayText, { color: bacak.musait_koltuk <= 5 ? "#DC2626" : "#16A34A" }]}>
                            {bacak.musait_koltuk} koltuk
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>

                  {/* Aktarma Bekleme (son bacak hariç) */}
                  {!isLast && (
                    <View style={styles.aktarmaBekleme}>
                      <View style={styles.aktarmaCizgi} />
                      <View style={styles.aktarmaInfo}>
                        <Feather name="refresh-cw" size={14} color="#8B5CF6" />
                        <Text style={styles.aktarmaBeklemeText}>
                          {bacak.varis_sehir}'de aktarma
                        </Text>
                      </View>
                      <View style={styles.aktarmaCizgi} />
                    </View>
                  )}
                </React.Fragment>
              );
            })}
          </>
        )}
      </View>

      {/* DETAYLAR SATIRI */}
      <View style={styles.detaylar}>
        {/* Süre */}
        {toplamSure && (
          <View style={styles.detayItem}>
            <Feather name="clock" size={14} color={renkler.metinAcik} />
            <Text style={styles.detayText}>{sureFormatla(toplamSure)}</Text>
          </View>
        )}

        {/* Mesafe */}
        {toplamMesafe && (
          <View style={styles.detayItem}>
            <Feather name="map-pin" size={14} color={renkler.metinAcik} />
            <Text style={styles.detayText}>{mesafeFormatla(toplamMesafe)}</Text>
          </View>
        )}

        {/* Otobüs Tipi */}
        <View style={styles.detayItem}>
          <MaterialCommunityIcons name="seat-passenger" size={14} color={renkler.metinAcik} />
          <Text style={styles.detayText}>{otobusTipi.tip}</Text>
        </View>

        {/* Tarih */}
        {rota.tarih && (
          <View style={styles.detayItem}>
            <Feather name="calendar" size={14} color={renkler.metinAcik} />
            <Text style={styles.detayText}>{rota.tarih}</Text>
          </View>
        )}
      </View>

      {/* ALT BAR: Koltuk Durumu */}
      <View style={styles.altBar}>
        <View style={styles.koltukContainer}>
          <View style={[styles.koltukIndicator, { backgroundColor: koltukRenk }]} />
          <Feather name="users" size={14} color={koltukRenk} />
          <Text style={[styles.koltukText, { color: koltukRenk }]}>
            {koltuk} koltuk {koltukDurumu === "az" ? "(Son birkaç!)" : "müsait"}
          </Text>
        </View>
        <View style={styles.detayButon}>
          <Text style={styles.detayButonText}>Detay</Text>
          <Feather name="chevron-right" size={16} color={renkler.anaRenk} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  kart: {
    backgroundColor: renkler.beyaz,
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
  },
  
  // HEADER
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  headerSol: {
    flex: 1,
    marginRight: 12,
  },
  firmaRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  firmaIkon: {
    marginRight: 6,
  },
  firmaAdi: {
    fontSize: 15,
    fontWeight: "600",
    color: renkler.metinKoyu,
    flex: 1,
  },
  firma2: {
    fontSize: 12,
    color: renkler.metinAcik,
    marginTop: 2,
    marginLeft: 24,
  },
  headerSag: {
    alignItems: "flex-end",
  },
  fiyat: {
    fontSize: 20,
    fontWeight: "700",
    color: renkler.anaRenk,
  },
  badge: {
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  direktBadge: {
    backgroundColor: "#DCFCE7",
  },
  aktarmaBadge: {
    backgroundColor: "#FEF3C7",
  },
  multiTransferBadge: {
    backgroundColor: "#EDE9FE",
  },
  badgeMetin: {
    fontSize: 11,
    fontWeight: "600",
  },
  direktMetin: {
    color: "#166534",
  },
  aktarmaMetin: {
    color: "#B45309",
  },
  multiTransferMetin: {
    color: "#7C3AED",
  },

  // TIMELINE
  timeline: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  timelineRow: {
    flexDirection: "row",
    minHeight: 36,
  },
  sonRow: {
    minHeight: 24,
  },
  timelineSol: {
    width: 20,
    alignItems: "center",
  },
  nokta: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
  },
  kalkisNokta: {
    backgroundColor: renkler.beyaz,
    borderColor: renkler.anaRenk,
  },
  aktarmaNokta: {
    backgroundColor: "#FEF3C7",
    borderColor: "#F59E0B",
  },
  varisNokta: {
    backgroundColor: "#16A34A",
    borderColor: "#16A34A",
  },
  cizgi: {
    flex: 1,
    width: 2,
    backgroundColor: "#E5E7EB",
    marginVertical: 2,
  },
  timelineIcerik: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingLeft: 10,
    paddingBottom: 8,
  },
  sehirAdi: {
    fontSize: 14,
    fontWeight: "500",
    color: renkler.metinKoyu,
  },
  saatText: {
    fontSize: 14,
    fontWeight: "600",
    color: renkler.metinKoyu,
  },
  aktarmaBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  aktarmaText: {
    fontSize: 12,
    color: "#B45309",
    fontWeight: "500",
    marginLeft: 4,
  },
  beklemeText: {
    fontSize: 11,
    color: "#92400E",
    marginLeft: 4,
  },

  // BACAK KARTLARI (Aktarmalı seferler için)
  bacakKart: {
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    padding: 10,
    marginBottom: 4,
  },
  bacakHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  bacakNumara: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: renkler.anaRenk,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  bacakNo: {
    fontSize: 11,
    fontWeight: "700",
    color: renkler.beyaz,
  },
  bacakFirma: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: renkler.metinKoyu,
  },
  bacakFiyat: {
    fontSize: 13,
    fontWeight: "600",
    color: renkler.anaRenk,
  },
  bacakGuzergah: {
    marginLeft: 28,
  },
  bacakNokta: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 2,
  },
  miniNokta: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
  },
  bacakSehir: {
    flex: 1,
    fontSize: 12,
    color: renkler.metinKoyu,
  },
  bacakSaat: {
    fontSize: 12,
    fontWeight: "500",
    color: renkler.metinKoyu,
  },
  bacakOk: {
    marginLeft: 0,
    paddingVertical: 2,
  },
  bacakDetay: {
    flexDirection: "row",
    marginTop: 6,
    marginLeft: 28,
  },
  bacakDetayItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
  },
  bacakDetayText: {
    fontSize: 11,
    marginLeft: 4,
    fontWeight: "500",
  },
  aktarmaBekleme: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  aktarmaCizgi: {
    flex: 1,
    height: 1,
    backgroundColor: "#E5E7EB",
  },
  aktarmaInfo: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
  },
  aktarmaBeklemeText: {
    fontSize: 11,
    color: "#F59E0B",
    marginLeft: 4,
    fontWeight: "500",
  },

  // DETAYLAR
  detaylar: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 14,
    paddingBottom: 10,
    gap: 12,
  },
  detayItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  detayText: {
    fontSize: 12,
    color: renkler.metinAcik,
    marginLeft: 4,
  },

  // ALT BAR
  altBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#F9FAFB",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  koltukContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  koltukIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  koltukText: {
    fontSize: 13,
    fontWeight: "500",
    marginLeft: 4,
  },
  detayButon: {
    flexDirection: "row",
    alignItems: "center",
  },
  detayButonText: {
    fontSize: 13,
    color: renkler.anaRenk,
    fontWeight: "500",
  },
});

// BiletKarti karşılaştırma fonksiyonu - gereksiz render'ları önler
const areEqual = (prevProps, nextProps) => {
  if (!prevProps.rota || !nextProps.rota) return false;
  return (
    prevProps.rota.id === nextProps.rota.id &&
    prevProps.rota.toplam_fiyat === nextProps.rota.toplam_fiyat &&
    prevProps.rota.musait_koltuk === nextProps.rota.musait_koltuk
  );
};

export default memo(BiletKarti, areEqual);
