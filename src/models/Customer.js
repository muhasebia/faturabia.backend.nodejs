import mongoose from "mongoose";

const CustomerScheme = new mongoose.Schema({
  TcNumber: { type: String, required: true },
  title: { type: String },
  name: { type: String },
  surname: { type: String },
  taxAdministiration: { type: String },
  address: { type: String, required: true },
  town: { type: String, required: true },
  city: { type: String, required: true },
  country: { type: String, required: true },
  postCode: { type: String },
  phone: { type: String },
  email: { type: String },
  fax: { type: String },
  email: { type: String },
  website: { type: String },
  note: { type: String },
  isFavorite: { type: Boolean, default: false },
  
  // Fatura entegrasyonu için
  partyIdentification: { type: String }, // Faturadaki vergi/tc no
  partyName: { type: String }, // Faturadaki firma adı
  isFromInvoice: { type: Boolean, default: false }, // Faturadan mı geldi
  invoiceCount: { type: Number, default: 0 }, // Bu müşteriye ait toplam fatura sayısı
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});
const CustomerModel = mongoose.model("Customer", CustomerScheme);
export default CustomerModel;
