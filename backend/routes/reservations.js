const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Reservation = require('../models/Reservation');

const jsonFilePath = path.join(__dirname, '../data/reservations.json');

function getLocalReservations() {
    if (fs.existsSync(jsonFilePath)) {
        try {
            return JSON.parse(fs.readFileSync(jsonFilePath, 'utf-8'));
        } catch (e) {
            return [];
        }
    }
    return [];
}

function saveLocalReservations(list) {
    fs.writeFileSync(jsonFilePath, JSON.stringify(list, null, 2));
}

// GET /api/reservations — Lister toutes les réservations (les plus récentes en premier)
router.get('/', async (req, res) => {
    try {
        if (mongoose.connection.readyState === 1) {
            const reservations = await Reservation.find().sort({ createdAt: -1 });
            return res.json({ success: true, count: reservations.length, reservations });
        }
    } catch (err) {
        console.warn('MongoDB Query error, fallback on JSON:', err.message);
    }
    const reservations = getLocalReservations();
    res.json({ success: true, count: reservations.length, reservations });
});

// POST /api/reservations — Créer une nouvelle réservation
router.post('/', async (req, res) => {
    try {
        const { nom, telephone, date, heure, personnes, message } = req.body;

        if (!nom || !telephone || !date || !heure || !personnes) {
            return res.status(400).json({
                success: false,
                message: 'Champs obligatoires manquants : nom, telephone, date, heure, personnes.'
            });
        }

        let nouvelle = null;

        if (mongoose.connection.readyState === 1) {
            nouvelle = new Reservation({
                nom,
                telephone,
                date,
                heure,
                personnes: parseInt(personnes),
                message: message || '',
                statut: 'en_attente'
            });
            await nouvelle.save();
        } else {
            nouvelle = {
                id: Date.now(),
                nom,
                telephone,
                date,
                heure,
                personnes: parseInt(personnes),
                message: message || '',
                statut: 'en_attente',
                createdAt: new Date().toISOString()
            };
            const list = getLocalReservations();
            list.unshift(nouvelle);
            saveLocalReservations(list);
        }

        console.log(`📅 Nouvelle réservation : ${nom} — ${date} à ${heure} pour ${personnes} pers.`);

        res.status(201).json({
            success: true,
            message: `Réservation confirmée pour ${nom} le ${date} à ${heure} !`,
            reservation: nouvelle
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});

// PATCH /api/reservations/:id/statut — Changer le statut d'une réservation
router.patch('/:id/statut', async (req, res) => {
    try {
        const { statut } = req.body;
        const validStatuts = ['en_attente', 'confirmée', 'annulée'];

        if (!validStatuts.includes(statut)) {
            return res.status(400).json({ success: false, message: 'Statut invalide.' });
        }

        let reservation = null;

        if (mongoose.connection.readyState === 1) {
            reservation = await Reservation.findByIdAndUpdate(
                req.params.id,
                { statut },
                { new: true }
            );
        } else {
            const list = getLocalReservations();
            const idx = list.findIndex(r => r.id == req.params.id || r._id == req.params.id);
            if (idx !== -1) {
                list[idx].statut = statut;
                saveLocalReservations(list);
                reservation = list[idx];
            }
        }

        if (!reservation) {
            return res.status(404).json({ success: false, message: 'Réservation introuvable.' });
        }

        res.json({ success: true, message: `Réservation → ${statut}`, reservation });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});

// DELETE /api/reservations/:id — Supprimer une réservation
router.delete('/:id', async (req, res) => {
    try {
        let reservation = null;

        if (mongoose.connection.readyState === 1) {
            reservation = await Reservation.findByIdAndDelete(req.params.id);
        } else {
            const list = getLocalReservations();
            const idx = list.findIndex(r => r.id == req.params.id || r._id == req.params.id);
            if (idx !== -1) {
                reservation = list[idx];
                list.splice(idx, 1);
                saveLocalReservations(list);
            }
        }

        if (!reservation) {
            return res.status(404).json({ success: false, message: 'Réservation introuvable.' });
        }
        res.json({ success: true, message: 'Réservation supprimée.' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});

module.exports = router;
