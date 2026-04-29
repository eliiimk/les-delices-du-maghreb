const express = require('express');
const router = express.Router();
const Reservation = require('../models/Reservation');

// GET /api/reservations — Lister toutes les réservations (les plus récentes en premier)
router.get('/', async (req, res) => {
    try {
        const reservations = await Reservation.find().sort({ createdAt: -1 });
        res.json({ success: true, count: reservations.length, reservations });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Erreur lecture des réservations.' });
    }
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

        const nouvelle = new Reservation({
            nom,
            telephone,
            date,
            heure,
            personnes: parseInt(personnes),
            message: message || '',
            statut: 'en_attente'
        });

        await nouvelle.save();
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

        const reservation = await Reservation.findByIdAndUpdate(
            req.params.id,
            { statut },
            { new: true }
        );

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
        const reservation = await Reservation.findByIdAndDelete(req.params.id);
        if (!reservation) {
            return res.status(404).json({ success: false, message: 'Réservation introuvable.' });
        }
        res.json({ success: true, message: 'Réservation supprimée.' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});

module.exports = router;
