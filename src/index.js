require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const fs = require('fs');
const https = require('https');
const http = require('http');
const axios = require('axios');
const bodyParser = require('body-parser');
const path = require('path');

const package = require('./package.json');
const sequelize = require('./config/db');
const usersRoutes = require('./routes/users');
const chatsRoutes = require('./routes/chats');
const messagesRoutes = require('./routes/messages');
const reactionsRoutes = require('./routes/reactions');
const userPhotosRoutes = require('./routes/userPhotos');
const cookiesRoutes = require('./routes/cookies');
require("./cron/userCronJob");
require('./models/Index');
const { initSocket } = require('./socket');

const TENOR_API_KEY = "AIzaSyCSkz9JQkns-4deH1FtoATnLjktCqkYUaA";
const apiRoot = '/api';

const HTTPS_PORT = 443;
const HTTP_PORT = 80;

const app = express();

// ─────────────────────────────────────────────
// Load SSL Certificates
let credentials = {};
try {
    const key = fs.readFileSync('/etc/ssl/certs/star.trustlinkmm.com.key', 'utf8');
    const cert = fs.readFileSync('/etc/ssl/certs/star.trustlinkmm.com.crt', 'utf8');
    // const ca = fs.readFileSync('/etc/ssl/certs/ca-bundle.pem', 'utf8'); // Optional

    credentials = {
        key,
        cert,
        // ca,
        minVersion: 'TLSv1.2',
    };
    console.log('✅ SSL certificates loaded');
} catch (err) {
    console.error('❌ SSL loading failed:', err.message);
    process.exit(1);
}

// ─────────────────────────────────────────────
// Middleware
const corsOptions = {
    origin: "http://localhost:5174",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
};

app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

app.use((req, res, next) => {
    if (req.originalUrl.startsWith('/api/uploadFile')) {
        return next(); // Skip body parsers for file upload
    }
    bodyParser.json({ limit: '200mb' })(req, res, next);
});
app.use(bodyParser.urlencoded({ extended: true, limit: '200mb' }));
app.use(cors(corsOptions));
app.use(cookieParser());
app.options('*', cors(corsOptions));

// ─────────────────────────────────────────────
// API Routes
app.use(apiRoot, usersRoutes);
app.use(apiRoot, chatsRoutes);
app.use(apiRoot, messagesRoutes);
app.use(apiRoot, reactionsRoutes);
app.use(apiRoot, userPhotosRoutes);
app.use(apiRoot, cookiesRoutes);

// ─────────────────────────────────────────────
// Tenor GIF Endpoint
app.get('/tenor/:type', async (req, res) => {
    const { type } = req.params;
    const { q = '', limit = 20 } = req.query;
    const validTypes = ['high', 'sticker'];
    if (!validTypes.includes(type)) {
        return res.status(400).json({ error: 'Invalid type. Use "high" or "sticker".' });
    }

    const endpoint = q
        ? `https://tenor.googleapis.com/v2/search?q=${q}&key=${TENOR_API_KEY}&contentfilter=${type}&limit=${limit}`
        : `https://tenor.googleapis.com/v2/trending?key=${TENOR_API_KEY}&contentfilter=${type}&limit=${limit}`;

    try {
        const response = await fetch(endpoint);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const data = await response.json();
        res.json(data);
    } catch (err) {
        console.error('Error fetching Tenor:', err);
        res.status(500).json({ error: 'Failed to fetch from Tenor API' });
    }
});

// ─────────────────────────────────────────────
// Serve Frontend
const staticPath = path.join(__dirname, '..', 'chat_application_ui', 'dist');
app.use(express.static(staticPath));

app.get('*', (req, res) => {
    console.log('Serving index.html for:', req.originalUrl);
    const filePath = path.resolve(staticPath, 'index.html');
    res.sendFile(filePath, (err) => {
        if (err) {
            console.error('Error serving index.html:', err);
            res.status(500).send('Server Error');
        }
    });
});

// ─────────────────────────────────────────────
// HTTP → HTTPS Redirect
// http.createServer((req, res) => {
//     const host = req.headers.host.split(':')[0];
//     res.writeHead(301, { "Location": `https://${host}${req.url}` });
//     res.end();
// }).listen(HTTP_PORT, () => {
//     console.log(`🔁 HTTP redirect server running on port ${HTTP_PORT}`);
// });

// ─────────────────────────────────────────────
// Start HTTPS Server After DB Sync
sequelize.sync()
    .then(() => {
        console.log('🗄️  Database synced');
        const httpsServer = https.createServer(credentials, app);
        initSocket(httpsServer);
        httpsServer.listen(HTTPS_PORT, () => {
            console.log(`🔐 HTTPS Server running at https://chat.trustlinkmm.com`);
            console.log(`Serving frontend from: ${staticPath}`);
        });
    })
    .catch((err) => {
        console.error('❌ Database sync failed:', err);
});
