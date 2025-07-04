# User Options Kullanımı

Bu döküman, User modelindeki `options` alanının nasıl kullanılacağını açıklar.

## Options Alanı

User modeline eklenen `options` alanı, kullanıcıya özel ayarları ve gösterilen uyarıları takip etmek için kullanılır.

### Şema
```javascript
options: [{
  type: String,
  enum: ['nesApiWarningShown'],
  default: []
}]
```

## Kullanılabilir Options

| Option | Açıklama |
|--------|----------|
| `nesApiWarningShown` | NES API uyarısının kullanıcıya gösterilip gösterilmediğini takip eder |

## API Endpoints

### Options Güncelleme
**Endpoint:** `POST /updateOptions`  
**Authentication:** Token gerekli  
**Headers:** 
```
Authorization: Bearer <token>
Content-Type: application/json
```

#### Request Body
```javascript
{
  "option": "nesApiWarningShown",
  "action": "add" // veya "remove"
}
```

#### Response (Başarılı)
```javascript
{
  "message": "Kullanıcı seçenekleri başarıyla güncellendi",
  "options": ["nesApiWarningShown"]
}
```

#### Response (Hata)
```javascript
{
  "error": "Option gereklidir"
}
```

## Kullanım Örnekleri

### 1. NES API Uyarısını Gösterildi Olarak İşaretle

```javascript
// Frontend'de AJAX çağrısı
fetch('/updateOptions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${userToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    option: 'nesApiWarningShown',
    action: 'add'
  })
})
.then(response => response.json())
.then(data => {
  console.log('Uyarı işaretlendi:', data);
});
```

### 2. NES API Uyarısını Tekrar Göstermek İçin Sıfırla

```javascript
fetch('/updateOptions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${userToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    option: 'nesApiWarningShown',
    action: 'remove'
  })
})
.then(response => response.json())
.then(data => {
  console.log('Uyarı sıfırlandı:', data);
});
```

### 3. Kullanıcı Bilgilerini Alırken Options Kontrolü

```javascript
// getUser endpoint'inden dönen response
{
  "_id": "64a1b2c3d4e5f6789012345",
  "fullName": "Ahmet Yılmaz",
  "email": "ahmet@example.com",
  "options": ["nesApiWarningShown"], // Bu uyarı gösterildi
  "createdAt": "2023-07-03T10:30:00.000Z",
  "updatedAt": "2023-07-03T15:45:00.000Z"
}

// Frontend'de kontrol
const shouldShowNesApiWarning = !user.options.includes('nesApiWarningShown');
if (shouldShowNesApiWarning) {
  // Uyarıyı göster
  showNesApiWarning();
}
```

## Backend Kod Örneği

### Controller'da Options Kontrolü

```javascript
// Bir endpoint'te uyarı durumunu kontrol etme
async function someEndpoint(req, res) {
  try {
    const userId = req.userId;
    const user = await User.findById(userId);
    
    const hasSeenNesApiWarning = user.options.includes('nesApiWarningShown');
    
    res.json({
      data: someData,
      showNesApiWarning: !hasSeenNesApiWarning
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

## Yeni Option Ekleme

Yeni bir option eklemek için:

1. **Model'de enum'a ekleyin:**
```javascript
enum: ['nesApiWarningShown', 'newOptionName']
```

2. **Controller'da validOptions array'ine ekleyin:**
```javascript
const validOptions = ['nesApiWarningShown', 'newOptionName'];
```

## Hata Durumları

| Hata | Açıklama | Status Code |
|------|----------|-------------|
| `Option gereklidir` | option parametresi gönderilmemiş | 400 |
| `Action add veya remove olmalıdır` | Geçersiz action değeri | 400 |
| `Geçersiz option değeri` | Enum'da olmayan option | 400 |
| `Kullanıcı bulunamadı` | Token geçerli ama kullanıcı silinmiş | 404 |

## Notes

- Options array'i otomatik olarak boş array olarak başlatılır
- Aynı option'ı tekrar eklemek array'i etkilemez (duplicate oluşmaz)
- Remove işlemi option yoksa da hata vermez
- Options değişiklikleri `updatedAt` alanını otomatik günceller 