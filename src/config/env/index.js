import dotenv from 'dotenv';

dotenv.config();

const port = process.env.port || 3202;
const uri = process.env.MONGODB_URI;
const secret_key = process.env.SECRET_KEY;

const smtp_host = process.env.SMTP_HOST;
const smtp_port = process.env.SMTP_PORT;
const smtp_secure = process.env.SMTP_SECURE;
const smtp_user = process.env.SMTP_USER;
const smtp_pass = process.env.SMTP_PASS;
const smtp_from = process.env.SMTP_FROM;


const env = {
    development: process.env.NODE_ENV === 'development',
    production: process.env.NODE_ENV === 'production',
};



export { port, env, uri, secret_key, smtp_host, smtp_port, smtp_secure, smtp_user, smtp_pass, smtp_from };

