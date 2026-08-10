require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const reservationsRouter = require('./routes/reservations');
const commandesRouter = require('./routes/commandes');

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/restaurant-delices';

if (MONGODB_URI) {
    mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 })
        .then(() => console.log('✅ MongoDB connecté avec succès !'))
        .catch(err => {
            console.warn('⚠️ MongoDB non disponible (', err.message, '). Le serveur utilisera le fallback JSON local.');
        });
}

// Middleware
// Middleware de sécurité
app.use(helmet({
    contentSecurityPolicy: false, // Désactivé pour simplifier le chargement des scripts externes si besoin
}));
app.use(cors());
app.use(express.json());

// Protection contre les abus (Rate Limiting)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limite chaque IP à 100 requêtes par fenêtre
    message: 'Trop de requêtes, veuillez réessayer plus tard.'
});
app.use('/api/', limiter);

// Serve frontend statically
app.use(express.static(path.join(__dirname, '../frontend')));
app.use('/', express.static(path.join(__dirname, '../')));

// API Routes
app.use('/api/reservations', reservationsRouter);
app.use('/api/commandes', commandesRouter);

// Route de connexion Admin sécurisée
app.post('/api/admin/login', (req, res) => {
    const { password } = req.body;
    if (password === (process.env.ADMIN_PASSWORD || 'admin123')) {
        res.json({ success: true, message: 'Authentification réussie' });
    } else {
        res.status(401).json({ success: false, message: 'Mot de passe incorrect' });
    }
});

// Health check
app.get('/api/status', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: 'Serveur Les Délices du Maghreb actif ✅',
        db: mongoose.connection.readyState === 1 ? 'MongoDB connecté' : 'Fallback JSON local'
    });
});

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`\n🍽️  Serveur démarré sur http://localhost:${PORT}`);
        console.log(`📋  API Réservations : http://localhost:${PORT}/api/reservations`);
        console.log(`🛒  API Commandes    : http://localhost:${PORT}/api/commandes`);
        console.log(`💚  Statut           : http://localhost:${PORT}/api/status\n`);
    });
}

module.exports = app;
