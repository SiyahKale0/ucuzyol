// src/utils/RotaAlgoritmalari.js
// A* ve benzeri algoritmalarla açık kaynaklı rota hesaplama

import { sehirKoordinatlari, mesafeHesapla } from '../constants/SehirKoordinatlari';
import { yolAgi, komsulariGetir, karayoluMesafesiHesapla, KARAYOLU_MESAFE_FAKTORU } from '../constants/YolAgi';

// Priority Queue implementasyonu (min-heap)
class OncelikKuyrugu {
  constructor() {
    this.elemanlar = [];
  }

  ekle(eleman, oncelik) {
    this.elemanlar.push({ eleman, oncelik });
    this.yukariTasi(this.elemanlar.length - 1);
  }

  cikar() {
    if (this.elemanlar.length === 0) return null;
    const min = this.elemanlar[0];
    const son = this.elemanlar.pop();
    if (this.elemanlar.length > 0) {
      this.elemanlar[0] = son;
      this.asagiTasi(0);
    }
    return min.eleman;
  }

  bosMu() {
    return this.elemanlar.length === 0;
  }

  yukariTasi(index) {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      if (this.elemanlar[parentIndex].oncelik <= this.elemanlar[index].oncelik) break;
      [this.elemanlar[parentIndex], this.elemanlar[index]] = [this.elemanlar[index], this.elemanlar[parentIndex]];
      index = parentIndex;
    }
  }

  asagiTasi(index) {
    const uzunluk = this.elemanlar.length;
    while (true) {
      let enKucuk = index;
      const sol = 2 * index + 1;
      const sag = 2 * index + 2;
      if (sol < uzunluk && this.elemanlar[sol].oncelik < this.elemanlar[enKucuk].oncelik) {
        enKucuk = sol;
      }
      if (sag < uzunluk && this.elemanlar[sag].oncelik < this.elemanlar[enKucuk].oncelik) {
        enKucuk = sag;
      }
      if (enKucuk === index) break;
      [this.elemanlar[enKucuk], this.elemanlar[index]] = [this.elemanlar[index], this.elemanlar[enKucuk]];
      index = enKucuk;
    }
  }
}

/**
 * A* algoritması ile en kısa yolu bulur
 * @param {string} baslangic - Başlangıç şehri
 * @param {string} hedef - Hedef şehri
 * @returns {string[]|null} - Şehirler dizisi veya yol bulunamazsa null
 */
export const aStarEnKisaYol = (baslangic, hedef) => {
  if (!sehirKoordinatlari[baslangic] || !sehirKoordinatlari[hedef]) {
    console.warn(`Şehir bulunamadı: ${baslangic} veya ${hedef}`);
    return null;
  }

  if (baslangic === hedef) {
    return [baslangic];
  }

  const acikKume = new OncelikKuyrugu();
  const gSkor = new Map(); // Başlangıçtan bu noktaya gerçek maliyet
  const fSkor = new Map(); // gSkor + heuristic
  const onceki = new Map(); // Yol geri izleme için

  gSkor.set(baslangic, 0);
  fSkor.set(baslangic, mesafeHesapla(baslangic, hedef));
  acikKume.ekle(baslangic, fSkor.get(baslangic));

  const kapaliKume = new Set();

  while (!acikKume.bosMu()) {
    const mevcut = acikKume.cikar();

    if (mevcut === hedef) {
      // Yolu geri izle
      const yol = [hedef];
      let adim = hedef;
      while (onceki.has(adim)) {
        adim = onceki.get(adim);
        yol.unshift(adim);
      }
      return yol;
    }

    if (kapaliKume.has(mevcut)) continue;
    kapaliKume.add(mevcut);

    const komsular = komsulariGetir(mevcut);
    for (const komsu of komsular) {
      if (kapaliKume.has(komsu)) continue;

      const kenarMaliyeti = karayoluMesafesiHesapla(mevcut, komsu, mesafeHesapla);
      const yeniGSkor = gSkor.get(mevcut) + kenarMaliyeti;

      if (!gSkor.has(komsu) || yeniGSkor < gSkor.get(komsu)) {
        onceki.set(komsu, mevcut);
        gSkor.set(komsu, yeniGSkor);
        const heuristik = mesafeHesapla(komsu, hedef);
        fSkor.set(komsu, yeniGSkor + heuristik);
        acikKume.ekle(komsu, fSkor.get(komsu));
      }
    }
  }

  return null; // Yol bulunamadı
};

/**
 * Alternatif rotaları bulur (K-shortest paths benzeri yaklaşım)
 * @param {string} baslangic - Başlangıç şehri
 * @param {string} hedef - Hedef şehri
 * @param {number} maksRota - Maksimum rota sayısı
 * @returns {Array<{yol: string[], mesafe: number}>}
 */
