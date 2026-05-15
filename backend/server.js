require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

// Import routes
const authRoutes = require('./routes/auth');
const menuRoutes = require('./routes/menu');
const orderRoutes = require('./routes/orders');
const reportRoutes = require('./routes/reports');
const categoryRoutes = require('./routes/categories');
const offerRoutes = require('./routes/offers');
const heroRoutes = require('./routes/hero');
const customerRoutes = require('./routes/customers');
const settingsRoutes = require('./routes/settings');
const startOrderHistoryCleanupJob = require('./jobs/orderHistoryCleanup');

const app = express();
const server = require('http').createServer(app);

// --- UPDATED SOCKET.IO CORS ---
const io = require('socket.io')(server, {
  cors: {
    origin: [
      'http://localhost:5173', 
      'http://127.0.0.1:5173', 
      'https://nanban-restaurant.vercel.app' // Unga Vercel URL
    ],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Make io accessible in our routes
app.set('io', io);

// --- UPDATED EXPRESS CORS ---
app.use(cors({
  origin: [
    'http://localhost:5173', 
    'http://127.0.0.1:5173', 
    'https://nanban-restaurant.vercel.app' // Unga Vercel URL
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- DATABASE CONNECTION CHECK ---
// Render-la neenga MONGO_URI nu kuduthuruntha ithu correct-ah connect aagum
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/food_ordering';

const startServer = async () => {
    try {
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Connected to MongoDB');

        // Ensure default admin exists only after DB is ready
        await createDefaultAdmin();

        // Initialize the background cron jobs after DB connects
        startOrderHistoryCleanupJob();

        const PORT = process.env.PORT || 5000;
        server.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });

        // Socket.io connection logging
        io.on('connection', (socket) => {
            console.log('Client connected:', socket.id);
            socket.on('disconnect', () => {
                console.log('Client disconnected:', socket.id);
            });
        });
    } catch (err) {
        console.error('MongoDB connection error:', err);
    }
};

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/hero', heroRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/settings', settingsRoutes);

// Default admin user setup
const Admin = require('./models/Admin');
const createDefaultAdmin = async () => {
    try {
        const defaultUsername = process.env.ADMIN_USERNAME || 'admin';
        const defaultPassword = process.env.ADMIN_PASSWORD || 'admin123';

        // Cleanup legacy accounts
        if (defaultUsername !== 'admin') {
            await Admin.deleteMany({ username: 'admin' });
        }
        if (defaultUsername !== 'nanban_admin') {
            await Admin.deleteMany({ username: 'nanban_admin' });
        }

        const adminExists = await Admin.findOne({ username: defaultUsername });
        if (!adminExists) {
            const admin = new Admin({
                username: defaultUsername,
                password: defaultPassword 
            });
            await admin.save();
            console.log(`Default admin user created with username "${defaultUsername}"`);
        } else {
            adminExists.password = defaultPassword;
            await adminExists.save();
            console.log(`Default admin user "${defaultUsername}" verified/updated.`);
        }
    } catch (err) {
        console.error('Error creating default admin:', err);
    }
};

// Kick off startup
startServer();