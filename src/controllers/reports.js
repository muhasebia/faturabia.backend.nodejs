import UserInvoices from '../models/UserInvoices.js';
import Customer from '../models/Customer.js';
import User from '../models/User.js';

// Reports verilerini getir
async function getReportsData(req, res) {
  try {
    const userId = req.userId;
    
    // Kullanıcının faturalarını al
    const userInvoices = await UserInvoices.findOne({ userId });
    if (!userInvoices) {
      return res.status(200).json({
        message: 'Henüz fatura verisi bulunamadı.',
        data: getEmptyReportsData()
      });
    }

    // Tüm faturaları topla ve tip bilgisi ekle
    const allInvoices = [
      ...(userInvoices.eFatura.incoming || []).map(inv => ({...inv, type: 'incoming', source: 'efatura'})),
      ...(userInvoices.eFatura.outgoing || []).map(inv => ({...inv, type: 'outgoing', source: 'efatura'})),
      ...(userInvoices.eFatura.incomingDraft || []).map(inv => ({...inv, type: 'draft', source: 'efatura'})),
      ...(userInvoices.eFatura.outgoingDraft || []).map(inv => ({...inv, type: 'draft', source: 'efatura'})),
      ...(userInvoices.eArchive.incoming || []).map(inv => ({...inv, type: 'incoming', source: 'earchive'})),
      ...(userInvoices.eArchive.outgoing || []).map(inv => ({...inv, type: 'outgoing', source: 'earchive'})),
      ...(userInvoices.eArchive.incomingDraft || []).map(inv => ({...inv, type: 'draft', source: 'earchive'})),
      ...(userInvoices.eArchive.outgoingDraft || []).map(inv => ({...inv, type: 'draft', source: 'earchive'}))
    ];

    // Müşteri verilerini al
    const user = await User.findById(userId).populate('customers');
    const customers = user?.customers || [];

    // Reports verilerini hesapla
    const reportsData = calculateReportsMetrics(allInvoices, customers);

    res.status(200).json({
      success: true,
      data: reportsData
    });

  } catch (error) {
    console.error('Reports verileri getirilirken hata:', error);
    res.status(500).json({
      error: 'Reports verileri getirilirken hata oluştu.',
      message: error.message
    });
  }
}

// Reports metriklerini hesapla
function calculateReportsMetrics(invoices, customers) {
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  // Son 6 ay için aylık veriler
  const monthlyData = getMonthlyData(invoices, sixMonthsAgo);
  
  // Gelir ve gider hesaplamaları
  const totalRevenue = calculateRevenue(invoices);
  const totalExpenses = calculateExpenses(invoices);
  const netProfit = totalRevenue - totalExpenses;
  
  // Tahsilat oranı (örnek hesaplama)
  const collectionRate = calculateCollectionRate(invoices);
  
  // Müşteri dağılımı
  const customerDistribution = calculateCustomerDistribution(customers, invoices);
  
  // Tahsilat performansı
  const collectionPerformance = calculateCollectionPerformance(invoices);
  
  // KPI göstergeleri
  const kpiIndicators = calculateKPIs(invoices, totalRevenue, totalExpenses);
  
  // Gider kategorileri
  const expenseCategories = calculateExpenseCategories(invoices);
  
  // Hedef gerçekleşme
  const targetAchievement = calculateTargetAchievement(totalRevenue, totalExpenses);

  return {
    // Finansal Metrikler
    financialMetrics: {
      totalRevenue: {
        value: totalRevenue,
        change: calculateGrowthRate(monthlyData.revenue),
        formatted: formatCurrency(totalRevenue)
      },
      totalExpenses: {
        value: totalExpenses,
        change: calculateGrowthRate(monthlyData.expenses),
        formatted: formatCurrency(totalExpenses)
      },
      netProfit: {
        value: netProfit,
        change: calculateProfitGrowth(monthlyData),
        formatted: formatCurrency(netProfit)
      },
      collectionRate: {
        value: collectionRate,
        change: 5.1, // Örnek değer
        formatted: `${collectionRate.toFixed(1)}%`
      }
    },

    // Son 6 ay gelir analizi
    revenueAnalysis: {
      months: monthlyData.months,
      data: monthlyData.revenue,
      growth: calculateGrowthRate(monthlyData.revenue)
    },

    // Son 6 ay gider analizi
    expenseAnalysis: {
      months: monthlyData.months,
      data: monthlyData.expenses,
      growth: calculateGrowthRate(monthlyData.expenses)
    },

    // Müşteri dağılımı
    customerDistribution,

    // Tahsilat performansı
    collectionPerformance,

    // KPI göstergeleri
    kpiIndicators,

    // Gider kategorileri
    expenseCategories,

    // Gelir-Gider karşılaştırması
    revenueExpenseComparison: {
      months: monthlyData.months,
      revenue: monthlyData.revenue,
      expenses: monthlyData.expenses
    },

    // Hedef gerçekleşme
    targetAchievement,

    // Genel istatistikler
    statistics: {
      totalInvoices: invoices.length,
      totalCustomers: customers.length,
      averageInvoiceAmount: invoices.length > 0 ? totalRevenue / invoices.filter(inv => inv.type !== 'draft').length : 0,
      lastUpdateDate: new Date().toISOString()
    }
  };
}

