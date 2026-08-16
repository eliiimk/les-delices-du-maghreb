/**
 * Tests unitaires — routes /api/reservations
 *
 * Même approche que commandes.test.js (RNCP C3.7) : MongoDB n'est pas
 * connecté dans cet environnement de test, le code applicatif bascule donc
 * automatiquement sur son fallback JSON local (comportement réel du serveur
 * en production si Atlas est temporairement indisponible — voir server.js).
 * Le module `fs` est mocké pour ne jamais toucher aux vraies données de démo.
 */

const fs = require('fs');
const request = require('supertest');

let mockStore = [];
let existsSyncSpy, readFileSyncSpy, writeFileSyncSpy;

beforeEach(() => {
    mockStore = [];
    existsSyncSpy = jest.spyOn(fs, 'existsSync').mockImplementation((filePath) => {
        if (filePath.toString().includes('reservations.json')) return true;
        return jest.requireActual('fs').existsSync(filePath);
    });
    readFileSyncSpy = jest.spyOn(fs, 'readFileSync').mockImplementation((filePath, ...args) => {
        if (filePath.toString().includes('reservations.json')) return JSON.stringify(mockStore);
        return jest.requireActual('fs').readFileSync(filePath, ...args);
    });
    writeFileSyncSpy = jest.spyOn(fs, 'writeFileSync').mockImplementation((filePath, data, ...args) => {
        if (filePath.toString().includes('reservations.json')) {
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

describe('POST /api/reservations', () => {
    test('crée une réservation valide et renvoie 201', async () => {
        const res = await request(app)
            .post('/api/reservations')
            .send({ nom: 'Karim B.', telephone: '0611223344', date: '2026-08-20', heure: '20:00', personnes: 4 });

        expect(res.statusCode).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.reservation.statut).toBe('en_attente');
        expect(res.body.reservation.nom).toBe('Karim B.');
    });

    test('rejette une réservation sans nom avec 400', async () => {
        const res = await request(app)
            .post('/api/reservations')
            .send({ telephone: '0611223344', date: '2026-08-20', heure: '20:00', personnes: 2 });

        expect(res.statusCode).toBe(400);
        expect(res.body.success).toBe(false);
    });

    test('rejette une réservation avec plusieurs champs obligatoires manquants', async () => {
        const res = await request(app)
            .post('/api/reservations')
            .send({ nom: 'Karim B.' });

        expect(res.statusCode).toBe(400);
        expect(res.body.success).toBe(false);
    });

    test('accepte un message optionnel vide', async () => {
        const res = await request(app)
            .post('/api/reservations')
            .send({ nom: 'Sofia', telephone: '0699887766', date: '2026-08-21', heure: '19:30', personnes: 2 });

        expect(res.statusCode).toBe(201);
        expect(res.body.reservation.message).toBe('');
    });

    test('convertit "personnes" en entier même transmis sous forme de chaîne', async () => {
        const res = await request(app)
            .post('/api/reservations')
            .send({ nom: 'Yanis', telephone: '0655443322', date: '2026-08-22', heure: '12:30', personnes: '6' });

        expect(res.statusCode).toBe(201);
        expect(res.body.reservation.personnes).toBe(6);
        expect(typeof res.body.reservation.personnes).toBe('number');
    });
});

describe('GET /api/reservations', () => {
    test('renvoie la liste des réservations existantes', async () => {
        mockStore = [
            { id: 1, nom: 'Client A', telephone: '0600000000', date: '2026-08-20', heure: '19:00', personnes: 2, statut: 'en_attente' }
        ];

        const res = await request(app).get('/api/reservations');

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.count).toBe(1);
    });

    test('renvoie une liste vide si aucune réservation', async () => {
        const res = await request(app).get('/api/reservations');

        expect(res.statusCode).toBe(200);
        expect(res.body.reservations).toEqual([]);
    });
});

describe('PATCH /api/reservations/:id/statut', () => {
    test('rejette un statut invalide avec 400', async () => {
        const res = await request(app)
            .patch('/api/reservations/1/statut')
            .send({ statut: 'statut_inexistant' });

        expect(res.statusCode).toBe(400);
        expect(res.body.success).toBe(false);
    });

    test('renvoie 404 si la réservation n\'existe pas', async () => {
        mockStore = [];
        const res = await request(app)
            .patch('/api/reservations/999/statut')
            .send({ statut: 'confirmée' });

        expect(res.statusCode).toBe(404);
    });

    test('met à jour le statut d\'une réservation existante vers "confirmée"', async () => {
        mockStore = [{ id: 42, nom: 'Client B', telephone: '0600000000', date: '2026-08-20', heure: '19:00', personnes: 3, statut: 'en_attente' }];

        const res = await request(app)
            .patch('/api/reservations/42/statut')
            .send({ statut: 'confirmée' });

        expect(res.statusCode).toBe(200);
        expect(res.body.reservation.statut).toBe('confirmée');
    });
});

describe('DELETE /api/reservations/:id', () => {
    test('supprime une réservation existante', async () => {
        mockStore = [{ id: 7, nom: 'Client C', telephone: '0600000000', date: '2026-08-20', heure: '19:00', personnes: 2, statut: 'en_attente' }];

        const res = await request(app).delete('/api/reservations/7');

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(mockStore).toHaveLength(0);
    });

    test('renvoie 404 si la réservation à supprimer n\'existe pas', async () => {
        mockStore = [];
        const res = await request(app).delete('/api/reservations/999');

        expect(res.statusCode).toBe(404);
    });
});
