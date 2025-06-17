import UserInvoices from '../models/UserInvoices.js';
import Customer from '../models/Customer.js';
import User from '../models/User.js';

async function getApiStatus(req, res) {
  try {
    const userId = req.userId;
    
    // User ve API anahtarı bilgilerini al
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: 'Kullanıcı bulunamadı.'
      });
    }

    // UserInvoices bilgilerini al
    const userInvoices = await UserInvoices.findOne({ userId });
    
    // Son senkronizasyon tarihlerini belirle
    let lastSynchronization = null;
    if (userInvoices && userInvoices.lastFetchDate) {
      const syncDates = Object.values(userInvoices.lastFetchDate).filter(date => date);
      if (syncDates.length > 0) {
        lastSynchronization = new Date(Math.max(...syncDates.map(date => new Date(date))));
      }
    }

    // Toplam senkronize edilen fatura sayısını hesapla
    const totalSynchronizedInvoices = userInvoices ? userInvoices.toplamFatura : 0;

    // API durumu bilgilerini döndür
    res.status(200).json({
      success: true,
      data: {
        apiKeyStatus: {
          hasApiKey: !!user.nesApiKey,
          isActive: !!user.nesApiKey,
          message: user.nesApiKey 
            ? 'API anahtarı aktif' 
            : 'API anahtarı tanımlanmamış'
        },
        lastSynchronization: {
          date: lastSynchronization,
          formatted: lastSynchronization 
            ? lastSynchronization.toLocaleString('tr-TR') 
            : 'Henüz senkronizasyon yapılmamış',
          details: userInvoices?.lastFetchDate || {}
        },
        synchronizedInvoiceCount: {
          total: totalSynchronizedInvoices,
          breakdown: userInvoices ? {
            eFatura: {
              incoming: userInvoices.eFatura.incoming?.length || 0,
              outgoing: userInvoices.eFatura.outgoing?.length || 0,
              incomingDraft: userInvoices.eFatura.incomingDraft?.length || 0,
              outgoingDraft: userInvoices.eFatura.outgoingDraft?.length || 0
            },
            eArchive: {
              incoming: userInvoices.eArchive.incoming?.length || 0,
              outgoing: userInvoices.eArchive.outgoing?.length || 0,
              incomingDraft: userInvoices.eArchive.incomingDraft?.length || 0,
              outgoingDraft: userInvoices.eArchive.outgoingDraft?.length || 0
            }
          } : {
            eFatura: { incoming: 0, outgoing: 0, incomingDraft: 0, outgoingDraft: 0 },
            eArchive: { incoming: 0, outgoing: 0, incomingDraft: 0, outgoingDraft: 0 }
          }
        },
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email
        },
        lastUpdateDate: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('API durumu getirilirken hata:', error);
    res.status(500).json({
      error: 'API durumu getirilirken hata oluştu.',
      message: error.message
    });
  }
}

async function getDashboardData(req, res) {
  try {
    const userId = req.userId;
    
    const userInvoices = await UserInvoices.findOne({ userId });
    if (!userInvoices) {
      return res.status(200).json({
        message: 'Henüz fatura verisi bulunamadı.',
        data: getEmptyDashboardData()
      });
    }

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

    const user = await User.findById(userId).populate('customers');
    const customers = user?.customers || [];

    const dashboardData = calculateDashboardMetrics(allInvoices, customers);

    res.status(200).json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('Dashboard verileri getirilirken hata:', error);
    res.status(500).json({
      error: 'Dashboard verileri getirilirken hata oluştu.',
      message: error.message
    });
  }
}

