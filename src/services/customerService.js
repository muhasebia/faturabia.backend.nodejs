import CustomerModel from '../models/Customer.js';
import UserModel from '../models/User.js';

// Faturadan müşteri bilgilerini çıkar ve kaydet
export async function saveCustomersFromInvoices(invoices, userId) {
  if (!invoices || !Array.isArray(invoices) || !userId) {
    console.log('saveCustomersFromInvoices: Geçersiz parametreler', { 
      invoicesLength: invoices?.length, 
      userId 
    });
    return;
  }

  console.log(`saveCustomersFromInvoices: ${invoices.length} fatura işlenecek, userId: ${userId}`);

  // User'ı bul
  const user = await UserModel.findById(userId);
  if (!user) {
    console.log('saveCustomersFromInvoices: User bulunamadı');
    return;
  }

  let processedCount = 0;
  let savedCount = 0;
  let skippedCount = 0;
  const newCustomerIds = []; // Yeni müşteri ID'lerini topla
  const processedTcNumbers = new Set(); // Bu senkronizasyonda işlenen TC numaraları

    for (const invoice of invoices) {
    try {
      processedCount++;
      
             // Hem supplier hem customer bilgilerini kontrol et
       let partyData = null;
       let partyType = '';
       
       // Hem supplier hem customer bilgilerini kontrol et
       if (invoice.accountingSupplierParty) {
         const supplier = invoice.accountingSupplierParty;
         
         // Supplier Yapı 1: party içinde
         if (supplier.party) {
           const party = supplier.party;
           partyData = {
             partyIdentification: party.partyIdentification?.[0]?.id,
             partyName: party.partyName?.[0]?.name,
             firstName: party.person?.[0]?.firstName,
             familyName: party.person?.[0]?.familyName,
             postalAddress: party.postalAddress?.[0]
           };
           partyType = 'supplier-party';
         }
         // Supplier Yapı 2: doğrudan
         else if (supplier.partyIdentification) {
           partyData = {
             partyIdentification: supplier.partyIdentification,
             partyName: supplier.partyName,
             firstName: supplier.firstName,
             familyName: supplier.familyName,
             postalAddress: null
           };
           partyType = 'supplier-direct';
         }
       }
       else if (invoice.accountingCustomerParty) {
         // Customer yapısı - her zaman doğrudan
         const customer = invoice.accountingCustomerParty;
         partyData = {
           partyIdentification: customer.partyIdentification,
           partyName: customer.partyName,
           firstName: customer.firstName,
           familyName: customer.familyName,
           postalAddress: null
         };
         partyType = 'customer';
       }
       
       if (!partyData || !partyData.partyIdentification) {
         console.log(`Fatura ${processedCount}: Party identification bulunamadı`);
         continue;
       }

       const partyIdentification = partyData.partyIdentification;
       const partyName = partyData.partyName;
      
      if (!partyIdentification) {
        console.log(`Fatura ${processedCount}: partyIdentification bulunamadı (${partyType})`);
        continue;
      }

      console.log(`Fatura ${processedCount}: Müşteri bulundu (${partyType}) - ${partyName} (${partyIdentification})`);

      // Bu senkronizasyonda zaten işlendi mi kontrol et
      if (processedTcNumbers.has(partyIdentification)) {
        console.log(`Fatura ${processedCount}: TC ${partyIdentification} bu senkronizasyonda zaten işlendi, atlanıyor`);
        skippedCount++;
        continue;
      }

      // Bu user'ın müşterileri arasında zaten var mı kontrol et
      const existingCustomer = await CustomerModel.findOne({ 
        _id: { $in: user.customers },
        partyIdentification: partyIdentification 
      });

      if (!existingCustomer) {
        // TC numarasını işlenenler listesine ekle
        processedTcNumbers.add(partyIdentification);
        // Müşteri adını belirle: partyName varsa onu kullan, yoksa firstName + familyName birleştir
        let finalPartyName = partyName;
        let displayName = partyName;
        
        if (!partyName || partyName.trim() === '') {
          // partyName boşsa firstName ve familyName'i birleştir
          const firstName = partyData.firstName || '';
          const familyName = partyData.familyName || '';
          const fullName = (firstName + ' ' + familyName).trim();
          
          if (fullName) {
            finalPartyName = fullName;
            displayName = fullName;
          } else {
            // Her ikisi de boşsa partyIdentification'ı kullan
            finalPartyName = partyIdentification;
            displayName = partyIdentification;
          }
        }
        
        console.log(`Yeni müşteri kaydediliyor: ${displayName}`);

        const newCustomer = new CustomerModel({
          TcNumber: partyIdentification,
          partyIdentification: partyIdentification,
          partyName: finalPartyName, // Güncellenmiş partyName
          name: partyData.firstName || '',
          surname: partyData.familyName || '',
          title: displayName,
          address: partyData.postalAddress?.streetName || 'Belirtilmemiş',
          town: partyData.postalAddress?.citySubdivisionName || 'Belirtilmemiş',
          city: partyData.postalAddress?.cityName || 'Belirtilmemiş',
          country: partyData.postalAddress?.country?.name || 'Türkiye',
          postCode: partyData.postalAddress?.postalZone || '',
          isFromInvoice: true
        });

        await newCustomer.save();
        savedCount++;

        // Yeni müşteri ID'sini topla (toplu ekleme için)
        newCustomerIds.push(newCustomer._id);
        
        console.log(`Müşteri kaydedildi: ${displayName} (ID: ${newCustomer._id})`);
      } else {
        const existingDisplayName = existingCustomer.partyName || 
          (existingCustomer.name + ' ' + existingCustomer.surname).trim() || 
          existingCustomer.partyIdentification;
        console.log(`Müşteri zaten mevcut: ${existingDisplayName}`);
        skippedCount++;
      }
    } catch (error) {
      // Hata olursa devam et
      console.error('Müşteri kaydedilirken hata:', error.message);
    }
  }
  
  // Tüm yeni müşterileri User'ın customers array'ine toplu olarak ekle
  if (newCustomerIds.length > 0) {
    console.log(`${newCustomerIds.length} yeni müşteri User'a ekleniyor...`);
    
    // User'ın customers array'ine yeni müşteri ID'lerini ekle
    user.customers.push(...newCustomerIds);
    await user.save();
    
    console.log(`${newCustomerIds.length} müşteri User'ın customers array'ine eklendi`);
  }
  
  console.log(`saveCustomersFromInvoices tamamlandı: ${processedCount} fatura işlendi, ${savedCount} yeni müşteri kaydedildi, ${skippedCount} müşteri atlandı (duplicate)`);
}

