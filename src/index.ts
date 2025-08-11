/**
 * Kargo takip sistemi ana modülü
 * 
 * Bu modül kargo takip işlemleri için gerekli tüm sınıfları ve tipleri dışa aktarır.
 * Farklı kargo firmalarından kargo durumu sorgulama işlemlerini destekler.
 * 
 * @example
 * ```typescript
 * import { CargoTracker } from 'kargo-takip';
 * 
 * const tracker = new CargoTracker();
 * const result = await tracker.trackArasKargo('1234567890');
 * console.log(result);
 * ```
 * 
 * @author Kargo Takip Sistemi
 * @version 1.0.0
 */

/**
 * Ana kargo takip sınıfını dışa aktarır
 * Farklı kargo firmalarını destekleyen merkezi takip sistemi
 */
export { CargoTracker } from './CargoTracker';

/**
 * Aras Kargo provider sınıfını dışa aktarır
 * Aras Kargo web sitesinden kargo bilgilerini çeker
 */
export { ArasKargo } from './providers/ArasKargo';

/**
 * Tüm tip tanımlarını dışa aktarır
 * Kargo takip işlemleri için gerekli interface ve enum'ları içerir
 */
export * from './types';

/**
 * Ana kargo takip sınıfını varsayılan export olarak dışa aktarır
 * Bu sayede import { CargoTracker } yerine import CargoTracker kullanılabilir
 */
import { CargoTracker } from './CargoTracker';
export default CargoTracker;