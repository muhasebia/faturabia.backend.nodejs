import {port, env} from './src/config/env/index.js';   
import mongoose from 'mongoose';
import app from './src/app.js';

const uri = "mongodb+srv://iscan:iscan@faturabia.mkcvi8b.mongodb.net/?appName=faturabia";

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
        await app.listen(port);
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