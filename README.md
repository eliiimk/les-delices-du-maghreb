# Les Délices du Maghreb & Chez Ahmed — Site Multi-Restaurant

## Structure du Projet

```
├── index.html                  ← Portail d'entrée (split-screen)
├── frontend/
│   ├── pages/                  ← Toutes les pages HTML
│   │   ├── delices.html
│   │   ├── menu.html
│   │   ├── galerie.html
│   │   ├── reservation.html
│   │   ├── commander.html
│   │   └── contact.html
│   ├── css/
│   │   ├── delices.css         ← Styles restaurant maghrébin
│   │   └── style.css           ← Styles du portail index
│   ├── js/
│   │   ├── cart.js             ← Logique panier (localStorage)
│   │   └── script.js
│   └── img/                    ← Toutes les photos (plat-1.png ... plat-13.png)
└── backend/
    ├── server.js               ← Serveur Express (à créer après install Node.js)
    ├── routes/
    │   ├── reservations.js     ← API POST /api/reservations
    │   └── commandes.js        ← API POST /api/commandes
    ├── data/
    │   ├── reservations.json   ← Stockage réservations
    │   └── commandes.json      ← Stockage commandes
    └── package.json
```

## Lancer le projet (après installation Node.js)

```bash
cd backend
npm install
node server.js
```

Le site frontend s'ouvre en ouvrant `index.html` dans le navigateur.
