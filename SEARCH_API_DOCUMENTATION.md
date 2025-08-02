# Fatura Arama API Dokümantasyonu

## Search All Invoices - Tüm Fatura Arama

### Endpoint
```
GET /api/invoices/search
```

### Açıklama
Bu endpoint, tüm fatura tiplerinde (gelen, giden, e-arşiv, taslak) arama yapar ve **pagination olmadan** tüm eşleşen sonuçları döner. Tüm API sayfalarını otomatik olarak gezer ve sonuçları birleştirir.

### Authentication
- **Required:** Yes
- **Type:** Bearer Token
- **Headers:** `Authorization: Bearer <token>`

### Query Parameters

| Parametre | Tip | Açıklama | Örnek |
|-----------|-----|----------|-------|
| `tags` | Array of UUID strings | Faturaya atanmış etiketlere göre filtreleme | `tags=0a6a08ff-be10-4892-bb19-4fe40e4282fc` |
| `userNote` | string | Kullanıcı notuna göre filtreleme | `userNote=önemli fatura` |
| `documentNote` | string | Belge içinde geçen nota göre filtreleme | `documentNote=acil` |
| `despatchNumber` | string | İrsaliye numarasına göre filtreleme | `despatchNumber=IRS2024001` |
| `orderNumber` | string | Sipariş numarasına göre filtreleme | `orderNumber=SIP2024001` |
| `company` | string | Firma Ünvanı veya VKN/TNCK değerine göre filtreleme | `company=ABC Şirketi` |
| `uuid` | string | UUID numarasına göre filtreleme | `uuid=123e4567-e89b-12d3-a456-426614174000` |
| `documentNumber` | string | Belge numarasına göre filtreleme | `documentNumber=FAT2024001` |
| `startCreateDate` | date-time | Oluşturma tarihi başlangıcı | `startCreateDate=2024-01-01T00:00:00Z` |
| `endCreateDate` | date-time | Oluşturma tarihi sonu | `endCreateDate=2024-12-31T23:59:59Z` |
| `invoiceStatus` | enum | Fatura durumu | `invoiceStatus=Succeed` |
| `archived` | boolean | Arşivlenen belgeleri göster | `archived=false` (default: false) |
| `profileId` | enum | Fatura profili | `profileId=TEMELFATURA` |
| `invoiceTypeCode` | enum | Fatura tipi | `invoiceTypeCode=SATIS` |
| `documentAnswer` | enum | Cevap durumu | `documentAnswer=Accepted` |
| `lucaTransferStatus` | enum | Luca transfer durumu | `lucaTransferStatus=Succeded` |
| `sort` | string | Sıralama | `sort=CreatedAt desc` (default) |
| `startDate` | string | Başlangıç tarihi | `startDate=2024-01-01` |
| `endDate` | string | Bitiş tarihi | `endDate=2024-12-31` |

### Enum Değerleri

#### invoiceStatus (RecordStatus)
- `None`
- `Waiting`
- `Succeed`
- `Error`
- `Unknown`

#### profileId (InvoiceProfileIdParameter)
- `TEMELFATURA`
- `TICARIFATURA`
- `IHRACAT`
- `YOLCUBERABERFATURA`
- `HKS`
- `KAMU`
- `All`

#### invoiceTypeCode (InvoiceTypeParameter)
- `SATIS`
- `IADE`
- `TEVKIFAT`
- `TEVKIFATIADE`
- `ISTISNA`
- `IHRACKAYITLI`
- `OZELMATRAH`
- `KOMISYONCU`
- `SGK`
- `All`

#### documentAnswer (DocumentAnswer)
- `None`
- `Waiting`
- `Accepted`
- `Rejected`

#### lucaTransferStatus (LucaTransferStatusParameter)
- `None`
- `Succeded`
- `Error`
- `Unknown`
- `All`

### Örnek İstekler

#### Basit Arama
```bash
GET /api/invoices/search?company=ABC&startDate=2024-01-01&endDate=2024-12-31
```

#### Detaylı Filtreleme
```bash
GET /api/invoices/search?invoiceStatus=Succeed&profileId=TEMELFATURA&invoiceTypeCode=SATIS&documentAnswer=Accepted&sort=CreatedAt desc
```

#### Tarih Aralığı ile Arama
```bash
GET /api/invoices/search?startCreateDate=2024-01-01T00:00:00Z&endCreateDate=2024-03-31T23:59:59Z&archived=false
```

#### Kullanıcı Notu ile Arama
```bash
GET /api/invoices/search?userNote=önemli&documentNote=acil&sort=CreatedAt asc
```

### Response Format

#### Başarılı Response (200 OK)
```json
{
  "success": true,
  "invoices": [
    {
      "uuid": "123e4567-e89b-12d3-a456-426614174000",
      "documentNumber": "FAT2024001",
      "issueDate": "2024-01-15T10:30:00Z",
      "payableAmount": 1150.50,
      "company": "ABC Şirketi",
      "invoiceStatus": "Succeed",
      "category": "incoming",
      // ... diğer fatura alanları
    }
    // ... diğer faturalar (pagination yok - tüm sonuçlar)
  ],
  "totalCount": 1250,
  "summary": {
    "incoming": {
      "count": 450,
      "totalAmount": 125750.25
    },
    "outgoing": {
      "count": 650,
      "totalAmount": 89420.50
    },
    "drafts": {
      "count": 150,
      "totalAmount": 25300.75
    },
    "total": {
      "count": 1250,
      "totalAmount": 240471.50
    }
  },
  "appliedFilters": {
    "company": "ABC",
    "startDate": "2024-01-01",
    "endDate": "2024-12-31"
  },
  "sort": "CreatedAt desc"
}
```

