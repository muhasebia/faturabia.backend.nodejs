import mongoose from "mongoose";

const UserInvoicesSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  
  toplamFatura: { type: Number, default: 0 },
  
  // Fatura verilerinde nesInvoiceId alanı otomatik olarak eklenir (NES API'den gelen benzersiz ID)
  eFatura: {
    incoming: [{ type: mongoose.Schema.Types.Mixed }],
    outgoing: [{ type: mongoose.Schema.Types.Mixed }],
    incomingDraft: [{ type: mongoose.Schema.Types.Mixed }],
    outgoingDraft: [{ type: mongoose.Schema.Types.Mixed }]
  },
  
  eArchive: {
    incoming: [{ type: mongoose.Schema.Types.Mixed }],
    outgoing: [{ type: mongoose.Schema.Types.Mixed }],
    incomingDraft: [{ type: mongoose.Schema.Types.Mixed }],
    outgoingDraft: [{ type: mongoose.Schema.Types.Mixed }]
  },
  
  lastFetchDate: {
    incomingInvoices: { type: Date },
    outgoingInvoices: { type: Date },
    draftInvoices: { type: Date },
    eArchiveInvoices: { type: Date },
    eArchiveDraftInvoices: { type: Date }
  },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Toplam fatura sayısını hesaplayan method
UserInvoicesSchema.methods.calculateTotalInvoices = function() {
  const eFaturaCount = 
    (this.eFatura.incoming?.length || 0) +
    (this.eFatura.outgoing?.length || 0) +
    (this.eFatura.incomingDraft?.length || 0) +
    (this.eFatura.outgoingDraft?.length || 0);
    
  const eArchiveCount = 
    (this.eArchive.incoming?.length || 0) +
    (this.eArchive.outgoing?.length || 0) +
    (this.eArchive.incomingDraft?.length || 0) +
    (this.eArchive.outgoingDraft?.length || 0);
    
  return eFaturaCount + eArchiveCount;
};

// NES fatura ID'si ile fatura bulma method'u
UserInvoicesSchema.methods.findInvoiceByNesId = function(nesInvoiceId) {
  const allArrays = [
    { array: this.eFatura.incoming, type: 'eFatura', subType: 'incoming' },
    { array: this.eFatura.outgoing, type: 'eFatura', subType: 'outgoing' },
    { array: this.eFatura.incomingDraft, type: 'eFatura', subType: 'incomingDraft' },
    { array: this.eFatura.outgoingDraft, type: 'eFatura', subType: 'outgoingDraft' },
    { array: this.eArchive.incoming, type: 'eArchive', subType: 'incoming' },
    { array: this.eArchive.outgoing, type: 'eArchive', subType: 'outgoing' },
    { array: this.eArchive.incomingDraft, type: 'eArchive', subType: 'incomingDraft' },
    { array: this.eArchive.outgoingDraft, type: 'eArchive', subType: 'outgoingDraft' }
  ];

  for (const { array, type, subType } of allArrays) {
    const invoice = array?.find(inv => 
      inv.nesInvoiceId === nesInvoiceId || 
      inv.uuid === nesInvoiceId || 
      inv.id === nesInvoiceId
    );
    
    if (invoice) {
      return {
        invoice,
        location: { type, subType }
      };
    }
  }
  
  return null;
};

// Pre-save hook - toplam fatura sayısını otomatik hesapla
UserInvoicesSchema.pre('save', function(next) {
  this.toplamFatura = this.calculateTotalInvoices();
  this.updatedAt = new Date();
  next();
});

const UserInvoicesModel = mongoose.model("UserInvoices", UserInvoicesSchema);
export default UserInvoicesModel; 