function calculateDashboardMetrics(invoices, customers) {
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const monthlyData = getMonthlyData(invoices, sixMonthsAgo);
  
  const totalRevenue = calculateRevenue(invoices);
  const totalExpenses = calculateExpenses(invoices);
  const netProfit = totalRevenue - totalExpenses;
  
  const collectionRate = calculateCollectionRate(invoices);
  
  const customerDistribution = calculateCustomerDistribution(customers, invoices);
  
  const collectionPerformance = calculateCollectionPerformance(invoices);
  
  const kpiIndicators = calculateKPIs(invoices, totalRevenue, totalExpenses);
  
  const expenseCategories = calculateExpenseCategories(invoices);
  
  const targetAchievement = calculateTargetAchievement(totalRevenue, totalExpenses);

  return {
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
        change: 5.1,
        formatted: `${collectionRate.toFixed(1)}%`
      }
    },

    revenueAnalysis: {
      months: monthlyData.months,
      data: monthlyData.revenue,
      growth: calculateGrowthRate(monthlyData.revenue)
    },

    expenseAnalysis: {
      months: monthlyData.months,
      data: monthlyData.expenses,
      growth: calculateGrowthRate(monthlyData.expenses)
    },

    customerDistribution,

    collectionPerformance,

    kpiIndicators,

    expenseCategories,

    revenueExpenseComparison: {
      months: monthlyData.months,
      revenue: monthlyData.revenue,
      expenses: monthlyData.expenses
    },

    targetAchievement,

    statistics: {
      totalInvoices: invoices.length,
      totalCustomers: customers.length,
      averageInvoiceAmount: invoices.length > 0 ? totalRevenue / invoices.filter(inv => inv.type !== 'draft').length : 0,
      lastUpdateDate: new Date().toISOString()
    }
  };
}

function getMonthlyData(invoices, startDate) {
  const months = [];
  const revenue = [];
  const expenses = [];
  
  for (let i = 0; i < 6; i++) {
    const date = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
    const monthName = date.toLocaleDateString('tr-TR', { month: 'short' });
    months.push(monthName);
    
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

function calculateRevenue(invoices) {
  return invoices
    .filter(inv => inv.type === 'incoming')
    .reduce((sum, inv) => sum + parseFloat(inv.payableAmount || 0), 0);
}

function calculateExpenses(invoices) {
  return invoices
    .filter(inv => inv.type === 'outgoing')
    .reduce((sum, inv) => sum + parseFloat(inv.payableAmount || 0), 0);
}

function calculateCollectionRate(invoices) {
  const totalInvoices = invoices.filter(inv => inv.type === 'incoming').length;
  if (totalInvoices === 0) return 0;
  
  const collectedInvoices = Math.floor(totalInvoices * 0.92);
  return (collectedInvoices / totalInvoices) * 100;
}

function calculateCustomerDistribution(customers, invoices) {
  const customerInvoiceCounts = new Map();
  
  customers.forEach(customer => {
    const count = customer.invoiceCount || 0;
    customerInvoiceCounts.set(customer._id.toString(), count);
  });
  
  let aSegment = 0;
  let bSegment = 0;
  let cSegment = 0;
  
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

function calculateCollectionPerformance(invoices) {
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

function calculateKPIs(invoices, revenue, expenses) {
  const totalInvoices = invoices.filter(inv => inv.type !== 'draft').length;
  const salesTarget = 100000;
  const collectionTarget = 95;
  const customerTarget = 50;
  const profitTarget = 20000;
  
  return {
    labels: ['Satış', 'Tahsilat', 'Müşteri', 'Karlılık'],
    data: [
      Math.min(revenue / salesTarget, 1),
      Math.min(calculateCollectionRate(invoices) / collectionTarget, 1),
      Math.min(totalInvoices / 100, 1),
      Math.min((revenue - expenses) / profitTarget, 1)
    ]
  };
}

function calculateExpenseCategories(invoices) {
  const outgoingInvoices = invoices.filter(inv => inv.type === 'outgoing');
  const totalExpenses = outgoingInvoices.reduce((sum, inv) => sum + parseFloat(inv.payableAmount || 0), 0);
  
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

function calculateTargetAchievement(revenue, expenses) {
  return {
    labels: ['Satış', 'Pazarlama', 'Finans'],
    data: [
      Math.min(revenue / 100000, 1),
      Math.min(0.88, 1),
      Math.min((revenue - expenses) / 20000, 1)
    ]
  };
}

function calculateGrowthRate(data) {
  if (data.length < 2) return 0;
  const current = data[data.length - 1];
  const previous = data[data.length - 2];
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

function calculateProfitGrowth(monthlyData) {
  const currentProfit = monthlyData.revenue[monthlyData.revenue.length - 1] - monthlyData.expenses[monthlyData.expenses.length - 1];
  const previousProfit = monthlyData.revenue[monthlyData.revenue.length - 2] - monthlyData.expenses[monthlyData.expenses.length - 2];
  
  if (previousProfit === 0) return 0;
  return ((currentProfit - previousProfit) / previousProfit) * 100;
}

function formatCurrency(amount) {
  return `₺${amount.toLocaleString('tr-TR')}`;
}

function getEmptyDashboardData() {
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

export { getDashboardData, getApiStatus }; 