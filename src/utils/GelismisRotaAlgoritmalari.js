// src/utils/GelismisRotaAlgoritmalari.js
// Gerçek otobüs firması mantığını taklit eden gelişmiş rota algoritmaları

import { sehirKoordinatlari, mesafeHesapla } from '../constants/SehirKoordinatlari';
import { yolAgi, komsulariGetir } from '../constants/YolAgi';
import {
  OTOBUS_FIRMALARI,
  HUB_SEHIRLER,
  HUB_PUANLARI,
  BAZ_FIYAT_KM,
  MESAFE_INDIRIMLERI,
  direktSeferFirmalariBul,
} from '../constants/OtobusFirmalari';

// ============ FIYAT HESAPLAMA ============

/**
 * İki şehir arası tahmini fiyat hesaplar
 * @param {string} kalkis 
 * @param {string} varis 
 * @param {number} fiyatCarpani - Firma fiyat çarpanı
 * @returns {number} TL cinsinden fiyat
 */
export const fiyatHesapla = (kalkis, varis, fiyatCarpani = 1.0) => {
  const mesafe = mesafeHesapla(kalkis, varis) * 1.3; // Karayolu faktörü
  
  // Mesafe bazlı indirim
  let indirimOrani = 1.0;
  for (const [esik, oran] of Object.entries(MESAFE_INDIRIMLERI).sort((a, b) => b[0] - a[0])) {
    if (mesafe >= parseInt(esik)) {
      indirimOrani = oran;
      break;
    }
  }
  
  // Baz fiyat: mesafe * km başı fiyat * indirim * firma çarpanı
  let fiyat = mesafe * BAZ_FIYAT_KM * indirimOrani * fiyatCarpani;
  
  // Minimum fiyat kontrolü (en az 80 TL)
  fiyat = Math.max(fiyat, 80);
  
  // 5'in katına yuvarla
  return Math.round(fiyat / 5) * 5;
};

/**
 * Toplam rota fiyatını hesaplar (tüm bacaklar dahil)
 */
export const toplamRotaFiyatiHesapla = (bacaklar) => {
  return bacaklar.reduce((toplam, bacak) => toplam + (bacak.fiyat || 0), 0);
};

// ============ GELİŞMİŞ A* ALGORİTMASI ============

/**
 * Priority Queue (Min-Heap)
 */
class OncelikKuyrugu {
  constructor() {
    this.heap = [];
  }

  ekle(eleman, oncelik) {
    this.heap.push({ eleman, oncelik });
    this._yukariTasi(this.heap.length - 1);
  }

  cikar() {
    if (this.heap.length === 0) return null;
    const min = this.heap[0];
    const son = this.heap.pop();
    if (this.heap.length > 0) {
      this.heap[0] = son;
      this._asagiTasi(0);
    }
    return min;
  }

  bosMu() {
    return this.heap.length === 0;
  }

  _yukariTasi(i) {
    while (i > 0) {
      const parent = Math.floor((i - 1) / 2);
      if (this.heap[parent].oncelik <= this.heap[i].oncelik) break;
      [this.heap[parent], this.heap[i]] = [this.heap[i], this.heap[parent]];
      i = parent;
    }
  }

  _asagiTasi(i) {
    while (true) {
      let min = i;
      const sol = 2 * i + 1;
      const sag = 2 * i + 2;
      if (sol < this.heap.length && this.heap[sol].oncelik < this.heap[min].oncelik) min = sol;
      if (sag < this.heap.length && this.heap[sag].oncelik < this.heap[min].oncelik) min = sag;
      if (min === i) break;
      [this.heap[min], this.heap[i]] = [this.heap[i], this.heap[min]];
      i = min;
    }
  }
}

/**
 * Gelişmiş maliyet hesaplayıcı
 * Sadece mesafe değil, firma varlığı, hub bonus, fiyat gibi faktörleri de hesaba katar
 */
