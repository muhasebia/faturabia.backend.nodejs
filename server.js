import {port, env} from './src/config/env/index.js';   
import mongoose from 'mongoose';
import app from './src/app.js';
import dotenv from 'dotenv';

dotenv.config();
const uri = "mongodb://admin:Azat.eser123%21@92.249.61.156:27017/faturabia_dev?directConnection=true&authSource=admin"

async function connectDB() {
    try{
        await mongoose.connect(uri);
        console.log('🥂 Connected to MongoDB');
    } catch (error) {
        console.error(`❌ Error connecting to MongoDB: ${error.message}`);
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