#### Hata Response (400 Bad Request)
```json
{
  "error": "NES API anahtarı bulunamadı. Lütfen önce API anahtarınızı kaydedin."
}
```

#### Hata Response (500 Internal Server Error)
```json
{
  "success": false,
  "error": "Fatura arama sırasında bir hata oluştu.",
  "message": "API connection timeout"
}
```

### Response Alanları

#### Invoice Object
Her fatura objesi aşağıdaki ana alanları içerir:

| Alan | Tip | Açıklama |
|------|-----|----------|
| `uuid` | string | Fatura benzersiz kimliği |
| `documentNumber` | string | Belge numarası |
| `issueDate` | date-time | Düzenleme tarihi |
| `createDate` | date-time | Oluşturma tarihi |
| `payableAmount` | number | Ödenecek tutar |
| `company` | string | Firma bilgisi |
| `invoiceStatus` | string | Fatura durumu |
| `category` | string | Fatura kategorisi (incoming/outgoing/draft) |
| `userNote` | string | Kullanıcı notu |
| `documentNote` | string | Belge notu |
| `despatchNumber` | string | İrsaliye numarası |
| `orderNumber` | string | Sipariş numarası |

#### Summary Object
Arama sonuçlarının özet istatistikleri:

| Alan | Tip | Açıklama |
|------|-----|----------|
| `incoming.count` | number | Gelen fatura sayısı |
| `incoming.totalAmount` | number | Gelen fatura toplam tutarı |
| `outgoing.count` | number | Giden fatura sayısı |
| `outgoing.totalAmount` | number | Giden fatura toplam tutarı |
| `drafts.count` | number | Taslak fatura sayısı |
| `drafts.totalAmount` | number | Taslak fatura toplam tutarı |
| `total.count` | number | Toplam fatura sayısı |
| `total.totalAmount` | number | Genel toplam tutar |

### Özellikler

#### ✅ Pagination Yok
Bu endpoint tüm eşleşen sonuçları tek seferde döner. Pagination parametreleri (`page`, `pageSize`) kullanılmaz.

#### ✅ Tüm Fatura Tipleri
- Gelen faturalar (incoming)
- Giden faturalar (outgoing)  
- e-Arşiv faturaları (eArchive)
- Taslak faturalar (drafts)
- e-Arşiv taslak faturaları (eArchiveDrafts)

#### ✅ Otomatik Sayfa Geçişi
API'nin pagination limitlerini aşar ve tüm sayfaları otomatik olarak çeker.

#### ✅ Paralel İşleme
Tüm fatura tiplerini paralel olarak çeker, performans için optimize edilmiştir.

#### ✅ Detaylı İstatistikler
Her kategori için ayrı ayrı sayı ve tutar bilgileri sağlar.

#### ✅ Esnek Filtreleme
Birden fazla filtreyi aynı anda kullanabilirsiniz.

### Performans Notları

- **Büyük Veri Setleri:** Çok fazla fatura varsa yanıt süresi uzayabilir
- **Filtre Kullanımı:** Mümkün olduğunca spesifik filtreler kullanın
- **Tarih Aralığı:** Geniş tarih aralıkları performansı etkileyebilir
- **API Limitleri:** NES API'nin rate limit'lerine tabidir

### Kullanım Örnekleri

#### 1. Belirli Bir Firmanın Tüm Faturaları
```bash
GET /api/invoices/search?company=ABC%20Şirketi&sort=CreatedAt desc
```

#### 2. Son 3 Aydaki Başarılı Faturalar
```bash
GET /api/invoices/search?startCreateDate=2024-01-01T00:00:00Z&endCreateDate=2024-03-31T23:59:59Z&invoiceStatus=Succeed
```

#### 3. Belirli Sipariş Numarasına Ait Faturalar
```bash
GET /api/invoices/search?orderNumber=SIP2024001
```

#### 4. Kullanıcı Notuna Göre Arama
```bash
GET /api/invoices/search?userNote=acil&sort=CreatedAt desc
```

#### 5. Ticari Fatura Profili ile Filtreleme
```bash
GET /api/invoices/search?profileId=TICARIFATURA&invoiceTypeCode=SATIS&documentAnswer=Accepted
```

### Hata Kodları

| HTTP Kodu | Açıklama |
|-----------|----------|
| 200 | Başarılı |
| 400 | API anahtarı bulunamadı |
| 401 | Yetkisiz erişim |
| 500 | Sunucu hatası |

Bu endpoint, mevcut `/api/invoices/all` endpoint'inden farklı olarak pagination kullanmaz ve tüm sonuçları tek seferde döner. Arama ve filtreleme için optimize edilmiştir.