import mongoose from "mongoose";


const validateTCKimlik = (tcKimlik) => {
    return /^[1-9]\d{10}$/.test(tcKimlik);
  };

const CustomerScheme = new mongoose.Schema({
    TcNumber: {
        type: String,
        required: true,
        unique: true,
        validate: {
          validator: validateTCKimlik,
          message: props => `${props.value} geçerli bir T.C. kimlik numarası değil!`
        }
      },
    title: {type: String},
    name: {type: String},
    surname: {type: String},
    taxAdministiration: {type: String},
    address: {type: String, required: true},
    town: {type: String, required: true},  
    city: {type: String, required: true},
    country: {type: String, required: true},
    postCode: {type: String},
    phone: {type: String},
    email: {type: String},
    fax: {type: String},
    email: {type: String},
    website: {type: String},
    note: {type: String},
    createdAt: {type: Date, default: Date.now},
    updatedAt: {type: Date, default: Date.now},
});
const CustomerModel = mongoose.model("Customer", CustomerScheme);
export default  CustomerModel;