const gelismisMaliyetHesapla = (onceki, mevcut, hedef, mod = 'mesafe') => {
  const mesafe = mesafeHesapla(onceki, mevcut) * 1.3;
  
  // Hub bonusu - hub şehirlerden geçmek avantajlı
  const hubBonus = HUB_PUANLARI[mevcut] ? (HUB_PUANLARI[mevcut] / 100) * 50 : 0;
  
  // Firma varlığı bonusu - bu güzergahta firma var mı?
  const firmalar = direktSeferFirmalariBul(onceki, mevcut);
  const firmaBonusu = firmalar.length > 0 ? 100 : 0; // Firma varsa bonus
  
  // Fiyat tahmini
  const tahminiF = fiyatHesapla(onceki, mevcut, 1.0);
  
  switch (mod) {
    case 'fiyat':
      // Fiyat optimizasyonu: fiyat ağırlıklı
      return tahminiF - hubBonus - firmaBonusu;
    case 'hiz':
      // Hız optimizasyonu: mesafe ağırlıklı
      return mesafe - hubBonus;
    case 'dengeli':
    default:
      // Dengeli: mesafe + fiyat kombinasyonu
      return mesafe * 0.5 + tahminiF * 0.3 - hubBonus - firmaBonusu * 0.2;
  }
};

/**
 * Gelişmiş A* - Fiyat, mesafe ve hub faktörlerini dikkate alır
 * @param {string} baslangic 
 * @param {string} hedef 
 * @param {string} optimizasyonModu - 'mesafe' | 'fiyat' | 'dengeli'
 * @returns {Object|null}
 */
export const gelismisAStarRota = (baslangic, hedef, optimizasyonModu = 'dengeli') => {
  if (!sehirKoordinatlari[baslangic] || !sehirKoordinatlari[hedef]) {
    console.warn(`Şehir bulunamadı: ${baslangic} veya ${hedef}`);
    return null;
  }

  if (baslangic === hedef) {
    return { yol: [baslangic], maliyet: 0, tahminiF: 0 };
  }

  const acikKume = new OncelikKuyrugu();
  const gSkor = new Map();
  const fiyatSkor = new Map();
  const onceki = new Map();
  const kapaliKume = new Set();

  gSkor.set(baslangic, 0);
  fiyatSkor.set(baslangic, 0);
  acikKume.ekle(baslangic, mesafeHesapla(baslangic, hedef));

  while (!acikKume.bosMu()) {
    const { eleman: mevcut } = acikKume.cikar();

    if (mevcut === hedef) {
      // Yolu geri izle
      const yol = [hedef];
      let adim = hedef;
      while (onceki.has(adim)) {
        adim = onceki.get(adim);
        yol.unshift(adim);
      }
      
      return {
        yol,
        maliyet: gSkor.get(hedef),
        tahminiF: fiyatSkor.get(hedef),
      };
    }

    if (kapaliKume.has(mevcut)) continue;
    kapaliKume.add(mevcut);

    // Komşuları genişlet - hem yol ağı hem de hub bağlantıları
    const komsular = new Set(komsulariGetir(mevcut));
    
    // Hub şehirlerden tüm diğer hub şehirlere atlama yapılabilir (express servis)
    if (HUB_PUANLARI[mevcut] && HUB_PUANLARI[mevcut] >= 55) {
      [...HUB_SEHIRLER.MEGA, ...HUB_SEHIRLER.BOLGESEL].forEach(hub => {
        if (hub !== mevcut) komsular.add(hub);
      });
    }

    for (const komsu of komsular) {
      if (kapaliKume.has(komsu)) continue;

      const kenarMaliyeti = gelismisMaliyetHesapla(mevcut, komsu, hedef, optimizasyonModu);
      const yeniFiyat = (fiyatSkor.get(mevcut) || 0) + fiyatHesapla(mevcut, komsu, 1.0);
      const yeniGSkor = (gSkor.get(mevcut) || 0) + kenarMaliyeti;

      if (!gSkor.has(komsu) || yeniGSkor < gSkor.get(komsu)) {
        onceki.set(komsu, mevcut);
        gSkor.set(komsu, yeniGSkor);
        fiyatSkor.set(komsu, yeniFiyat);
        
        const heuristik = mesafeHesapla(komsu, hedef);
        acikKume.ekle(komsu, yeniGSkor + heuristik);
      }
    }
  }

  return null;
};

// ============ ÇOKLU ROTA BULMA ============

/**
 * Birden fazla alternatif rota bulur
 * Her rota farklı hub'lardan geçer
 */
