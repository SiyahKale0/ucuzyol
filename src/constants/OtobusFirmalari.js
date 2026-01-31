// src/constants/OtobusFirmalari.js
// Gerçek otobüs firmalarının rota ağları ve fiyatlandırma mantığı

// Firma türleri ve özellikleri
export const FIRMA_TURLERI = {
  PREMIUM: 'premium',       // Lüks servis (Metro, Kamil Koç, Pamukkale)
  STANDART: 'standart',     // Standart servis (Ulusoy, Varan)
  EKONOMI: 'ekonomi',       // Ekonomik servis (bölgesel firmalar)
  BOLGESEL: 'bolgesel',     // Sadece belirli bölgelerde çalışan firmalar
};

// Ana otobüs firmaları ve hizmet verdikleri bölgeler/hatlar
export const OTOBUS_FIRMALARI = {
  'Metro Turizm': {
    tur: FIRMA_TURLERI.PREMIUM,
    fiyatCarpani: 1.15,  // Piyasa ortalamasının %15 üstü
    anaHatlar: [
      // İstanbul merkez
      ['İstanbul', 'Ankara'],
      ['İstanbul', 'İzmir'],
      ['İstanbul', 'Antalya'],
      ['İstanbul', 'Bursa'],
      ['İstanbul', 'Trabzon'],
      ['İstanbul', 'Diyarbakır'],
      ['İstanbul', 'Adana'],
      // Ankara merkez
      ['Ankara', 'İzmir'],
      ['Ankara', 'Antalya'],
      ['Ankara', 'Adana'],
      ['Ankara', 'Trabzon'],
      ['Ankara', 'Diyarbakır'],
      ['Ankara', 'Konya'],
      ['Ankara', 'Samsun'],
      // Diğer ana hatlar
      ['İzmir', 'Antalya'],
      ['İzmir', 'Ankara'],
      ['Adana', 'Gaziantep'],
      ['Adana', 'Diyarbakır'],
    ],
    aktarmaHublari: ['İstanbul', 'Ankara', 'İzmir', 'Adana'],
  },

  'Kamil Koç': {
    tur: FIRMA_TURLERI.PREMIUM,
    fiyatCarpani: 1.10,
    anaHatlar: [
      ['İstanbul', 'Ankara'],
      ['İstanbul', 'İzmir'],
      ['İstanbul', 'Bursa'],
      ['İstanbul', 'Antalya'],
      ['İstanbul', 'Konya'],
      ['Ankara', 'İstanbul'],
      ['Ankara', 'İzmir'],
      ['Ankara', 'Konya'],
      ['Ankara', 'Eskişehir'],
      ['Ankara', 'Samsun'],
      ['Ankara', 'Kayseri'],
      ['İzmir', 'Denizli'],
      ['İzmir', 'Manisa'],
      ['İzmir', 'Aydın'],
      ['İzmir', 'Muğla'],
      ['Bursa', 'Eskişehir'],
      ['Bursa', 'Balıkesir'],
    ],
    aktarmaHublari: ['İstanbul', 'Ankara', 'İzmir', 'Bursa'],
  },

  'Pamukkale Turizm': {
    tur: FIRMA_TURLERI.PREMIUM,
    fiyatCarpani: 1.08,
    anaHatlar: [
      // Ege bölgesi uzmanı
      ['İstanbul', 'Denizli'],
      ['İstanbul', 'Muğla'],
      ['İstanbul', 'Aydın'],
      ['İstanbul', 'İzmir'],
      ['Ankara', 'Denizli'],
      ['Ankara', 'Muğla'],
      ['Ankara', 'İzmir'],
      ['İzmir', 'Denizli'],
      ['İzmir', 'Muğla'],
      ['İzmir', 'Aydın'],
      ['Denizli', 'Antalya'],
      ['Denizli', 'Muğla'],
      ['Denizli', 'Afyonkarahisar'],
    ],
    aktarmaHublari: ['İstanbul', 'Ankara', 'İzmir', 'Denizli'],
  },

  'Ulusoy': {
    tur: FIRMA_TURLERI.STANDART,
    fiyatCarpani: 1.0,
    anaHatlar: [
      ['İstanbul', 'Ankara'],
      ['İstanbul', 'Trabzon'],
      ['İstanbul', 'Samsun'],
      ['İstanbul', 'Rize'],
      ['Ankara', 'Trabzon'],
      ['Ankara', 'Samsun'],
      ['Ankara', 'Erzurum'],
      ['Trabzon', 'Rize'],
      ['Trabzon', 'Erzurum'],
      ['Samsun', 'Ordu'],
      ['Samsun', 'Giresun'],
    ],
    aktarmaHublari: ['İstanbul', 'Ankara', 'Trabzon', 'Samsun'],
  },

  'Süha Turizm': {
    tur: FIRMA_TURLERI.STANDART,
    fiyatCarpani: 0.95,
    anaHatlar: [
      // Doğu Anadolu uzmanı
      ['İstanbul', 'Diyarbakır'],
      ['İstanbul', 'Van'],
      ['İstanbul', 'Erzurum'],
      ['İstanbul', 'Malatya'],
      ['Ankara', 'Diyarbakır'],
      ['Ankara', 'Van'],
      ['Ankara', 'Malatya'],
      ['Ankara', 'Elazığ'],
      ['Diyarbakır', 'Van'],
      ['Diyarbakır', 'Mardin'],
      ['Diyarbakır', 'Batman'],
      ['Malatya', 'Elazığ'],
    ],
    aktarmaHublari: ['İstanbul', 'Ankara', 'Diyarbakır', 'Malatya'],
  },

  'Özkaymak': {
    tur: FIRMA_TURLERI.STANDART,
    fiyatCarpani: 0.92,
    anaHatlar: [
      // Güney-Güneydoğu uzmanı
      ['İstanbul', 'Adana'],
      ['İstanbul', 'Mersin'],
      ['İstanbul', 'Gaziantep'],
      ['İstanbul', 'Şanlıurfa'],
      ['Ankara', 'Adana'],
      ['Ankara', 'Gaziantep'],
      ['Ankara', 'Şanlıurfa'],
      ['Adana', 'Gaziantep'],
      ['Adana', 'Mersin'],
      ['Adana', 'Şanlıurfa'],
      ['Gaziantep', 'Şanlıurfa'],
      ['Gaziantep', 'Diyarbakır'],
    ],
    aktarmaHublari: ['İstanbul', 'Ankara', 'Adana', 'Gaziantep'],
  },

  'Niğde Turizm': {
    tur: FIRMA_TURLERI.EKONOMI,
    fiyatCarpani: 0.85,
    anaHatlar: [
      // İç Anadolu odaklı
      ['İstanbul', 'Niğde'],
      ['İstanbul', 'Nevşehir'],
      ['İstanbul', 'Kayseri'],
      ['İstanbul', 'Aksaray'],
      ['Ankara', 'Niğde'],
      ['Ankara', 'Nevşehir'],
      ['Ankara', 'Aksaray'],
      ['Niğde', 'Adana'],
      ['Niğde', 'Mersin'],
      ['Kayseri', 'Niğde'],
      ['Kayseri', 'Adana'],
      ['Nevşehir', 'Kayseri'],
    ],
    aktarmaHublari: ['Ankara', 'Kayseri', 'Niğde', 'Adana'],
  },

  'Nilüfer Turizm': {
    tur: FIRMA_TURLERI.STANDART,
    fiyatCarpani: 0.90,
    anaHatlar: [
      // Marmara ve Batı Anadolu
      ['İstanbul', 'Bursa'],
      ['İstanbul', 'Balıkesir'],
      ['İstanbul', 'Çanakkale'],
      ['Bursa', 'İzmir'],
      ['Bursa', 'Balıkesir'],
      ['Bursa', 'Çanakkale'],
      ['Bursa', 'Eskişehir'],
      ['Balıkesir', 'İzmir'],
      ['Balıkesir', 'Çanakkale'],
    ],
    aktarmaHublari: ['İstanbul', 'Bursa', 'Balıkesir'],
  },

  'Lüks Artvin': {
    tur: FIRMA_TURLERI.BOLGESEL,
    fiyatCarpani: 0.88,
    anaHatlar: [
      // Karadeniz uzmanı
      ['İstanbul', 'Artvin'],
      ['İstanbul', 'Rize'],
      ['İstanbul', 'Trabzon'],
      ['İstanbul', 'Hopa'],
      ['Ankara', 'Artvin'],
      ['Trabzon', 'Artvin'],
      ['Trabzon', 'Rize'],
      ['Rize', 'Artvin'],
    ],
    aktarmaHublari: ['İstanbul', 'Trabzon'],
  },

  'As Turizm': {
    tur: FIRMA_TURLERI.BOLGESEL,
    fiyatCarpani: 0.82,
    anaHatlar: [
      // Doğu Karadeniz
      ['İstanbul', 'Trabzon'],
      ['İstanbul', 'Giresun'],
      ['İstanbul', 'Ordu'],
      ['Ankara', 'Trabzon'],
      ['Ankara', 'Samsun'],
      ['Samsun', 'Trabzon'],
      ['Samsun', 'Ordu'],
    ],
    aktarmaHublari: ['İstanbul', 'Samsun', 'Trabzon'],
  },

  'Diyarbakır Seyahat': {
    tur: FIRMA_TURLERI.BOLGESEL,
    fiyatCarpani: 0.78,
    anaHatlar: [
      // Güneydoğu uzmanı - UCUZ
      ['İstanbul', 'Diyarbakır'],
      ['Ankara', 'Diyarbakır'],
      ['Diyarbakır', 'Batman'],
      ['Diyarbakır', 'Mardin'],
      ['Diyarbakır', 'Şanlıurfa'],
      ['Diyarbakır', 'Siirt'],
      ['Diyarbakır', 'Van'],
      ['Diyarbakır', 'Bingöl'],
      ['Diyarbakır', 'Elazığ'],
      ['Gaziantep', 'Diyarbakır'],
      ['Adana', 'Diyarbakır'],
    ],
    aktarmaHublari: ['Diyarbakır', 'Gaziantep'],
  },

  'Mardin Seyahat': {
    tur: FIRMA_TURLERI.BOLGESEL,
    fiyatCarpani: 0.75,
    anaHatlar: [
      ['İstanbul', 'Mardin'],
      ['Ankara', 'Mardin'],
      ['Diyarbakır', 'Mardin'],
      ['Mardin', 'Şırnak'],
      ['Mardin', 'Batman'],
      ['Gaziantep', 'Mardin'],
    ],
    aktarmaHublari: ['Diyarbakır', 'Mardin'],
  },

  'Van Seyahat': {
    tur: FIRMA_TURLERI.BOLGESEL,
    fiyatCarpani: 0.80,
    anaHatlar: [
      ['İstanbul', 'Van'],
      ['Ankara', 'Van'],
      ['Van', 'Diyarbakır'],
      ['Van', 'Erzurum'],
      ['Van', 'Bitlis'],
      ['Van', 'Muş'],
      ['Van', 'Hakkâri'],
    ],
    aktarmaHublari: ['Van', 'Diyarbakır', 'Erzurum'],
  },
};

