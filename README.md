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

