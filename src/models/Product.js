import mongoose from "mongoose";
const productScheme = new mongoose.Schema({
    name: {type: String, required: true},
    amount: {type: Number, required: true},
    unit: {type: String, required: true},
    price: {type: Number, required: true, default: 0},
    priceWithTax: {type: Number, required: true, default: 0},
    discountRate: {type: Number, required: true, default: 0},   
    discountAmount: {type: Number, required: true, default: 0},
    taxRate: {type: Number, required: true, default: 0, enum : [0, 1, 10, 20]},
    taxAmount: {type: Number, required: true, default: 0},
    total: {type: Number, required: true, default: 0},
    totalWithTax: {type: Number, required: true, default: 0},
    createdAt: {type: Date, default: Date.now},
    updatedAt: {type: Date, default: Date.now},
});
const ProductModel = mongoose.model("Product", productScheme);
export default ProductModel;
