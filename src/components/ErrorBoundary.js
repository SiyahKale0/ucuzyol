// src/components/ErrorBoundary.js
// Global hata yakalama bileşeni

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { renkler } from '../styles/GenelStiller';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ 
      errorInfo,
      errorCount: this.state.errorCount + 1,
    });
    
    // Hata loglama servisi entegrasyonu için
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Production'da Sentry/Crashlytics'e gönderebilirsiniz
    // crashlytics().recordError(error);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    this.props.onRetry?.();
  };

  handleReport = () => {
    // Hata raporlama modalı açılabilir
    this.props.onReport?.(this.state.error, this.state.errorInfo);
  };

  render() {
    if (this.state.hasError) {
      const { fallback, showDetails = false } = this.props;
      
      // Özel fallback varsa kullan
      if (fallback) {
        return fallback(this.state.error, this.handleRetry);
      }

      return (
        <View style={styles.container}>
          <View style={styles.content}>
            {/* İkon */}
            <View style={styles.iconContainer}>
              <Feather name="alert-triangle" size={48} color={renkler.hataRenk} />
            </View>

            {/* Başlık */}
            <Text style={styles.title}>Bir Sorun Oluştu</Text>
            <Text style={styles.subtitle}>
              Beklenmeyen bir hata meydana geldi. Lütfen tekrar deneyin.
            </Text>

            {/* Hata detayları (development modunda) */}
            {showDetails && this.state.error && (
              <ScrollView style={styles.errorDetails}>
                <Text style={styles.errorTitle}>Hata Mesajı:</Text>
                <Text style={styles.errorText}>{this.state.error.toString()}</Text>
                {this.state.errorInfo && (
                  <>
                    <Text style={styles.errorTitle}>Stack Trace:</Text>
                    <Text style={styles.errorText}>
                      {this.state.errorInfo.componentStack}
                    </Text>
                  </>
                )}
              </ScrollView>
            )}

            {/* Butonlar */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={styles.retryButton} 
                onPress={this.handleRetry}
                activeOpacity={0.8}
              >
                <Feather name="refresh-cw" size={18} color={renkler.beyaz} />
                <Text style={styles.retryButtonText}>Tekrar Dene</Text>
              </TouchableOpacity>

              {this.props.onReport && (
                <TouchableOpacity 
                  style={styles.reportButton} 
                  onPress={this.handleReport}
                  activeOpacity={0.8}
                >
                  <Feather name="flag" size={18} color={renkler.anaRenk} />
                  <Text style={styles.reportButtonText}>Hatayı Bildir</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Hata sayacı */}
            {this.state.errorCount > 1 && (
              <Text style={styles.errorCounter}>
                Bu oturumda {this.state.errorCount} hata oluştu
              </Text>
            )}
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: renkler.arkaPlan,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    backgroundColor: renkler.beyaz,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: renkler.hataRenk + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: renkler.metinKoyu,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: renkler.metinAcik,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  errorDetails: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    maxHeight: 150,
    width: '100%',
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: renkler.metinKoyu,
    marginBottom: 4,
    marginTop: 8,
  },
  errorText: {
    fontSize: 11,
    color: renkler.hataRenk,
    fontFamily: 'monospace',
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: renkler.anaRenk,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: renkler.beyaz,
  },
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: renkler.anaRenk + '10',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  reportButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: renkler.anaRenk,
  },
  errorCounter: {
    marginTop: 16,
    fontSize: 12,
    color: renkler.metinAcik,
  },
});

export default ErrorBoundary;
