require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');

const reservationsRouter = require('./routes/reservations');
const commandesRouter = require('./routes/commandes');

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/restaurant-delices';

// En environnement de test, on ne tente pas de connexion réelle : les routes
// basculent automatiquement sur leur fallback JSON local (readyState reste à 0).
if (MONGODB_URI && process.env.NODE_ENV !== 'test') {
    mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 })
        .then(() => console.log('MongoDB connecté avec succès !'))
        .catch(err => {
            console.warn('MongoDB non disponible (', err.message, '). Le serveur utilisera le fallback JSON local.');
        });
}

// Middleware
// Middleware de sécurité
app.use(helmet({
    contentSecurityPolicy: false, // Désactivé pour simplifier le chargement des scripts externes si besoin
}));

// CORS restrictif — liste blanche d'origines autorisées
// En développement : localhost. En production : uniquement le(s) domaine(s) Vercel déclaré(s).
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000')
    .split(',')
    .map(origin => origin.trim());

const corsOptions = {
    origin: function (origin, callback) {
        // Autorise les requêtes sans origine (ex: Postman, apps mobiles) et les origines listées
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Origine non autorisée par la politique CORS'));
        }
    },
    methods: ['GET', 'POST', 'PATCH'],
    allowedHeaders: ['Content-Type'],
};
app.use(cors(corsOptions));

// Gestion propre des erreurs CORS : renvoyer 403 plutôt qu'une erreur 500 générique
app.use((err, req, res, next) => {
    if (err && err.message === 'Origine non autorisée par la politique CORS') {
        return res.status(403).json({ success: false, message: 'Origine non autorisée.' });
    }
    next(err);
});

app.use(express.json());

// Assainissement des données entrantes contre les injections NoSQL
// (supprime les clés commençant par '$' ou contenant '.', utilisées pour manipuler les requêtes MongoDB)
app.use(mongoSanitize());

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
    if (!process.env.ADMIN_PASSWORD) {
        console.error('ADMIN_PASSWORD non configuré côté serveur — connexion admin refusée par sécurité.');
        return res.status(500).json({ success: false, message: 'Configuration serveur incomplète.' });
    }
    const { password } = req.body;
    if (password === process.env.ADMIN_PASSWORD) {
        res.json({ success: true, message: 'Authentification réussie' });
    } else {
        res.status(401).json({ success: false, message: 'Mot de passe incorrect' });
    }
});

// Health check
app.get('/api/status', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: 'Serveur Les Délices du Maghreb actif',
        db: mongoose.connection.readyState === 1 ? 'MongoDB connecté' : 'Fallback JSON local'
    });
});

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`\nServeur démarré sur http://localhost:${PORT}`);
        console.log(`API Réservations : http://localhost:${PORT}/api/reservations`);
        console.log(`API Commandes    : http://localhost:${PORT}/api/commandes`);
        console.log(`Statut           : http://localhost:${PORT}/api/status\n`);
    });
}

module.exports = app;
