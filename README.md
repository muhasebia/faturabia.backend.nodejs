# Fatura Müşteri Sistemi API Dokümantasyonu

## Genel Bakış
Bu sistem faturalardan otomatik olarak müşteri bilgilerini çıkarır ve müşterilerin faturalarını görüntülemenizi sağlar.

## Nasıl Çalışır
1. **Fatura çekildiğinde** → Müşteri bilgileri otomatik olarak kaydedilir
2. **Müşteri listesinde** → Hem manuel hem faturadan gelen müşteriler görünür  
3. **Müşteriye tıklayınca** → O müşterinin tüm faturaları listelenir

---

## API Endpoints

### 1. Fatura Çekme
```
POST /invoices/fetch-all
```
**Ne yapar:** Tüm faturaları çeker ve içlerindeki müşteri bilgilerini otomatik olarak kaydeder.

**Sonuç:** Yeni müşteriler Customer listesine eklenir.

---

### 2. Müşteri Listesi
```
GET /customers
```
**Ne yapar:** Tüm müşterileri getirir (hem manuel eklenenler hem faturalardan gelenler).

**Cevap:**
```json
{
  "data": [
    {
      "_id": "...",
      "title": "ATAŞ İNŞAAT MÜHENDİSLİK",
      "partyIdentification": "0990256673",
      "isFromInvoice": true
    }
  ]
}
```

---

### 3. Müşterinin Faturalarını Görme
```
GET /customers/:customerId/invoices
```
**Ne yapar:** Seçilen müşterinin tüm faturalarını getirir.

**Örnek:** `GET /customers/507f1f77bcf86cd799439011/invoices`

**Cevap:**
```json
{
  "invoices": [
    {
      "id": "fatura123",
      "documentNumber": "FAT2024001",
      "issueDate": "2024-01-15",
      "payableAmount": 1500.00
    }
  ],
  "customer": {
    "title": "ATAŞ İNŞAAT MÜHENDİSLİK",
    "partyIdentification": "0990256673"
  }
}
```

---

### 4. Gelen Faturaları Listele
```
GET /invoices/list/incoming?page=1&limit=50
```
**Ne yapar:** Tüm gelen faturaları getirir (e-Fatura + e-Arşiv).

**Cevap:**
```json
{
  "invoices": [...],
  "totalCount": 150,
  "currentPage": 1,
  "totalPages": 3,
  "hasNext": true,
  "hasPrev": false
}
```

---

### 5. Giden Faturaları Listele
```
GET /invoices/list/outgoing?page=1&limit=50
```
**Ne yapar:** Tüm giden faturaları getirir (e-Fatura + e-Arşiv).

---

### 6. Taslak Faturaları Listele
```
GET /invoices/list/drafts?page=1&limit=50
```
**Ne yapar:** Tüm taslak faturaları getirir (e-Fatura + e-Arşiv).

---

### 7. Tüm Faturaları Listele
```
GET /invoices/list/all?page=1&limit=50
```
**Ne yapar:** Tüm faturaları bir arada getirir (gelen + giden + taslaklar).

**Cevap:**
```json
{
  "invoices": [...],
  "totalCount": 500,
  "currentPage": 1,
  "totalPages": 10,
  "hasNext": true,
  "hasPrev": false,
  "summary": {
    "incoming": { "count": 150, "totalAmount": 45230.75 },
    "outgoing": { "count": 300, "totalAmount": 125430.50 },
    "drafts": { "count": 50, "totalAmount": 8450.25 },
    "total": { "count": 500, "totalAmount": 179111.50 }
  }
}
```

---

### 8. Fatura Arama ve Filtreleme
```
GET /invoices/search
```
**Ne yapar:** Faturaları filtreler ve arar (pagination yok, tüm sonuçlar).

**Query Parametreleri:**
- `startDate`: Başlangıç tarihi (YYYY-MM-DD)
- `endDate`: Bitiş tarihi (YYYY-MM-DD)
- `minAmount`: Minimum tutar
- `maxAmount`: Maximum tutar
- `status`: Fatura durumu (`incoming`, `outgoing`, `draft`, `all`)
- `search`: Genel arama (fatura no, firma adı, vergi no)
- `invoiceType`: Fatura türü (`efatura`, `earchive`, `all`)

**Örnek Kullanımlar:**
```
# Tarih aralığında arama
GET /invoices/search?startDate=2024-01-01&endDate=2024-12-31

# Tutar aralığında arama
GET /invoices/search?minAmount=1000&maxAmount=5000

# Sadece gelen faturaları ara
GET /invoices/search?status=incoming

# Firma adına göre ara
GET /invoices/search?search=KOVPAGIDA

# Kombine filtreler
GET /invoices/search?startDate=2024-06-01&status=incoming&minAmount=500&search=KOVPA
```

**Cevap:**
```json
{
  "invoices": [...], // Tüm eşleşen faturalar
  "totalCount": 156,
  "summary": {
    "count": 156,
    "totalAmount": 45230.75
  },
  "filters": {
    "startDate": "2024-06-01",
    "endDate": null,
    "minAmount": 500,
    "maxAmount": null,
    "status": "incoming",
    "search": "KOVPA",
    "invoiceType": "all"
  }
}
```