// Hub şehirler - aktarma için en uygun noktalar
export const HUB_SEHIRLER = {
  // Tier 1 - Mega Hub'lar (her yere sefer var)
  MEGA: ['İstanbul', 'Ankara'],
  
  // Tier 2 - Bölgesel Hub'lar
  BOLGESEL: ['İzmir', 'Bursa', 'Adana', 'Antalya', 'Konya', 'Kayseri', 'Samsun', 'Trabzon', 'Gaziantep', 'Diyarbakır'],
  
  // Tier 3 - Alt Hub'lar (belirli rotalar için aktarma noktası)
  ALT: ['Denizli', 'Eskişehir', 'Afyonkarahisar', 'Malatya', 'Erzurum', 'Van', 'Mersin', 'Şanlıurfa', 'Sivas', 'Elazığ'],
};

// Hub öncelik puanları (aktarma için uygunluk)
export const HUB_PUANLARI = {
  'İstanbul': 100,
  'Ankara': 95,
  'İzmir': 80,
  'Bursa': 75,
  'Adana': 70,
  'Antalya': 70,
  'Konya': 65,
  'Kayseri': 60,
  'Gaziantep': 60,
  'Samsun': 55,
  'Trabzon': 55,
  'Diyarbakır': 55,
  'Denizli': 50,
  'Eskişehir': 50,
  'Malatya': 45,
  'Erzurum': 45,
  'Mersin': 45,
  'Şanlıurfa': 40,
  'Sivas': 40,
  'Afyonkarahisar': 35,
  'Van': 35,
  'Elazığ': 35,
};

