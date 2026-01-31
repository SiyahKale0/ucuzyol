import { GoogleGenerativeAI } from "@google/generative-ai";

export const GEMINI_API_KEY_STRING = "AIzaSyAaEvBCDrbOfRxdJG6U6szGJyarkTPEUZc";

export const BILETCOM_BASE_URL = "https://www.bilet.com/otobus-bileti/ara";
export const GEMINI_API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

// GoogleGenerativeAI istemcisini yapılandır
export const genAI = new GoogleGenerativeAI(GEMINI_API_KEY_STRING);

// API key'i test etmek için yardımcı fonksiyon (opsiyonel, debug için)
export const testGeminiApiKey = async () => {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY_STRING}`
    );
    if (!response.ok) {
      console.error("API Key test hatası:", response.status, response.statusText);
      return null;
    }
    const data = await response.json();
    const modelNames = data.models?.map(m => m.name) || [];
    console.log("✅ API Key geçerli! Kullanılabilir modeller:", modelNames);
    return modelNames;
  } catch (error) {
    console.error("❌ API Key test hatası:", error);
    return null;
  }
};