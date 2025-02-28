import mongoose from "mongoose";
const productScheme = new mongoose.Schema({
    name: {type: String, required: true},
    unit: {type: String, required: true},
    currency: {type: String, required: true, default: "TRY"},
    taxRate: {type: Number, required: true, default: 0, enum : [0, 1, 8, 10, 18, 20]},
    price: {type: Number, required: true, default: 0},
    priceWithTax: {type: Number, required: true, default: 0},
    code: {type: String},
    stock: {type: Number, default: 0},
    createdAt: {type: Date, default: Date.now},
    updatedAt: {type: Date, default: Date.now},
});
const ProductModel = mongoose.model("Product", productScheme);
export default ProductModel;
