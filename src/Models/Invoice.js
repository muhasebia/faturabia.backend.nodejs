import mongoose from "mongoose";
const billScheme = new mongoose.Schema({
    billType: {type: String, required: true, default: "Satış"},
    currency: {type: String, required: true, default: TL},
    exchangeRate: {type: Number, required: true, default: 0},
    billNote: {type: String},
    waybillNumber: {type: Number},
    wayBillDate: {type: Date},
    createdAt: {type: Date, default: Date.now},
    updatedAt: {type: Date, default: Date.now},

});
const BillModel = mongoose.model("Bill", billScheme);
export default BillModel;