// Baz fiyat hesaplama (TL/km)
export const BAZ_FIYAT_KM = 0.35; // Ortalama 0.35 TL/km

// Mesafe bazlı indirim oranları
export const MESAFE_INDIRIMLERI = {
  0: 1.0,      // 0-200 km: normal fiyat
  200: 0.95,   // 200-400 km: %5 indirim
  400: 0.90,   // 400-600 km: %10 indirim
  600: 0.85,   // 600-800 km: %15 indirim
  800: 0.80,   // 800-1000 km: %20 indirim
  1000: 0.75,  // 1000+ km: %25 indirim
};

// Saat bazlı fiyat çarpanları
export const SAAT_CARPANLARI = {
  gece: 0.90,     // 00:00-06:00 - gece seferleri daha ucuz
  sabah: 1.05,    // 06:00-09:00 - sabah trafiği
  ogle: 1.0,      // 09:00-17:00 - normal
  aksam: 1.10,    // 17:00-21:00 - akşam trafiği  
  geceYarisi: 0.95, // 21:00-00:00
};

/**
 * Verilen iki şehir arasında direkt sefer yapan firmaları bulur
 */
export const direktSeferFirmalariBul = (kalkis, varis) => {
  const firmalar = [];
  
  for (const [firmaAdi, firmaData] of Object.entries(OTOBUS_FIRMALARI)) {
    const hatlar = firmaData.anaHatlar;
    
    // Bu firma bu hat üzerinde sefer yapıyor mu?
    const hatVar = hatlar.some(hat => 
      (hat[0] === kalkis && hat[1] === varis) ||
      (hat[0] === varis && hat[1] === kalkis)
    );
    
    if (hatVar) {
      firmalar.push({
        firma: firmaAdi,
        tur: firmaData.tur,
        fiyatCarpani: firmaData.fiyatCarpani,
      });
    }
  }
  
  return firmalar;
};