// Son 6 ay için aylık verileri hesapla
function getMonthlyData(invoices, startDate) {
  const months = [];
  const revenue = [];
  const expenses = [];
  
  for (let i = 0; i < 6; i++) {
    const date = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
    const monthName = date.toLocaleDateString('tr-TR', { month: 'short' });
    months.push(monthName);
    
    // O ay için gelir ve gider hesapla
    const monthRevenue = invoices
      .filter(inv => {
        const invDate = new Date(inv.issueDate || inv.createDate);
        return invDate.getMonth() === date.getMonth() && 
               invDate.getFullYear() === date.getFullYear() &&
               inv.type === 'incoming';
      })
      .reduce((sum, inv) => sum + parseFloat(inv.payableAmount || 0), 0);
    
    const monthExpenses = invoices
      .filter(inv => {
        const invDate = new Date(inv.issueDate || inv.createDate);
        return invDate.getMonth() === date.getMonth() && 
               invDate.getFullYear() === date.getFullYear() &&
               inv.type === 'outgoing';
      })
      .reduce((sum, inv) => sum + parseFloat(inv.payableAmount || 0), 0);
    
    revenue.push(Math.round(monthRevenue));
    expenses.push(Math.round(monthExpenses));
  }
  
  return { months, revenue, expenses };
}

// Toplam gelir hesapla
function calculateRevenue(invoices) {
  return invoices
    .filter(inv => inv.type === 'incoming')
    .reduce((sum, inv) => sum + parseFloat(inv.payableAmount || 0), 0);
}

// Toplam gider hesapla
function calculateExpenses(invoices) {
  return invoices
    .filter(inv => inv.type === 'outgoing')
    .reduce((sum, inv) => sum + parseFloat(inv.payableAmount || 0), 0);
}

// Tahsilat oranı hesapla
function calculateCollectionRate(invoices) {
  const totalInvoices = invoices.filter(inv => inv.type === 'incoming').length;
  if (totalInvoices === 0) return 0;
  
  // Basit hesaplama - gerçekte ödeme durumuna göre hesaplanmalı
  const collectedInvoices = Math.floor(totalInvoices * 0.92); // %92 tahsilat varsayımı
  return (collectedInvoices / totalInvoices) * 100;
}

// Müşteri dağılımı hesapla
function calculateCustomerDistribution(customers, invoices) {
  const customerInvoiceCounts = new Map();
  
  // Her müşteri için fatura sayısını hesapla
  customers.forEach(customer => {
    const count = customer.invoiceCount || 0;
    customerInvoiceCounts.set(customer._id.toString(), count);
  });
  
  // Segmentlere ayır
  let aSegment = 0; // 10+ fatura
  let bSegment = 0; // 5-9 fatura
  let cSegment = 0; // 1-4 fatura
  
  customerInvoiceCounts.forEach(count => {
    if (count >= 10) aSegment++;
    else if (count >= 5) bSegment++;
    else if (count >= 1) cSegment++;
  });
  
  const total = aSegment + bSegment + cSegment;
  
  return [
    {
      name: 'A Segmenti',
      population: total > 0 ? Math.round((aSegment / total) * 100) : 0,
      color: '#2C9F1B',
      legendFontColor: '#7F7F7F'
    },
    {
      name: 'B Segmenti', 
      population: total > 0 ? Math.round((bSegment / total) * 100) : 0,
      color: '#4CAF50',
      legendFontColor: '#7F7F7F'
    },
    {
      name: 'C Segmenti',
      population: total > 0 ? Math.round((cSegment / total) * 100) : 0,
      color: '#81C784',
      legendFontColor: '#7F7F7F'
    }
  ];
}

