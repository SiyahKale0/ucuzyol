// src/constants/YolAgi.js
// Türkiye otobüs güzergahları - ana karayolları ve otoyolları temel alan bağlantılar
// Her bağlantı çift yönlüdür ve yaklaşık karayolu mesafesini (km) içerir

export const yolAgi = {
  // İstanbul merkez - Trakya ve Marmara
  'İstanbul': ['Kocaeli', 'Tekirdağ', 'Edirne', 'Bursa', 'Sakarya', 'Yalova', 'Balıkesir', 'Çanakkale'],
  'Kocaeli': ['İstanbul', 'Sakarya', 'Bursa', 'Yalova', 'Bilecik'],
  'Sakarya': ['İstanbul', 'Kocaeli', 'Bolu', 'Düzce', 'Bilecik'],
  'Yalova': ['İstanbul', 'Kocaeli', 'Bursa'],
  'Tekirdağ': ['İstanbul', 'Edirne', 'Kırklareli', 'Çanakkale'],
  'Edirne': ['İstanbul', 'Tekirdağ', 'Kırklareli'],
  'Kırklareli': ['Edirne', 'Tekirdağ'],
  
  // Batı Marmara - Ege geçişi
  'Bursa': ['İstanbul', 'Kocaeli', 'Yalova', 'Bilecik', 'Balıkesir', 'Kütahya', 'Eskişehir'],
  'Balıkesir': ['İstanbul', 'Bursa', 'Çanakkale', 'İzmir', 'Manisa', 'Kütahya'],
  'Çanakkale': ['İstanbul', 'Tekirdağ', 'Balıkesir', 'İzmir'],
  
  // Ege Bölgesi
  'İzmir': ['Balıkesir', 'Çanakkale', 'Manisa', 'Aydın', 'Denizli', 'Uşak', 'Muğla'],
  'Manisa': ['İzmir', 'Balıkesir', 'Kütahya', 'Uşak', 'Denizli', 'Aydın'],
  'Aydın': ['İzmir', 'Manisa', 'Denizli', 'Muğla'],
  'Muğla': ['İzmir', 'Aydın', 'Denizli', 'Antalya', 'Burdur'],
  'Denizli': ['İzmir', 'Manisa', 'Aydın', 'Muğla', 'Uşak', 'Afyonkarahisar', 'Burdur', 'Antalya'],
  'Uşak': ['İzmir', 'Manisa', 'Denizli', 'Afyonkarahisar', 'Kütahya'],
  
  // İç Batı Anadolu
  'Bilecik': ['Kocaeli', 'Sakarya', 'Bursa', 'Eskişehir', 'Kütahya', 'Bolu'],
  'Eskişehir': ['Bursa', 'Bilecik', 'Kütahya', 'Afyonkarahisar', 'Ankara'],
  'Kütahya': ['Bursa', 'Balıkesir', 'Bilecik', 'Eskişehir', 'Afyonkarahisar', 'Uşak', 'Manisa'],
  'Afyonkarahisar': ['Eskişehir', 'Kütahya', 'Uşak', 'Denizli', 'Burdur', 'Isparta', 'Konya', 'Ankara'],
  
  // Akdeniz Bölgesi
  'Antalya': ['Muğla', 'Denizli', 'Burdur', 'Isparta', 'Konya', 'Karaman', 'Mersin'],
  'Burdur': ['Muğla', 'Denizli', 'Afyonkarahisar', 'Isparta', 'Antalya'],
  'Isparta': ['Burdur', 'Afyonkarahisar', 'Konya', 'Antalya'],
  'Mersin': ['Antalya', 'Karaman', 'Konya', 'Adana', 'Niğde'],
  'Adana': ['Mersin', 'Niğde', 'Kayseri', 'Kahramanmaraş', 'Osmaniye', 'Hatay', 'Gaziantep'],
  'Hatay': ['Adana', 'Osmaniye', 'Gaziantep'],
  'Osmaniye': ['Adana', 'Hatay', 'Gaziantep', 'Kahramanmaraş'],
  
  // İç Anadolu
  'Ankara': ['Eskişehir', 'Afyonkarahisar', 'Konya', 'Kırıkkale', 'Çankırı', 'Bolu', 'Kırşehir', 'Aksaray', 'Yozgat'],
  'Konya': ['Afyonkarahisar', 'Isparta', 'Antalya', 'Karaman', 'Mersin', 'Niğde', 'Aksaray', 'Ankara', 'Kayseri'],
  'Karaman': ['Antalya', 'Konya', 'Mersin', 'Niğde'],
  'Aksaray': ['Ankara', 'Konya', 'Niğde', 'Nevşehir', 'Kırşehir'],
  'Niğde': ['Mersin', 'Adana', 'Kayseri', 'Aksaray', 'Nevşehir', 'Konya', 'Karaman'],
  'Nevşehir': ['Aksaray', 'Niğde', 'Kayseri', 'Kırşehir', 'Yozgat'],
  'Kırşehir': ['Ankara', 'Aksaray', 'Nevşehir', 'Kayseri', 'Yozgat', 'Kırıkkale'],
  'Kırıkkale': ['Ankara', 'Yozgat', 'Kırşehir', 'Çankırı'],
  'Kayseri': ['Konya', 'Niğde', 'Nevşehir', 'Kırşehir', 'Yozgat', 'Sivas', 'Kahramanmaraş', 'Adana', 'Malatya'],
  'Yozgat': ['Ankara', 'Kırıkkale', 'Kırşehir', 'Nevşehir', 'Kayseri', 'Sivas', 'Çorum', 'Tokat'],
  
  // Kuzey Orta Anadolu
  'Bolu': ['Sakarya', 'Düzce', 'Ankara', 'Çankırı', 'Karabük', 'Bilecik'],
  'Düzce': ['Sakarya', 'Bolu', 'Zonguldak'],
  'Çankırı': ['Ankara', 'Bolu', 'Karabük', 'Kastamonu', 'Kırıkkale', 'Çorum'],
  'Karabük': ['Bolu', 'Çankırı', 'Kastamonu', 'Bartın', 'Zonguldak'],
  'Zonguldak': ['Düzce', 'Karabük', 'Bartın'],
  'Bartın': ['Zonguldak', 'Karabük', 'Kastamonu'],
  'Kastamonu': ['Çankırı', 'Karabük', 'Bartın', 'Sinop', 'Çorum'],
  'Sinop': ['Kastamonu', 'Samsun', 'Çorum'],
  
  // Karadeniz Bölgesi
  'Samsun': ['Sinop', 'Çorum', 'Amasya', 'Tokat', 'Ordu'],
  'Amasya': ['Samsun', 'Çorum', 'Tokat', 'Yozgat'],
  'Çorum': ['Çankırı', 'Kastamonu', 'Sinop', 'Samsun', 'Amasya', 'Yozgat', 'Tokat'],
  'Tokat': ['Samsun', 'Amasya', 'Yozgat', 'Sivas', 'Ordu'],
  'Ordu': ['Samsun', 'Tokat', 'Sivas', 'Giresun'],
  'Giresun': ['Ordu', 'Sivas', 'Erzincan', 'Gümüşhane', 'Trabzon'],
  'Trabzon': ['Giresun', 'Gümüşhane', 'Bayburt', 'Rize'],
  'Rize': ['Trabzon', 'Artvin', 'Erzurum'],
  'Artvin': ['Rize', 'Erzurum', 'Ardahan'],
  
  // Doğu Anadolu - Kuzey
  'Gümüşhane': ['Giresun', 'Trabzon', 'Bayburt', 'Erzincan'],
  'Bayburt': ['Trabzon', 'Gümüşhane', 'Erzincan', 'Erzurum'],
  'Erzincan': ['Giresun', 'Gümüşhane', 'Bayburt', 'Erzurum', 'Tunceli', 'Sivas'],
  'Erzurum': ['Rize', 'Artvin', 'Bayburt', 'Erzincan', 'Bingöl', 'Muş', 'Ağrı', 'Kars'],
  'Kars': ['Erzurum', 'Ardahan', 'Iğdır', 'Ağrı'],
  'Ardahan': ['Artvin', 'Kars'],
  'Iğdır': ['Kars', 'Ağrı'],
  'Ağrı': ['Erzurum', 'Kars', 'Iğdır', 'Van', 'Muş'],
  
  // Doğu Anadolu - Güney
  'Tunceli': ['Erzincan', 'Bingöl', 'Elazığ'],
  'Bingöl': ['Erzurum', 'Tunceli', 'Elazığ', 'Muş', 'Diyarbakır'],
  'Muş': ['Erzurum', 'Ağrı', 'Bingöl', 'Bitlis', 'Van'],
  'Bitlis': ['Muş', 'Van', 'Siirt'],
  'Van': ['Ağrı', 'Muş', 'Bitlis', 'Hakkâri'],
  'Hakkâri': ['Van', 'Şırnak'],
  
  // Güneydoğu Anadolu
  'Malatya': ['Kayseri', 'Sivas', 'Elazığ', 'Adıyaman', 'Kahramanmaraş'],
  'Elazığ': ['Malatya', 'Tunceli', 'Bingöl', 'Diyarbakır'],
  'Sivas': ['Yozgat', 'Kayseri', 'Malatya', 'Tokat', 'Ordu', 'Giresun', 'Erzincan'],
  'Kahramanmaraş': ['Adana', 'Osmaniye', 'Kayseri', 'Malatya', 'Adıyaman', 'Gaziantep'],
  'Adıyaman': ['Kahramanmaraş', 'Malatya', 'Diyarbakır', 'Şanlıurfa', 'Gaziantep'],
  'Gaziantep': ['Adana', 'Hatay', 'Osmaniye', 'Kahramanmaraş', 'Adıyaman', 'Şanlıurfa', 'Kilis'],
  'Kilis': ['Gaziantep'],
  'Şanlıurfa': ['Gaziantep', 'Adıyaman', 'Diyarbakır', 'Mardin'],
  'Diyarbakır': ['Bingöl', 'Elazığ', 'Adıyaman', 'Şanlıurfa', 'Mardin', 'Batman', 'Siirt'],
  'Mardin': ['Şanlıurfa', 'Diyarbakır', 'Batman', 'Şırnak'],
  'Batman': ['Diyarbakır', 'Mardin', 'Siirt', 'Şırnak'],
  'Siirt': ['Bitlis', 'Diyarbakır', 'Batman', 'Şırnak'],
  'Şırnak': ['Hakkâri', 'Mardin', 'Batman', 'Siirt'],
};

