const mongoose = require('mongoose');

const ArticleSchema = new mongoose.Schema({
    name:     { type: String, required: true },
    price:    { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 }
});

const CommandeSchema = new mongoose.Schema({
    nom:       { type: String, default: 'Client' },
    telephone: { type: String, default: '' },
    email:     { type: String, default: '' },
    // origine / restaurant (optionnel) — ex: 'chez_ahmed' or 'les_delices'
    restaurant: { type: String, default: 'chez_ahmed' },
    articles:  { type: [ArticleSchema], required: true },
    total:     { type: Number, required: true },
    statut: {
        type: String,
        enum: ['nouvelle', 'en_preparation', 'prête', 'livrée'],
        default: 'nouvelle'
    }
}, { timestamps: true }); // Ajoute createdAt et updatedAt automatiquement

module.exports = mongoose.model('Commande', CommandeSchema);
