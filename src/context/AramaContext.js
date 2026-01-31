import React, { createContext, useState, useContext, useCallback, useMemo, useReducer } from 'react';
import { sehirListesi } from '../constants/Sehirler';

// 1. Context'i oluştur
const AramaContext = createContext();

// Arama modu sabitleri
export const ARAMA_MODLARI = {
  STANDART: 'standart',        // Direkt + tek aktarmalı
  COKLU_AKTARMA: 'coklu',      // 2+ aktarmalı dahil
  SADECE_DIREKT: 'direkt',     // Sadece direkt seferler
};

// Loading state reducer - daha granüler yükleme durumları
const loadingReducer = (state, action) => {
  switch (action.type) {
    case 'START_SEARCH':
      return { ...state, isSearching: true, searchProgress: 0 };
    case 'UPDATE_PROGRESS':
      return { ...state, searchProgress: action.payload };
    case 'END_SEARCH':
      return { ...state, isSearching: false, searchProgress: 100 };
    case 'RESET':
      return { isSearching: false, searchProgress: 0 };
    default:
      return state;
  }
};

// 2. Provider Bileşeni oluştur
export const AramaProvider = ({ children }) => {
  const [kalkisSehri, setKalkisSehri] = useState(sehirListesi[0]); // Başlangıç değeri
  const [varisSehri, setVarisSehri] = useState(sehirListesi[1]);   // Başlangıç değeri
  const [seciliTarih, setSeciliTarih] = useState(new Date());
  const [aramaSonuclari, setAramaSonuclari] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hataMesaji, setHataMesaji] = useState(null);
  
  // Loading state için reducer
  const [loadingState, dispatchLoading] = useReducer(loadingReducer, {
    isSearching: false,
    searchProgress: 0,
  });
  
  // Yeni: Gelişmiş arama ayarları
  const [aramaModu, setAramaModu] = useState(ARAMA_MODLARI.STANDART);
  const [maksAktarmaSayisi, setMaksAktarmaSayisi] = useState(2);
  const [siralama, setSiralama] = useState('fiyat'); // fiyat, sure, aktarma
  const [filtre, setFiltre] = useState({
    sadeceDirekt: false,
    maksimumFiyat: null,
    firmalar: [],
  });
  
  // Yeni: Arama istatistikleri
  const [aramaIstatistikleri, setAramaIstatistikleri] = useState({
    direktSayisi: 0,
    tekAktarmaliSayisi: 0,
    cokluAktarmaliSayisi: 0,
    enDusukFiyat: null,
    enYuksekFiyat: null,
  });

  // Tarihi GG.AA.YYYY formatına çeviren yardımcı fonksiyon - useCallback ile optimize
  const formatliTarih = useCallback((tarih) => {
    const gun = tarih.getDate().toString().padStart(2, '0');
    const ay = (tarih.getMonth() + 1).toString().padStart(2, '0');
    const yil = tarih.getFullYear();
    return `${gun}.${ay}.${yil}`;
  }, []);

  // Sonuçları sırala - useCallback ile optimize
  const sonuclariSirala = useCallback((sonuclar, siralamaKriteri) => {
    const siralanmis = [...sonuclar];
    switch (siralamaKriteri) {
      case 'fiyat':
        return siralanmis.sort((a, b) => a.toplam_fiyat - b.toplam_fiyat);
      case 'aktarma':
        return siralanmis.sort((a, b) => {
          const aAktarma = a.tip === 'direct' ? 0 : (a.aktarma_sayisi || 1);
          const bAktarma = b.tip === 'direct' ? 0 : (b.aktarma_sayisi || 1);
          return aAktarma - bAktarma;
        });
      case 'sure':
        return siralanmis.sort((a, b) => (a.toplam_sure || 999) - (b.toplam_sure || 999));
      default:
        return siralanmis;
    }
  }, []);

  // Sonuçları filtrele - useCallback ile optimize
  const sonuclariFiltrele = useCallback((sonuclar, filtreler) => {
    let filtrelenmis = [...sonuclar];
    
    if (filtreler.sadeceDirekt) {
      filtrelenmis = filtrelenmis.filter(s => s.tip === 'direct');
    }
    
    if (filtreler.maksimumFiyat) {
      filtrelenmis = filtrelenmis.filter(s => s.toplam_fiyat <= filtreler.maksimumFiyat);
    }
    
    if (filtreler.firmalar && filtreler.firmalar.length > 0) {
      filtrelenmis = filtrelenmis.filter(s => {
        if (s.firma) return filtreler.firmalar.includes(s.firma);
        if (s.bacak1?.firma) return filtreler.firmalar.includes(s.bacak1.firma);
        return true;
      });
    }
    
    return filtrelenmis;
  }, []);

  // İstatistikleri hesapla - useCallback ile optimize
  const istatistikleriHesapla = useCallback((sonuclar) => {
    const stats = {
      direktSayisi: sonuclar.filter(s => s.tip === 'direct').length,
      tekAktarmaliSayisi: sonuclar.filter(s => s.tip === 'transfer').length,
      cokluAktarmaliSayisi: sonuclar.filter(s => s.tip === 'multi-transfer').length,
      enDusukFiyat: sonuclar.length > 0 ? Math.min(...sonuclar.map(s => s.toplam_fiyat)) : null,
      enYuksekFiyat: sonuclar.length > 0 ? Math.max(...sonuclar.map(s => s.toplam_fiyat)) : null,
    };
    setAramaIstatistikleri(stats);
    return stats;
  }, []);

  // Tüm arama sonuçlarını ayarla ve istatistikleri güncelle - useCallback ile optimize
  const aramaSonuclariAyarla = useCallback((sonuclar) => {
    setAramaSonuclari(sonuclar);
    istatistikleriHesapla(sonuclar);
  }, [istatistikleriHesapla]);

  // Aramayı sıfırla - useCallback ile optimize
  const aramaySifirla = useCallback(() => {
    setAramaSonuclari([]);
    setHataMesaji(null);
    dispatchLoading({ type: 'RESET' });
    setAramaIstatistikleri({
      direktSayisi: 0,
      tekAktarmaliSayisi: 0,
      cokluAktarmaliSayisi: 0,
      enDusukFiyat: null,
      enYuksekFiyat: null,
    });
  }, []);

  // Şehir değiştirme fonksiyonu
  const sehirleriDegistir = useCallback(() => {
    const temp = kalkisSehri;
    setKalkisSehri(varisSehri);
    setVarisSehri(temp);
  }, [kalkisSehri, varisSehri]);

  // Provider'ın sağlayacağı değerler - useMemo ile optimize
  const value = useMemo(() => ({
    kalkisSehri,
    setKalkisSehri,
    varisSehri,
    setVarisSehri,
    seciliTarih,
    setSeciliTarih,
    formatliTarih,
    aramaSonuclari,
    setAramaSonuclari: aramaSonuclariAyarla,
    yukleniyor,
    setYukleniyor,
    hataMesaji,
    setHataMesaji,
    // Yeni değerler
    aramaModu,
    setAramaModu,
    maksAktarmaSayisi,
    setMaksAktarmaSayisi,
    siralama,
    setSiralama,
    filtre,
    setFiltre,
    aramaIstatistikleri,
    sonuclariSirala,
    sonuclariFiltrele,
    aramaySifirla,
    sehirleriDegistir,
    loadingState,
    dispatchLoading,
    ARAMA_MODLARI,
  }), [
    kalkisSehri, varisSehri, seciliTarih, aramaSonuclari,
    yukleniyor, hataMesaji, aramaModu, maksAktarmaSayisi,
    siralama, filtre, aramaIstatistikleri, loadingState,
    formatliTarih, sonuclariSirala, sonuclariFiltrele,
    aramaySifirla, sehirleriDegistir, aramaSonuclariAyarla,
  ]);

  return (
    <AramaContext.Provider value={value}>
      {children}
    </AramaContext.Provider>
  );
};

// 3. Context'i kullanmak için özel bir hook (isteğe bağlı ama önerilir)
export const useArama = () => {
  const context = useContext(AramaContext);
  if (context === undefined) {
    throw new Error('useArama hooku AramaProvider içinde kullanılmalıdır!');
  }
  return context;
};