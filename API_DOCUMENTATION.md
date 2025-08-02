# Fatura API Dokümantasyonu

Bu API **sadece ve sadece istatistik hesaplama** amacıyla tasarlanmıştır. 

## ⚡ Önemli Değişiklik
- Fatura verileri artık **veritabanında saklanmıyor**
- Sadece **hesaplanmış istatistikler** kaydediliyor
- API'den çekilen veriler **geçici olarak** işleniyor ve **istatistik hesaplama** için kullanılıyor

## Base URL
```
/invoices
```

## Authentication
Tüm endpoint'ler JWT token ile korunmaktadır.
```
Authorization: Bearer <your-jwt-token>
```

---

## 📊 API Endpoint'leri (3 Endpoint)

### 1. Fatura Verilerini Çek ve İstatistik Hesapla
Tüm fatura türlerini NES API'sinden çeker, istatistik hesaplar ve **sadece istatistiği** kaydeder.

**Endpoint:** `POST /invoices/fetch-all`

**Açıklama:** Bu endpoint NES API'sinden tüm faturaları çeker, istatistikleri hesaplar ve veritabanında sadece hesaplanan istatistiği saklar. Fatura verilerini saklamaz.

**Response:**
```json
{
  "success": true,
  "message": "İstatistikler başarıyla hesaplandı ve kaydedildi.",
  "statistics": {
    "toplamTutar": 224201.00,
    "gelenTutar": 125750.25,
    "gidenTutar": 98450.75,
    "karZarar": 27299.50,
    "toplamMiktar": 900,
    "gelenMiktar": 500,
    "gidenMiktar": 400,
    "taslakMiktar": 150,
    "lastCalculated": "2025-08-02T10:30:00.000Z"
  },
  "summary": {
    "totalProcessed": 1050,
    "incoming": 500,
    "outgoing": 400,
    "drafts": 150
  }
}
```

---

### 2. Tüm Faturaları Getir (Gelen + Giden) - Canlı
Gelen ve giden faturaları canlı olarak NES API'sinden çeker ve tarihsel sıraya dizili olarak döner.

**Endpoint:** `GET /invoices/all`

**Açıklama:** Bu endpoint her çağrıldığında NES API'sinden gelen ve giden faturaları çeker, tarih sırasına göre döner. Veritabanında saklanmaz, sadece döndürülür.

**Response:**
```json
{
  "invoices": [
    {
      "uuid": "12345-67890",
      "type": "incoming",
      "documentNumber": "FTR2025000001",
      "issueDate": "2025-08-02T00:00:00.000Z",
      "payableAmount": 1250.50,
      "accountingSupplierParty": {
        "partyName": "ABC Şirketi",
        "partyIdentification": "1234567890"
      }
    },
    {
      "uuid": "54321-09876",
      "type": "outgoing",
      "documentNumber": "FTR2025000002",
      "issueDate": "2025-08-01T00:00:00.000Z",
      "payableAmount": 2500.75,
      "accountingSupplierParty": {
        "partyName": "Bizim Şirket",
        "partyIdentification": "5555555555"
      }
    }
  ],
  "totalCount": 900,
  "summary": {
    "incoming": {
      "count": 500,
      "totalAmount": 125750.25
    },
    "outgoing": {
      "count": 400,
      "totalAmount": 98450.75
    },
    "total": {
      "count": 900,
      "totalAmount": 224201.00
    }
  }
}
```

---

### 3. Hesaplanmış İstatistikleri Getir
Daha önce hesaplanmış ve kaydedilmiş istatistikleri döner.

**Endpoint:** `GET /invoices/statistics`

**Açıklama:** Daha önce fetch-all ile hesaplanmış istatistikleri getirir. Eğer hiç hesaplama yapılmamışsa uyarı mesajı döner.

