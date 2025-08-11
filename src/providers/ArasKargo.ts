import puppeteer, { Browser, Page } from 'puppeteer';
import UserAgent from 'user-agents';
import { CargoProvider, TrackingResult, TrackingStatus, CargoInfo, MovementInfo, ServiceInfo } from '../types';

/**
 * Aras Kargo provider sınıfı
 * 
 * Aras Kargo web sitesinden kargo takip bilgilerini çeken provider.
 * Puppeteer kullanarak web scraping işlemi gerçekleştirir.
 * 
 * @example
 * ```typescript
 * const arasKargo = new ArasKargo();
 * const result = await arasKargo.track('1234567890');
 * console.log(result);
 * await arasKargo.close();
 * ```
 */
export class ArasKargo implements CargoProvider {
  /** Provider adı - CargoProvider interface'inden geliyor */
  public readonly name: string = 'Aras Kargo';
  
  /** Puppeteer browser instance'ı - performans için tekrar kullanılır */
  private browser: Browser | null = null;

  /**
   * Browser instance'ını döndürür, yoksa yeni bir tane oluşturur
   * Singleton pattern kullanarak performansı artırır
   * 
   * @returns Puppeteer browser instance'ı
   * @private
   */
  private async getBrowser(): Promise<Browser> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    }
    return this.browser;
  }

  /**
   * Yeni bir Puppeteer page oluşturur ve rastgele User-Agent ayarlar
   * Bot tespitini önlemek için farklı User-Agent kullanır
   * 
   * @returns Yapılandırılmış Puppeteer page instance'ı
   * @private
   */
  private async createPage(): Promise<Page> {
    const browser = await this.getBrowser();
    const page = await browser.newPage();
    const userAgent = new UserAgent();
    await page.setUserAgent(userAgent.toString());
    return page;
  }

  /**
   * Verilen kargo numarası için Aras Kargo takip işlemi yapar
   * 
   * @param trackingNumber - Takip edilecek kargo numarası
   * @returns Kargo takip sonucu
   * 
   * @example
   * ```typescript
   * const arasKargo = new ArasKargo();
   * const result = await arasKargo.track('1234567890');
   * 
   * if (result.success && result.data) {
   *   console.log('Durum:', result.data.status);
   *   console.log('Gönderici şube:', result.data.senderBranch);
   * } else {
   *   console.error('Hata:', result.error);
   * }
   * ```
   */
  public async track(trackingNumber: string): Promise<TrackingResult> {
    const page = await this.createPage();

    try {
      const url = `https://kargotakip.araskargo.com.tr/mainpage.aspx?code=${trackingNumber}`;
      await page.goto(url, { waitUntil: 'networkidle2' });
    
      const errorElement = await page.$('#Label1');
      if (errorElement) {
        const errorText = await page.evaluate(el => el?.textContent?.trim(), errorElement);
        if (errorText === 'Girdiğiniz bilgiler için bir sonuç bulunamamıştır.') {
          return {
            success: false,
            status: TrackingStatus.NOT_FOUND,
            error: 'Kargo numarası bulunamadı'
          };
        }
      }


      const currentUrl = page.url();
      if (!currentUrl.includes('kargotakip.aspx')) {
        return {
          success: false,
          status: TrackingStatus.ERROR,
          error: 'Beklenmeyen sayfa yönlendirmesi'
        };
      }

      const cargoInfo = await this.extractCargoInfo(page, trackingNumber);

      return {
        success: true,
        status: this.getTrackingStatus(cargoInfo.status),
        data: cargoInfo
      };

    } catch (error) {
      return {
        success: false,
        status: TrackingStatus.ERROR,
        error: `Scraping hatası: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`
      };
    } finally {
      await page.close();
    }
  }

  /**
   * Aras Kargo web sayfasından kargo bilgilerini çıkarır
   * 
   * @param page - Puppeteer page instance'ı
   * @param trackingNumber - Kargo takip numarası
   * @returns Çıkarılan kargo bilgileri
   * @private
   */
  private async extractCargoInfo(page: Page, trackingNumber: string): Promise<CargoInfo> {

    const data = await page.evaluate(() => {
      const getText = (selector: string): string => {
        const element = document.querySelector(selector);
        return element?.textContent?.trim() || '';
      };

      const getFailureReasons = (): Array<{ date: string, reason: string, description: string }> => {
        const rows = document.querySelectorAll('#notDeliveredDataGrid tr');
        const reasons: Array<{ date: string, reason: string, description: string }> = [];

        for (let i = 1; i < rows.length; i++) {
          const cells = rows[i].querySelectorAll('td');
          if (cells.length >= 3) {
            reasons.push({
              date: cells[0]?.textContent?.trim() || '',
              reason: cells[1]?.textContent?.trim() || '',
              description: cells[2]?.textContent?.trim() || ''
            });
          }
        }
        return reasons;
      };

      return {
        status: getText('#Son_Durum'),
        senderBranch: getText('#LabelIlkCikis'),
        receiverBranch: getText('#varis_subesi'),
        shipmentDate: getText('#cikis_tarihi'),
        deliveryDate: getText('#Teslim_Tarihi'),
        recipient: getText('#Teslim_Alan'),
        sender: getText('#gonderici_adi_soyadi'),
        cargoType: getText('#LabelCargoType'),
        weight: getText('#LabelCargoVolume'),
        packageCount: getText('#LabelPackageCount'),
        waybillNumber: getText('#labelTradingWaybillNumber'),
        paymentType: getText('#fatura_turu'),
        deliveryMethod: getText('#Teslimat_Kodu'),
        smsCode: getText('#Teslimat_Kodu'),
        failureReasons: getFailureReasons()
      };
    });

    const movements = await this.extractMovements(page);
    
    const serviceInfo = await this.extractServiceInfo(page);

    return {
      trackingNumber,
      status: data.status,
      senderBranch: data.senderBranch,
      receiverBranch: data.receiverBranch,
      shipmentDate: data.shipmentDate,
      deliveryDate: data.deliveryDate,
      recipient: data.recipient,
      sender: data.sender,
      cargoType: data.cargoType,
      weight: data.weight,
      packageCount: data.packageCount,
      waybillNumber: data.waybillNumber,
      paymentType: data.paymentType,
      deliveryMethod: data.deliveryMethod,
      smsCode: data.smsCode,
      failureReasons: data.failureReasons,
      movements,
      serviceInfo
    };
  }

  /**
   * Kargo hareket geçmişini web sayfasından çıkarır
   * "Hareket Bilgileri" sekmesine tıklayarak hareket verilerini alır
   * 
   * @param page - Puppeteer page instance'ı
   * @returns Kargo hareket bilgileri listesi
   * @private
   */
  private async extractMovements(page: Page): Promise<MovementInfo[]> {
    try {
      await page.click('a[href="#ui-tabs-2"]');
      await new Promise(resolve => setTimeout(resolve, 1000));

      const movements = await page.evaluate(() => {
        const movementData: Array<{ date: string, location: string, status: string, description?: string }> = [];
        

        const tables = document.querySelectorAll('#ui-tabs-2 table');
        tables.forEach(table => {
          const rows = table.querySelectorAll('tr');
          for (let i = 1; i < rows.length; i++) {
            const cells = rows[i].querySelectorAll('td');
            if (cells.length >= 3) {
              const date = cells[0]?.textContent?.trim() || '';
              const location = cells[1]?.textContent?.trim() || '';
              const status = cells[2]?.textContent?.trim() || '';
              
              const isHeaderRow = date.includes('İŞLEM TARİHİ') || 
                                date.includes('TARIH') || 
                                location.includes('İL') || 
                                location.includes('KARGO TİPİ') ||
                                status.includes('BIRIM') ||
                                status.includes('KARGO DURUMU');
              
              const datePattern = /^\d{1,2}\.\d{1,2}\.\d{4}/;
              const hasValidDate = datePattern.test(date);
              
              if (!isHeaderRow && hasValidDate && date && location && status) {
                movementData.push({
                  date,
                  location,
                  status,
                  description: cells[3]?.textContent?.trim() || undefined
                });
              }
            }
          }
        });
        
        return movementData;
      });

      return movements;
    } catch (error) {
      console.warn('Hareket bilgileri alınamadı:', error);
      return [];
    }
  }

  /**
   * Kargo hizmet bilgilerini web sayfasından çıkarır
   * "Hizmet Bilgileri" sekmesine tıklayarak SMS ve ek hizmet verilerini alır
   * 
   * @param page - Puppeteer page instance'ı
   * @returns Hizmet bilgileri veya undefined
   * @private
   */
  private async extractServiceInfo(page: Page): Promise<ServiceInfo | undefined> {
    try {
      await page.click('a[href="#ui-tabs-3"]');
      await new Promise(resolve => setTimeout(resolve, 1000));

      const serviceInfo = await page.evaluate(() => {
        const getServiceData = (): string[] => {
          const services: string[] = [];
          const serviceTable = document.querySelector('#servicesDataGrid');
          if (serviceTable) {
            const rows = serviceTable.querySelectorAll('tr');
            for (let i = 1; i < rows.length; i++) {
              const cells = rows[i].querySelectorAll('td');
              if (cells.length >= 2) {
                const serviceName = cells[0]?.textContent?.trim() || '';
                const count = cells[1]?.textContent?.trim() || '';
                if (serviceName && count) {
                  services.push(`${serviceName} (${count})`);
                }
              }
            }
          }
          return services;
        };

        const getSmsData = (): string[] => {
          const smsData: string[] = [];
          const smsTable = document.querySelector('#smsDataGrid');
          if (smsTable) {
            const rows = smsTable.querySelectorAll('tr');
            for (let i = 1; i < rows.length; i++) {
              const cells = rows[i].querySelectorAll('td');
              if (cells.length >= 4) {
                const status = cells[0]?.textContent?.trim() || '';
                const unit = cells[1]?.textContent?.trim() || '';
                const date = cells[2]?.textContent?.trim() || '';
                const type = cells[3]?.textContent?.trim() || '';
                if (status && unit && date && type) {
                  smsData.push(`${type}: ${status} - ${unit} (${date})`);
                }
              }
            }
          }
          return smsData;
        };

        return {
          serviceType: 'Aras Kargo Hizmetleri',
          smsNotifications: getSmsData(),
          additionalServices: getServiceData()
        };
      });

      return serviceInfo;
    } catch (error) {
      console.warn('Hizmet bilgileri alınamadı:', error);
      return {
        serviceType: '',
        smsNotifications: [],
        additionalServices: []
      };
    }
  }

  /**
   * Kargo durumu metnini TrackingStatus enum'una dönüştürür
   * 
   * @param status - Aras Kargo'dan gelen durum metni
   * @returns Standartlaştırılmış TrackingStatus enum değeri
   * @private
   */
  private getTrackingStatus(status: string): TrackingStatus {
    if (status.includes('TESLİM EDİLDİ')) {
      return TrackingStatus.DELIVERED;
    } else if (status.includes('YOLDA')) {
      return TrackingStatus.IN_TRANSIT;
    } else {
      return TrackingStatus.ERROR;
    }
  }

  /**
   * Browser instance'ını kapatır ve kaynakları temizler
   * Bellek sızıntısını önlemek için önemlidir
   * 
   * @returns Promise<void>
   * 
   * @example
   * ```typescript
   * const arasKargo = new ArasKargo();
   * // ... takip işlemleri
   * await arasKargo.close(); // Kaynakları temizle
   * ```
   */
  public async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}