export const cokluRotaBul = (baslangic, hedef, maksRota = 5) => {
  const rotalar = [];
  const denenmisYollar = new Set();

  // 1. En kısa mesafe rotası
  const mesafeRotasi = gelismisAStarRota(baslangic, hedef, 'mesafe');
  if (mesafeRotasi) {
    mesafeRotasi.tip = 'en_kisa';
    rotalar.push(mesafeRotasi);
    denenmisYollar.add(JSON.stringify(mesafeRotasi.yol));
  }

  // 2. En ucuz fiyat rotası
  const fiyatRotasi = gelismisAStarRota(baslangic, hedef, 'fiyat');
  if (fiyatRotasi && !denenmisYollar.has(JSON.stringify(fiyatRotasi.yol))) {
    fiyatRotasi.tip = 'en_ucuz';
    rotalar.push(fiyatRotasi);
    denenmisYollar.add(JSON.stringify(fiyatRotasi.yol));
  }

  // 3. Dengeli rota
  const dengeliRota = gelismisAStarRota(baslangic, hedef, 'dengeli');
  if (dengeliRota && !denenmisYollar.has(JSON.stringify(dengeliRota.yol))) {
    dengeliRota.tip = 'onerilen';
    rotalar.push(dengeliRota);
    denenmisYollar.add(JSON.stringify(dengeliRota.yol));
  }

  // 4. Farklı hub'lardan geçen alternatif rotalar
  const tumHublar = [...HUB_SEHIRLER.MEGA, ...HUB_SEHIRLER.BOLGESEL];
  
  for (const hub of tumHublar) {
    if (rotalar.length >= maksRota) break;
    if (hub === baslangic || hub === hedef) continue;

    // Bu hub üzerinden rota hesapla
    const ilkBacak = gelismisAStarRota(baslangic, hub, 'dengeli');
    const ikinciBacak = gelismisAStarRota(hub, hedef, 'dengeli');

    if (ilkBacak && ikinciBacak) {
      const tamYol = [...ilkBacak.yol.slice(0, -1), ...ikinciBacak.yol];
      const yolKey = JSON.stringify(tamYol);
      
      if (!denenmisYollar.has(yolKey)) {
        denenmisYollar.add(yolKey);
        
        const toplam = {
          yol: tamYol,
          maliyet: ilkBacak.maliyet + ikinciBacak.maliyet,
          tahminiF: ilkBacak.tahminiF + ikinciBacak.tahminiF,
          tip: 'alternatif',
          aktarmaHub: hub,
        };
        
        rotalar.push(toplam);
      }
    }
  }

  // Fiyata göre sırala
  return rotalar.sort((a, b) => a.tahminiF - b.tahminiF).slice(0, maksRota);
};

// ============ AKILLI AKTARMA ÖNERİSİ ============

/**
 * İki şehir arasında geçerli bağlantı var mı kontrol eder
 * Firma rotası VEYA yol ağı bağlantısı VEYA makul mesafe yeterli
 */
const baglantiVarMi = (sehir1, sehir2) => {
  // Önce firma rotalarına bak
  const firmalar = direktSeferFirmalariBul(sehir1, sehir2);
  if (firmalar.length > 0) {
    return { var: true, firmalar, tip: 'firma' };
  }
  
  // Sonra yol ağı bağlantısına bak
  const komsular1 = komsulariGetir(sehir1);
  
  // Direkt komşu mu?
  if (komsular1 && komsular1.includes(sehir2)) {
    return { var: true, firmalar: [], tip: 'yol' };
  }
  
  // Mesafe makul mü? (600km altı kabul edilebilir - Türkiye genelinde otobüs seferleri için)
  const mesafe = mesafeHesapla(sehir1, sehir2);
  if (mesafe < 600) {
    return { var: true, firmalar: [], tip: 'yakin' };
  }
  
  return { var: false, firmalar: [], tip: null };
};

/**
 * Verilen güzergah için en uygun aktarma noktalarını önerir
 * Hem firma rotalarını hem de yol ağı bağlantılarını kullanır
 */