export const alternatifRotalarBul = (baslangic, hedef, maksRota = 5) => {
  const rotalar = [];
  const anaYol = aStarEnKisaYol(baslangic, hedef);
  
  if (!anaYol) return rotalar;

  // Ana yolu ekle
  const anaMesafe = yolMesafesiHesapla(anaYol);
  rotalar.push({ yol: anaYol, mesafe: anaMesafe });

  // Ana yoldaki her kenarı çıkararak alternatif yollar bul
  const denenmisYollar = new Set();
  denenmisYollar.add(JSON.stringify(anaYol));

  for (let i = 0; i < anaYol.length - 1 && rotalar.length < maksRota; i++) {
    // Bu kenarı geçici olarak devre dışı bırak
    const cikarilacakSehir1 = anaYol[i];
    const cikarilacakSehir2 = anaYol[i + 1];
    
    // Alternatif yol bul (bu kenarı kullanmadan)
    const alternatifYol = aStarKisitli(baslangic, hedef, [[cikarilacakSehir1, cikarilacakSehir2]]);
    
    if (alternatifYol && !denenmisYollar.has(JSON.stringify(alternatifYol))) {
      denenmisYollar.add(JSON.stringify(alternatifYol));
      const mesafe = yolMesafesiHesapla(alternatifYol);
      // Mesafe ana yolun %50'sinden fazla değilse ekle
      if (mesafe <= anaMesafe * 1.5) {
        rotalar.push({ yol: alternatifYol, mesafe });
      }
    }
  }

  // Mesafeye göre sırala
  rotalar.sort((a, b) => a.mesafe - b.mesafe);
  return rotalar.slice(0, maksRota);
};

/**
 * Kısıtlı A* - belirli kenarları kullanmadan yol bulur
 */
const aStarKisitli = (baslangic, hedef, yasakliKenarlar) => {
  if (!sehirKoordinatlari[baslangic] || !sehirKoordinatlari[hedef]) {
    return null;
  }

  const yasakSet = new Set(yasakliKenarlar.map(([a, b]) => `${a}-${b}`));
  const yasakSetTers = new Set(yasakliKenarlar.map(([a, b]) => `${b}-${a}`));

  const kenarYasakMi = (sehir1, sehir2) => {
    return yasakSet.has(`${sehir1}-${sehir2}`) || yasakSetTers.has(`${sehir1}-${sehir2}`);
  };

  const acikKume = new OncelikKuyrugu();
  const gSkor = new Map();
  const onceki = new Map();

  gSkor.set(baslangic, 0);
  acikKume.ekle(baslangic, mesafeHesapla(baslangic, hedef));

  const kapaliKume = new Set();

  while (!acikKume.bosMu()) {
    const mevcut = acikKume.cikar();

    if (mevcut === hedef) {
      const yol = [hedef];
      let adim = hedef;
      while (onceki.has(adim)) {
        adim = onceki.get(adim);
        yol.unshift(adim);
      }
      return yol;
    }

    if (kapaliKume.has(mevcut)) continue;
    kapaliKume.add(mevcut);

    const komsular = komsulariGetir(mevcut);
    for (const komsu of komsular) {
      if (kapaliKume.has(komsu)) continue;
      if (kenarYasakMi(mevcut, komsu)) continue;

      const kenarMaliyeti = karayoluMesafesiHesapla(mevcut, komsu, mesafeHesapla);
      const yeniGSkor = gSkor.get(mevcut) + kenarMaliyeti;

      if (!gSkor.has(komsu) || yeniGSkor < gSkor.get(komsu)) {
        onceki.set(komsu, mevcut);
        gSkor.set(komsu, yeniGSkor);
        acikKume.ekle(komsu, yeniGSkor + mesafeHesapla(komsu, hedef));
      }
    }
  }

  return null;
};

/**
 * Bir yolun toplam mesafesini hesaplar
 */
export const yolMesafesiHesapla = (yol) => {
  if (!yol || yol.length < 2) return 0;
  
  let toplam = 0;
  for (let i = 0; i < yol.length - 1; i++) {
    toplam += karayoluMesafesiHesapla(yol[i], yol[i + 1], mesafeHesapla);
  }
  return toplam;
};

/**
 * Aktarma noktalarını rotadan çıkarır (başlangıç ve bitiş hariç ara noktalar)
 * @param {string[]} yol - Şehirler dizisi
 * @returns {string[]} - Aktarma noktaları
 */
export const aktarmaNoktalariniCikar = (yol) => {
  if (!yol || yol.length <= 2) return [];
  return yol.slice(1, -1);
};

/**
 * Çoklu bacaklı rota için aktarma noktalarını belirler
 * Her aktarma noktası büyük bir şehir veya kavşak noktası olmalı
 * @param {string} baslangic 
 * @param {string} hedef 
 * @param {number} maksAktarma - Maksimum aktarma sayısı
 * @returns {string[][]} - Olası aktarma kombinasyonları
 */
