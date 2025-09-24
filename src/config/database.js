import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import mongoose from "mongoose";

// Load environment variables first
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../../.env') });

const connectDB = async () => {
    try {
        const options = {
            // Connection pool settings
            maxPoolSize: 10,
            minPoolSize: 1,
            maxIdleTimeMS: 30000,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            
            // Write/Read settings
            retryWrites: true,
            retryReads: true,
            
            // Buffer settings (bufferMaxEntries is deprecated and removed)
            bufferCommands: false,
            
            // App identification
            appName: 'mental-health-tests'
        };

        console.log('MONGODB_URI from env:', process.env.MONGODB_URI ? 'Found' : 'Not found');
        console.log('Connecting to:', process.env.MONGODB_URI || 'mongodb://localhost:27017/mental_health_tests');
       
        const conn = await mongoose.connect(
            process.env.MONGODB_URI || 'mongodb://localhost:27017/mental_health_tests',
            options
        );

        console.log(`MongoDB Connected: ${conn.connection.host}`);

       
        mongoose.connection.on('error', (err) => {
            console.error('MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('MongoDB disconnected');
        });

        mongoose.connection.on('reconnected', () => {
            console.log('MongoDB reconnected');
        });


        return conn;

    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        
        if (process.env.NODE_ENV === 'development') {
            console.log('Running in development mode without database');
            return null;
        }
        process.exit(1);
    }
};


const checkDBHealth = async () => {
    try {
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.db.admin().ping();
            return { status: 'healthy', message: 'Database connection is active' };
        } else {
            return { status: 'unhealthy', message: 'Database connection is inactive' };
        }
    } catch (error) {
        return { status: 'unhealthy', message: error.message };
    }
};

const seedDatabase = async () => {
    try {
        const { SystemAnalytics } = await import('../models/index.js');
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const existingEntry = await SystemAnalytics.findOne({ date: today });
        if (!existingEntry) {
            await SystemAnalytics.create({
                date: today,
                totalTests: 0,
                testBreakdown: {},
                languageUsage: { en: 0, ks: 0 },
                severityDistributions: {}
            });
            console.log('Initial system analytics entry created');
        }

    } catch (error) {
        console.error('Error seeding database:', error);
    }
};


const cleanupOldData = async () => {
    try {
        const { UserResult, Recommendation, UserAnalytics } = await import('../models/index.js');
        
        const OneYearsAgo = new Date();
        OneYearsAgo.setFullYear(OneYearsAgo.getFullYear() - 1);
        
        const deleteResult = await UserResult.deleteMany({
            completedAt: { $lt: OneYearsAgo }
        });
        
        if (deleteResult.deletedCount > 0) {
            console.log(`Cleaned up ${deleteResult.deletedCount} old user results`);
        }

        const expiredRecs = await Recommendation.deleteMany({
            expiresAt: { $lt: new Date() }
        });

        if (expiredRecs.deletedCount > 0) {
            console.log(`Cleaned up ${expiredRecs.deletedCount} expired recommendations`);
        }

        const optedOutCleanup = await UserAnalytics.deleteMany({
            optOutAnalytics: true
        });

        if (optedOutCleanup.deletedCount > 0) {
            console.log(`Cleaned up ${optedOutCleanup.deletedCount} opted-out user analytics`);
        }

    } catch (error) {
        console.error('Error during data cleanup:', error);
    }
};

export { 
    connectDB, 
    checkDBHealth, 
    seedDatabase, 
    cleanupOldData 
};