import mongoose from "mongoose";

const UserInvoicesSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  
  toplamFatura: { type: Number, default: 0 },
  
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

// Pre-save hook - toplam fatura sayısını otomatik hesapla
UserInvoicesSchema.pre('save', function(next) {
  this.toplamFatura = this.calculateTotalInvoices();
  this.updatedAt = new Date();
  next();
});

const UserInvoicesModel = mongoose.model("UserInvoices", UserInvoicesSchema);
export default UserInvoicesModel; 