export const akillIAktarmaOnerisi = (kalkis, varis) => {
  if (__DEV__) console.log(`🚌 Gelişmiş aktarma analizi: ${kalkis} -> ${varis}`);

  const oneriler = [];
  const direktFirmalar = direktSeferFirmalariBul(kalkis, varis);

  // Direkt sefer varsa önce onu döndür
  if (direktFirmalar.length > 0) {
    if (__DEV__) console.log(`✅ Direkt sefer var: ${direktFirmalar.map(f => f.firma).join(', ')}`);
    return {
      direktVar: true,
      direktFirmalar,
      aktarmaOnerisi: [],
    };
  }

  // Potansiyel aktarma noktaları: hub'lar + yol ağındaki komşular
  const kalkisKomsulari = komsulariGetir(kalkis) || [];
  const varisKomsulari = komsulariGetir(varis) || [];
  const tumHublar = [...HUB_SEHIRLER.MEGA, ...HUB_SEHIRLER.BOLGESEL, ...HUB_SEHIRLER.ALT];
  
  // Tüm potansiyel aktarma noktalarını birleştir
  const potansiyelAktarmalar = new Set([...tumHublar, ...kalkisKomsulari, ...varisKomsulari]);
  if (__DEV__) console.log(`📊 Potansiyel aktarma noktası sayısı: ${potansiyelAktarmalar.size}`);
  
  const direktMesafe = mesafeHesapla(kalkis, varis) * 1.3;
  if (__DEV__) console.log(`📏 Direkt mesafe (x1.3): ${Math.round(direktMesafe)} km`);

  let kontolEdilen = 0;
  let gecerliOlan = 0;

  for (const hub of potansiyelAktarmalar) {
    if (hub === kalkis || hub === varis) continue;
    kontolEdilen++;

    const ilkBacak = baglantiVarMi(kalkis, hub);
    const ikinciBacak = baglantiVarMi(hub, varis);

    // Her iki bacakta da bağlantı varsa geçerli aktarma noktası
    if (ilkBacak.var && ikinciBacak.var) {
      gecerliOlan++;
      const ilkBacakMesafe = mesafeHesapla(kalkis, hub) * 1.3;
      const ikinciBacakMesafe = mesafeHesapla(hub, varis) * 1.3;
      const toplamMesafe = ilkBacakMesafe + ikinciBacakMesafe;
      
      // Çok uzun sapma yapma (direkt mesafenin 3 katından fazla olmasın)
      if (toplamMesafe > direktMesafe * 3) continue;
      
      const mesafeVerimi = direktMesafe / toplamMesafe;

      // Fiyat hesapla
      const ilkCarpan = ilkBacak.firmalar.length > 0 
        ? Math.min(...ilkBacak.firmalar.map(f => f.fiyatCarpani)) 
        : 1.0;
      const ikinciCarpan = ikinciBacak.firmalar.length > 0 
        ? Math.min(...ikinciBacak.firmalar.map(f => f.fiyatCarpani)) 
        : 1.0;
      
      const ilkBacakFiyat = fiyatHesapla(kalkis, hub, ilkCarpan);
      const ikinciBacakFiyat = fiyatHesapla(hub, varis, ikinciCarpan);
      const toplamFiyat = ilkBacakFiyat + ikinciBacakFiyat;

      // Skor hesapla - firma olan rotalar ve hub'lar bonus alır
      const hubPuani = HUB_PUANLARI[hub] || 0;
      const firmaBonus = (ilkBacak.tip === 'firma' ? 20 : 0) + (ikinciBacak.tip === 'firma' ? 20 : 0);
      const skor = hubPuani * 2 + mesafeVerimi * 100 + firmaBonus - toplamFiyat / 15;

      oneriler.push({
        aktarmaSehri: hub,
        hubPuani,
        ilkBacak: {
          firmalar: ilkBacak.firmalar,
          fiyat: ilkBacakFiyat,
          mesafe: Math.round(ilkBacakMesafe),
          baglantiTipi: ilkBacak.tip,
        },
        ikinciBacak: {
          firmalar: ikinciBacak.firmalar,
          fiyat: ikinciBacakFiyat,
          mesafe: Math.round(ikinciBacakMesafe),
          baglantiTipi: ikinciBacak.tip,
        },
        toplamFiyat,
        bacak1Fiyat: ilkBacakFiyat,
        bacak2Fiyat: ikinciBacakFiyat,
        toplamMesafe: Math.round(toplamMesafe),
        mesafeVerimi: Math.round(mesafeVerimi * 100),
        skor,
      });
    }
  }

  // Skora göre sırala
  oneriler.sort((a, b) => b.skor - a.skor);

  if (__DEV__) {
    console.log(`✓ Kontrol edilen: ${kontolEdilen}, Geçerli bağlantı: ${gecerliOlan}`);
    console.log(`📍 ${oneriler.length} aktarma noktası bulundu`);
    if (oneriler.length > 0) {
      console.log(`🏆 En iyi aktarma: ${oneriler[0].aktarmaSehri} (${oneriler[0].toplamFiyat} TL)`);
    }
  }

  return {
    direktVar: false,
    direktFirmalar: [],
    aktarmaOnerisi: oneriler.slice(0, 10), // En iyi 10 öneri
  };
};

