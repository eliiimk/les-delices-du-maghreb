# Les Délices du Maghreb & Chez Ahmed — Site Multi-Restaurant

Plateforme web multi-restaurant avec portail d'accueil commun, système de commande en ligne et gestion des réservations.

---

## Structure du Projet

```
├── index.html                      ← Portail d'entrée (split-screen)
├── frontend/
│   ├── pages/
│   │   ├── delices.html            ← Accueil Les Délices du Maghreb
│   │   ├── menu.html               ← Carte complète Les Délices du Maghreb
│   │   ├── galerie.html            ← Galerie photos
│   │   ├── reservation.html        ← Formulaire de réservation
│   │   ├── commander.html          ← Page de commande Les Délices
│   │   ├── contact.html            ← Contact Les Délices
│   │   ├── ahmed.html              ← Carte Chez Ahmed (fast-food)
│   │   ├── commander-ahmed.html    ← Page de commande Chez Ahmed
│   │   ├── contact-ahmed.html      ← Contact Chez Ahmed
│   │   └── admin.html              ← Interface d'administration
│   ├── css/
│   │   ├── delices.css             ← Styles Les Délices du Maghreb
│   │   ├── ahmed.css               ← Styles Chez Ahmed (fast-food)
│   │   └── style.css               ← Styles du portail index
│   ├── js/
│   │   ├── cart.js                 ← Logique panier (localStorage)
│   │   └── script.js
│   └── img/                        ← Photos des plats et assets
└── backend/
    ├── server.js                   ← Serveur Express
    ├── routes/
    │   ├── reservations.js         ← API POST /api/reservations
    │   └── commandes.js            ← API POST /api/commandes
    ├── data/
    │   ├── reservations.json       ← Stockage réservations
    │   └── commandes.json          ← Stockage commandes
    └── package.json
```

---

## Fonctionnalités

### Les Délices du Maghreb
- Carte complète : Entrées, Tajines, Spécialités, Grillades, Couscous, Poissons, Desserts, Boissons
- Formulaire de réservation en ligne (envoi vers l'API backend)
- Système de commande en ligne avec panier persistant (localStorage)
- Choix **seul ou en menu** (+ frites & boisson) pour les produits compatibles

### Chez Ahmed — Fast-Food
- Carte complète : Sandwiches & Grecs, **Tacos**, Burgers, Assiettes, Wings/Tenders/Nuggets, Panini, Menu Enfant, Naans & Galettes, Formules
- Système de commande avec panier partagé (même localStorage)
- Choix **seul ou en menu** pour les sandwiches et burgers
- **Personnalisation des Tacos en 2 étapes** :
  - Étape 1 — Choix de la/les viande(s) selon le format :
    - Tacos M → 1 viande
    - Tacos L → 2 viandes
    - Tacos X → 3 viandes
    - Viandes disponibles : **Bœuf haché**, **Poulet**, **Merguez**
  - Étape 2 — Choix de la sauce parmi :
    - Sauce Burger, Sauce Algérienne, Sauce Fromagère, Sauce Samourai, Sauce Harissa
  - Le détail complet apparaît dans le panier (ex : `Tacos L — Bœuf haché + Poulet — Sauce Samourai`)

### Panier & Commandes
- Panier persistant via `localStorage` (survit au rechargement de page)
- Toast de confirmation à chaque ajout
- Modification des quantités sur la page de commande
- Envoi de la commande au backend (POST `/api/commandes`)

---

## Lancer le projet

### Frontend uniquement
Ouvrir `index.html` dans le navigateur (aucune installation requise).

### Avec le backend (Node.js requis)

```bash
cd backend
npm install
node server.js
```

Le serveur tourne sur `http://localhost:3000`.  
Le frontend s'ouvre en ouvrant `index.html` dans le navigateur.

---

## English Summary

*(Added August 2026 as part of the RNCP 36463 certification portfolio — this section documents the project in English; it was not written during the original April 2026 internship.)*

**Les Délices du Maghreb & Chez Ahmed** is a multi-restaurant web platform built for a Maghrebi restaurant and its attached fast-food counter, sharing a single online-ordering and reservation system behind a common landing portal.

### Project structure

The project is split into a static frontend (plain HTML/CSS/JS, no build step) and a Node.js/Express backend:

- `index.html` — split-screen entry portal linking to each restaurant
- `frontend/pages/` — one HTML page per restaurant section (menu, gallery, reservation form, ordering, contact) for each brand, plus an admin interface
- `frontend/css/` and `frontend/js/` — per-brand styles and shared cart logic (`cart.js`, persisted via `localStorage`)
- `backend/server.js` — Express server exposing `POST /api/reservations` and `POST /api/commandes`, backed by MongoDB (Mongoose models) with a local JSON fallback for offline/demo use

### Key features

- Full menus for both brands (starters, tajines, grills, couscous, desserts, drinks for Les Délices; sandwiches, burgers, tacos, kids' menu for Chez Ahmed)
- A two-step tacos customizer (meat count by size, then sauce choice) with the full configuration reflected in the cart line item
- A persistent shopping cart shared between both brands, with quantity editing and toast confirmations
- An online reservation form validated against a Mongoose schema (party size, status workflow: pending / confirmed / cancelled)
- An admin interface for managing incoming orders and reservations
- Security hardening (CORS allow-list, admin authentication) and an automated test suite added post-internship, together with RGAA/WCAG accessibility fixes (heading hierarchy, form labels, colour contrast) — see the project's pull request history for details

### Running the project

Frontend only: open `index.html` in a browser, no installation required.

With the backend (Node.js required):

```bash
cd backend
npm install
node server.js
```

The server runs on `http://localhost:3000`; the frontend is served by opening `index.html` in the browser.
