const mongoose = require('mongoose');

const ReservationSchema = new mongoose.Schema({
    nom:       { type: String, required: true },
    telephone: { type: String, required: true },
    date:      { type: String, required: true },
    heure:     { type: String, required: true },
    personnes: { type: Number, required: true, min: 1 },
    message:   { type: String, default: '' },
    statut: {
        type: String,
        enum: ['en_attente', 'confirmée', 'annulée'],
        default: 'en_attente'
    }
}, { timestamps: true }); // Ajoute createdAt et updatedAt automatiquement

module.exports = mongoose.model('Reservation', ReservationSchema);