// ============ ÇOKLU BACAKLI ROTA (2+ AKTARMA) ============

/**
 * 2 veya daha fazla aktarmalı rotalar için optimum yolu bulur
 * Uzak mesafeler için ekonomik seçenekler sunar
 */
export const cokluAktarmaliRotaBul = (kalkis, varis, maksAktarma = 3) => {
  if (__DEV__) console.log(`🔀 Çoklu aktarma analizi (max ${maksAktarma}): ${kalkis} -> ${varis}`);

  const rotalar = [];
  const direktMesafe = mesafeHesapla(kalkis, varis) * 1.3;

  // 1 aktarmalı rotalar
  const tekAktarma = akillIAktarmaOnerisi(kalkis, varis);
  if (!tekAktarma.direktVar && tekAktarma.aktarmaOnerisi.length > 0) {
    for (const oneri of tekAktarma.aktarmaOnerisi.slice(0, 5)) {
      rotalar.push({
        aktarmaSayisi: 1,
        aktarmaSehirleri: [oneri.aktarmaSehri],
        aktarmalar: [oneri.aktarmaSehri], // Eski format uyumluluğu
        bacaklar: [
          { kalkis, varis: oneri.aktarmaSehri, firmalar: oneri.ilkBacak.firmalar, fiyat: oneri.ilkBacak.fiyat },
          { kalkis: oneri.aktarmaSehri, varis, firmalar: oneri.ikinciBacak.firmalar, fiyat: oneri.ikinciBacak.fiyat },
        ],
        toplamFiyat: oneri.toplamFiyat,
        toplamMesafe: oneri.toplamMesafe,
        verimlilik: oneri.mesafeVerimi,
        hubPuani: oneri.hubPuani,
      });
    }
  }

  // 2 aktarmalı rotalar (orta-uzun mesafeler için)
  if (maksAktarma >= 2 && direktMesafe > 400) {
    const megaHublar = HUB_SEHIRLER.MEGA;
    const bolgeselHublar = HUB_SEHIRLER.BOLGESEL;

    for (const hub1 of [...megaHublar, ...bolgeselHublar]) {
      if (hub1 === kalkis || hub1 === varis) continue;
      
      for (const hub2 of [...megaHublar, ...bolgeselHublar]) {
        if (hub2 === kalkis || hub2 === varis || hub2 === hub1) continue;

        // Sıralama mantıklı mı kontrol et (kalkış -> hub1 -> hub2 -> varış)
        const mesafe1 = mesafeHesapla(kalkis, hub1);
        const mesafe2 = mesafeHesapla(hub1, hub2);
        const mesafe3 = mesafeHesapla(hub2, varis);
        
        // Toplam mesafe direkt mesafenin 3 katından fazlaysa atla
        const toplamMesafe = (mesafe1 + mesafe2 + mesafe3) * 1.3;
        if (toplamMesafe > direktMesafe * 3) continue;

        // Bağlantı var mı kontrol et (firma veya yol ağı)
        const baglanti1 = baglantiVarMi(kalkis, hub1);
        const baglanti2 = baglantiVarMi(hub1, hub2);
        const baglanti3 = baglantiVarMi(hub2, varis);

        if (baglanti1.var && baglanti2.var && baglanti3.var) {
          const carpan1 = baglanti1.firmalar.length > 0 ? Math.min(...baglanti1.firmalar.map(f => f.fiyatCarpani)) : 1.0;
          const carpan2 = baglanti2.firmalar.length > 0 ? Math.min(...baglanti2.firmalar.map(f => f.fiyatCarpani)) : 1.0;
          const carpan3 = baglanti3.firmalar.length > 0 ? Math.min(...baglanti3.firmalar.map(f => f.fiyatCarpani)) : 1.0;
          
          const fiyat1 = fiyatHesapla(kalkis, hub1, carpan1);
          const fiyat2 = fiyatHesapla(hub1, hub2, carpan2);
          const fiyat3 = fiyatHesapla(hub2, varis, carpan3);
          const toplamFiyat = fiyat1 + fiyat2 + fiyat3;

          rotalar.push({
            aktarmaSayisi: 2,
            aktarmaSehirleri: [hub1, hub2],
            aktarmalar: [hub1, hub2], // Eski format uyumluluğu
            bacaklar: [
              { kalkis, varis: hub1, firmalar: baglanti1.firmalar, fiyat: fiyat1 },
              { kalkis: hub1, varis: hub2, firmalar: baglanti2.firmalar, fiyat: fiyat2 },
              { kalkis: hub2, varis, firmalar: baglanti3.firmalar, fiyat: fiyat3 },
            ],
            toplamFiyat,
            toplamMesafe: Math.round(toplamMesafe),
            verimlilik: Math.round((direktMesafe / toplamMesafe) * 100),
          });
        }
      }
    }
  }

  // 3 aktarmalı rotalar (çok uzun mesafeler için - örn: Edirne -> Hakkari)
  if (maksAktarma >= 3 && direktMesafe > 700) {
    const megaHublar = HUB_SEHIRLER.MEGA;
    
    // Sadece mega hub'ları kullan (Istanbul, Ankara, Izmir)
    for (const hub1 of megaHublar) {
      if (hub1 === kalkis || hub1 === varis) continue;
      
      for (const hub2 of megaHublar) {
        if (hub2 === kalkis || hub2 === varis || hub2 === hub1) continue;
        
        for (const hub3 of [...megaHublar, ...HUB_SEHIRLER.BOLGESEL.slice(0, 5)]) {
          if (hub3 === kalkis || hub3 === varis || hub3 === hub1 || hub3 === hub2) continue;
          
          const mesafe1 = mesafeHesapla(kalkis, hub1);
          const mesafe2 = mesafeHesapla(hub1, hub2);
          const mesafe3 = mesafeHesapla(hub2, hub3);
          const mesafe4 = mesafeHesapla(hub3, varis);
          
          const toplamMesafe = (mesafe1 + mesafe2 + mesafe3 + mesafe4) * 1.3;
          if (toplamMesafe > direktMesafe * 3.5) continue;
          
          const baglanti1 = baglantiVarMi(kalkis, hub1);
          const baglanti2 = baglantiVarMi(hub1, hub2);
          const baglanti3 = baglantiVarMi(hub2, hub3);
          const baglanti4 = baglantiVarMi(hub3, varis);
          
          if (baglanti1.var && baglanti2.var && baglanti3.var && baglanti4.var) {
            const fiyat1 = fiyatHesapla(kalkis, hub1, 1.0);
            const fiyat2 = fiyatHesapla(hub1, hub2, 1.0);
            const fiyat3 = fiyatHesapla(hub2, hub3, 1.0);
            const fiyat4 = fiyatHesapla(hub3, varis, 1.0);
            const toplamFiyat = fiyat1 + fiyat2 + fiyat3 + fiyat4;
            
            rotalar.push({
              aktarmaSayisi: 3,
              aktarmaSehirleri: [hub1, hub2, hub3],
              aktarmalar: [hub1, hub2, hub3],
              bacaklar: [
                { kalkis, varis: hub1, fiyat: fiyat1 },
                { kalkis: hub1, varis: hub2, fiyat: fiyat2 },
                { kalkis: hub2, varis: hub3, fiyat: fiyat3 },
                { kalkis: hub3, varis, fiyat: fiyat4 },
              ],
              toplamFiyat,
              toplamMesafe: Math.round(toplamMesafe),
              verimlilik: Math.round((direktMesafe / toplamMesafe) * 100),
            });
          }
        }
      }
    }
  }

  // Fiyata göre sırala ve en iyi 10'u döndür
  rotalar.sort((a, b) => a.toplamFiyat - b.toplamFiyat);
  
  if (__DEV__) console.log(`📋 Toplam ${rotalar.length} çoklu aktarmalı rota bulundu`);
  
  return rotalar.slice(0, 10);
};

// ============ EXPORT ============

export default {
  fiyatHesapla,
  toplamRotaFiyatiHesapla,
  gelismisAStarRota,
  cokluRotaBul,
  akillIAktarmaOnerisi,
  cokluAktarmaliRotaBul,
};
