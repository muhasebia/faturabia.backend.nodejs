import mongoose from "mongoose";
const invoiceScheme = new mongoose.Schema({
    invoiceTuru: {type: String, required: true, enum: ["giden", "gelen"]},
    invoiceTipi: {type: String, required: true, enum: ["satis", "iade", "tevkifat", "istisna", "ozelMatrah", "ihracKayitli", "konaklamaVergisi" ]},
    customerId: {type: String, required: true},
    products: [
        {
            productId: {type: String, required: true},
            quantity: {type: Number, required: true},
            price: {type: Number, required: true},
            discountRate: {type: Number, required: true, default: 0},
            discountAmount: {type: Number, required: true, default: 0},
            priceWithTax: {type: Number, required: true},
            unit: {type: String, required: true},
        }
    ],
    exceptional: {type: String},
    currency: {type: String, default: "₺"},
    exchange: {type: Number,
    invoiceNote: {type: String},
    waybillNo: {type: String},
    waybillDate: {type: Date},
    createdAt: {type: Date, default: Date.now},
    updatedAt: {type: Date, default: Date.now},
    },
});
const InvoiceModel = mongoose.model("Invoice", invoiceScheme);
export default InvoiceModel;
