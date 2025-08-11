import { CargoProvider, TrackingResult } from './types';
import { ArasKargo } from './providers/ArasKargo';

/**
 * Ana kargo takip sınıfı
 * 
 * Farklı kargo firmalarını destekleyen merkezi takip sistemi.
 * Provider pattern kullanarak yeni kargo firmaları kolayca eklenebilir.
 * 
 * @example
 * ```typescript
 * const tracker = new CargoTracker();
 * 
 * // Aras Kargo ile takip
 * const result = await tracker.trackArasKargo('1234567890');
 * 
 * // Genel provider ile takip
 * const result2 = await tracker.trackWithProvider('aras kargo', '1234567890');
 * 
 * // Kullanılabilir provider'ları listele
 * const providers = tracker.getProviders();
 * console.log(providers);
 * 
 * // Kaynakları temizle
 * await tracker.close();
 * ```
 */
export class CargoTracker {
  /**
   * Kayıtlı kargo provider'larını saklayan Map yapısı
   * Key: provider adı (küçük harflerle), Value: provider instance
   * @private
   */
  private providers: Map<string, CargoProvider> = new Map();

  /**
   * CargoTracker sınıfının constructor'ı
   * Varsayılan olarak Aras Kargo provider'ını kayıt eder
   * 
   * @example
   * ```typescript
   * const tracker = new CargoTracker();
   * ```
   */
  constructor() {
    this.registerProvider(new ArasKargo());
  }

  /**
   * Yeni bir kargo provider'ı sisteme kayıt eder
   * 
   * @param provider - Kayıt edilecek kargo provider'ı
   * @throws {Error} Provider adı boş olamaz
   * 
   * @example
   * ```typescript
   * const customProvider = new CustomKargoProvider();
   * tracker.registerProvider(customProvider);
   * ```
   */
  public registerProvider(provider: CargoProvider): void {
    this.providers.set(provider.name.toLowerCase(), provider);
  }

  /**
   * Kayıtlı tüm kargo provider'larının adlarını döndürür
   * 
   * @returns Kayıtlı provider adlarının listesi (küçük harflerle)
   * 
   * @example
   * ```typescript
   * const providers = tracker.getProviders();
   * console.log(providers); // ['aras kargo']
   * ```
   */
  public getProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Belirtilen provider ile kargo takip işlemi yapar
   * 
   * @param providerName - Kullanılacak kargo provider'ının adı (büyük/küçük harf duyarsız)
   * @param trackingNumber - Takip edilecek kargo numarası
   * @returns Kargo takip sonucu
   * 
   * @example
   * ```typescript
   * const result = await tracker.trackWithProvider('aras kargo', '1234567890');
   * if (result.success) {
   *   console.log('Kargo durumu:', result.data?.status);
   * } else {
   *   console.error('Hata:', result.error);
   * }
   * ```
   */
  public async trackWithProvider(providerName: string, trackingNumber: string): Promise<TrackingResult> {
    const provider = this.providers.get(providerName.toLowerCase());
    if (!provider) {
      return {
        success: false,
        status: 'ERROR' as any,
        error: `Provider '${providerName}' not found`
      };
    }

    return await provider.track(trackingNumber);
  }

  /**
   * Aras Kargo ile kargo takip işlemi yapar (kısayol metod)
   * 
   * @param trackingNumber - Takip edilecek Aras Kargo numarası
   * @returns Kargo takip sonucu
   * 
   * @example
   * ```typescript
   * const result = await tracker.trackArasKargo('1234567890');
   * if (result.success && result.data) {
   *   console.log('Gönderici şube:', result.data.senderBranch);
   *   console.log('Alıcı şube:', result.data.receiverBranch);
   *   console.log('Durum:', result.data.status);
   * }
   * ```
   */
  public async trackArasKargo(trackingNumber: string): Promise<TrackingResult> {
    return await this.trackWithProvider('aras kargo', trackingNumber);
  }

  /**
   * Tüm provider'ların kaynaklarını temizler ve bağlantıları kapatır
   * Özellikle Puppeteer browser instance'larını kapatmak için önemlidir
   * 
   * @returns Promise<void>
   * 
   * @example
   * ```typescript
   * const tracker = new CargoTracker();
   * // ... takip işlemleri
   * await tracker.close(); // Kaynakları temizle
   * ```
   */
  public async close(): Promise<void> {
    for (const provider of this.providers.values()) {
      if ('close' in provider && typeof provider.close === 'function') {
        await provider.close();
      }
    }
  }
}