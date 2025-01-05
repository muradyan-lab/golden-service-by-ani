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
    origin: ['https://www.goldenservicebyani.com', 'https://golden-service-by-ani.onrender.com'],
    methods: ['GET', 'POST'],
    credentials: true
}));
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Add security headers
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
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
    const { name, email, phone, date, time, eventType, details } = req.body;
    
    // Validate required fields
    if (!name || !email || !phone || !date || !time || !eventType) {
        console.error('Missing required fields:', { name, email, phone, date, time, eventType });
        return res.status(400).json({ 
            error: 'All fields are required except details' 
        });
    }

    console.log('Received booking request:', { name, email, phone, date, time, eventType, details });
    
    // Insert booking into database
    const sql = `INSERT INTO bookings (name, email, phone, date, time, eventType, details)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`;
    
    db.run(sql, [name, email, phone, date, time, eventType, details], function(err) {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: err.message });
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
        try {
            transporter.sendMail(adminMailOptions, (error) => {
                if (error) console.error('Admin email error:', error);
                else console.log('Admin notification email sent');
            });
            
            transporter.sendMail(customerMailOptions, (error) => {
                if (error) console.error('Customer email error:', error);
                else console.log('Customer confirmation email sent');
            });
        } catch (emailError) {
            console.error('Email sending error:', emailError);
            // Continue with success response even if email fails
        }

        res.json({
            message: 'Booking successful',
            bookingId: this.lastID
        });
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
