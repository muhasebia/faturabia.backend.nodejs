import {port, env} from './src/config/env/index.js';   
import mongoose from 'mongoose';
import app from './src/app.js';
import dotenv from 'dotenv';

dotenv.config();

 // DEVELOPMENT
// const uri = "mongodb+srv://azatesser:S8moLZbgcCOASpOt@developer.ffzdqhy.mongodb.net/"

PRODUCTION
const uri = "mongodb+srv://azatesser:kmcp6IfIP3ZdrFAl@prod.l2fgnjn.mongodb.net/"


async function connectDB() {
    try{
        await mongoose.connect(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        })
        console.log('🥂 Connected to MongoDB');
    } catch (error) {
        console.error(`❌ Error connecting to MongoDB: ${error.message}`);
        process.exit(1);
    }
}

const start = async () => {
    try {
        await connectDB();
        app.listen(port);
        if(env.development){
            console.log(`🚀 Server running at http://localhost:${port}`);
        }else if(env.production){
            console.log(`🚀 Server running at http://faturabia.muhasebia.com:${port}`);
        }
    } catch (error) {
        console.error(`❌ Error starting server: ${error.message}`);
    }
}

start();