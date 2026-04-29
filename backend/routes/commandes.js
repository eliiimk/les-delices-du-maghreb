const express = require('express');
const router = express.Router();
const Commande = require('../models/Commande');

// GET /api/commandes — Lister toutes les commandes (les plus récentes en premier)
router.get('/', async (req, res) => {
    try {
        const commandes = await Commande.find().sort({ createdAt: -1 });
        res.json({ success: true, count: commandes.length, commandes });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Erreur lecture des commandes.' });
    }
});

// POST /api/commandes — Passer une nouvelle commande
router.post('/', async (req, res) => {
    try {
        const { nom, telephone, articles } = req.body;

        if (!articles || !Array.isArray(articles) || articles.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'La commande doit contenir au moins un article.'
            });
        }

        const total = articles.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        const nouvelle = new Commande({
            nom: nom || 'Client',
            telephone: telephone || '',
            articles,
            total,
            statut: 'nouvelle'
        });

        await nouvelle.save();
        console.log(`🛒 Nouvelle commande — ${articles.length} article(s) — Total : ${total}€`);

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

        const commande = await Commande.findByIdAndUpdate(
            req.params.id,
            { statut },
            { new: true }
        );

        if (!commande) {
            return res.status(404).json({ success: false, message: 'Commande introuvable.' });
        }

        res.json({ success: true, message: `Commande → ${statut}`, commande });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});

module.exports = router;