**Response:**
```json
{
  "success": true,
  "statistics": {
    "toplamTutar": 224201.00,
    "gelenTutar": 125750.25,
    "gidenTutar": 98450.75,
    "karZarar": 27299.50,
    "toplamMiktar": 900,
    "gelenMiktar": 500,
    "gidenMiktar": 400,
    "taslakMiktar": 150,
    "lastCalculated": "2025-08-02T10:30:00.000Z"
  },
  "summary": {
    "gelenFaturalar": {
      "miktar": 500,
      "tutar": 125750.25,
      "ortalama": 251.50
    },
    "gidenFaturalar": {
      "miktar": 400,
      "tutar": 98450.75,
      "ortalama": 246.13
    },
    "taslakFaturalar": {
      "miktar": 150
    }
  },
  "lastCalculated": "2025-08-02T10:30:00.000Z"
}
```

**Eğer Henüz İstatistik Hesaplanmamışsa:**
```json
{
  "message": "Henüz istatistik hesaplanmamış. Lütfen önce fetch-all çalıştırın.",
  "statistics": {
    "toplamTutar": 0,
    "gelenTutar": 0,
    "gidenTutar": 0,
    "toplamMiktar": 0,
    "karZarar": 0,
    "gelenMiktar": 0,
    "gidenMiktar": 0,
    "taslakMiktar": 0
  }
}
```

---

## 📋 Kullanım Örnekleri

### JavaScript/Node.js
```javascript
// İstatistik hesapla
const response = await fetch('/invoices/fetch-all', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer your-jwt-token',
    'Content-Type': 'application/json'
  }
});

// Tüm faturaları canlı getir
const all = await fetch('/invoices/all', {
  headers: {
    'Authorization': 'Bearer your-jwt-token'
  }
});

// İstatistikleri al
const stats = await fetch('/invoices/statistics', {
  headers: {
    'Authorization': 'Bearer your-jwt-token'
  }
});
```

### cURL
```bash
# İstatistik hesapla
curl -X POST "http://localhost:3000/invoices/fetch-all" \
  -H "Authorization: Bearer your-jwt-token"

# Tüm faturaları canlı getir
curl "http://localhost:3000/invoices/all" \
  -H "Authorization: Bearer your-jwt-token"

# İstatistikleri getir
curl "http://localhost:3000/invoices/statistics" \
  -H "Authorization: Bearer your-jwt-token"
```

---

## 📝 Önemli Notlar

1. **Sadece İstatistik Amaçlı**: Bu API sadece istatistik hesaplama için tasarlanmıştır.

2. **Veri Saklanmıyor**: Fatura verileri artık veritabanında saklanmıyor, sadece istatistikler kaydediliyor.

3. **İş Akışı**:
   - `POST /invoices/fetch-all` ile istatistik hesaplat
   - `GET /invoices/statistics` ile hesaplanan istatistikleri al

4. **Gelen vs Giden**:
   - **Gelen**: Bize kesilen faturalar (incoming)
   - **Giden**: Bizim kestiğimiz faturalar (outgoing + eArchive)

5. **Kar/Zarar**: `gelenTutar - gidenTutar` şeklinde hesaplanır.

6. **Taslaklar**: Hesaplamalara dahil edilmez, sadece sayılır.

---

## ⚠️ Hata Kodları

- **400**: NES API anahtarı bulunamadı
- **401**: Yetkisiz erişim (token geçersiz)
- **500**: Sunucu hatası (NES API veya veritabanı hatası)

## 🔄 İş Akışı

1. Kullanıcı giriş yapar ve JWT token alır
2. `POST /invoices/fetch-all` ile istatistikler hesaplanır ve kaydedilir
3. `GET /invoices/statistics` ile hesaplanmış istatistikler alınır

## 🎯 API Özeti

**Toplam Endpoint Sayısı: 3**

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | `/invoices/fetch-all` | İstatistik hesapla ve kaydet |
| GET | `/invoices/all` | Tüm faturaları canlı getir (gelen+giden) |
| GET | `/invoices/statistics` | Hesaplanan istatistikleri getir |