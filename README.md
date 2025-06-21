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

---

## 🔑 Şifre Sıfırlama Sistemi

Email ile şifre sıfırlama özelliği eklenmiştir. Kullanıcılar emaillerine gönderilen kod ile şifrelerini sıfırlayabilirler.

### Kurulum

1. **SMTP Sunucu Yapılandırması**
   
   Proje ana dizininizde `.env` dosyası oluşturun ve aşağıdaki içeriği ekleyin:
   
   Environment variable'ları ayarlayın:
   ```bash
   # SMTP Sunucu Ayarları (Muhasebia.com için örnek)
   SMTP_HOST=mail.muhasebia.com
   SMTP_PORT=587                    # 587 (STARTTLS önerilen), 465 (SSL), 25 (güvensiz)
   SMTP_SECURE=false               # false=STARTTLS, true=SSL
   SMTP_USER=no-reply@muhasebia.com
   SMTP_PASS=5HBc]k{#L7:cCG{T
   SMTP_FROM=no-reply@muhasebia.com # Gönderici adresi
   
   # Frontend URL
   FRONTEND_URL=http://localhost:3000
   NODE_ENV=development
   ```

   **Kopya-Yapıştır için hazır .env dosyası:**
   ```bash
   # MongoDB (mevcut)
   MONGODB_URI=mongodb+srv://iscan:iscan@faturabia.mkcvi8b.mongodb.net/?appName=faturabia
   
   # JWT (mevcut)
   JWT_SECRET=your-secret-key-here
   
   # Server (mevcut)
   PORT=5000
   NODE_ENV=development
   
   # SMTP Configuration for Muhasebia.com (Optimized)
   SMTP_HOST=mail.muhasebia.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=no-reply@muhasebia.com
   SMTP_PASS=5HBc]k{#L7:cCG{T
   SMTP_FROM=no-reply@muhasebia.com
   
   # Frontend URL
   FRONTEND_URL=http://localhost:3000
   ```

   **Sorun yaşıyorsanız farklı portları deneyin:**
   ```bash
   # STARTTLS (Önerilen - Mail Client için)
   SMTP_PORT=587
   SMTP_SECURE=false
   
   # SSL/TLS (Eski SSL)
   SMTP_PORT=465
   SMTP_SECURE=true
   
   # SMTP (Sunucudan sunucuya - son çare)
   SMTP_PORT=25
   SMTP_SECURE=false
   ```

2. **Serveri Başlatın ve Test Edin**
   
   ```bash
   # Serveri başlat
   npm run dev
   
   # SMTP bağlantısını test et
   curl http://localhost:5000/auth/test-email
   ```
   
   Console'da şu mesajları görmelisiniz:
   ```
   ✅ SMTP sunucusu hazır
   📧 Mail sunucusu: mail.muhasebia.com:587
   ✅ Test emaili gönderildi: abc123@muhasebia.com
   ```

3. **Webmail Kontrolü**
   - http://webmail.muhasebia.com adresine gidin
   - `no-reply@muhasebia.com` / `5HBc]k{#L7:cCG{T` ile giriş yapın
   - Test emailinin geldiğini kontrol edin

### Sorun Giderme

#### ENOTFOUND Hatası (DNS Çözümleme)
```bash
# DNS test
nslookup mail.muhasebia.com

# Ping test  
ping mail.muhasebia.com

# Farklı DNS deney (Google DNS)
# macOS/Linux için:
sudo sh -c 'echo "nameserver 8.8.8.8" > /etc/resolv.conf'
```

#### Bağlantı Sorunları
```bash
# Port test (telnet ile)
telnet mail.muhasebia.com 587
telnet mail.muhasebia.com 465  
telnet mail.muhasebia.com 25

# Netcat ile test
nc -zv mail.muhasebia.com 587
```