/**
 * Bölgeye göre olası firma öner (direkt sefer bulunamazsa)
 */
export const bolgeselFirmaOner = (sehir1, sehir2) => {
  // Doğu Anadolu şehirleri
  const doguAnadolu = ['Erzurum', 'Erzincan', 'Kars', 'Ağrı', 'Iğdır', 'Ardahan', 'Van', 'Muş', 'Bitlis', 'Bingöl', 'Tunceli', 'Elazığ', 'Malatya'];
  // Güneydoğu şehirleri
  const guneydogu = ['Diyarbakır', 'Batman', 'Siirt', 'Şırnak', 'Mardin', 'Şanlıurfa', 'Gaziantep', 'Adıyaman', 'Kilis', 'Hakkâri'];
  // Karadeniz şehirleri
  const karadeniz = ['Trabzon', 'Rize', 'Artvin', 'Giresun', 'Ordu', 'Samsun', 'Gümüşhane', 'Bayburt', 'Amasya', 'Tokat', 'Sinop', 'Çorum'];
  // İç Anadolu
  const icAnadolu = ['Ankara', 'Konya', 'Kayseri', 'Sivas', 'Yozgat', 'Kırıkkale', 'Kırşehir', 'Nevşehir', 'Aksaray', 'Niğde', 'Karaman', 'Eskişehir'];
  
  const sehirler = [sehir1, sehir2];
  
  // Güneydoğu bölgesi
  if (sehirler.some(s => guneydogu.includes(s))) {
    return { firma: 'Diyarbakır Seyahat', fiyatCarpani: 0.78 };
  }
  
  // Doğu Anadolu bölgesi
  if (sehirler.some(s => doguAnadolu.includes(s))) {
    // Malatya özel
    if (sehirler.includes('Malatya')) {
      return { firma: 'Malatya Medine', fiyatCarpani: 0.80 };
    }
    return { firma: 'Doğu Turizm', fiyatCarpani: 0.82 };
  }
  
  // Karadeniz bölgesi  
  if (sehirler.some(s => karadeniz.includes(s))) {
    if (sehirler.some(s => ['Trabzon', 'Rize', 'Artvin', 'Gümüşhane', 'Bayburt'].includes(s))) {
      return { firma: 'Lüks Artvin', fiyatCarpani: 0.88 };
    }
    return { firma: 'As Turizm', fiyatCarpani: 0.82 };
  }
  
  // İç Anadolu bölgesi
  if (sehirler.some(s => icAnadolu.includes(s))) {
    return { firma: 'Özkaymak', fiyatCarpani: 0.85 };
  }
  
  // Varsayılan - büyük firma
  return { firma: 'Metro Turizm', fiyatCarpani: 0.95 };
};

/**
 * Verilen şehir için uygun aktarma hub'ını bulur
 */
export const enYakinHubBul = (sehir, hedef) => {
  // Şehir zaten hub mu?
  if (HUB_PUANLARI[sehir]) {
    return { hub: sehir, puan: HUB_PUANLARI[sehir] };
  }
  
  // En yakın hub'ları bul
  const tumHublar = [...HUB_SEHIRLER.MEGA, ...HUB_SEHIRLER.BOLGESEL, ...HUB_SEHIRLER.ALT];
  
  // Hedefe göre uygun hub'ları öncele
  return tumHublar
    .map(hub => ({ hub, puan: HUB_PUANLARI[hub] || 20 }))
    .sort((a, b) => b.puan - a.puan);
};

/**
 * Aktarmalı rotalar için uygun firmaları bulur
 */
export const aktarmaliRotaFirmalariBul = (kalkis, aktarmaSehri, varis) => {
  const ilkBacak = direktSeferFirmalariBul(kalkis, aktarmaSehri);
  const ikinciBacak = direktSeferFirmalariBul(aktarmaSehri, varis);
  
  return {
    ilkBacak,
    ikinciBacak,
    aktarmaSehri,
    aktarmaHubPuani: HUB_PUANLARI[aktarmaSehri] || 0,
  };
};

export default {
  OTOBUS_FIRMALARI,
  FIRMA_TURLERI,
  HUB_SEHIRLER,
  HUB_PUANLARI,
  BAZ_FIYAT_KM,
  MESAFE_INDIRIMLERI,
  SAAT_CARPANLARI,
  direktSeferFirmalariBul,
  bolgeselFirmaOner,
  aktarmaliRotaFirmalariBul,
  enYakinHubBul,
};
