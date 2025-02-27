import mongoose from "mongoose";

const UserScheme = new mongoose.Schema({
  nesApiKey: { type: String, default: null },
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  bankName: { type: String },
  IBAN: { type: Number },
  taxAdministiration: { type: String },
  title: { type: String },
  mersisNumber: {type: String},
  registirationNumber: {type: String},
  street: { type: String},
  apartmentName: { type: Number},
  apartmentNo: { type: Number},
  doorNumber: { type: Number},
  neighborhood: { type: String},
  town: { type: String},
  city: { type: String},
  postCode: { type: String},
  country: { type: String},
  phone: { type: Number},
  fax: { type: Number},
  website: { type: String},
  businnesCenter: {type: String},
  customers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Customer' }],
  products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  invoices: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' }],
  createdAt: {type: Date, default: Date.now},
  updatedAt: {type: Date, default: Date.now},
});

const UserModel = mongoose.model("User", UserScheme);
export default UserModel;