export const aktarmaKombinasyonlariBul = (baslangic, hedef, maksAktarma = 2) => {
  const rotalar = alternatifRotalarBul(baslangic, hedef, 10);
  const kombinasyonlar = new Set();

  // Büyük şehirler ve kavşak noktaları - otobüs hatlarının yoğun olduğu yerler
  const oncelelikliSehirler = new Set([
    'İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya', 'Adana', 
    'Konya', 'Gaziantep', 'Kayseri', 'Eskişehir', 'Samsun',
    'Diyarbakır', 'Mersin', 'Denizli', 'Afyonkarahisar', 'Sivas',
    'Erzurum', 'Trabzon', 'Malatya', 'Balıkesir', 'Manisa'
  ]);

  for (const { yol } of rotalar) {
    const araSehirler = aktarmaNoktalariniCikar(yol);
    
    // Tek aktarmalı kombinasyonlar
    for (const sehir of araSehirler) {
      if (maksAktarma >= 1) {
        kombinasyonlar.add(JSON.stringify([sehir]));
      }
    }

    // Çift aktarmalı kombinasyonlar (sadece öncelikli şehirler)
    if (maksAktarma >= 2 && araSehirler.length >= 2) {
      for (let i = 0; i < araSehirler.length; i++) {
        for (let j = i + 1; j < araSehirler.length; j++) {
          const sehir1 = araSehirler[i];
          const sehir2 = araSehirler[j];
          // En az biri öncelikli şehir olmalı
          if (oncelelikliSehirler.has(sehir1) || oncelelikliSehirler.has(sehir2)) {
            kombinasyonlar.add(JSON.stringify([sehir1, sehir2]));
          }
        }
      }
    }
  }

  // Öncelikli şehirleri öne al
  const sonuc = Array.from(kombinasyonlar)
    .map(k => JSON.parse(k))
    .sort((a, b) => {
      // Öncelikli şehir içerenleri öne al
      const aOncelik = a.filter(s => oncelelikliSehirler.has(s)).length;
      const bOncelik = b.filter(s => oncelelikliSehirler.has(s)).length;
      if (bOncelik !== aOncelik) return bOncelik - aOncelik;
      // Daha az aktarmalı olanları öne al
      return a.length - b.length;
    });

  return sonuc.slice(0, 10); // En fazla 10 kombinasyon
};

/**
 * Doğrudan bağlantı olmayan şehirler için mantıklı aktarma noktaları önerir
 * A* algoritması ile hesaplanır - Gemini API'ye gerek kalmaz
 */
export const akillIAktarmaOner = (kalkisSehri, varisSehri) => {
  console.log(`🗺️ Yerel algoritma ile aktarma noktaları hesaplanıyor: ${kalkisSehri} -> ${varisSehri}`);
  
  // Direkt bağlantı var mı kontrol et
  const komsular = komsulariGetir(kalkisSehri);
  if (komsular.includes(varisSehri)) {
    console.log('✅ Direkt bağlantı mevcut, aktarmaya gerek yok');
    return [];
  }

  // A* ile en kısa yolu bul
  const enKisaYol = aStarEnKisaYol(kalkisSehri, varisSehri);
  
  if (!enKisaYol) {
    console.warn('⚠️ Yol bulunamadı, alternatif rotalar deneniyor...');
    return [];
  }

  // Yoldaki ara noktaları aktarma noktası olarak döndür
  const aktarmaNoktalari = aktarmaNoktalariniCikar(enKisaYol);
  console.log(`✅ Bulunan rota: ${enKisaYol.join(' -> ')}`);
  console.log(`📍 Önerilen aktarma noktaları: ${aktarmaNoktalari.join(', ')}`);

  // Alternatif rotalardan da aktarma noktaları topla
  const tumAktarmaNoktalari = new Set(aktarmaNoktalari);
  const alternatifler = alternatifRotalarBul(kalkisSehri, varisSehri, 3);
  
  for (const { yol } of alternatifler) {
    const araNoktalari = aktarmaNoktalariniCikar(yol);
    araNoktalari.forEach(n => tumAktarmaNoktalari.add(n));
  }

  // Benzersiz aktarma noktalarını döndür
  const sonuc = Array.from(tumAktarmaNoktalari);
  console.log(`📋 Tüm olası aktarma noktaları: ${sonuc.join(', ')}`);
  
  return sonuc;
};

/**
 * Multi-hop (birden fazla aktarmalı) rota önerileri
 * @param {string} kalkis 
 * @param {string} varis 
 * @param {number} maksAktarma 
 * @returns {Array<{aktarmalar: string[], mesafe: number}>}
 */
export const multiHopRotaOner = (kalkis, varis, maksAktarma = 2) => {
  const kombinasyonlar = aktarmaKombinasyonlariBul(kalkis, varis, maksAktarma);
  
  const sonuclar = kombinasyonlar.map(aktarmalar => {
    // Toplam mesafeyi hesapla
    const tamYol = [kalkis, ...aktarmalar, varis];
    const mesafe = yolMesafesiHesapla(tamYol);
    return { aktarmalar, mesafe, yol: tamYol };
  });

  // Mesafeye göre sırala
  return sonuclar.sort((a, b) => a.mesafe - b.mesafe);
};

export default {
  aStarEnKisaYol,
  alternatifRotalarBul,
  aktarmaNoktalariniCikar,
  aktarmaKombinasyonlariBul,
  akillIAktarmaOner,
  multiHopRotaOner,
  yolMesafesiHesapla,
};
