// admin.js

const API_BASE = '/api';
let currentTab = 'commandes';
let dataCommandes = [];
let dataReservations = [];

// DOM Elements
const loginOverlay = document.getElementById('login-overlay');
const dashboardApp = document.getElementById('dashboard-app');
const btnLogin = document.getElementById('btn-login');
const pwdInput = document.getElementById('admin-pwd');
const loginError = document.getElementById('login-error');

const tabCommandes = document.getElementById('tab-commandes');
const tabReservations = document.getElementById('tab-reservations');
const title = document.getElementById('current-tab-title');

const containerCommandes = document.getElementById('commandes-container');
const containerReservations = document.getElementById('reservations-container');

// Login Logic
btnLogin.addEventListener('click', async () => {
    const password = pwdInput.value;
    try {
        const response = await fetch(`${API_BASE}/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password })
        });
        const result = await response.json();
        
        if (result.success) {
            loginOverlay.style.display = 'none';
            dashboardApp.style.display = 'flex';
            initDashboard();
        } else {
            loginError.textContent = 'Mot de passe incorrect.';
        }
    } catch (err) {
        loginError.textContent = 'Erreur de connexion au serveur.';
    }
});
pwdInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') btnLogin.click();
});

// Tab Switching
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const target = btn.dataset.tab;
        if (target === 'tab-commandes') {
            currentTab = 'commandes';
            tabCommandes.classList.add('active');
            tabReservations.classList.remove('active');
            title.textContent = 'Gestion des Commandes';
            renderCommandes('all');
        } else {
            currentTab = 'reservations';
            tabReservations.classList.add('active');
            tabCommandes.classList.remove('active');
            title.textContent = 'Gestion des Réservations';
            renderReservations('all');
        }
    });
});

// Refresh Button
document.getElementById('btn-refresh').addEventListener('click', () => {
    fetchData();
});

// Filters
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const parent = btn.closest('.status-filters');
        parent.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        if (currentTab === 'commandes') {
            renderCommandes(btn.dataset.filter);
        } else {
            renderReservations(btn.dataset.filter);
        }
    });
});

// Initialization
function initDashboard() {
    fetchData();
    setInterval(fetchData, 10000); // Auto refresh every 10s
}

async function fetchData() {
    try {
        const resCmd = await fetch(`${API_BASE}/commandes`);
        const resRes = await fetch(`${API_BASE}/reservations`);
        
        if (resCmd.ok) {
            const json = await resCmd.json();
            dataCommandes = json.commandes; // Already sorted by createdAt desc from server
            
            // Count active (nouvelle)
            const newCount = dataCommandes.filter(c => c.statut === 'nouvelle').length;
            document.getElementById('badge-commandes').textContent = dataCommandes.length;
        }
        
        if (resRes.ok) {
            const json = await resRes.json();
            dataReservations = json.reservations;
            
            const newCount = dataReservations.filter(r => r.statut === 'en_attente').length;
            document.getElementById('badge-reservations').textContent = newCount;
        }

        // Re-render current view based on active filter
        const activeFilter = document.querySelector(`#tab-${currentTab} .filter-btn.active`).dataset.filter;
        if (currentTab === 'commandes') renderCommandes(activeFilter);
        else renderReservations(activeFilter);

    } catch (err) {
        console.error('Failed to fetch data', err);
    }
}

// Rendering Commandes
function renderCommandes(filter) {
    containerCommandes.innerHTML = '';
    const filtered = filter === 'all' ? dataCommandes : dataCommandes.filter(c => c.statut === filter);
    
    if (filtered.length === 0) {
        containerCommandes.innerHTML = '<p style="color: #6B7280;">Aucune commande trouvée.</p>';
        return;
    }

    filtered.forEach(cmd => {
        const d = new Date(cmd.createdAt);
        const timeStr = d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        const dateStr = d.toLocaleDateString();

        const card = document.createElement('div');
        card.className = 'data-card';

        let articlesHTML = '';
        cmd.articles.forEach(a => {
            articlesHTML += `<div class="detail-item"><span>${a.quantity}x ${a.name}</span><span>${(a.price * a.quantity).toFixed(2).replace('.', ',')}€</span></div>`;
        });

        let actionsHTML = '';
        if (cmd.statut === 'nouvelle') {
            actionsHTML = `<button class="action-btn btn-primary" onclick="updateStatus('commandes', '${cmd._id}', 'en_preparation')">Accepter (Préparation)</button>`;
        } else if (cmd.statut === 'en_preparation') {
            actionsHTML = `<button class="action-btn btn-primary" onclick="updateStatus('commandes', '${cmd._id}', 'prête')">Marquer Prête</button>`;
        } else if (cmd.statut === 'prête') {
            actionsHTML = `<button class="action-btn btn-secondary" onclick="updateStatus('commandes', '${cmd._id}', 'livrée')">Terminer (Livrée)</button>`;
        }

        // Bouton WhatsApp si téléphone disponible
        let whatsappBtn = '';
        if (cmd.telephone) {
            const tel = cmd.telephone.replace(/[^0-9+]/g, '');
            const telWa = tel.startsWith('0') ? '33' + tel.slice(1) : tel.replace('+', '');
            const articlesList = cmd.articles.map(a => `${a.quantity}x ${a.name}`).join('\n');
            // Déterminer le nom du restaurant selon la commande
            let restaurantName = 'Chez Ahmed';
            if (cmd.restaurant && (cmd.restaurant === 'les_delices' || cmd.restaurant === 'les_delices_du')) {
                restaurantName = 'Les Délices du Maghreb';
            }
            const msg = encodeURIComponent(
                `Bonjour ${cmd.nom} ! Votre commande ${restaurantName} est confirmée :\n${articlesList}\nTotal : ${cmd.total.toFixed(2).replace('.', ',')}€\nPaiement à la réception.\nÀ tout de suite !`
            );
            whatsappBtn = `<a href="https://wa.me/${telWa}?text=${msg}" target="_blank" class="action-btn" style="background:#25D366;color:#fff;text-decoration:none;display:inline-flex;align-items:center;gap:6px;">WhatsApp</a>`;
        }

        card.innerHTML = `
            <div class="card-header">
                <div>
                    <h3>Commande #${cmd._id.toString().slice(-6)}</h3>
                    <div class="time">${dateStr} à ${timeStr}</div>
                </div>
                <span class="status-badge status-${cmd.statut}">${formatStatus(cmd.statut)}</span>
            </div>
            <div class="card-body">
                <div style="margin-bottom: 1rem;">
                    <strong>Client :</strong> ${cmd.nom}<br>
                    <strong>Tél :</strong> ${cmd.telephone || '<span style="color:#E3000F">Non renseigné</span>'}<br>
                    <strong>Email :</strong> ${cmd.email || '<span style="color:#aaa">-</span>'}
                </div>
                <div style="background: #F9FAFB; padding: 1rem; border-radius: 8px;">
                    ${articlesHTML}
                    <div class="detail-item total"><span>Total</span><span>${cmd.total.toFixed(2).replace('.', ',')}€</span></div>
                </div>
            </div>
            <div class="card-actions">
                ${actionsHTML}
                ${whatsappBtn}
            </div>
        `;
        containerCommandes.appendChild(card);
    });
}

// Rendering Reservations
function renderReservations(filter) {
    containerReservations.innerHTML = '';
    const filtered = filter === 'all' ? dataReservations : dataReservations.filter(r => r.statut === filter);
    
    if (filtered.length === 0) {
        containerReservations.innerHTML = '<p style="color: #6B7280;">Aucune réservation trouvée.</p>';
        return;
    }

    filtered.forEach(res => {
        const d = new Date(res.createdAt);
        const timeStr = d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

        const card = document.createElement('div');
        card.className = 'data-card';

        let actionsHTML = '';
        if (res.statut === 'en_attente') {
            actionsHTML = `
                <button class="action-btn btn-primary" onclick="updateStatus('reservations', '${res._id}', 'confirmée')">Confirmer</button>
                <button class="action-btn btn-secondary" style="background:#FEE2E2; color:#991B1B;" onclick="deleteReservation('${res._id}')">Annuler</button>
            `;
        }

        card.innerHTML = `
            <div class="card-header">
                <div>
                    <h3>${res.nom || 'Client'}</h3>
                    <div class="time">Reçu à ${timeStr}</div>
                </div>
                <span class="status-badge status-${res.statut}">${formatStatus(res.statut)}</span>
            </div>
            <div class="card-body">
                <div style="font-size: 1.1rem; margin-bottom: 1rem; color: var(--primary); font-weight: bold;">
                    📅 ${res.date} à ${res.heure} — 👥 ${res.personnes} pers.
                </div>
                <div style="margin-bottom: 0.5rem;">
                    <strong>Tél :</strong> ${res.telephone}
                </div>
                ${res.message ? `<div style="background: #F9FAFB; padding: 1rem; border-radius: 8px; font-style: italic;">"${res.message}"</div>` : ''}
            </div>
            <div class="card-actions">
                ${actionsHTML}
            </div>
        `;
        containerReservations.appendChild(card);
    });
}

// Actions
async function updateStatus(type, id, newStatus) {
    try {
        await fetch(`${API_BASE}/${type}/${id}/statut`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ statut: newStatus })
        });
        fetchData(); // Refresh
    } catch (err) {
        alert('Erreur de connexion au serveur.');
    }
}

async function deleteReservation(id) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette réservation ?')) return;
    try {
        await fetch(`${API_BASE}/reservations/${id}`, {
            method: 'DELETE'
        });
        fetchData();
    } catch (err) {
        alert('Erreur de connexion au serveur.');
    }
}

function formatStatus(status) {
    const map = {
        'nouvelle': 'Nouvelle',
        'en_preparation': 'En Préparation',
        'prête': 'Prête',
        'livrée': 'Livrée',
        'en_attente': 'En Attente',
        'confirmée': 'Confirmée',
        'annulée': 'Annulée'
    };
    return map[status] || status;
}
