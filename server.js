const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const nodemailer = require('nodemailer');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: [
        'https://www.goldenservicebyani.com',
        'https://golden-service-by-ani.onrender.com',
        'http://www.goldenservicebyani.com',
        'http://golden-service-by-ani.onrender.com'
    ],
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));

app.use(express.json({ limit: '1mb' }));  
app.use(express.urlencoded({ extended: true }));  
app.use(express.static(path.join(__dirname)));

// Add basic request logging
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
    next();
});

// Add security headers
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    res.status(500).json({ 
        error: 'Internal server error',
        details: err.message 
    });
});

// Database setup
const db = new sqlite3.Database('bookings.db', (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the bookings database.');
});

// Create bookings table
db.run(`CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    eventType TEXT NOT NULL,
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

// Email configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Routes
app.post('/api/book', (req, res) => {
    try {
        const { name, email, phone, date, time, eventType, details } = req.body;
        
        // Log the incoming request
        console.log('Booking request received:', {
            name,
            email,
            phone,
            date,
            time,
            eventType,
            details: details || 'No details provided'
        });
        
        // Validate required fields
        if (!name || !email || !phone || !date || !time || !eventType) {
            return res.status(400).json({ 
                error: 'Please fill in all required fields' 
            });
        }

        // Insert booking into database
        const sql = `INSERT INTO bookings (name, email, phone, date, time, eventType, details)
                     VALUES (?, ?, ?, ?, ?, ?, ?)`;
        
        db.run(sql, [name, email, phone, date, time, eventType, details], function(err) {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Could not save booking' });
            }

            console.log('Booking saved successfully. ID:', this.lastID);

            // Send email to admin
            const adminMailOptions = {
                from: process.env.EMAIL_USER,
                to: process.env.ADMIN_EMAIL,
                subject: 'New Event Booking',
                text: `
                    New booking received:
                    Name: ${name}
                    Email: ${email}
                    Phone: ${phone}
                    Date: ${date}
                    Time: ${time}
                    Event Type: ${eventType}
                    Details: ${details || 'No additional details provided'}
                `
            };

            // Send email to customer
            const customerMailOptions = {
                from: process.env.EMAIL_USER,
                to: email,
                subject: 'Booking Confirmation - Golden Service by Ani',
                text: `
                    Dear ${name},

                    Thank you for booking with Golden Service by Ani!

                    Your booking details:
                    Date: ${date}
                    Time: ${time}
                    Event Type: ${eventType}

                    We will contact you shortly to discuss the details of your event.

                    Best regards,
                    Golden Service by Ani
                `
            };

            // Send emails
            Promise.all([
                transporter.sendMail(adminMailOptions),
                transporter.sendMail(customerMailOptions)
            ]).then(() => {
                res.json({ message: 'Booking successful' });
            }).catch(err => {
                console.error('Email error:', err);
                res.status(200).json({ 
                    message: 'Booking saved but email notification failed',
                    booking_id: this.lastID
                });
            });
        });
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: 'Server error occurred' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