// Karayolu mesafe faktörü (kuş uçuşu mesafenin yaklaşık 1.3 katı gerçek karayolu mesafesi)
export const KARAYOLU_MESAFE_FAKTORU = 1.3;

// Şehirler arası tahmini karayolu mesafesi (km)
export const karayoluMesafesiHesapla = (sehir1, sehir2, mesafeHesaplaFunc) => {
  const kusUcusu = mesafeHesaplaFunc(sehir1, sehir2);
  return kusUcusu * KARAYOLU_MESAFE_FAKTORU;
};

// Yol ağında bağlantı var mı kontrol et
export const baglantiVarMi = (sehir1, sehir2) => {
  return yolAgi[sehir1]?.includes(sehir2) || yolAgi[sehir2]?.includes(sehir1);
};

// Bir şehrin tüm komşularını getir
export const komsulariGetir = (sehir) => {
  const komsular = new Set();
  
  // Doğrudan bağlantılar
  if (yolAgi[sehir]) {
    yolAgi[sehir].forEach(komsu => komsular.add(komsu));
  }
  
  // Ters bağlantılar
  Object.entries(yolAgi).forEach(([s, baglantilar]) => {
    if (baglantilar.includes(sehir)) {
      komsular.add(s);
    }
  });
  
  return Array.from(komsular);
};
