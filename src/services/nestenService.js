import fetch from 'node-fetch';

class NestenService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.nes.com.tr/einvoice/v1';
    this.eArchiveBaseUrl = 'https://api.nes.com.tr/earchive/v1';
  }

  async fetchIncomingInvoices(options = {}) {
    const {
      page = 1,
      pageSize = 99,
      sort = 'CreatedAt desc',
      startDate = '2000-01-01',
      endDate = new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0],
      ...otherParams
    } = options;

    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
      sort,
      startDate,
      endDate,
      ...otherParams
    });

    const url = `${this.baseUrl}/incoming/invoices?${params}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      
      
      return data;
    } catch (error) {
      console.error('Nesten API Error:', error);
      throw error;
    }
  }

  async fetchOutgoingInvoices(options = {}) {
    const {
      page = 1,
      pageSize = 99,
      sort = 'CreatedAt desc',
      startDate = '2000-01-01',
      endDate = new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0],
      ...otherParams
    } = options;

    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
      sort,
      startDate,
      endDate,
      ...otherParams
    });

    const url = `${this.baseUrl}/outgoing/invoices?${params}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      
      
      return data;
    } catch (error) {
      console.error('Nesten API Error:', error);
      throw error;
    }
  }

  async fetchDraftInvoices(options = {}) {
    const {
      page = 1,
      pageSize = 99,
      sort = 'CreatedAt desc',
      ...otherParams
    } = options;

    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
      sort,
      ...otherParams
    });

    const url = `${this.baseUrl}/outgoing/invoices/drafts?${params}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      
      
      return data;
    } catch (error) {
      console.error('Nesten API Error:', error);
      throw error;
    }
  }

  async fetchEArchiveInvoices(options = {}) {
    const {
      page = 1,
      pageSize = 99,
      sort = 'CreatedAt desc',
      startDate = '2000-01-01',
      endDate = new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0],
      ...otherParams
    } = options;

    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
      sort,
      startDate,
      endDate,
      ...otherParams
    });

    const url = `${this.eArchiveBaseUrl}/invoices?${params}`;


    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      
      
      return data;
    } catch (error) {
      console.error('Nesten API Error:', error);
      throw error;
    }
  }

  async fetchEArchiveDraftInvoices(options = {}) {
    const {
      page = 1,
      pageSize = 99,
      sort = 'CreatedAt desc',
      ...otherParams
    } = options;

    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
      sort,
      ...otherParams
    });

    const url = `${this.eArchiveBaseUrl}/invoices/drafts?${params}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      
      
      return data;
    } catch (error) {
      console.error('Nesten API Error:', error);
      throw error;
    }
  }

  async fetchAllIncomingInvoices(options = {}) {
    try {
      const now = new Date(); // UTC kullan
      
      const lastSyncDate = options.lastSyncDate;
      let startDate;
      
      if (lastSyncDate) {
        // Son senkronizasyon tarihinden itibaren (1 gün öncesinden güvenlik için)
        startDate = new Date(lastSyncDate);
        startDate.setDate(startDate.getDate() - 1);
      } else {
        // İlk senkronizasyon - 2000'den itibaren
        startDate = new Date('2000-01-01');
      }
      
      const defaultStartDate = options.startDate || startDate.toISOString().split('T')[0];
      // Bitiş tarihini yarın yap (güncel faturaları kaçırmamak için)
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const defaultEndDate = options.endDate || tomorrow.toISOString().split('T')[0];

      // İlk sayfayı çek
      const firstPageResponse = await this.fetchIncomingInvoices({
        ...options,
        page: 1,
        pageSize: 100,
        startDate: defaultStartDate,
        endDate: defaultEndDate
      });

      if (!firstPageResponse || !firstPageResponse.data) {
        return [];
      }

      const totalCount = firstPageResponse.totalCount || 0;
      
      // Tek sayfa yeterliyse
      if (totalCount <= 100) {
        return firstPageResponse.data || [];
      }

      // Çoklu sayfa - paralel çek
      const totalPages = Math.ceil(totalCount / 100);
      let allInvoices = [...(firstPageResponse.data || [])];

      const pagePromises = [];
      for (let page = 2; page <= totalPages; page++) {
        pagePromises.push(
          this.fetchIncomingInvoices({
            ...options,
            page: page,
            pageSize: 100,
            startDate: defaultStartDate,
            endDate: defaultEndDate
          }).then(response => ({ page, data: response?.data || [] }))
            .catch(error => ({ page, data: [], error: error.message }))
        );
      }

      const pageResults = await Promise.all(pagePromises);
      pageResults.forEach((result) => {
        if (result.data && Array.isArray(result.data)) {
          allInvoices = [...allInvoices, ...result.data];
        }
      });
      
      return allInvoices;

    } catch (error) {
      throw error;
    }
  }

  async fetchAllOutgoingInvoices(options = {}) {
    try {
      const now = new Date(); // UTC kullan
      
      const lastSyncDate = options.lastSyncDate;
      let startDate;
      
      if (lastSyncDate) {
        // Son senkronizasyon tarihinden itibaren (1 gün öncesinden güvenlik için)
        startDate = new Date(lastSyncDate);
        startDate.setDate(startDate.getDate() - 1);
      } else {
        // İlk senkronizasyon - 2000'den itibaren
        startDate = new Date('2000-01-01');
      }
      
      const defaultStartDate = options.startDate || startDate.toISOString().split('T')[0];
      // Bitiş tarihini yarın yap (güncel faturaları kaçırmamak için)
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const defaultEndDate = options.endDate || tomorrow.toISOString().split('T')[0];

      // İlk sayfayı çek
      const firstPageResponse = await this.fetchOutgoingInvoices({
        ...options,
        page: 1,
        pageSize: 100,
        startDate: defaultStartDate,
        endDate: defaultEndDate
      });

      if (!firstPageResponse || !firstPageResponse.data) {
        return [];
      }

      const totalCount = firstPageResponse.totalCount || 0;
      
      // Tek sayfa yeterliyse
      if (totalCount <= 100) {
        return firstPageResponse.data || [];
      }

      // Çoklu sayfa - paralel çek
      const totalPages = Math.ceil(totalCount / 100);
      let allInvoices = [...(firstPageResponse.data || [])];

      const pagePromises = [];
      for (let page = 2; page <= totalPages; page++) {
        pagePromises.push(
          this.fetchOutgoingInvoices({
            ...options,
            page: page,
            pageSize: 100,
            startDate: defaultStartDate,
            endDate: defaultEndDate
          }).then(response => ({ page, data: response?.data || [] }))
            .catch(error => ({ page, data: [], error: error.message }))
        );
      }

      const pageResults = await Promise.all(pagePromises);
      pageResults.forEach((result) => {
        if (result.data && Array.isArray(result.data)) {
          allInvoices = [...allInvoices, ...result.data];
        }
      });
      
      return allInvoices;

    } catch (error) {
      throw error;
    }
  }

  async fetchAllDraftInvoices(options = {}) {
    try {
      // Taslaklar için tarih aralığı kullanmıyoruz - tüm taslakları çek
      const firstPageResponse = await this.fetchDraftInvoices({
        ...options,
        page: 1,
        pageSize: 100
      });

      if (!firstPageResponse || !firstPageResponse.data) {
        return [];
      }

      const totalCount = firstPageResponse.totalCount || 0;
      
      // Tek sayfa yeterliyse
      if (totalCount <= 100) {
        return firstPageResponse.data || [];
      }

      // Çoklu sayfa - paralel çek
      const totalPages = Math.ceil(totalCount / 100);
      let allInvoices = [...(firstPageResponse.data || [])];

      const pagePromises = [];
      for (let page = 2; page <= totalPages; page++) {
        pagePromises.push(
          this.fetchDraftInvoices({
            ...options,
            page: page,
            pageSize: 100
          }).then(response => ({ page, data: response?.data || [] }))
            .catch(error => ({ page, data: [], error: error.message }))
        );
      }

      const pageResults = await Promise.all(pagePromises);
      pageResults.forEach((result) => {
        if (result.data && Array.isArray(result.data)) {
          allInvoices = [...allInvoices, ...result.data];
        }
      });
      
      return allInvoices;

    } catch (error) {
      throw error;
    }
  }

  async fetchAllEArchiveInvoices(options = {}) {
    try {
      const now = new Date(); // UTC kullan
      
      const lastSyncDate = options.lastSyncDate;
      let startDate;
      
      if (lastSyncDate) {
        // Son senkronizasyon tarihinden itibaren (1 gün öncesinden güvenlik için)
        startDate = new Date(lastSyncDate);
        startDate.setDate(startDate.getDate() - 1);
      } else {
        // İlk senkronizasyon - 2000'den itibaren
        startDate = new Date('2000-01-01');
      }
      
      const defaultStartDate = options.startDate || startDate.toISOString().split('T')[0];
      // Bitiş tarihini yarın yap (güncel faturaları kaçırmamak için)
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const defaultEndDate = options.endDate || tomorrow.toISOString().split('T')[0];

      // İlk sayfayı çek
      const firstPageResponse = await this.fetchEArchiveInvoices({
        ...options,
        page: 1,
        pageSize: 100,
        startDate: defaultStartDate,
        endDate: defaultEndDate
      });

      if (!firstPageResponse || !firstPageResponse.data) {
        return [];
      }

      const totalCount = firstPageResponse.totalCount || 0;
      
      // Tek sayfa yeterliyse
      if (totalCount <= 100) {
        return firstPageResponse.data || [];
      }

      // Çoklu sayfa - paralel çek
      const totalPages = Math.ceil(totalCount / 100);
      let allInvoices = [...(firstPageResponse.data || [])];

      const pagePromises = [];
      for (let page = 2; page <= totalPages; page++) {
        pagePromises.push(
          this.fetchEArchiveInvoices({
            ...options,
            page: page,
            pageSize: 100,
            startDate: defaultStartDate,
            endDate: defaultEndDate
          }).then(response => ({ page, data: response?.data || [] }))
            .catch(error => ({ page, data: [], error: error.message }))
        );
      }

      const pageResults = await Promise.all(pagePromises);
      pageResults.forEach((result) => {
        if (result.data && Array.isArray(result.data)) {
          allInvoices = [...allInvoices, ...result.data];
        }
      });
      
      return allInvoices;

    } catch (error) {
      throw error;
    }
  }

  async fetchAllEArchiveDraftInvoices(options = {}) {
    try {
      // e-Arşiv taslaklar için tarih aralığı kullanmıyoruz - tüm taslakları çek
      const firstPageResponse = await this.fetchEArchiveDraftInvoices({
        ...options,
        page: 1,
        pageSize: 100
      });

      if (!firstPageResponse || !firstPageResponse.data) {
        return [];
      }

      const totalCount = firstPageResponse.totalCount || 0;
      
      // Tek sayfa yeterliyse
      if (totalCount <= 100) {
        return firstPageResponse.data || [];
      }

      // Çoklu sayfa - paralel çek
      const totalPages = Math.ceil(totalCount / 100);
      let allInvoices = [...(firstPageResponse.data || [])];

      const pagePromises = [];
      for (let page = 2; page <= totalPages; page++) {
        pagePromises.push(
          this.fetchEArchiveDraftInvoices({
            ...options,
            page: page,
            pageSize: 100
          }).then(response => ({ page, data: response?.data || [] }))
            .catch(error => ({ page, data: [], error: error.message }))
        );
      }

      const pageResults = await Promise.all(pagePromises);
      pageResults.forEach((result) => {
        if (result.data && Array.isArray(result.data)) {
          allInvoices = [...allInvoices, ...result.data];
        }
      });
      
      return allInvoices;

    } catch (error) {
      console.error('e-Arşiv taslak faturalar çekilirken hata:', error);
      throw error;
    }
  }
}

export default NestenService; 