import { BILETCOM_BASE_URL } from '../constants/ApiConfig';
// Gelişmiş algoritma modülleri
import { 
  akillIAktarmaOnerisi, 
  cokluAktarmaliRotaBul, 
  cokluRotaBul 
} from '../utils/GelismisRotaAlgoritmalari';
import { 
  HUB_PUANLARI,
  HUB_SEHIRLER 
} from '../constants/OtobusFirmalari';
// Cache ve API yardımcıları
import { apiCache, withCache } from '../utils/ApiCache';
import { fetchWithRetry, fetchWithTimeout, globalRateLimiter } from '../utils/ApiHelpers';

// API timeout süresi (ms)
const API_TIMEOUT = 15000;
// API retry sayısı
const API_RETRY_COUNT = 2;

// Şehir ismini URL-uyumlu slug'a çevirir
export const slugOlustur = (sehirAdi) => {
  const turkceKarakterler = {
    'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u',
    'Ç': 'c', 'Ğ': 'g', 'İ': 'i', 'Ö': 'o', 'Ş': 's', 'Ü': 'u'
  };
  let slug = sehirAdi;
  for (const tr in turkceKarakterler) {
    slug = slug.replace(new RegExp(tr, 'g'), turkceKarakterler[tr]);
  }
  slug = slug.toLowerCase();
  slug = slug.replace(/\s+/g, '-');
  slug = slug.replace(/[^\w-]+/g, '');
  return slug;
};

// Bilet.com API'sinden belirli bir rota için biletleri alır
// Cache ve retry mekanizması ile optimize edildi
export const enUcuzBiletleriAlApi = async (kalkisSlug, varisSlug, tarih, useCache = true) => {
  const cacheKey = `biletler-${kalkisSlug}-${varisSlug}-${tarih}`;
  
  // Cache kontrolü
  if (useCache) {
    const cachedData = apiCache.get(cacheKey);
    if (cachedData) {
      if (__DEV__) console.log(`📦 Cache hit: ${cacheKey}`);
      return cachedData;
    }
  }
  
  const url = BILETCOM_BASE_URL;
  const payload = new URLSearchParams({
    origin: kalkisSlug,
    destination: varisSlug,
    date: tarih,
  }).toString();

  const headers = {
    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    "Accept": "application/json, text/javascript, */*; q=0.01",
    "X-Requested-With": "XMLHttpRequest",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  };

  try {
    // Rate limiter kontrolü
    await globalRateLimiter.waitForSlot();
    
    // Retry mekanizması ile API çağrısı
    const response = await fetchWithRetry(
      url,
      {
        method: 'POST',
        headers: headers,
        body: payload,
      },
      API_RETRY_COUNT,
      API_TIMEOUT
    );
    
    if (!response.ok) {
      if (__DEV__) console.error(`Bilet.com HTTP hatası! Durum: ${response.status}`);
      throw new Error(`HTTP hatası! Durum: ${response.status}`);
    }
    const data = await response.json();

    if (data.status === true && data.result && data.result.routes) {
      let routes = data.result.routes;
      const fiyatiVeMusaitligiAl = (route) => {
        const pricing = route.pricing || {};
        let fiyatAdaylari = [
          pricing.base_internet_price,
          pricing.internet_price,
          pricing.price,
        ].filter(p => typeof p === 'number');
        const fiyat = fiyatAdaylari.length > 0 ? Math.min(...fiyatAdaylari) : Infinity;
        const musaitKoltuk = pricing.available_seats || 0;
        return [fiyat, musaitKoltuk];
      };

      let gecerliRotalar = [];
      for (let route of routes) {
        if (Array.isArray(route)) {
          route = route[0];
          if (!route) continue;
        }
        const [fiyat, musaitKoltuk] = fiyatiVeMusaitligiAl(route);
        if (musaitKoltuk > 0 && fiyat !== Infinity) {
          gecerliRotalar.push(route);
        }
      }

      if (gecerliRotalar.length > 0) {
        const sortedRoutes = gecerliRotalar.sort((a, b) => fiyatiVeMusaitligiAl(a)[0] - fiyatiVeMusaitligiAl(b)[0]);
        
        // Cache'e kaydet
        if (useCache) {
          apiCache.set(cacheKey, sortedRoutes);
        }
        
        return sortedRoutes;
      }
      return [];
    }
    return [];
  } catch (error) {
    if (__DEV__) console.error(`Bilet.com API hatası (${kalkisSlug}-${varisSlug}, ${tarih}):`, error.message);
    return [];
  }
};



