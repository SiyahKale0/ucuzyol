import { useCallback, useState, useEffect, useRef } from "react";
import { InterstitialAd, AdEventType, TestIds } from "react-native-google-mobile-ads";

// Geçiş reklamı birimi ID'si
const INTERSTITIAL_AD_UNIT_ID = __DEV__
  ? TestIds.INTERSTITIAL
  : "ca-app-pub-1312596055663310/1889163982";

export const useInterstitialAd = () => {
  const [loaded, setLoaded] = useState(false);
  const interstitialRef = useRef(null);
  const subscribersRef = useRef([]);

  // Yeni reklam oluştur ve yükle
  const loadAd = useCallback(() => {
    // Önceki subscriber'ları temizle
    subscribersRef.current.forEach((unsub) => unsub());
    subscribersRef.current = [];

    const interstitial = InterstitialAd.createForAdRequest(INTERSTITIAL_AD_UNIT_ID, {
      requestNonPersonalizedAdsOnly: true,
    });

    interstitialRef.current = interstitial;

    // Reklam yüklendiğinde
    const unsubLoaded = interstitial.addAdEventListener(AdEventType.LOADED, () => {
      setLoaded(true);
    });

    // Reklam kapatıldığında yenisini yükle
    const unsubClosed = interstitial.addAdEventListener(AdEventType.CLOSED, () => {
      setLoaded(false);
      // Yeni reklam yükle (preload)
      setTimeout(() => loadAd(), 1000);
    });

    // Hata durumunda
    const unsubError = interstitial.addAdEventListener(AdEventType.ERROR, (error) => {
      console.warn("[InterstitialAd] Reklam hatası:", error?.message || error);
      setLoaded(false);
      // Hata sonrası tekrar dene (30 saniye sonra)
      setTimeout(() => loadAd(), 30000);
    });

    subscribersRef.current = [unsubLoaded, unsubClosed, unsubError];

    // Reklamı yüklemeye başla
    interstitial.load();
  }, []);

  // Component mount'ta ilk reklamı yükle
  useEffect(() => {
    loadAd();

    return () => {
      // Cleanup: tüm subscriber'ları temizle
      subscribersRef.current.forEach((unsub) => unsub());
      subscribersRef.current = [];
    };
  }, [loadAd]);

  // Reklamı göster
  const showAd = useCallback(async () => {
    if (loaded && interstitialRef.current) {
      try {
        await interstitialRef.current.show();
      } catch (error) {
        console.warn("[InterstitialAd] Reklam gösterilemedi:", error?.message || error);
        // Gösterilemezse sessizce devam et, kullanıcı deneyimini bozma
        setLoaded(false);
        loadAd();
      }
    }
    // Yüklü değilse sessizce geç - kullanıcıyı beklemeye almayız
  }, [loaded, loadAd]);

  return { showAd, loaded };
};

export default useInterstitialAd;
