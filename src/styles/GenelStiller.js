import { StyleSheet, Platform, StatusBar } from "react-native";

// Modern renk paleti - daha canlı ve modern tonlar
export const renkler = {
  anaRenk: "#4F46E5", // Indigo - modern ve profesyonel
  ikinciRenk: "#10B981", // Emerald green - başarı ve güven
  uyariRenk: "#F59E0B", // Amber - dikkat çekici
  hataRenk: "#EF4444", // Red - hata durumu
  arkaPlan: "#F8FAFC", // Slate 50 - yumuşak arka plan
  beyaz: "#FFFFFF",
  metinKoyu: "#1E293B", // Slate 800 - okunabilir koyu metin
  metinAcik: "#64748B", // Slate 500 - yumuşak gri
  kartArkaPlan: "#FFFFFF",
  golge: "#E2E8F0", // Slate 200 - zarif gölge
  gradyanBaslangic: "#4F46E5",
  gradyanBitis: "#7C3AED",
  basariRenk: "#10B981",
  kartGolge: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
};

export const genelStiller = StyleSheet.create({
  ekranContainer: {
    flex: 1,
    backgroundColor: renkler.arkaPlan,
  },
  scrollViewContainer: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  baslik: {
    fontSize: 28,
    fontWeight: "800",
    color: renkler.metinKoyu,
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  altBaslik: {
    fontSize: 20,
    fontWeight: "700",
    color: renkler.metinKoyu,
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  hataMetni: {
    color: renkler.hataRenk,
    textAlign: "center",
    marginTop: 16,
    fontSize: 15,
    fontWeight: "500",
  },
  bilgiMetni: {
    color: renkler.metinAcik,
    textAlign: "center",
    marginTop: 20,
    fontSize: 15,
    lineHeight: 22,
  },
  yukleniyorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  logo: {
    width: 120,
    height: 120,
    alignSelf: "center",
    marginBottom: 24,
    borderRadius: 24,
    backgroundColor: renkler.beyaz,
    ...renkler.kartGolge,
  },
  // Banner Ad stili
  bannerAd: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    width: "100%",
    height: Platform.OS === "android" ? 50 : 60,
    backgroundColor: renkler.beyaz,
  },
  // Modern kart stili
  modernKart: {
    backgroundColor: renkler.beyaz,
    borderRadius: 20,
    padding: 20,
    ...renkler.kartGolge,
  },
  // Gradient container
  gradyanKapsayici: {
    flex: 1,
    borderRadius: 0,
  },
  // İçerik container - banner ad için padding bottom
  icerikKapsayici: {
    flex: 1,
    paddingBottom: Platform.OS === "android" ? 60 : 70,
  },
  // Modern buton stili
  modernButon: {
    backgroundColor: renkler.anaRenk,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    ...renkler.kartGolge,
  },
  modernButonMetni: {
    color: renkler.beyaz,
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  // Input container stili
  inputKapsayici: {
    marginBottom: 16,
  },
  inputEtiket: {
    fontSize: 14,
    fontWeight: "600",
    color: renkler.metinKoyu,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  // Liste container
  listeContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  // Sonuç başlığı
  sonucBasligi: {
    fontSize: 18,
    fontWeight: "700",
    color: renkler.metinKoyu,
    textAlign: "center",
    paddingVertical: 16,
    backgroundColor: renkler.beyaz,
    borderBottomWidth: 1,
    borderBottomColor: renkler.golge,
    marginBottom: 8,
    letterSpacing: -0.3,
  },
});