// Gelişmiş algoritma kullanarak olası aktarma noktalarını alır
export const olasiAktarmaNoktalariAlApi = async (kalkisSehri, varisSehri) => {
  try {
    if (__DEV__) {
      console.log(`🚌 Gelişmiş aktarma analizi başlatılıyor...`);
      console.log(`📍 ${kalkisSehri} -> ${varisSehri}`);
    }
    
    const analiz = akillIAktarmaOnerisi(kalkisSehri, varisSehri);
    
    if (analiz.direktVar) {
      if (__DEV__) console.log(`✅ Direkt sefer var: ${analiz.direktFirmalar.map(f => f.firma).join(', ')}`);
      return { direktVar: true, direktFirmalar: analiz.direktFirmalar, aktarmalar: [] };
    }
    
    if (analiz.aktarmaOnerisi.length > 0) {
      if (__DEV__) {
        console.log(`📍 ${analiz.aktarmaOnerisi.length} aktarma noktası bulundu`);
        console.log(`🏆 En iyi: ${analiz.aktarmaOnerisi[0].aktarmaSehri} (${analiz.aktarmaOnerisi[0].toplamFiyat} TL)`);
      }
      
      const aktarmaSehirleri = analiz.aktarmaOnerisi.map(o => o.aktarmaSehri);
      return { 
        direktVar: false, 
        aktarmalar: analiz.aktarmaOnerisi,
        aktarmaSehirleri 
      };
    }
    
    if (__DEV__) console.log(`ℹ️ Aktarma noktası bulunamadı`);
    return { direktVar: false, aktarmalar: [], aktarmaSehirleri: [] };
  } catch (error) {
    if (__DEV__) console.error("Aktarma noktası hesaplama hatası:", error);
    return { direktVar: false, aktarmalar: [], aktarmaSehirleri: [] };
  }
};

