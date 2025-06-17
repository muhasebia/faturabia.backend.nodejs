import mongoose from "mongoose";

const InvoiceSchema = new mongoose.Schema({
  // Temel bilgiler
  uuid: { type: String, required: true, unique: true },
  documentNumber: { type: String },
  documentDate: { type: Date },
  
  // Fatura türü - gelen/giden/taslak ayırımı
  type: { type: String, enum: ['incoming', 'outgoing', 'draft'], required: true },
  
  // API'den gelen tüm veri
  rawData: { type: mongoose.Schema.Types.Mixed, required: true },
  
  // Kullanıcı ilişkisi
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Sistem bilgileri
  fetchedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const InvoiceModel = mongoose.model("Invoice", InvoiceSchema);
export default InvoiceModel; 