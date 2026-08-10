// cart.js

let cart = JSON.parse(localStorage.getItem('restaurant_cart')) || [];

function saveCart() {
    localStorage.setItem('restaurant_cart', JSON.stringify(cart));
    updateCartButton();
    updateFloatingCart();
}

// --- Panier flottant ---
function updateFloatingCart() {
    const btn = document.getElementById('floating-cart-btn');
    const badge = document.getElementById('floating-cart-badge');
    if (!btn || !badge) return;
    const total = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (total > 0) {
        badge.textContent = total;
        btn.classList.add('visible');
        // Animation pop à chaque ajout
        btn.classList.remove('pop');
        void btn.offsetWidth; // reflow pour relancer l'animation
        btn.classList.add('pop');
    } else {
        btn.classList.remove('visible', 'pop');
    }
}

function updateCartButton() {
    const btn = document.querySelector('header .btn-commander');
    if (btn) {
        if (cart.length > 0) {
            btn.textContent = 'Votre panier';
        } else {
            btn.textContent = 'Commander';
        }
    }
}

function addToCart(name, price) {
    const existingItem = cart.find(item => item.name === name);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        // Handle French commas in old text scraping and float prices
        const priceFloat = typeof price === 'string' ? parseFloat(price.toString().replace(',', '.')) : parseFloat(price);
        cart.push({ name, price: priceFloat, quantity: 1 });
    }
    saveCart();
    
    // Create a temporary toast feedback
    const toast = document.createElement('div');
    toast.textContent = `${name} ajouté à la commande !`;
    toast.style.position = 'fixed';
    toast.style.bottom = '20px';
    toast.style.right = '20px';
    toast.style.backgroundColor = 'var(--brand-color, #B2653C)';
    toast.style.color = 'white';
    toast.style.padding = '1rem 2rem';
    toast.style.borderRadius = '30px';
    toast.style.boxShadow = '0 10px 20px rgba(0,0,0,0.1)';
    toast.style.zIndex = '1000';
    toast.style.fontWeight = 'bold';
    toast.style.transition = 'opacity 0.3s ease';
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

function renderCommanderPage() {
    const itemsContainer = document.getElementById('commande-items-list');
    const cartContainer = document.getElementById('panier-list');
    const totalElement = document.getElementById('panier-total');

    if (!itemsContainer || !cartContainer) return; // Not on the commander page

    itemsContainer.innerHTML = '';
    cartContainer.innerHTML = '';
    let total = 0;

    if (cart.length === 0) {
        itemsContainer.innerHTML = `
            <div class="empty-cart-msg" style="text-align:center;">
                <p style="font-size:1.1rem;font-weight:800;text-transform:uppercase;">Votre panier est vide</p>
                <p style="font-size:0.9rem;color:#666;margin-top:0.5rem;font-weight:400;text-transform:none;">Ajoutez des plats depuis la carte pour commencer.</p>
                <a href="ahmed.html" class="empty-cart-cta">← Voir la carte</a>
            </div>`;
        totalElement.textContent = '0€';
        const infoCard = document.getElementById('customer-info-fields');
        if (infoCard) infoCard.style.display = 'none';
        return;
    }

    const infoCard = document.getElementById('customer-info-fields');
    if (infoCard) infoCard.style.display = 'block';

    cart.forEach((item, index) => {
        // Left side item card
        const itemCard = document.createElement('div');
        itemCard.className = 'commande-item-card';
        itemCard.innerHTML = `
            <div class="commande-item-info">
                <h3>${item.name}</h3>
                <p>Préparé frais • Disponible à emporter</p>
                <div class="commande-item-controls">
                    <button onclick="changeQuantity(${index}, -1)" class="qty-btn">-</button>
                    <span class="qty-val">${item.quantity}</span>
                    <button onclick="changeQuantity(${index}, 1)" class="qty-btn">+</button>
                </div>
            </div>
            <div class="commande-item-price">${item.price.toFixed(2).replace('.', ',')}€</div>
        `;
        itemsContainer.appendChild(itemCard);

        // Right side cart list
        const cartItem = document.createElement('div');
        cartItem.className = 'panier-item';
        cartItem.innerHTML = `
            <span class="panier-item-name">${item.quantity} × ${item.name}</span>
            <span class="panier-item-price">${(item.quantity * item.price).toFixed(2).replace('.', ',')}€</span>
        `;
        cartContainer.appendChild(cartItem);

        total += (item.quantity * item.price);
    });

    totalElement.textContent = total.toFixed(2).replace('.', ',') + '€';
}