// Direkt ve aktarmalı en ucuz rotaları bulur (GELİŞMİŞ VERSİYON)
export const enUcuzRotalariBulApi = async (kalkisSehri, varisSehri, tarih, maksSonuc = 7) => {
  const kalkisSlug = slugOlustur(kalkisSehri);
  const varisSlug = slugOlustur(varisSehri);
  let tumRotalar = [];

  if (__DEV__) console.log(`🔍 Bilet arama başlatılıyor: ${kalkisSehri} -> ${varisSehri} (${tarih})`);
  
  // 1. Direkt Seferler
  if (__DEV__) console.log(`📌 Direkt seferler aranıyor...`);
  try {
    const direktBiletler = await enUcuzBiletleriAlApi(kalkisSlug, varisSlug, tarih);
    if (direktBiletler && direktBiletler.length > 0) {
      direktBiletler.forEach(bilet => {
        if (bilet?.pricing?.base_internet_price != null && bilet?.firm?.name) {
          tumRotalar.push({
            tip: "direct",
            segmentler: [bilet],
            toplam_fiyat: bilet.pricing.base_internet_price,
            firma: bilet.firm.name,
            kalkis_sehir: kalkisSehri,
            varis_sehir: varisSehri,
            kalkis_saati: bilet.departure?.humanized?.time || '',
            varis_saati: bilet.arrival?.humanized?.time || '',
            musait_koltuk: bilet.pricing.available_seats || 0,
            tarih: tarih,
            id: `direct-${bilet.id || Math.random()}`
          });
        }
      });
      if (__DEV__) console.log(`✅ ${tumRotalar.length} direkt sefer bulundu`);
    }
  } catch (error) {
    if (__DEV__) console.error("Direkt bilet arama sırasında hata:", error);
  }

  // 2. Gelişmiş Aktarma Analizi
  if (__DEV__) console.log(`🔀 Aktarma analizi yapılıyor...`);
  let aktarmaAnalizi;
  try {
    aktarmaAnalizi = await olasiAktarmaNoktalariAlApi(kalkisSehri, varisSehri);
  } catch (error) {
    if (__DEV__) console.error("Aktarma analizi hatası:", error);
    aktarmaAnalizi = { direktVar: false, aktarmalar: [], aktarmaSehirleri: [] };
  }

  // Aktarma önerilerini işle (en iyi 6 öneriyi kullan)
  const aktarmaOnerileri = aktarmaAnalizi.aktarmalar || [];
  const enIyiOneriler = aktarmaOnerileri.slice(0, 6);

  if (enIyiOneriler.length > 0) {
    if (__DEV__) {
      console.log(`📍 ${enIyiOneriler.length} aktarma noktası deneniyor...`);
      console.log(`   Öneriler: ${enIyiOneriler.map(o => `${o.aktarmaSehri} (${o.toplamFiyat}₺)`).join(', ')}`);
    }

    // Her aktarma önerisi için paralel sorgu
    const aktarmaSorgulari = enIyiOneriler.map(async (oneri) => {
      const aktarmaSehri = oneri.aktarmaSehri;
      const aktarmaSlug = slugOlustur(aktarmaSehri);

      try {
        if (__DEV__) console.log(`   🔸 1. Bacak: ${kalkisSehri} -> ${aktarmaSehri}`);
        const ilkBacakBiletleri = await enUcuzBiletleriAlApi(kalkisSlug, aktarmaSlug, tarih);

        if (!ilkBacakBiletleri || ilkBacakBiletleri.length === 0) {
          if (__DEV__) console.log(`   ⚠️ 1. Bacak API'den bulunamadı, atlanıyor`);
          return null;
        }
        
        const ilkBacak = ilkBacakBiletleri[0];

        // Zaman hesaplamaları
        let ilkBacakVarisDt;
        try {
          const [year, month, day] = tarih.split('.').reverse();
          const ilkBacakKalkisStr = ilkBacak.departure?.humanized?.time;
          const ilkBacakVarisStr = ilkBacak.arrival?.humanized?.time;

          if (!ilkBacakKalkisStr || !ilkBacakVarisStr) {
            return null;
          }

          const ilkBacakKalkisDt = new Date(`${year}-${month}-${day}T${ilkBacakKalkisStr}:00`);
          ilkBacakVarisDt = new Date(`${year}-${month}-${day}T${ilkBacakVarisStr}:00`);

          if (ilkBacakVarisDt <= ilkBacakKalkisDt) {
            ilkBacakVarisDt.setDate(ilkBacakVarisDt.getDate() + 1);
          }
        } catch (e) {
          return null;
        }

        // İkinci bacak tarihi
        const varisGun = ilkBacakVarisDt.getDate().toString().padStart(2, '0');
        const varisAy = (ilkBacakVarisDt.getMonth() + 1).toString().padStart(2, '0');
        const varisYil = ilkBacakVarisDt.getFullYear();
        const ikinciBacakTarih = `${varisGun}.${varisAy}.${varisYil}`;

        if (__DEV__) console.log(`   🔸 2. Bacak: ${aktarmaSehri} -> ${varisSehri} (${ikinciBacakTarih})`);
        const ikinciBacakBiletleri = await enUcuzBiletleriAlApi(aktarmaSlug, varisSlug, ikinciBacakTarih);

        if (!ikinciBacakBiletleri || ikinciBacakBiletleri.length === 0) {
          if (__DEV__) console.log(`   ⚠️ 2. Bacak API'den bulunamadı, atlanıyor`);
          return null;
        }

        // Uygun ikinci bacak biletini bul
        const minimumBeklemeSuresiMs = 60 * 60 * 1000;
        let uygunIkinciBacak = null;

        for (const adayBilet of ikinciBacakBiletleri) {
          try {
            const ikinciBacakKalkisStr = adayBilet.departure?.humanized?.time;
            if (!ikinciBacakKalkisStr) continue;

            const ikinciBacakKalkisDt = new Date(`${varisYil}-${varisAy}-${varisGun}T${ikinciBacakKalkisStr}:00`);

            if (ikinciBacakKalkisDt.getTime() >= ilkBacakVarisDt.getTime() + minimumBeklemeSuresiMs) {
              uygunIkinciBacak = adayBilet;
              break;
            }
          } catch (e) {
            continue;
          }
        }

        if (!uygunIkinciBacak) {
          return null;
        }

        // Gerçek API verisiyle rota oluştur
        const toplamFiyat = (ilkBacak.pricing?.base_internet_price || 0) + (uygunIkinciBacak.pricing?.base_internet_price || 0);
        
        return {
          tip: "transfer",
          aktarma_sehri: aktarmaSehri,
          toplam_fiyat: toplamFiyat,
          hub_puani: oneri.hubPuani || 0,
          veri_kaynagi: 'api',
          bacak1: {
            firma: ilkBacak.firm?.name || 'Bilinmiyor',
            kalkis_sehir: kalkisSehri,
            varis_sehir: aktarmaSehri,
            kalkis: ilkBacak.departure?.humanized?.time,
            varis: ilkBacak.arrival?.humanized?.time,
            kalkis_tarih: tarih,
            varis_tarih: ikinciBacakTarih,
            fiyat: ilkBacak.pricing?.base_internet_price,
            musait_koltuk: ilkBacak.pricing?.available_seats || 0,
          },
          bacak2: {
            firma: uygunIkinciBacak.firm?.name || 'Bilinmiyor',
            kalkis_sehir: aktarmaSehri,
            varis_sehir: varisSehri,
            kalkis: uygunIkinciBacak.departure?.humanized?.time,
            varis: uygunIkinciBacak.arrival?.humanized?.time,
            kalkis_tarih: ikinciBacakTarih,
            fiyat: uygunIkinciBacak.pricing?.base_internet_price,
            musait_koltuk: uygunIkinciBacak.pricing?.available_seats || 0,
          },
          id: `transfer-${aktarmaSehri}-${Date.now()}-${Math.random()}`
        };
      } catch (error) {
        if (__DEV__) console.error(`Aktarma sorgusu hatası (${aktarmaSehri}):`, error);
        return null;
      }
    });

    const aktarmaSonuclari = await Promise.all(aktarmaSorgulari);
    const gecerliAktarmalar = aktarmaSonuclari.filter(r => r !== null);
    tumRotalar = [...tumRotalar, ...gecerliAktarmalar];
  }

  // 3. Direkt rota yoksa ve aktarma az bulunduysa, çoklu aktarma dene
  if (tumRotalar.filter(r => r.tip === 'direct').length === 0 && tumRotalar.length < 3) {
    if (__DEV__) console.log(`🔀 Çoklu aktarma rotaları aranıyor...`);
    try {
      const cokluAktarmalar = await cokluBacakliRotaBulApi(kalkisSehri, varisSehri, tarih, 2, 3);
      if (cokluAktarmalar && cokluAktarmalar.length > 0) {
        tumRotalar = [...tumRotalar, ...cokluAktarmalar];
      }
    } catch (error) {
      if (__DEV__) console.error("Çoklu aktarma hatası:", error);
    }
  }

  // Sonuçları fiyata göre sırala ve döndür
  const siraliSonuclar = tumRotalar.sort((a, b) => a.toplam_fiyat - b.toplam_fiyat).slice(0, maksSonuc);
  
  if (__DEV__) console.log(`✅ Toplam ${siraliSonuclar.length} rota bulundu`);
  return siraliSonuclar;
};