---

## Özellikler

✅ **Otomatik Müşteri Kaydı** - Faturalardan müşteri bilgileri çıkarılır  
✅ **Duplicate Kontrolü** - Aynı müşteri tekrar kaydedilmez  
✅ **Hem Şirket Hem Bireysel** - Tüm müşteri türlerini destekler  
✅ **Fatura Filtreleme** - Müşteriye göre fatura listeleme  
✅ **Mevcut Sistemle Uyumlu** - Eski Customer yapısını bozmaz  

---

## Kullanım Akışı

1. **Fatura Çek** → `/invoices/fetch-all`
2. **Müşterileri Gör** → `/customers` 
3. **Müşteri Seç** → `/customers/{id}/invoices`
4. **Faturalarını İncele** → Müşterinin tüm faturaları

Bu kadar! 🎉

---

## Veri Yapıları

### UserInvoices Yapısı
Kullanıcının tüm fatura verilerinin saklandığı ana yapı:

```json
{
  "_id": "684f25f4f18d70f79f757a64",
  "userId": "67c1ac62b101e363af148275",
  "toplamFatura": 3382,
  "eFatura": {
    "incoming": [],      // Gelen e-Faturalar
    "outgoing": [],      // Giden e-Faturalar
    "incomingDraft": [], // Gelen taslaklar
    "outgoingDraft": []  // Giden taslaklar
  },
  "eArchive": {
    "incoming": [],      // Gelen e-Arşiv faturalar
    "outgoing": [],      // Giden e-Arşiv faturalar
    "incomingDraft": [], // Gelen e-Arşiv taslaklar
    "outgoingDraft": []  // Giden e-Arşiv taslaklar
  },
  "lastFetchDate": {
    "incomingInvoices": "2024-01-15T10:30:00Z",
    "outgoingInvoices": "2024-01-15T10:30:00Z",
    "draftInvoices": "2024-01-15T10:30:00Z",
    "eArchiveInvoices": "2024-01-15T10:30:00Z",
    "eArchiveDraftInvoices": "2024-01-15T10:30:00Z"
  },
  "createdAt": "2025-06-15T19:58:44.223Z",
  "updatedAt": "2025-06-15T19:58:45.953Z"
}
```

### Customer Yapısı
Müşteri bilgilerinin saklandığı yapı:

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "TcNumber": "0990256673",
  "title": "ATAŞ İNŞAAT MÜHENDİSLİK",
  "name": "Ahmet",
  "surname": "Yılmaz",
  "address": "Atatürk Cad. No:123",
  "town": "Merkez",
  "city": "İstanbul",
  "country": "Türkiye",
  "postCode": "34000",
  "phone": "5551234567",
  "email": "info@atas.com",
  "partyIdentification": "0990256673",  // Faturadaki kimlik no
  "partyName": "ATAŞ İNŞAAT MÜHENDİSLİK",
  "isFromInvoice": true,                // Faturadan mı geldi
  "isFavorite": false,
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

### Fatura Yapısı
Her bir faturanın içeriği:

```json
{
  "id": "fatura123",
  "documentNumber": "FAT2024001",
  "issueDate": "2024-01-15",
  "payableAmount": 1500.00,
  "documentCurrencyCode": "TRY",
  "invoiceTypeCode": "SATIS",
  "accountingCustomerParty": {
    "partyIdentification": "0990256673",
    "partyName": "ATAŞ İNŞAAT MÜHENDİSLİK",
    "firstName": null,
    "familyName": null,
    "alias": "urn:mail:info@atas.com"
  },
  "accountingSupplierParty": {
    "party": {
      "partyIdentification": [{"id": "1234567890"}],
      "partyName": [{"name": "Tedarikçi Firma"}],
      "person": [{"firstName": "Ali", "familyName": "Veli"}],
      "postalAddress": [{"streetName": "Adres", "cityName": "Şehir"}]
    }
  },
  "createdAt": "2024-01-15T08:00:00Z",
  "isPrinted": false,
  "recordStatus": "ACTIVE"
}
```

### API Response Örnekleri

#### Fatura Çekme Sonucu
```json
{
  "success": true,
  "message": "Faturalar başarıyla senkronize edildi.",
  "summary": {
    "totalFetched": 150,
    "totalNew": 25,
    "totalUpdated": 5,
    "finalTotal": 3382
  },
  "details": {
    "incoming": {"fetched": 50, "new": 10, "updated": 2},
    "outgoing": {"fetched": 100, "new": 15, "updated": 3}
  }
}
```

#### Müşteri Fatura Listesi
```json
{
  "invoices": [
    {
      "id": "fatura123",
      "documentNumber": "FAT2024001",
      "issueDate": "2024-01-15",
      "payableAmount": 1500.00,
      "documentCurrencyCode": "TRY"
    }
  ],
  "customer": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "ATAŞ İNŞAAT MÜHENDİSLİK",
    "partyIdentification": "0990256673",
    "isFromInvoice": true
  }
}
```
