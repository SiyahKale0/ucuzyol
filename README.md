# ucuzyol

Türkiye genelinde otobüs bileti fiyatlarını karşılaştıran React Native uygulaması.

## Proje Hakkında

ucuzyol, bilet.com API'sini kullanarak 81 il arasındaki otobüs seferlerini sorgular ve kullanıcıya en uygun fiyatlı seçenekleri sunar. Direkt seferlerin yanı sıra aktarmalı güzergahları da analiz ederek alternatif rotalar önerir.

## Mimari

```
src/
├── api/
│   └── apiServisleri.js      # API çağrıları ve veri işleme
├── components/
│   ├── BiletKarti.js         # Sefer kartı bileşeni
│   ├── SehirAramaInput.js    # Şehir seçim alanı
│   └── BannerAd.js           # Reklam bileşeni
├── screens/
│   ├── AramaEkrani.js        # Ana arama sayfası
│   └── SonuclarEkrani.js     # Sonuç listesi
├── context/
│   └── AramaContext.js       # Global state yönetimi
├── utils/
│   ├── RotaAlgoritmalari.js  # Temel rota hesaplama
│   ├── GelismisRotaAlgoritmalari.js  # Çoklu aktarma analizi
│   ├── ApiCache.js           # İstek önbellekleme
│   └── ApiHelpers.js         # Retry ve rate limiting
├── constants/
│   ├── Sehirler.js           # Şehir listesi
│   ├── SehirKoordinatlari.js # Koordinat verileri
│   ├── YolAgi.js             # Şehirler arası bağlantılar
│   └── OtobusFirmalari.js    # Firma bilgileri
└── hooks/
    └── useInterstitialAd.js  # Reklam hook'u
```

## Temel Bileşenler

**Rota Algoritması**

Aktarmalı güzergahlar için hub-based yaklaşım kullanılır. İstanbul, Ankara, İzmir gibi merkezi şehirler üzerinden geçen rotalar öncelikli değerlendirilir. Mesafe ve fiyat optimizasyonu Haversine formülü ile yapılır.

**API Katmanı**

- Rate limiting (saniyede 5 istek)
- Exponential backoff ile retry
- 2 dakikalık önbellek süresi
- Paralel istek desteği

**State Yönetimi**

React Context API ile merkezi state. Arama parametreleri, sonuçlar ve yükleme durumları tek noktadan yönetilir.

## Kurulum

```bash
npm install
npx expo start
```

## Gereksinimler

- Node.js 18+
- Expo CLI
- Android Studio veya Xcode (native build için)


