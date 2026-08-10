const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Commande = require('../models/Commande');
const { sendCommandeEmail, sendStatusEmail } = require('../services/notifications');

const jsonFilePath = path.join(__dirname, '../data/commandes.json');

function getLocalCommandes() {
    if (fs.existsSync(jsonFilePath)) {
        try {
            return JSON.parse(fs.readFileSync(jsonFilePath, 'utf-8'));
        } catch (e) {
            return [];
        }
    }
    return [];
}

function saveLocalCommandes(list) {
    fs.writeFileSync(jsonFilePath, JSON.stringify(list, null, 2));
}

// GET /api/commandes — Lister toutes les commandes (les plus récentes en premier)
router.get('/', async (req, res) => {
    try {
        if (mongoose.connection.readyState === 1) {
            const commandes = await Commande.find().sort({ createdAt: -1 });
            return res.json({ success: true, count: commandes.length, commandes });
        }
    } catch (err) {
        console.warn('MongoDB Query error, fallback on JSON:', err.message);
    }
    const commandes = getLocalCommandes();
    res.json({ success: true, count: commandes.length, commandes });
});

// POST /api/commandes — Passer une nouvelle commande
router.post('/', async (req, res) => {
    try {
        const { nom, telephone, email, articles, restaurant } = req.body;

        if (!articles || !Array.isArray(articles) || articles.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'La commande doit contenir au moins un article.'
            });
        }

        const total = articles.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        let nouvelle = null;

        if (mongoose.connection.readyState === 1) {
            nouvelle = new Commande({
                nom: nom || 'Client',
                telephone: telephone || '',
                email: email || '',
                restaurant: restaurant || 'chez_ahmed',
                articles,
                total,
                statut: 'nouvelle'
            });
            await nouvelle.save();
        } else {
            nouvelle = {
                id: Date.now(),
                nom: nom || 'Client',
                telephone: telephone || '',
                email: email || '',
                restaurant: restaurant || 'chez_ahmed',
                articles,
                total,
                statut: 'nouvelle',
                createdAt: new Date().toISOString()
            };
            const list = getLocalCommandes();
            list.unshift(nouvelle);
            saveLocalCommandes(list);
        }

        console.log(`Nouvelle commande — ${articles.length} article(s) — Total : ${total}€`);

        // Envoi email de confirmation (en arrière-plan, sans bloquer la réponse)
        sendCommandeEmail(nouvelle).catch(err => console.error('Email error:', err));

        res.status(201).json({
            success: true,
            message: `Commande reçue ! Total : ${total.toFixed(2)}€`,
            commande: nouvelle
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});

// PATCH /api/commandes/:id/statut — Changer le statut d'une commande
router.patch('/:id/statut', async (req, res) => {
    try {
        const { statut } = req.body;
        const validStatuts = ['nouvelle', 'en_preparation', 'prête', 'livrée'];

        if (!validStatuts.includes(statut)) {
            return res.status(400).json({ success: false, message: `Statut invalide. Valeurs: ${validStatuts.join(', ')}` });
        }

        let commande = null;
        if (mongoose.connection.readyState === 1) {
            commande = await Commande.findByIdAndUpdate(
                req.params.id,
                { statut },
                { new: true }
            );
        } else {
            const list = getLocalCommandes();
            const idx = list.findIndex(c => c.id == req.params.id || c._id == req.params.id);
            if (idx !== -1) {
                list[idx].statut = statut;
                saveLocalCommandes(list);
                commande = list[idx];
            }
        }

        if (!commande) {
            return res.status(404).json({ success: false, message: 'Commande introuvable.' });
        }

        // Envoi email de suivi au client (en arrière-plan)
        sendStatusEmail(commande, statut).catch(err => console.error('Email statut error:', err));

        res.json({ success: true, message: `Commande → ${statut}`, commande });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});

module.exports = router;
