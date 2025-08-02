# Fatura API Dokümantasyonu - Pagination ve Endpoint'ler

Bu dokümantasyon, fatura sisteminin API endpoint'lerini ve pagination mantığını detaylı olarak açıklar.

## Base URL
```
https://your-api-domain.com/api/invoices
```

## Authentication
Tüm endpoint'ler için `Authorization` header'ı gereklidir:
```
Authorization: Bearer <your-jwt-token>
```

---

## 1. TÜM FATURALAR - Pagination ile

### GET `/api/invoices/all`

Gelen + Giden + e-Arşiv faturalarının hepsini birleştirip tarihsel sırayla döner.

#### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Sayfa numarası (1'den başlar) |
| `pageSize` | number | 100 | Sayfa başına kayıt sayısı |
| `sort` | string | "CreatedAt desc" | Sıralama kriteri |

#### Request Example
```javascript
fetch('/api/invoices/all?page=1&pageSize=100&sort=CreatedAt desc', {
  headers: {
    'Authorization': 'Bearer your-token'
  }
})
```

#### Response Format
```json
{
  "invoices": [
    {
      "id": "string",
      "type": "incoming|outgoing",
      "issueDate": "2025-01-15T10:30:00Z",
      "payableAmount": 1250.75,
      "customerName": "Müşteri Adı",
      "invoiceNumber": "FTR2025000123",
      // ... diğer fatura alanları
    }
  ],
  "totalCount": 456,
  "currentPage": 1,
  "totalPages": 5,
  "pageSize": 100,
  "summary": {
    "incoming": {
      "count": 120,
      "totalAmount": 45600.50
    },
    "outgoing": {
      "count": 336,
      "totalAmount": 125300.75
    },
    "total": {
      "count": 456,
      "totalAmount": 170901.25
    }
  }
}
```

---

## 2. GELEN FATURALAR - Pagination ile

### GET `/api/invoices/incoming`

Sadece gelen faturaları döner.

#### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Sayfa numarası |
| `pageSize` | number | 100 | Sayfa başına kayıt sayısı |
| `sort` | string | "CreatedAt desc" | Sıralama kriteri |

#### Response Format
```json
{
  "invoices": [
    {
      "id": "string",
      "type": "incoming",
      "issueDate": "2025-01-15T10:30:00Z",
      "payableAmount": 1250.75,
      "customerName": "Satıcı Firma",
      "invoiceNumber": "GF2025000001"
    }
  ],
  "totalCount": 120,
  "currentPage": 1,
  "totalPages": 2,
  "pageSize": 100,
  "totalAmount": 45600.50
}
```

---

## 3. GİDEN FATURALAR - Pagination ile

### GET `/api/invoices/outgoing`

Giden + e-Arşiv faturalarını birleştirip döner.

#### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Sayfa numarası |
| `pageSize` | number | 100 | Sayfa başına kayıt sayısı |
| `sort` | string | "CreatedAt desc" | Sıralama kriteri |

#### Response Format
```json
{
  "invoices": [
    {
      "id": "string",
      "type": "outgoing",
      "issueDate": "2025-01-15T10:30:00Z",
      "payableAmount": 2150.00,
      "customerName": "Alıcı Firma",
      "invoiceNumber": "SF2025000001"
    }
  ],
  "totalCount": 336,
  "currentPage": 1,
  "totalPages": 4,
  "pageSize": 100,
  "totalAmount": 125300.75
}
```

---

## 4. İSTATİSTİKLER

### GET `/api/invoices/statistics`

Hesaplanmış istatistikleri döner (toplam tutarlar, kar-zarar vb.)

#### Response Format
```json
{
  "success": true,
  "statistics": {
    "toplamTutar": 170901.25,
    "gelenTutar": 45600.50,
    "gidenTutar": 125300.75,
    "karZarar": -79700.25,
    "toplamMiktar": 456,
    "gelenMiktar": 120,
    "gidenMiktar": 336,
    "taslakMiktar": 12,
    "lastCalculated": "2025-08-02T14:30:00Z"
  },
  "summary": {
    "gelenFaturalar": {
      "miktar": 120,
      "tutar": 45600.50,
      "ortalama": 380.00
    },
    "gidenFaturalar": {
      "miktar": 336,
      "tutar": 125300.75,
      "ortalama": 372.92
    },
    "taslakFaturalar": {
      "miktar": 12
    }
  },
  "lastCalculated": "2025-08-02T14:30:00Z"
}
```

---

## 5. İSTATİSTİK HESAPLAMA

### POST `/api/invoices/fetch-all`

Tüm faturaları API'den çekip istatistikleri yeniden hesaplar.

#### Response Format
```json
{
  "success": true,
  "message": "İstatistikler başarıyla hesaplandı ve kaydedildi.",
  "statistics": {
    "toplamTutar": 170901.25,
    "gelenTutar": 45600.50,
    "gidenTutar": 125300.75,
    "karZarar": -79700.25,
    "toplamMiktar": 456,
    "gelenMiktar": 120,
    "gidenMiktar": 336,
    "taslakMiktar": 12,
    "lastCalculated": "2025-08-02T14:30:00Z"
  },
  "summary": {
    "totalProcessed": 468,
    "incoming": 120,
    "outgoing": 336,
    "drafts": 12
  }
}
```