// Tahsilat performansı hesapla
function calculateCollectionPerformance(invoices) {
  // Basit hesaplama - gerçekte ödeme tarihleri kullanılmalı
  return [
    {
      name: 'Zamanında',
      population: 75,
      color: '#2C9F1B',
      legendFontColor: '#7F7F7F'
    },
    {
      name: 'Gecikmiş',
      population: 15,
      color: '#FF9800',
      legendFontColor: '#7F7F7F'
    },
    {
      name: 'Beklemede',
      population: 10,
      color: '#E0E0E0',
      legendFontColor: '#7F7F7F'
    }
  ];
}

// KPI göstergeleri hesapla
function calculateKPIs(invoices, revenue, expenses) {
  const totalInvoices = invoices.filter(inv => inv.type !== 'draft').length;
  const salesTarget = 100000; // Örnek hedef
  const collectionTarget = 95; // %95 tahsilat hedefi
  const customerTarget = 50; // 50 müşteri hedefi
  const profitTarget = 20000; // 20K kar hedefi
  
  return {
    labels: ['Satış', 'Tahsilat', 'Müşteri', 'Karlılık'],
    data: [
      Math.min(revenue / salesTarget, 1),
      Math.min(calculateCollectionRate(invoices) / collectionTarget, 1),
      Math.min(totalInvoices / 100, 1), // Fatura sayısı bazında
      Math.min((revenue - expenses) / profitTarget, 1)
    ]
  };
}

// Gider kategorileri hesapla
function calculateExpenseCategories(invoices) {
  const outgoingInvoices = invoices.filter(inv => inv.type === 'outgoing');
  const totalExpenses = outgoingInvoices.reduce((sum, inv) => sum + parseFloat(inv.payableAmount || 0), 0);
  
  // Basit kategorizasyon - gerçekte fatura içeriğine göre yapılmalı
  const categories = {
    'Personel': totalExpenses * 0.4,
    'Kira': totalExpenses * 0.2,
    'Elektrik': totalExpenses * 0.15,
    'Su': totalExpenses * 0.1,
    'Diğer': totalExpenses * 0.15
  };
  
  return {
    labels: Object.keys(categories),
    datasets: [{
      data: Object.values(categories).map(val => Math.round(val))
    }]
  };
}

// Hedef gerçekleşme hesapla
function calculateTargetAchievement(revenue, expenses) {
  return {
    labels: ['Satış', 'Pazarlama', 'Finans'],
    data: [
      Math.min(revenue / 100000, 1), // Satış hedefi
      Math.min(0.88, 1), // Pazarlama hedefi (örnek)
      Math.min((revenue - expenses) / 20000, 1) // Finans hedefi
    ]
  };
}

// Büyüme oranı hesapla
function calculateGrowthRate(data) {
  if (data.length < 2) return 0;
  const current = data[data.length - 1];
  const previous = data[data.length - 2];
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

// Kar büyümesi hesapla
function calculateProfitGrowth(monthlyData) {
  const currentProfit = monthlyData.revenue[monthlyData.revenue.length - 1] - monthlyData.expenses[monthlyData.expenses.length - 1];
  const previousProfit = monthlyData.revenue[monthlyData.revenue.length - 2] - monthlyData.expenses[monthlyData.expenses.length - 2];
  
  if (previousProfit === 0) return 0;
  return ((currentProfit - previousProfit) / previousProfit) * 100;
}

// Para formatı
function formatCurrency(amount) {
  return `₺${amount.toLocaleString('tr-TR')}`;
}

// Boş reports verisi
function getEmptyReportsData() {
  return {
    financialMetrics: {
      totalRevenue: { value: 0, change: 0, formatted: '₺0' },
      totalExpenses: { value: 0, change: 0, formatted: '₺0' },
      netProfit: { value: 0, change: 0, formatted: '₺0' },
      collectionRate: { value: 0, change: 0, formatted: '0%' }
    },
    revenueAnalysis: { months: [], data: [], growth: 0 },
    expenseAnalysis: { months: [], data: [], growth: 0 },
    customerDistribution: [],
    collectionPerformance: [],
    kpiIndicators: { labels: [], data: [] },
    expenseCategories: { labels: [], datasets: [{ data: [] }] },
    revenueExpenseComparison: { months: [], revenue: [], expenses: [] },
    targetAchievement: { labels: [], data: [] },
    statistics: { totalInvoices: 0, totalCustomers: 0, averageInvoiceAmount: 0, lastUpdateDate: new Date().toISOString() }
  };
}

export { getReportsData }; 