// Çoklu bacaklı (multi-hop) rota arama - 2+ aktarmalı rotalar için
export const cokluBacakliRotaBulApi = async (kalkisSehri, varisSehri, tarih, maksAktarma = 2, maksSonuc = 5) => {
  if (__DEV__) console.log(`🚌 Çoklu bacaklı rota aranıyor: ${kalkisSehri} -> ${varisSehri} (Max ${maksAktarma} aktarma)`);
  
  // Gelişmiş multi-hop rota önerileri al
  const rotaOnerileri = cokluAktarmaliRotaBul(kalkisSehri, varisSehri, maksAktarma);
  
  if (!rotaOnerileri || rotaOnerileri.length === 0) {
    if (__DEV__) console.log('ℹ️ Multi-hop rota bulunamadı');
    return [];
  }

  const tumRotalar = [];

  for (const oneri of rotaOnerileri.slice(0, 5)) {
    // cokluAktarmaliRotaBul fonksiyonu aktarmaSehirleri döndürür
    const aktarmaNoktalar = oneri.aktarmaSehirleri || oneri.aktarmalar || [];
    const yol = [kalkisSehri, ...aktarmaNoktalar, varisSehri];
    if (__DEV__) console.log(`\n📍 Denenen rota: ${yol.join(' -> ')}`);
    
    try {
      const bacaklar = [];
      let toplamFiyat = 0;
      let mevcutTarih = tarih;
      let oncekiVarisDt = null;

      // Her bacak için bilet ara
      for (let i = 0; i < yol.length - 1; i++) {
        const bacakKalkis = yol[i];
        const bacakVaris = yol[i + 1];
        const bacakKalkisSlug = slugOlustur(bacakKalkis);
        const bacakVarisSlug = slugOlustur(bacakVaris);

        if (__DEV__) console.log(`  Bacak ${i + 1}: ${bacakKalkis} -> ${bacakVaris} (${mevcutTarih})`);
        
        const biletler = await enUcuzBiletleriAlApi(bacakKalkisSlug, bacakVarisSlug, mevcutTarih);
        
        if (!biletler || biletler.length === 0) {
          if (__DEV__) console.log(`  ⚠️ Bacak ${i + 1} için API bileti bulunamadı, rota atlanıyor`);
          break; // Bu rotayı atla
        }

        // Uygun bileti bul
        let uygunBilet = null;
        for (const bilet of biletler) {
          if (!bilet?.pricing?.base_internet_price || !bilet?.departure?.humanized?.time) {
            continue;
          }

          const [year, month, day] = mevcutTarih.split('.').reverse();
          const biletKalkisDt = new Date(`${year}-${month}-${day}T${bilet.departure.humanized.time}:00`);

          if (i === 0 || (oncekiVarisDt && biletKalkisDt.getTime() >= oncekiVarisDt.getTime() + 60 * 60 * 1000)) {
            uygunBilet = bilet;
            break;
          }
        }

        if (!uygunBilet && i > 0) {
          // Ertesi günü dene
          const [year, month, day] = mevcutTarih.split('.').reverse();
          const ertesiGun = new Date(`${year}-${month}-${day}`);
          ertesiGun.setDate(ertesiGun.getDate() + 1);
          mevcutTarih = `${ertesiGun.getDate().toString().padStart(2, '0')}.${(ertesiGun.getMonth() + 1).toString().padStart(2, '0')}.${ertesiGun.getFullYear()}`;
          
          const ertesiGunBiletler = await enUcuzBiletleriAlApi(bacakKalkisSlug, bacakVarisSlug, mevcutTarih);
          
          if (ertesiGunBiletler && ertesiGunBiletler.length > 0) {
            uygunBilet = ertesiGunBiletler.find(b => b?.pricing?.base_internet_price && b?.departure?.humanized?.time);
          }
        }

        if (!uygunBilet) {
          if (__DEV__) console.log(`  ⚠️ Uygun bilet bulunamadı, rota atlanıyor`);
          break; // Bu rotayı atla
        }

        // Varış zamanını hesapla
        const [year, month, day] = mevcutTarih.split('.').reverse();
        const biletKalkisDt = new Date(`${year}-${month}-${day}T${uygunBilet.departure.humanized.time}:00`);
        const biletVarisDt = new Date(`${year}-${month}-${day}T${uygunBilet.arrival?.humanized?.time || '12:00'}:00`);
        
        if (biletVarisDt <= biletKalkisDt) {
          biletVarisDt.setDate(biletVarisDt.getDate() + 1);
        }

        oncekiVarisDt = biletVarisDt;
        toplamFiyat += uygunBilet.pricing.base_internet_price;

        bacaklar.push({
          kalkis_sehir: bacakKalkis,
          varis_sehir: bacakVaris,
          firma: uygunBilet.firm?.name || 'Bilinmiyor',
          kalkis: uygunBilet.departure.humanized.time,
          kalkis_tarih: mevcutTarih,
          varis: uygunBilet.arrival?.humanized?.time || '',
          fiyat: uygunBilet.pricing.base_internet_price,
          musait_koltuk: uygunBilet.pricing?.available_seats || 0,
          bilet: uygunBilet,
        });

        // Bir sonraki bacak için tarihi güncelle
        mevcutTarih = `${biletVarisDt.getDate().toString().padStart(2, '0')}.${(biletVarisDt.getMonth() + 1).toString().padStart(2, '0')}.${biletVarisDt.getFullYear()}`;
      }

      if (bacaklar.length === yol.length - 1) {
        if (__DEV__) console.log(`  ✅ Geçerli rota bulundu! Toplam: ${toplamFiyat} TL`);
        
        tumRotalar.push({
          tip: "multi-transfer",
          segmentler: bacaklar.filter(b => b.bilet).map(b => b.bilet),
          bacaklar: bacaklar,
          toplam_fiyat: toplamFiyat,
          aktarma_sehirleri: aktarmaNoktalar,
          aktarma_sayisi: aktarmaNoktalar.length,
          id: `multi-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          rota_ozeti: yol.join(' → '),
          hub_puani: oneri.hubPuani || 0,
        });
      }
    } catch (error) {
      if (__DEV__) console.error(`Rota hatası (${yol.join(' -> ')}):`, error);
    }
  }

  return tumRotalar.sort((a, b) => a.toplam_fiyat - b.toplam_fiyat).slice(0, maksSonuc);
};

// Arama istatistiklerini döndür
export const aramaIstatistikleriAl = (sonuclar) => {
  if (!sonuclar || sonuclar.length === 0) {
    return null;
  }
  
  const direktSeferler = sonuclar.filter(r => r.tip === 'direct');
  const aktarmaliSeferler = sonuclar.filter(r => r.tip === 'transfer');
  const cokluAktarmaliSeferler = sonuclar.filter(r => r.tip === 'multi-transfer');
  
  const tumFiyatlar = sonuclar.map(r => r.toplam_fiyat);
  const minFiyat = Math.min(...tumFiyatlar);
  const maxFiyat = Math.max(...tumFiyatlar);
  const ortFiyat = Math.round(tumFiyatlar.reduce((a, b) => a + b, 0) / tumFiyatlar.length);
  
  // Firma dağılımı
  const firmalar = {};
  sonuclar.forEach(r => {
    if (r.firma) {
      firmalar[r.firma] = (firmalar[r.firma] || 0) + 1;
    }
    if (r.bacak1?.firma) {
      firmalar[r.bacak1.firma] = (firmalar[r.bacak1.firma] || 0) + 1;
    }
    if (r.bacak2?.firma) {
      firmalar[r.bacak2.firma] = (firmalar[r.bacak2.firma] || 0) + 1;
    }
  });
  
  return {
    toplamSonuc: sonuclar.length,
    direktSeferSayisi: direktSeferler.length,
    aktarmaliSeferSayisi: aktarmaliSeferler.length,
    cokluAktarmaliSeferSayisi: cokluAktarmaliSeferler.length,
    enUcuzFiyat: minFiyat,
    enPahaliFiyat: maxFiyat,
    ortalamaFiyat: ortFiyat,
    firmaDagilimi: firmalar,
  };
};