---

## Frontend Entegrasyonu

### React/Next.js Örnek Kullanım

#### 1. Pagination Hook
```javascript
import { useState, useEffect } from 'react';

const usePagination = (initialPage = 1, initialPageSize = 100) => {
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const goToPage = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const nextPage = () => goToPage(page + 1);
  const prevPage = () => goToPage(page - 1);

  return {
    page,
    pageSize,
    totalPages,
    totalCount,
    setTotalPages,
    setTotalCount,
    goToPage,
    nextPage,
    prevPage,
    setPageSize
  };
};
```

#### 2. Fatura Listesi Component
```javascript
import { useState, useEffect } from 'react';

const InvoiceList = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  
  const {
    page,
    pageSize,
    totalPages,
    totalCount,
    setTotalPages,
    setTotalCount,
    goToPage,
    nextPage,
    prevPage
  } = usePagination();

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/invoices/all?page=${page}&pageSize=${pageSize}&sort=CreatedAt desc`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      const data = await response.json();
      
      setInvoices(data.invoices);
      setTotalPages(data.totalPages);
      setTotalCount(data.totalCount);
      setSummary(data.summary);
    } catch (error) {
      console.error('Faturalar yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [page, pageSize]);

  return (
    <div>
      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-100 p-4 rounded">
            <h3>Gelen Faturalar</h3>
            <p>Adet: {summary.incoming.count}</p>
            <p>Tutar: ₺{summary.incoming.totalAmount.toLocaleString()}</p>
          </div>
          <div className="bg-green-100 p-4 rounded">
            <h3>Giden Faturalar</h3>
            <p>Adet: {summary.outgoing.count}</p>
            <p>Tutar: ₺{summary.outgoing.totalAmount.toLocaleString()}</p>
          </div>
          <div className="bg-gray-100 p-4 rounded">
            <h3>Toplam</h3>
            <p>Adet: {summary.total.count}</p>
            <p>Tutar: ₺{summary.total.totalAmount.toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* Invoice Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border">
          <thead>
            <tr>
              <th>Fatura No</th>
              <th>Tür</th>
              <th>Tarih</th>
              <th>Müşteri</th>
              <th>Tutar</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5">Yükleniyor...</td></tr>
            ) : (
              invoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td>{invoice.invoiceNumber}</td>
                  <td>
                    <span className={`px-2 py-1 rounded text-sm ${
                      invoice.type === 'incoming' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {invoice.type === 'incoming' ? 'Gelen' : 'Giden'}
                    </span>
                  </td>
                  <td>{new Date(invoice.issueDate).toLocaleDateString()}</td>
                  <td>{invoice.customerName}</td>
                  <td>₺{invoice.payableAmount.toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex justify-between items-center mt-4">
        <div>
          Sayfa {page} / {totalPages} (Toplam {totalCount} kayıt)
        </div>
        <div className="flex gap-2">
          <button 
            onClick={prevPage} 
            disabled={page === 1}
            className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
          >
            Önceki
          </button>
          <button 
            onClick={nextPage} 
            disabled={page === totalPages}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
          >
            Sonraki
          </button>
        </div>
      </div>
    </div>
  );
};
```

#### 3. Fatura Türü Seçimi
```javascript
const InvoiceTypeSelector = () => {
  const [activeType, setActiveType] = useState('all');

  const types = [
    { key: 'all', label: 'Tüm Faturalar', endpoint: '/api/invoices/all' },
    { key: 'incoming', label: 'Gelen Faturalar', endpoint: '/api/invoices/incoming' },
    { key: 'outgoing', label: 'Giden Faturalar', endpoint: '/api/invoices/outgoing' }
  ];

  return (
    <div className="flex gap-2 mb-4">
      {types.map((type) => (
        <button
          key={type.key}
          onClick={() => setActiveType(type.key)}
          className={`px-4 py-2 rounded ${
            activeType === type.key
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          {type.label}
        </button>
      ))}
    </div>
  );
};
```

---

## Önemli Notlar

### 1. Tarih Aralığı
- Tüm endpoint'ler default olarak 2000-01-01'den bugüne kadar olan faturaları çeker
- Özel tarih aralığı için `startDate` ve `endDate` parametreleri kullanılabilir

### 2. Performans
- Tüm faturalar endpoint'i (`/all`) birden fazla API çağrısı yapar
- Büyük veri setlerinde yavaş olabilir
- İlk yüklemede loading state gösterin

### 3. Error Handling
- 401: Token geçersiz
- 400: NES API anahtarı bulunamadı
- 500: Sunucu hatası

### 4. Cache Stratejisi
- İstatistikler cache'lenir
- Yeni hesaplama için `/fetch-all` endpoint'ini kullanın
- Frontend'de sayfa değişimlerinde cache kullanın

### 5. Responsive Design
- Tablolar mobilde yatay scroll kullanmalı
- Pagination kontrolleri mobil-friendly olmalı
- Summary kartları mobilde alt alta dizilmeli

Bu dokümantasyon ile frontend entegrasyonunuzu sorunsuz yapabilirsiniz. Herhangi bir sorunuz olursa sorabilirsiniz!
