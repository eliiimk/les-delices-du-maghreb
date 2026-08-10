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