#### Yaygın Çözümler
1. **VPN kapatın** - VPN SMTP portlarını blokluyor olabilir
2. **Firewall kontrol** - Port 587/465 açık olmalı
3. **Antivirus** - Email tarama özelliğini geçici kapatın
4. **ISP engellemesi** - Bazı ISP'ler SMTP portlarını engeller
5. **Port 25 deneyin** - Son çare olarak port 25 kullanın

### API Endpoints

#### 1. Şifremi Unuttum
```http
POST /auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Cevap:**
```json
{
  "message": "Şifre sıfırlama linki email adresinize gönderildi.",
  "resetToken": "abc123..." // Sadece development ortamında
}
```

#### 2. Şifre Sıfırlama Token Doğrulama
```http
GET /auth/validate-reset-token/YOUR_TOKEN_HERE
```

**Cevap:**
```json
{
  "valid": true,
  "message": "Token geçerli",
  "userEmail": "us***@example.com"
}
```

#### 3. Şifreyi Sıfırla
```http
POST /auth/reset-password
Content-Type: application/json

{
  "token": "reset-token-from-email",
  "newPassword": "YeniSifre123!"
}
```

**Cevap:**
```json
{
  "message": "Şifreniz başarıyla değiştirildi. Artık yeni şifrenizle giriş yapabilirsiniz."
}
```

### Email Template'leri

#### Şifre Sıfırlama Emaili
- 📊 Profesyonel Faturabia logosu
- 🔗 Kolay tıklanabilir "Şifremi Sıfırla" butonu
- 🔢 6 haneli alternatif kod
- ⚠️ Güvenlik uyarıları
- ⏰ 1 saat geçerlilik süresi

#### Şifre Değişikliği Onayı
- ✅ Başarılı değişiklik bildirimi
- 🕐 Değişiklik tarihi
- 🚨 Güvenlik uyarısı

### Güvenlik Özellikleri

✅ **Token Hash'leme** - Token'lar SHA-256 ile hash'lenerek saklanır  
✅ **Zaman Sınırı** - Token'lar 1 saat sonra otomatik geçersiz olur  
✅ **Tek Kullanım** - Token kullanıldıktan sonra silinir  
✅ **Güvenli Email** - Kullanıcı bulunamasa da aynı mesaj döner  
✅ **Şifre Validasyonu** - Güçlü şifre kuralları  
✅ **Çifte Onay** - Değişiklik sonrası bilgilendirme emaili  

### Frontend Entegrasyonu

#### Forgot Password Form
```javascript
const forgotPassword = async (email) => {
  const response = await fetch('/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  
  return response.json();
};
```

#### Reset Password Form
```javascript
const resetPassword = async (token, newPassword) => {
  const response = await fetch('/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, newPassword })
  });
  
  return response.json();
};
```

#### Token Validation
```javascript
const validateToken = async (token) => {
  const response = await fetch(`/auth/validate-reset-token/${token}`);
  return response.json();
};
```

### Email Service Özellikleri

- **Nodemailer** ile email gönderimi
- **HTML Template** ile profesyonel görünüm
- **Responsive Design** - Mobil uyumlu
- **Türkçe Dil Desteği**
- **Error Handling** - Hata durumlarında graceful handling

### SMTP Test Endpoint

SMTP ayarlarınızı test etmek için (sadece development):

```bash
# Kendi email adresinize test gönder
curl "http://localhost:5000/auth/test-email?email=youremail@domain.com"

# Default olarak SMTP_USER adresine gönder
curl http://localhost:5000/auth/test-email