// Müşterilerin fatura sayılarını güncelle (basit versiyon)
export async function updateCustomerInvoiceCounts(userId) {
  try {
    console.log('Müşteri fatura sayıları güncelleniyor...');
    
    // User'ı al
    const user = await UserModel.findById(userId).populate('customers');
    if (!user) return;

    // UserInvoices'ı al
    const { default: UserInvoices } = await import('../models/UserInvoices.js');
    const userInvoices = await UserInvoices.findOne({ userId });
    if (!userInvoices) return;

    // Tüm faturaları topla
    const allInvoices = [
      ...(userInvoices.eFatura.incoming || []),
      ...(userInvoices.eFatura.outgoing || []),
      ...(userInvoices.eFatura.incomingDraft || []),
      ...(userInvoices.eFatura.outgoingDraft || []),
      ...(userInvoices.eArchive.incoming || []),
      ...(userInvoices.eArchive.outgoing || []),
      ...(userInvoices.eArchive.incomingDraft || []),
      ...(userInvoices.eArchive.outgoingDraft || [])
    ];

    // Her müşteri için fatura sayısını hesapla
    const customerCounts = new Map();

    for (const invoice of allInvoices) {
      let partyIdentification = null;

      // Faturadan müşteri kimliğini çıkar
      if (invoice.accountingSupplierParty) {
        const supplier = invoice.accountingSupplierParty;
        
        // party içinde mi yoksa doğrudan mı?
        if (supplier.party) {
          partyIdentification = supplier.party.partyIdentification?.[0]?.id;
        } else if (supplier.partyIdentification) {
          partyIdentification = supplier.partyIdentification;
        }
      } else if (invoice.accountingCustomerParty) {
        partyIdentification = invoice.accountingCustomerParty.partyIdentification;
      }

      if (partyIdentification) {
        customerCounts.set(partyIdentification, (customerCounts.get(partyIdentification) || 0) + 1);
      }
    }

    // Müşterilerin fatura sayılarını güncelle
    let updatedCount = 0;
    for (const customer of user.customers) {
      if (customer.partyIdentification) {
        const count = customerCounts.get(customer.partyIdentification) || 0;
        if (customer.invoiceCount !== count) {
          customer.invoiceCount = count;
          await customer.save();
          updatedCount++;
        }
      }
    }

    console.log(`${updatedCount} müşterinin fatura sayısı güncellendi`);
  } catch (error) {
    console.error('Müşteri fatura sayıları güncellenirken hata:', error.message);
  }
} 