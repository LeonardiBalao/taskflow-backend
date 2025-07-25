import mongoose from 'mongoose';

export const connectDatabase = async (): Promise<void> => {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error('MONGO_URI environment variable is required');
        }

        const options = {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            bufferCommands: false,
        };

        await mongoose.connect(process.env.MONGO_URI, options);
        console.log('✅ Database connected successfully');
    } catch (error) {
        console.error('❌ Database connection failed:', error);
        throw error; // Re-throw to be caught by startServer
    }
};

// Event listeners for mongoose connection
mongoose.connection.on('disconnected', () => {
    console.log('⚠️ Database disconnected');
});

mongoose.connection.on('error', (error) => {
    console.error('❌ Database error:', error);
});

mongoose.connection.on('reconnected', () => {
    console.log('🔄 Database reconnected');
});

// Graceful shutdown
process.on('SIGINT', async () => {
    try {
        await mongoose.connection.close();
        console.log('📴 Database connection closed through app termination');
        process.exit(0);
    } catch (error) {
        console.error('Error during database disconnection:', error);
        process.exit(1);
    }
});

process.on('SIGTERM', async () => {
    try {
        await mongoose.connection.close();
        console.log('📴 Database connection closed through app termination');
        process.exit(0);
    } catch (error) {
        console.error('Error during database disconnection:', error);
        process.exit(1);
    }
});