# Postman/Insomnia ile
GET http://localhost:5000/auth/test-email?email=youremail@domain.com
```

**Başarılı Cevap:**
```json
{
  "success": true,
  "message": "Test emaili başarıyla gönderildi",
  "messageId": "abc123@muhasebia.com",
  "smtpConfig": {
    "host": "mail.muhasebia.com",
    "port": "587",
    "secure": false,
    "user": "no-reply@muhasebia.com"
  }
}
```

**Hata Durumunda:**
```json
{
  "success": false,
  "error": "Test emaili gönderilemedi",
  "details": "Connection timeout"
}
```

> **💡 İpucu:** Test emaili `no-reply@muhasebia.com` adresine gönderilecek. Webmail'den kontrol edebilirsiniz.

### Test ve Geliştirme

Development ortamında:
- Console'a detaylı SMTP bağlantı logları yazılır
- Test email endpoint'i aktif
- Token response'ta da döndürülür (test için)
- Email gönderim hatalarında detaylı log

Production ortamında:
- Sadece gerekli loglar
- Test endpoint'i devre dışı
- Token güvenli şekilde sadece email ile paylaşılır
- Hata detayları gizlenir

---

## 📊 Dashboard API Durumu

API anahtar durumu, son senkronizasyon ve fatura sayısı bilgileri için endpoint:

### GET /dashboard/api-status

**Cevap:**
```json
{
  "success": true,
  "data": {
    "apiKeyStatus": {
      "hasApiKey": true,
      "isActive": true,
      "message": "API anahtarı aktif"
    },
    "lastSynchronization": {
      "date": "2024-01-15T14:30:00.000Z",
      "formatted": "15.01.2024 14:30:00",
      "details": {
        "incomingInvoices": "2024-01-15T14:30:00.000Z",
        "outgoingInvoices": "2024-01-15T14:25:00.000Z"
      }
    },
    "synchronizedInvoiceCount": {
      "total": 1234,
      "breakdown": {
        "eFatura": { "incoming": 450, "outgoing": 320 },
        "eArchive": { "incoming": 200, "outgoing": 180 }
      }
    }
  }
}
```

## Fatura İstatistikleri API'si

### GET /api/invoices/statistics

Kullanıcının tüm faturalarına ait istatistikleri döner.

**Authentication:** Bearer Token gerekli

**Response:**
```json
{
  "success": true,
  "statistics": {
    "toplamTutar": 150000.50,
    "gelenTutar": 200000.00,
    "gidenTutar": 50000.50,
    "karZarar": 149500.50,
    "toplamMiktar": 45,
    "gelenMiktar": 30,
    "gidenMiktar": 15,
    "taslakMiktar": 5
  },
  "summary": {
    "gelenFaturalar": {
      "miktar": 30,
      "tutar": 200000.00,
      "ortalama": 6666.67
    },
    "gidenFaturalar": {
      "miktar": 15,
      "tutar": 50000.50,
      "ortalama": 3333.37
    },
    "taslakFaturalar": {
      "miktar": 5
    }
  },
  "lastUpdated": "2024-01-15T10:30:00.000Z"
}
```

**Açıklama:**
- `gelenTutar`: Müşterilerden gelen fatura tutarları (gelir)
- `gidenTutar`: Tedarikçilere ödenen fatura tutarları (gider)  
- `karZarar`: Gelir - Gider (pozitif kar, negatif zarar)
- Taslak faturalar kar/zarar hesabına dahil edilmez
- e-Fatura ve e-Arşiv faturaları birlikte hesaplanır

**Kullanım:**
```javascript
fetch('/api/invoices/statistics', {
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  }
})
```

## Kullanıcı Güncelleme API'si

### POST /api/auth/update

Giriş yapmış kullanıcının profil bilgilerini günceller.

**Authentication:** Bearer Token gerekli

**Request Body:**
```json
{
  "fullName": "Ahmet Yılmaz",
  "email": "ahmet@example.com",
  "password": "YeniSifre123",
  "bankName": "Ziraat Bankası",
  "IBAN": 1234567890123456,
  "taxAdministiration": "Kadıköy VD",
  "title": "Yazılım Geliştirici",
  "mersisNumber": "0123456789012345",
  "registirationNumber": "12345",
  "street": "Atatürk Caddesi No:123",
  "apartmentName": 5,
  "apartmentNo": 10,
  "doorNumber": 3,
  "neighborhood": "Merkez Mahallesi",
  "town": "Kadıköy",
  "city": "İstanbul",
  "postCode": "34710",
  "country": "Türkiye",
  "phone": 5551234567,
  "fax": 2161234567,
  "website": "https://example.com",
  "businnesCenter": "Teknoloji Merkezi"
}
```

**Response (Başarılı):**
```json
{
  "message": "Kullanıcı başarıyla güncellendi",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "fullName": "Ahmet Yılmaz",
    "email": "ahmet@example.com",
    "bankName": "Ziraat Bankası",
    "IBAN": 1234567890123456,
    "taxAdministiration": "Kadıköy VD",
    "title": "Yazılım Geliştirici",
    "mersisNumber": "0123456789012345",
    "registirationNumber": "12345",
    "street": "Atatürk Caddesi No:123",
    "apartmentName": 5,
    "apartmentNo": 10,
    "doorNumber": 3,
    "neighborhood": "Merkez Mahallesi",
    "town": "Kadıköy",
    "city": "İstanbul",
    "postCode": "34710",
    "country": "Türkiye",
    "phone": 5551234567,
    "fax": 2161234567,
    "website": "https://example.com",
    "businnesCenter": "Teknoloji Merkezi",
    "createdAt": "2024-01-15T08:00:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Önemli Notlar:**
- Tüm field'lar opsiyonel - sadece güncellemek istediğiniz field'ları gönderin
- `email` değiştirilirse benzersizlik kontrolü yapılır
- `password` güncellenirse şifre validasyonu uygulanır:
  - En az 6, en fazla 32 karakter
  - En az 1 küçük harf, 1 büyük harf, 1 rakam içermeli
- Şifre response'da döndürülmez (güvenlik)

**Hata Durumları:**
```json
// Email zaten kullanımda
{
  "error": "Bu email adresi zaten kullanımda"
}

// Şifre validasyon hatası
{
  "error": "Şifreniz en az 6 karakter olmalıdır"
}

// Kullanıcı bulunamadı
{
  "error": "Kullanıcı bulunamadı"
}
```

**Kullanım Örneği:**
```javascript
// Sadece isim güncelleme
fetch('/api/auth/update', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  },
  body: JSON.stringify({
    fullName: "Yeni İsim Soyisim"
  })
})

// Birden fazla field güncelleme
fetch('/api/auth/update', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  },
  body: JSON.stringify({
    fullName: "Ahmet Yılmaz",
    email: "yeni@email.com",
    phone: 5559876543,
    city: "Ankara"
  })
})
```

## Şifre Değiştirme API'si

### POST /api/auth/change-password

Giriş yapmış kullanıcının şifresini güvenli bir şekilde değiştirir.

**Authentication:** Bearer Token gerekli

**Request Body:**
```json
{
  "currentPassword": "MevcutSifre123",
  "newPassword": "YeniSifre456"
}
```

**Response (Başarılı):**
```json
{
  "message": "Şifreniz başarıyla değiştirildi",
  "changedAt": "2024-01-15T10:30:00.000Z"
}
```

**Güvenlik Özellikleri:**
- ✅ Mevcut şifre kontrolü yapılır
- ✅ Yeni şifre eski şifre ile aynı olamaz
- ✅ Güçlü şifre validasyonu uygulanır
- ✅ Şifre bcrypt ile hash'lenir

**Şifre Kuralları:**
- En az 6, en fazla 32 karakter
- En az 1 küçük harf (a-z)
- En az 1 büyük harf (A-Z)  
- En az 1 rakam (0-9)

**Hata Durumları:**
```json
// Eksik parametre
{
  "error": "Mevcut şifre ve yeni şifre gereklidir"
}

// Yanlış mevcut şifre
{
  "error": "Mevcut şifre yanlış"
}

// Aynı şifre
{
  "error": "Yeni şifre mevcut şifre ile aynı olamaz"
}

// Şifre validation hatası
{
  "error": "Yeni şifre en az 6 karakter olmalıdır"
}
```

**Kullanım Örneği:**
```javascript
fetch('/api/auth/change-password', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  },
  body: JSON.stringify({
    currentPassword: "EskiSifrem123",
    newPassword: "YeniGuvenlisifremi456"
  })
})
.then(response => response.json())
.then(data => {
  if (data.message) {
    console.log('Şifre başarıyla değiştirildi');
    // Kullanıcıyı bilgilendir
  } else {
    console.error('Hata:', data.error);
    // Hata mesajını göster
  }
});
```

**Önemli Notlar:**
- Bu API sadece şifre değiştirmek içindir
- Profil güncellemesi için `/api/auth/update` kullanın
- Şifre unuttum için `/api/auth/forgot-password` kullanın
- Güvenlik açısından mevcut şifre mutlaka gereklidir

## Müşteri Listeleme API'si (Pagination)

### GET /api/customer?page=1&limit=10

Kullanıcının müşterilerini sayfalama, arama ve sıralama ile listeler.

**Authentication:** Bearer Token gerekli

**Query Parameters:**
- `page` (optional): Sayfa numarası (default: 1)
- `limit` (optional): Sayfa başına kayıt sayısı (default: 10)
- `search` (optional): Arama metni
- `sortBy` (optional): Sıralama field'ı (default: 'createdAt')
- `sortOrder` (optional): Sıralama yönü 'asc' veya 'desc' (default: 'desc')

**Örnek Request:**
```
GET /api/customer?page=2&limit=5&search=ahmet&sortBy=name&sortOrder=asc
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "TcNumber": "12345678901",
      "title": "Bay",
      "name": "Ahmet",
      "surname": "Yılmaz",
      "taxAdministiration": "Kadıköy VD",
      "address": "Atatürk Caddesi No:123",
      "town": "Kadıköy",
      "city": "İstanbul",
      "country": "Türkiye",
      "postCode": "34710",
      "phone": "5551234567",
      "email": "ahmet@example.com",
      "partyName": "Ahmet Yılmaz",
      "partyIdentification": "12345678901",
      "invoiceCount": 5,
      "isFavorite": false,
      "isFromInvoice": true,
      "createdAt": "2024-01-15T08:00:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 2,
    "totalPages": 8,
    "pageLimit": 5,
    "totalItems": 38,
    "hasNextPage": true,
    "hasPrevPage": true,
    "nextPage": 3,
    "prevPage": 1
  },
  "filters": {
    "search": "ahmet",
    "sortBy": "name",
    "sortOrder": "asc"
  },
  "summary": {
    "totalCustomersInAccount": 45,
    "filteredResults": 38,
    "showingResults": 5
  }
}
```

**Arama Özellikleri:**
Search parametresi şu field'larda arama yapar:
- `name` - Müşteri adı
- `surname` - Müşteri soyadı  
- `title` - Ünvan
- `partyName` - Fatura adı
- `email` - Email adresi
- `phone` - Telefon numarası
- `TcNumber` - TC Kimlik No
- `partyIdentification` - Vergi/TC No
- `city` - Şehir
- `town` - İlçe

**Sıralama Seçenekleri:**
- `createdAt` - Oluşturulma tarihi (default)
- `updatedAt` - Güncellenme tarihi
- `name` - İsim
- `surname` - Soyisim
- `invoiceCount` - Fatura sayısı
- `city` - Şehir

**Kullanım Örnekleri:**
```javascript
// Basit listeleme
fetch('/api/customer?page=1&limit=10', {
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  }
})

// Arama ile listeleme
fetch('/api/customer?search=ahmet&page=1&limit=5', {
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  }
})

// Sıralama ile listeleme
fetch('/api/customer?sortBy=invoiceCount&sortOrder=desc&page=1&limit=20', {
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  }
})

// Kombine kullanım
const params = new URLSearchParams({
  page: 1,
  limit: 10,
  search: 'istanbul',
  sortBy: 'name',
  sortOrder: 'asc'
});

fetch(`/api/customer?${params}`, {
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  }
})
```

**Frontend Pagination Örneği:**
```javascript
function loadCustomers(page = 1, limit = 10, search = '') {
  const url = `customer?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`;
  
  fetch(url, {
    headers: {
      'Authorization': 'Bearer ' + localStorage.getItem('token')
    }
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      displayCustomers(data.data);
      updatePagination(data.pagination);
    }
  });
}

function updatePagination(pagination) {
  document.getElementById('current-page').textContent = pagination.currentPage;
  document.getElementById('total-pages').textContent = pagination.totalPages;
  document.getElementById('next-btn').disabled = !pagination.hasNextPage;
  document.getElementById('prev-btn').disabled = !pagination.hasPrevPage;
}
```

## Müşteri Sayısı API'si

### GET /api/customer/count

Kullanıcının toplam müşteri sayısını ve detaylı istatistikleri döner.

**Authentication:** Bearer Token gerekli

**Query Parameters:**
- `search` (optional): Arama metni (filtrelenmiş sayı için)

**Örnek Request:**
```
GET /api/customer/count
GET /api/customer/count?search=ahmet
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalCustomers": 45,
    "filteredCount": null,
    "favoriteCustomers": 8,
    "fromInvoiceCustomers": 32,
    "manuallyAddedCustomers": 13
  },
  "filters": {
    "search": null
  },
  "lastUpdated": "2024-01-15T10:30:00.000Z"
}
```

**Arama ile Response:**
```json
{
  "success": true,
  "data": {
    "totalCustomers": 45,
    "filteredCount": 12,
    "favoriteCustomers": 8,
    "fromInvoiceCustomers": 32,
    "manuallyAddedCustomers": 13
  },
  "filters": {
    "search": "ahmet"
  },
  "lastUpdated": "2024-01-15T10:30:00.000Z"
}
```

**Response Açıklaması:**
- `totalCustomers`: Toplam müşteri sayısı
- `filteredCount`: Arama sonucu bulunan müşteri sayısı (search varsa)
- `favoriteCustomers`: Favori olarak işaretlenen müşteri sayısı
- `fromInvoiceCustomers`: Faturalardan otomatik eklenen müşteri sayısı
- `manuallyAddedCustomers`: Manuel eklenen müşteri sayısı

**Kullanım Örnekleri:**
```javascript
// Toplam müşteri sayısını al
fetch('/api/customer/count', {
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  }
})
.then(response => response.json())
.then(data => {
  console.log('Toplam müşteri:', data.data.totalCustomers);
  console.log('Favori müşteri:', data.data.favoriteCustomers);
});

// Arama sonucu müşteri sayısını al
fetch('/api/customer/count?search=istanbul', {
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  }
})
.then(response => response.json())
.then(data => {
  console.log('Toplam:', data.data.totalCustomers);
  console.log('Arama sonucu:', data.data.filteredCount);
});

// Dashboard için özet bilgiler
async function loadDashboardStats() {
  const response = await fetch('/api/customer/count', {
    headers: {
      'Authorization': 'Bearer ' + localStorage.getItem('token')
    }
  });
  
  const data = await response.json();
  
  if (data.success) {
    document.getElementById('total-customers').textContent = data.data.totalCustomers;
    document.getElementById('favorite-customers').textContent = data.data.favoriteCustomers;
    document.getElementById('invoice-customers').textContent = data.data.fromInvoiceCustomers;
  }
}
```

**Faydaları:**
- ⚡ **Hızlı**: Sadece sayı bilgilerini döndürür, veri transferi minimal
- 📊 **Detaylı İstatistik**: Farklı kategorilerde müşteri sayıları
- 🔍 **Arama Desteği**: Filtrelenmiş sonuç sayısı
- 🎯 **Dashboard İçin İdeal**: Özet bilgiler için mükemmel

