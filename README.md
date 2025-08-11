# Kargo Takip - Türkiye Kargo Takip Modülü

Türkiye'deki kargo şirketleri için web scraping tabanlı kargo takip modülü.

## Özellikler

- 🚚 **Aras Kargo** desteği
- 🔍 Gerçek zamanlı kargo durumu sorgulama
- 📦 Detaylı kargo bilgileri
- 🛡️ TypeScript desteği
- 🎭 User-Agent rotasyonu
- 🚀 Modüler yapı (yeni kargo şirketleri kolayca eklenebilir)

## Kurulum

```bash
npm install kargo-takip
```

### Geliştirme için

```bash
git clone https://github.com/sw3do/kargo-takip-module.git
cd kargo-takip-module
npm install
npm run build
```

## Kullanım

### Temel Kullanım

```typescript
import { CargoTracker, TrackingStatus } from 'kargo-takip';

const tracker = new CargoTracker();

const result = await tracker.trackArasKargo('KARGO_KODUN');

if (result.success && result.data) {
  console.log('Status:', result.data.status);
  console.log('Sender:', result.data.senderBranch);
  console.log('Receiver:', result.data.receiverBranch);
  
  if (result.status === TrackingStatus.DELIVERED) {
    console.log('Delivered to:', result.data.recipient);
    console.log('Delivery date:', result.data.deliveryDate);
  }
}

// Kaynakları temizle
await tracker.close();
```

### Örnek Çalıştırma

```bash
npm run dev
# veya
ts-node example.ts
```

## API

### CargoTracker

#### `trackArasKargo(trackingNumber: string): Promise<TrackingResult>`

Aras Kargo için kargo takibi yapar.

#### `trackWithProvider(providerName: string, trackingNumber: string): Promise<TrackingResult>`

Belirtilen provider ile kargo takibi yapar.

#### `getProviders(): string[]`

Mevcut provider'ları listeler.

#### `close(): Promise<void>`

Tüm browser instance'larını kapatır.

### TrackingResult

```typescript
interface TrackingResult {
  success: boolean;
  status: TrackingStatus;
  data?: CargoInfo;
  error?: string;
}
```

### CargoInfo

```typescript
interface CargoInfo {
  trackingNumber: string;
  status: string;
  senderBranch: string;
  receiverBranch: string;
  shipmentDate: string;
  deliveryDate?: string;
  recipient?: string;
  sender?: string;
  cargoType: string;
  weight: string;
  packageCount: string;
  waybillNumber: string;
  paymentType: string;
  deliveryMethod?: string;
  smsCode?: string;
  failureReasons?: FailureReason[];
}
```

## Desteklenen Kargo Şirketleri

- ✅ **Aras Kargo** - Tam destek
- 🔄 **MNG Kargo** - Planlanan
- 🔄 **Yurtiçi Kargo** - Planlanan
- 🔄 **PTT Kargo** - Planlanan

## Geliştirme

### Yeni Provider Ekleme

```typescript
import { CargoProvider, TrackingResult } from '../types';

export class YeniKargo implements CargoProvider {
  public readonly name: string = 'Yeni Kargo';
  
  public async track(trackingNumber: string): Promise<TrackingResult> {
    // Implementation
  }
}
```

### Build

```bash
npm run build
```

### Test

```bash
npm test
```

## Dokümantasyon

📖 **[Online Dokümantasyon](https://sw3do.github.io/kargo-takip-module/)** - GitHub Pages üzerinde otomatik güncellenen dokümantasyon

Yerel dokümantasyon oluşturmak için:

```bash
# Dokümantasyonu oluştur
npm run docs
```

Dokümantasyon `docs/` klasöründe oluşturulur ve http://localhost:8080 adresinde görüntülenebilir.

## Lisans

MIT

## Uyarı

Bu modül web scraping kullanır. Kargo şirketlerinin web sitelerindeki değişiklikler modülün çalışmasını etkileyebilir. Kullanım sıklığınızı makul seviyelerde tutun.