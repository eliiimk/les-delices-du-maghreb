require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');

const reservationsRouter = require('./routes/reservations');
const commandesRouter = require('./routes/commandes');

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/restaurant-delices';

mongoose.connect(MONGODB_URI)
    .then(() => console.log('✅ MongoDB connecté avec succès !'))
    .catch(err => {
        console.error('❌ Erreur de connexion MongoDB :', err.message);
        process.exit(1);
    });

// Middleware
app.use(cors());
app.use(express.json());

// Serve frontend statically
app.use(express.static(path.join(__dirname, '../frontend')));
app.use('/', express.static(path.join(__dirname, '../')));

// API Routes
app.use('/api/reservations', reservationsRouter);
app.use('/api/commandes', commandesRouter);

// Health check
app.get('/api/status', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: 'Serveur Les Délices du Maghreb actif ✅',
        db: mongoose.connection.readyState === 1 ? 'MongoDB connecté' : 'MongoDB déconnecté'
    });
});

app.listen(PORT, () => {
    console.log(`\n🍽️  Serveur démarré sur http://localhost:${PORT}`);
    console.log(`📋  API Réservations : http://localhost:${PORT}/api/reservations`);
    console.log(`🛒  API Commandes    : http://localhost:${PORT}/api/commandes`);
    console.log(`💚  Statut           : http://localhost:${PORT}/api/status\n`);
});
