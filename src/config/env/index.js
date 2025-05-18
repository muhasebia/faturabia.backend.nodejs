import dotenv from 'dotenv';

dotenv.config();

const port = process.env.port || 3202;
const uri = process.env.MONGODB_URI;
const secret_key = process.env.SECRET_KEY;

const env = {
    development: process.env.NODE_ENV === 'development',
    production: process.env.NODE_ENV === 'production',
};



export { port, env, uri, secret_key };

