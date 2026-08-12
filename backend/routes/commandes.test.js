/**
 * Tests unitaires — routes /api/commandes
 *
 * MongoDB n'est pas connecté dans cet environnement de test : le code applicatif
 * bascule donc automatiquement sur son fallback JSON local (comportement réel du
 * serveur en production si Atlas est temporairement indisponible — voir server.js).
 * Le module `fs` est mocké pour ne jamais toucher aux vraies données de démo.
 */

const fs = require('fs');
const request = require('supertest');

// Simule un fichier JSON vide en mémoire pour chaque test.
// On cible uniquement les 3 fonctions utilisées par le fallback JSON (existsSync,
// readFileSync, writeFileSync) via des spies, plutôt que de mocker tout le module `fs` :
// un mock global casserait le serveur de fichiers statiques d'Express, qui utilise
// aussi `fs` en interne pour répondre aux requêtes GET.
let mockStore = [];
let existsSyncSpy, readFileSyncSpy, writeFileSyncSpy;

beforeEach(() => {
    mockStore = [];
    existsSyncSpy = jest.spyOn(fs, 'existsSync').mockImplementation((filePath) => {
        if (filePath.toString().includes('commandes.json')) return true;
        return jest.requireActual('fs').existsSync(filePath);
    });
    readFileSyncSpy = jest.spyOn(fs, 'readFileSync').mockImplementation((filePath, ...args) => {
        if (filePath.toString().includes('commandes.json')) return JSON.stringify(mockStore);
        return jest.requireActual('fs').readFileSync(filePath, ...args);
    });
    writeFileSyncSpy = jest.spyOn(fs, 'writeFileSync').mockImplementation((filePath, data, ...args) => {
        if (filePath.toString().includes('commandes.json')) {
            mockStore = JSON.parse(data);
            return;
        }
        return jest.requireActual('fs').writeFileSync(filePath, data, ...args);
    });
});

afterEach(() => {
    existsSyncSpy.mockRestore();
    readFileSyncSpy.mockRestore();
    writeFileSyncSpy.mockRestore();
});

const app = require('../server');

describe('POST /api/commandes', () => {
    test('crée une commande valide et renvoie 201', async () => {
        const res = await request(app)
            .post('/api/commandes')
            .send({
                nom: 'Test Client',
                telephone: '0600000000',
                email: 'test@example.com',
                restaurant: 'chez_ahmed',
                articles: [{ name: 'Tacos M', price: 8.5, quantity: 2 }]
            });

        expect(res.statusCode).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.commande.total).toBe(17); // 8.5 * 2
        expect(res.body.commande.statut).toBe('nouvelle');
    });

    test('rejette une commande sans articles avec 400', async () => {
        const res = await request(app)
            .post('/api/commandes')
            .send({ nom: 'Test Client', articles: [] });

        expect(res.statusCode).toBe(400);
        expect(res.body.success).toBe(false);
    });

    test('rejette une commande où articles est absent avec 400', async () => {
        const res = await request(app)
            .post('/api/commandes')
            .send({ nom: 'Test Client' });

        expect(res.statusCode).toBe(400);
        expect(res.body.success).toBe(false);
    });

    test('calcule correctement le total sur plusieurs articles', async () => {
        const res = await request(app)
            .post('/api/commandes')
            .send({
                nom: 'Test Client',
                articles: [
                    { name: 'Tajine Poulet', price: 14.5, quantity: 1 },
                    { name: 'Couscous Royal', price: 16, quantity: 2 }
                ]
            });

        expect(res.statusCode).toBe(201);
        expect(res.body.commande.total).toBe(46.5); // 14.5 + 32
    });

    test('applique "chez_ahmed" comme restaurant par défaut si non précisé', async () => {
        const res = await request(app)
            .post('/api/commandes')
            .send({ articles: [{ name: 'Naan', price: 3, quantity: 1 }] });

        expect(res.statusCode).toBe(201);
        expect(res.body.commande.restaurant).toBe('chez_ahmed');
    });
});

describe('GET /api/commandes', () => {
    test('renvoie la liste des commandes existantes', async () => {
        mockStore = [
            { id: 1, nom: 'Client A', articles: [], total: 10, statut: 'nouvelle' }
        ];

        const res = await request(app).get('/api/commandes');

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.count).toBe(1);
    });

    test('renvoie une liste vide si aucune commande', async () => {
        const res = await request(app).get('/api/commandes');

        expect(res.statusCode).toBe(200);
        expect(res.body.commandes).toEqual([]);
    });
});

describe('PATCH /api/commandes/:id/statut', () => {
    test('rejette un statut invalide avec 400', async () => {
        const res = await request(app)
            .patch('/api/commandes/1/statut')
            .send({ statut: 'statut_inexistant' });

        expect(res.statusCode).toBe(400);
        expect(res.body.success).toBe(false);
    });

    test('renvoie 404 si la commande n\'existe pas', async () => {
        mockStore = [];
        const res = await request(app)
            .patch('/api/commandes/999/statut')
            .send({ statut: 'en_preparation' });

        expect(res.statusCode).toBe(404);
    });

    test('met à jour le statut d\'une commande existante', async () => {
        mockStore = [{ id: 42, nom: 'Client B', articles: [], total: 20, statut: 'nouvelle' }];

        const res = await request(app)
            .patch('/api/commandes/42/statut')
            .send({ statut: 'en_preparation' });

        expect(res.statusCode).toBe(200);
        expect(res.body.commande.statut).toBe('en_preparation');
    });
});
