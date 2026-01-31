import { useCallback, useState } from "react";

// Expo Go test modu - mock interstitial reklam

export const useInterstitialAd = () => {
  const [loaded] = useState(true); // Her zaman "yüklü"

  const showAd = useCallback(async () => {
    console.log("📢 [TEST] Geçiş reklamı gösterildi");
    return;
  }, []);

  return { showAd, loaded };
};

export default useInterstitialAd;
