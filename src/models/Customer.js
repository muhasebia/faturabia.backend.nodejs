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
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});
const CustomerModel = mongoose.model("Customer", CustomerScheme);
export default CustomerModel;
