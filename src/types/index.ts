/**
 * Kargo takip işleminin sonucunu temsil eden interface
 * Tüm takip işlemlerinin döndürdüğü standart veri yapısı
 */
export interface TrackingResult {
  /** Takip işleminin başarılı olup olmadığını belirtir */
  success: boolean;
  /** Kargo durumunu belirten enum değeri */
  status: TrackingStatus;
  /** Başarılı takip durumunda kargo detay bilgileri */
  data?: CargoInfo;
  /** Hata durumunda hata mesajı */
  error?: string;
}

/**
 * Kargo durumlarını temsil eden enum
 * Türkçe değerlerle kargo durumlarını standartlaştırır
 */
export enum TrackingStatus {
  /** Kargo başarıyla teslim edildi */
  DELIVERED = 'TESLİM EDİLDİ',
  /** Kargo yolda, henüz teslim edilmedi */
  IN_TRANSIT = 'YOLDA',
  /** Verilen kargo numarası bulunamadı */
  NOT_FOUND = 'BULUNAMADI',
  /** Takip işlemi sırasında hata oluştu */
  ERROR = 'HATA'
}

/**
 * Kargo detay bilgilerini içeren ana interface
 * Bir kargonun tüm özelliklerini ve durumunu temsil eder
 */
export interface CargoInfo {
  /** Kargo takip numarası */
  trackingNumber: string;
  /** Kargonun mevcut durumu (örn: "TESLİM EDİLDİ", "YOLDA") */
  status: string;
  /** Kargonun gönderildiği şube */
  senderBranch: string;
  /** Kargonun teslim edileceği şube */
  receiverBranch: string;
  /** Kargonun gönderim tarihi */
  shipmentDate: string;
  /** Kargonun teslim tarihi (varsa) */
  deliveryDate?: string;
  /** Kargoyu teslim alan kişi (varsa) */
  recipient?: string;
  /** Kargoyu gönderen kişi (varsa) */
  sender?: string;
  /** Kargo türü (örn: "PAKET", "EVRAK") */
  cargoType: string;
  /** Kargo ağırlığı */
  weight: string;
  /** Paket sayısı */
  packageCount: string;
  /** İrsaliye numarası */
  waybillNumber: string;
  /** Ödeme türü (örn: "ALICI ÖDEMELİ", "GÖNDERİCİ ÖDEMELİ") */
  paymentType: string;
  /** Teslimat yöntemi (varsa) */
  deliveryMethod?: string;
  /** SMS kodu (varsa) */
  smsCode?: string;
  /** Teslimat başarısızlık nedenleri (varsa) */
  failureReasons?: FailureReason[];
  /** Kargo hareket geçmişi (varsa) */
  movements?: MovementInfo[];
  /** Ek hizmet bilgileri (varsa) */
  serviceInfo?: ServiceInfo;
}

/**
 * Kargo teslimat başarısızlık nedenlerini temsil eden interface
 */
export interface FailureReason {
  /** Başarısızlık tarihi */
  date: string;
  /** Başarısızlık nedeni */
  reason: string;
  /** Detaylı açıklama */
  description: string;
}

/**
 * Kargo hareket bilgilerini temsil eden interface
 * Kargonun geçtiği lokasyonları ve durumları içerir
 */
export interface MovementInfo {
  /** Hareket tarihi */
  date: string;
  /** Hareket lokasyonu (şehir/şube) */
  location: string;
  /** Hareket durumu */
  status: string;
  /** Ek açıklama (varsa) */
  description?: string;
}

/**
 * Kargo hizmet bilgilerini temsil eden interface
 * SMS bildirimleri ve ek hizmetleri içerir
 */
export interface ServiceInfo {
  /** Hizmet türü */
  serviceType?: string;
  /** SMS bildirim listesi */
  smsNotifications?: string[];
  /** Ek hizmetler listesi */
  additionalServices?: string[];
}

/**
 * Kargo provider'larının uygulaması gereken interface
 * Yeni kargo firmaları bu interface'i implement etmelidir
 * 
 * @example
 * ```typescript
 * class YeniKargoProvider implements CargoProvider {
 *   name = 'Yeni Kargo';
 *   
 *   async track(trackingNumber: string): Promise<TrackingResult> {
 *     // Takip işlemi implementasyonu
 *     return { success: true, status: TrackingStatus.IN_TRANSIT };
 *   }
 * }
 * ```
 */
export interface CargoProvider {
  /** Provider'ın adı */
  name: string;
  /** 
   * Kargo takip işlemini gerçekleştiren metod
   * @param trackingNumber - Takip edilecek kargo numarası
   * @returns Takip sonucu
   */
  track(trackingNumber: string): Promise<TrackingResult>;
}