// Global function to change quantity from within HTML onclick
window.changeQuantity = function(index, delta) {
    if (cart[index]) {
        cart[index].quantity += delta;
        if (cart[index].quantity <= 0) {
            cart.splice(index, 1); // remove item
        }
        saveCart();
        renderCommanderPage();
    }
}

/**
 * Modale de personnalisation pour les Tacos (Chez Ahmed)
 * Étape 1 : choix de la/les viande(s) selon le format (M=1, L=2, X=3)
 * Étape 2 : choix de la sauce
 * Le nom final dans le panier : "Tacos M — Bœuf haché — Sauce Algérienne"
 */
function showTacosCustomModal(name, price, nbViandes) {
    const VIANDES = ['Bœuf haché', 'Poulet', 'Merguez'];
    const SAUCES = ['Sauce Burger', 'Sauce Algérienne', 'Sauce Fromagère', 'Sauce Samourai', 'Sauce Harissa'];

    const selectedViandes = [];

    // ---------- Création de l'overlay ----------
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position:fixed;top:0;left:0;width:100%;height:100%;
        background:rgba(0,0,0,0.6);display:flex;justify-content:center;align-items:center;
        z-index:10000;backdrop-filter:blur(6px);animation:fadeInOverlay .2s ease;
    `;

    // Inject keyframes once
    if (!document.getElementById('tacos-modal-styles')) {
        const style = document.createElement('style');
        style.id = 'tacos-modal-styles';
        style.textContent = `
            @keyframes fadeInOverlay { from{opacity:0} to{opacity:1} }
            @keyframes slideUpModal { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
            .tacos-option-btn {
                flex:1;min-width:calc(33% - 8px);padding:.9rem .5rem;border:2px solid #e0e0e0;
                background:#fff;border-radius:10px;cursor:pointer;font-weight:600;font-size:.95rem;
                font-family:'Outfit',sans-serif;color:#333;transition:all .18s ease;
            }
            .tacos-option-btn:hover { border-color:#E3000F;color:#E3000F;background:#FFF5F5; }
            .tacos-option-btn.selected { border-color:#E3000F;background:#E3000F;color:#fff; }
            .tacos-progress-step { display:inline-block;width:10px;height:10px;border-radius:50%;background:#ddd;margin:0 4px;transition:.2s; }
            .tacos-progress-step.active { background:#E3000F;transform:scale(1.2); }
        `;
        document.head.appendChild(style);
    }

    const modal = document.createElement('div');
    modal.style.cssText = `
        background:#fff;padding:2rem;border-radius:20px;
        box-shadow:0 25px 60px rgba(0,0,0,0.25);max-width:440px;width:92%;
        font-family:'Outfit',sans-serif;animation:slideUpModal .25s ease;
    `;
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Fermer en cliquant hors modal
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });

    // ---------- Étape 1 : Choix viande(s) ----------
    function renderViande() {
        modal.innerHTML = `
            <div style="text-align:center;margin-bottom:1.2rem;">
                <span style="font-size:.8rem;color:#E3000F;font-weight:700;letter-spacing:.08em;text-transform:uppercase;">Personnalise ton tacos</span>
                <h3 style="font-size:1.5rem;font-weight:800;margin:.4rem 0 0;color:#111;">${name}</h3>
            </div>
            <div style="text-align:center;margin-bottom:1.2rem;">
                <span class="tacos-progress-step active"></span>
                <span class="tacos-progress-step"></span>
            </div>
            <p style="text-align:center;color:#555;margin-bottom:1rem;font-size:.95rem;">
                Choisis ${nbViandes === 1 ? 'ta viande' : `tes <strong>${nbViandes} viandes</strong>`} :
            </p>
            <div id="viande-choices" style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-bottom:1.5rem;">
                ${VIANDES.map(v => `<button class="tacos-option-btn" data-viande="${v}">${v}</button>`).join('')}
            </div>
            <div style="display:flex;gap:.8rem;">
                <button id="btn-tacos-cancel" style="flex:1;padding:.8rem;border:1.5px solid #ddd;background:none;border-radius:10px;cursor:pointer;font-weight:600;color:#999;font-family:'Outfit',sans-serif;">Annuler</button>
                <button id="btn-tacos-next" style="flex:2;padding:.8rem;border:none;background:#E3000F;color:#fff;border-radius:10px;cursor:pointer;font-weight:700;font-family:'Outfit',sans-serif;font-size:1rem;opacity:.5;pointer-events:none;">
                    ${nbViandes > 1 ? 'Suivant →' : 'Choisir la sauce →'}
                </button>
            </div>
        `;

        const choices = modal.querySelectorAll('[data-viande]');
        const nextBtn = modal.querySelector('#btn-tacos-next');

        // Gestion sélection multiple ou unique
        choices.forEach(btn => {
            btn.addEventListener('click', () => {
                if (nbViandes === 1) {
                    // Sélection unique
                    choices.forEach(b => b.classList.remove('selected'));
                    btn.classList.add('selected');
                    selectedViandes.length = 0;
                    selectedViandes.push(btn.dataset.viande);
                } else {
                    // Sélection multiple jusqu'à nbViandes
                    if (btn.classList.contains('selected')) {
                        btn.classList.remove('selected');
                        const idx = selectedViandes.indexOf(btn.dataset.viande);
                        if (idx > -1) selectedViandes.splice(idx, 1);
                    } else if (selectedViandes.length < nbViandes) {
                        btn.classList.add('selected');
                        selectedViandes.push(btn.dataset.viande);
                    }
                }
                // Activer bouton suivant quand sélection complète
                const ready = (nbViandes === 1 && selectedViandes.length === 1) || selectedViandes.length === nbViandes;
                nextBtn.style.opacity = ready ? '1' : '.5';
                nextBtn.style.pointerEvents = ready ? 'auto' : 'none';
            });
        });

        nextBtn.addEventListener('click', renderSauce);
        modal.querySelector('#btn-tacos-cancel').addEventListener('click', () => overlay.remove());
    }

    // ---------- Étape 2 : Choix sauce ----------
    function renderSauce() {
        const viandeSummary = selectedViandes.join(' + ');
        modal.innerHTML = `
            <div style="text-align:center;margin-bottom:1.2rem;">
                <span style="font-size:.8rem;color:#E3000F;font-weight:700;letter-spacing:.08em;text-transform:uppercase;">Personnalise ton tacos</span>
                <h3 style="font-size:1.5rem;font-weight:800;margin:.4rem 0 0;color:#111;">${name}</h3>
                <p style="font-size:.85rem;color:#777;margin:.3rem 0 0;">${viandeSummary}</p>
            </div>
            <div style="text-align:center;margin-bottom:1.2rem;">
                <span class="tacos-progress-step"></span>
                <span class="tacos-progress-step active"></span>
            </div>
            <p style="text-align:center;color:#555;margin-bottom:1rem;font-size:.95rem;">Choisis ta sauce :</p>
            <div id="sauce-choices" style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-bottom:1.5rem;">
                ${SAUCES.map(s => `<button class="tacos-option-btn" data-sauce="${s}">${s}</button>`).join('')}
            </div>
            <div style="display:flex;gap:.8rem;">
                <button id="btn-tacos-back" style="flex:1;padding:.8rem;border:1.5px solid #ddd;background:none;border-radius:10px;cursor:pointer;font-weight:600;color:#555;font-family:'Outfit',sans-serif;">← Retour</button>
                <button id="btn-tacos-confirm" style="flex:2;padding:.8rem;border:none;background:#E3000F;color:#fff;border-radius:10px;cursor:pointer;font-weight:700;font-family:'Outfit',sans-serif;font-size:1rem;opacity:.5;pointer-events:none;">
                    Ajouter au panier
                </button>
            </div>
        `;

        let selectedSauce = null;
        const sauceBtns = modal.querySelectorAll('[data-sauce]');
        const confirmBtn = modal.querySelector('#btn-tacos-confirm');

        sauceBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                sauceBtns.forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                selectedSauce = btn.dataset.sauce;
                confirmBtn.style.opacity = '1';
                confirmBtn.style.pointerEvents = 'auto';
            });
        });

        confirmBtn.addEventListener('click', () => {
            const finalName = `${name} — ${viandeSummary} — ${selectedSauce}`;
            addToCart(finalName, price);
            overlay.remove();
        });

        modal.querySelector('#btn-tacos-back').addEventListener('click', () => {
            renderViande();
            // Restaurer les sélections précédentes
            setTimeout(() => {
                modal.querySelectorAll('[data-viande]').forEach(btn => {
                    if (selectedViandes.includes(btn.dataset.viande)) btn.classList.add('selected');
                });
                const nextBtn = modal.querySelector('#btn-tacos-next');
                if (nextBtn && selectedViandes.length > 0) {
                    nextBtn.style.opacity = '1';
                    nextBtn.style.pointerEvents = 'auto';
                }
            }, 0);
        });
    }

    // Lancer étape 1
    renderViande();
}

/**
 * Modale de sélection de sauce (+ option Seul/Menu si applicable)
 * Pour les sandwiches, burgers, naans, etc.
 * @param {string} name - Nom du produit
 * @param {string|number} priceSeul - Prix seul
 * @param {string|number|null} priceMenu - Prix menu (null si pas d'option menu)
 * @param {string[]} sauceList - Liste des sauces disponibles
 */
function showSauceModal(name, priceSeul, priceMenu, sauceList) {
    const DEFAULT_SAUCES = ['Sauce Burger', 'Sauce Algérienne', 'Sauce Fromagère', 'Sauce Samourai', 'Sauce Harissa', 'Sauce Blanche'];
    const sauces = sauceList && sauceList.length > 0 ? sauceList : DEFAULT_SAUCES;

    // Inject styles once
    if (!document.getElementById('sauce-modal-styles')) {
        const style = document.createElement('style');
        style.id = 'sauce-modal-styles';
        style.textContent = `
            @keyframes fadeSauceOverlay { from{opacity:0} to{opacity:1} }
            @keyframes slideSauceModal { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
            .sauce-opt-btn {
                flex: 1; min-width: calc(33% - 8px); padding: .75rem .4rem;
                border: 2px solid #e0e0e0; background: #fff; border-radius: 10px;
                cursor: pointer; font-weight: 600; font-size: .9rem;
                font-family: 'Outfit', sans-serif; color: #333; transition: all .18s ease;
            }
            .sauce-opt-btn:hover { border-color: #000; color: #000; background: #f5f5f5; }
            .sauce-opt-btn.selected { border-color: #000; background: #000; color: #fff; }
            .menu-toggle-btn {
                flex: 1; padding: 1rem; border: 2px solid #ddd; background: transparent;
                border-radius: 10px; cursor: pointer; font-weight: 700; font-size: .95rem;
                font-family: 'Outfit', sans-serif; color: #555; transition: all .2s ease;
            }
            .menu-toggle-btn.selected { border-color: #000; background: #000; color: #fff; }
            .menu-toggle-btn:hover:not(.selected) { border-color: #555; }
        `;
        document.head.appendChild(style);
    }

    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position:fixed;top:0;left:0;width:100%;height:100%;
        background:rgba(0,0,0,0.6);display:flex;justify-content:center;align-items:center;
        z-index:10000;backdrop-filter:blur(6px);animation:fadeSauceOverlay .2s ease;
    `;

    const modal = document.createElement('div');
    modal.style.cssText = `
        background:#fff;padding:2rem;border-radius:20px;
        box-shadow:0 25px 60px rgba(0,0,0,0.25);max-width:460px;width:92%;
        font-family:'Outfit',sans-serif;animation:slideSauceModal .25s ease;
    `;
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });

    let selectedSauce = null;
    let selectedMode = priceMenu ? null : 'seul'; // si pas de menu, mode = seul par défaut

    function getConfirmEnabled() {
        return selectedSauce !== null && selectedMode !== null;
    }

    function render() {
        const pSeul = parseFloat(priceSeul.toString().replace(',', '.')).toFixed(2).replace('.', ',');
        const pMenu = priceMenu ? parseFloat(priceMenu.toString().replace(',', '.')).toFixed(2).replace('.', ',') : null;

        modal.innerHTML = `
            <div style="text-align:center;margin-bottom:1.4rem;">
                <span style="font-size:.8rem;color:#555;font-weight:700;letter-spacing:.08em;text-transform:uppercase;">Personnalise ta commande</span>
                <h3 style="font-size:1.5rem;font-weight:800;margin:.4rem 0 0;color:#111;">${name}</h3>
            </div>

            <p style="font-size:.9rem;font-weight:700;text-transform:uppercase;letter-spacing:.05em;margin-bottom:.8rem;color:#333;">Sauce :</p>
            <div id="sauce-choices" style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:1.5rem;">
                ${sauces.map(s => `<button class="sauce-opt-btn${selectedSauce === s ? ' selected' : ''}" data-sauce="${s}">${s}</button>`).join('')}
            </div>

            ${pMenu ? `
            <p style="font-size:.9rem;font-weight:700;text-transform:uppercase;letter-spacing:.05em;margin-bottom:.8rem;color:#333;">Formule :</p>
            <div style="display:flex;gap:.8rem;margin-bottom:1.5rem;">
                <button class="menu-toggle-btn${selectedMode === 'seul' ? ' selected' : ''}" data-mode="seul">
                    Seul<span style="display:block;font-size:1.1rem;margin-top:.2rem;">${pSeul}€</span>
                </button>
                <button class="menu-toggle-btn${selectedMode === 'menu' ? ' selected' : ''}" data-mode="menu">
                    En Menu <span style="font-size:.75rem;color:inherit;">(Frites+Boisson)</span>
                    <span style="display:block;font-size:1.1rem;margin-top:.2rem;">${pMenu}€</span>
                </button>
            </div>` : ''}

            <div style="display:flex;gap:.8rem;">
                <button id="btn-sauce-cancel" style="flex:1;padding:.8rem;border:1.5px solid #ddd;background:none;border-radius:10px;cursor:pointer;font-weight:600;color:#999;font-family:'Outfit',sans-serif;">Annuler</button>
                <button id="btn-sauce-confirm" style="flex:2;padding:.8rem;border:none;background:#000;color:#fff;border-radius:10px;cursor:pointer;font-weight:700;font-family:'Outfit',sans-serif;font-size:1rem;opacity:${getConfirmEnabled() ? '1' : '.4'};pointer-events:${getConfirmEnabled() ? 'auto' : 'none'};">
                    Ajouter au panier
                </button>
            </div>
        `;

        // Sauce buttons
        modal.querySelectorAll('[data-sauce]').forEach(btn => {
            btn.addEventListener('click', () => {
                selectedSauce = btn.dataset.sauce;
                render();
            });
        });

        // Mode buttons
        modal.querySelectorAll('[data-mode]').forEach(btn => {
            btn.addEventListener('click', () => {
                selectedMode = btn.dataset.mode;
                render();
            });
        });

        modal.querySelector('#btn-sauce-cancel').addEventListener('click', () => overlay.remove());
        modal.querySelector('#btn-sauce-confirm').addEventListener('click', () => {
            const finalPrice = (priceMenu && selectedMode === 'menu') ? priceMenu : priceSeul;
            const modeSuffix = priceMenu ? ` (${selectedMode === 'menu' ? 'Menu' : 'Seul'})` : '';
            const finalName = `${name}${modeSuffix} — ${selectedSauce}`;
            addToCart(finalName, finalPrice);
            overlay.remove();
        });
    }

    render();
}

function showMenuChoiceModal(name, priceSeul, priceMenu) {
    const modalOverlay = document.createElement('div');
    modalOverlay.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 10000;
        backdrop-filter: blur(5px);
    `;
    
    const modal = document.createElement('div');
    modal.style.cssText = `
        background: white; padding: 2rem; border-radius: 16px;
        box-shadow: 0 20px 40px rgba(0,0,0,0.2); text-align: center; max-width: 400px; width: 90%;
        font-family: 'Outfit', sans-serif;
    `;
    
    // For price display, format correctly
    const displaySeul = parseFloat(priceSeul.toString().replace(',', '.')).toFixed(2).replace('.', ',');
    const displayMenu = parseFloat(priceMenu.toString().replace(',', '.')).toFixed(2).replace('.', ',');

    modal.innerHTML = `
        <h3 style="font-size: 1.5rem; margin-bottom: 0.5rem; color: #111;">${name}</h3>
        <p style="color: #666; margin-bottom: 1.5rem;">Voulez-vous ce produit seul ou en menu ?<br><small>(Menu = Frites + Boisson)</small></p>
        <div style="display: flex; gap: 1rem; justify-content: center;">
            <button id="btn-seul" style="flex: 1; padding: 1rem; border: 2px solid #ccc; background: transparent; border-radius: 8px; cursor: pointer; font-weight: 600; color: #333; transition: 0.2s;">
                Seul<br><span style="font-size:1.2rem; display:block; margin-top:0.3rem;">${displaySeul}€</span>
            </button>
            <button id="btn-menu" style="flex: 1; padding: 1rem; border: none; background: var(--brand-color, #E3000F); color: white; border-radius: 8px; cursor: pointer; font-weight: 600; transition: 0.2s; box-shadow: 0 4px 10px rgba(227,0,15,0.3);">
                En Menu<br><span style="font-size:1.2rem; display:block; margin-top:0.3rem;">${displayMenu}€</span>
            </button>
        </div>
        <button id="btn-cancel" style="margin-top: 1.5rem; background: none; border: none; color: #999; cursor: pointer; text-decoration: underline;">Annuler</button>
    `;
    
    modalOverlay.appendChild(modal);
    document.body.appendChild(modalOverlay);
    
    // Adjust colors dynamically based on the site (Ahmed or Delices)
    const ahmedColor = window.location.href.includes('ahmed') ? '#E3000F' : '#B2653C';
    const menuBtn = modal.querySelector('#btn-menu');
    menuBtn.style.background = ahmedColor;
    
    modal.querySelector('#btn-seul').addEventListener('click', () => {
        addToCart(name + ' (Seul)', priceSeul);
        modalOverlay.remove();
    });
    
    menuBtn.addEventListener('click', () => {
        addToCart(name + ' (Menu)', priceMenu);
        modalOverlay.remove();
    });
    
    modal.querySelector('#btn-cancel').addEventListener('click', () => {
        modalOverlay.remove();
    });
    
    modalOverlay.addEventListener('click', (e) => {
        if(e.target === modalOverlay) modalOverlay.remove();
    });
}

// Auto-bind add to cart buttons on page load
document.addEventListener('DOMContentLoaded', () => {
    const addButtons = document.querySelectorAll('.btn-add');
    addButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const card = e.target.closest('.menu-detail-card');
            if (card) {
                const btn = e.target;
                const name = btn.dataset.name || card.querySelector('h3').textContent;

                // --- Tacos : modale personnalisation ---
                if (btn.dataset.tacos === 'true') {
                    const price = parseFloat(btn.dataset.price);
                    const nbViandes = parseInt(btn.dataset.tacosViandes) || 1;
                    showTacosCustomModal(name, price, nbViandes);
                    return;
                }

                let priceRaw = btn.dataset.price;
                let priceMenu = null;

                const priceElement = card.querySelector('.price');
                if (priceElement) {
                    if (!priceRaw) {
                        priceRaw = priceElement.childNodes[0].textContent.replace('€', '').trim();
                    }
                    const smallEl = priceElement.querySelector('small');
                    if (smallEl && smallEl.textContent.includes('/ Menu')) {
                        const match = smallEl.textContent.match(/Menu\s*([\d,.]+)/i);
                        if (match && match[1]) {
                            priceMenu = match[1].replace(',', '.');
                        }
                    }
                } else if (!priceRaw) {
                    priceRaw = 0;
                }

                // --- Sauce : modale de personnalisation sauce ---
                if (btn.dataset.sauce === 'true') {
                    const rawList = btn.dataset.sauceList;
                    const sauceList = rawList ? rawList.split(',').map(s => s.trim()) : [];
                    showSauceModal(name, priceRaw, priceMenu, sauceList);
                    return;
                }

                if (priceMenu) {
                    showMenuChoiceModal(name, priceRaw, priceMenu);
                } else {
                    addToCart(name, priceRaw);
                }
            }
        });
    });

    // Render commander page if we are on it
    renderCommanderPage();

    // Update cart button text state on load
    updateCartButton();
    updateFloatingCart();

    // Wire checkout button
    const checkoutBtn = document.querySelector('.btn-checkout');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', submitCommande);
    }
});

async function submitCommande() {
    if (cart.length === 0) {
        alert('Votre panier est vide !');
        return;
    }

    // Collecte des infos client si les champs existent (page commander-ahmed)
    const nomInput   = document.getElementById('client-nom');
    const emailInput = document.getElementById('client-email');
    const telInput   = document.getElementById('client-tel');
    const nom       = nomInput   ? nomInput.value.trim()   : '';
    const email     = emailInput ? emailInput.value.trim() : '';
    const telephone = telInput   ? telInput.value.trim()   : '';

    const themeColor = window.location.href.includes('ahmed') ? '#E3000F' : '#B2653C';

    if (nomInput && !nom) {
        nomInput.focus();
        nomInput.style.borderColor = themeColor;
        setTimeout(() => nomInput.style.borderColor = '', 2000);
        alert('Veuillez indiquer votre nom.');
        return;
    }
    if (emailInput && !email) {
        emailInput.focus();
        emailInput.style.borderColor = themeColor;
        setTimeout(() => emailInput.style.borderColor = '', 2000);
        alert('Veuillez indiquer votre email pour recevoir la confirmation.');
        return;
    }
    if (telInput && !telephone) {
        telInput.focus();
        telInput.style.borderColor = themeColor;
        setTimeout(() => telInput.style.borderColor = '', 2000);
        alert('Veuillez indiquer votre numéro de téléphone.');
        return;
    }

    const btn = document.querySelector('.btn-checkout');
    btn.textContent = 'Envoi en cours...';
    btn.disabled = true;

    try {
        const res = await fetch('/api/commandes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                articles: cart,
                nom,
                email,
                telephone,
                restaurant: window.location.href.includes('ahmed') ? 'chez_ahmed' : 'les_delices'
            })
        });
        const data = await res.json();

        if (data.success) {
            // Clear cart
            cart = [];
            saveCart();
            renderCommanderPage();

            // Show success message
            const successMsg = document.createElement('div');
            successMsg.style.cssText = `
                position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
                background: white; padding: 3rem 4rem; border-radius: 24px;
                box-shadow: 0 30px 60px rgba(0,0,0,0.15); text-align: center; z-index: 9999;
                width: 90%; max-width: 450px;
            `;
            successMsg.innerHTML = `
                <h2 style="font-size: 1.8rem; font-weight: 800; margin-bottom: 0.5rem;">Commande envoyée !</h2>
                <div style="background: #F3F4F6; padding: 1rem; border-radius: 12px; margin: 1rem 0;">
                    <p style="color: #333; font-weight: 600; margin: 0;">Paiement à la réception</p>
                    <p style="color: #666; font-size: 0.9rem; margin-top: 0.3rem;">Espèces, Carte Bancaire ou Ticket Resto</p>
                </div>
                <p style="color: #666;">${data.message}</p>
                <button onclick="this.parentElement.remove()" style="margin-top: 1.5rem; padding: 0.8rem 2rem; background: ${themeColor}; color: white; border: none; border-radius: 30px; font-size: 1rem; font-weight: 700; cursor: pointer;">Fermer</button>
            `;
            document.body.appendChild(successMsg);
        } else {
            alert(data.message || 'Erreur lors de la commande.');
        }
    } catch (err) {
        alert('Impossible de contacter le serveur. Vérifiez que le backend est démarré.');
    } finally {
        btn.textContent = 'Valider la commande';
        btn.disabled = false;
    }
}
