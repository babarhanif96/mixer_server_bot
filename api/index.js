// app.js
// require('dotenv').config();
const express = require('express');
const cors = require('cors'); // Import cors for handling cross-origin requests
const mongoose = require('mongoose');
const morgan = require('morgan'); // Import Morgan for logging
const authRoutes = require("../router/authRouter");
const feeRoutes = require("../router/feeRouter");

if (process.env.NODE_ENV !== 'PRODUCTION') {

    require('dotenv').config({ path: '../config.env' })
}

console.log(process.env.MONGO_URI)

const app = express();
const port = process.env.PORT || 4000;

// Middleware
app.use(morgan('dev'));
app.use(express.json()); // Parse JSON bodies
app.use(cors({
    credentials: true,
    origin: ['http://localhost:5173' , 'https://mixcer.vercel.app', 'https://mixer-frontend-pi.vercel.app', 'http://anon-swap.com']
}));






// Simple GET route
app.get('/', (req, res) => {
    res.send('Hello, world!');
});

// Routes
app.use('/api/mixer', authRoutes);
app.use('/api/mixcer/fees', feeRoutes);



// Start the server
mongoose.connect(process.env.MONGO_URI, {})
    .then(() => {
        console.log('MongoDB connected');
        app.listen(port, () => {
            console.log(`Server is running on http://localhost:${port}`);
        });
    })
    .catch(err => console.log(err));

module.exports = app; // Export your app
