// cart.js

let cart = JSON.parse(localStorage.getItem('restaurant_cart')) || [];

function saveCart() {
    localStorage.setItem('restaurant_cart', JSON.stringify(cart));
    updateCartButton();
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
        itemsContainer.innerHTML = '<div class="empty-cart-msg">Votre commande est vide. Ajoutez des plats depuis le menu !</div>';
        totalElement.textContent = '0€';
        return;
    }

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

// Auto-bind add to cart buttons on page load
document.addEventListener('DOMContentLoaded', () => {
    const addButtons = document.querySelectorAll('.btn-add');
    addButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const card = e.target.closest('.menu-detail-card');
            if (card) {
                const btn = e.target;
                const name = btn.dataset.name || card.querySelector('h3').textContent;
                const priceRaw = btn.dataset.price || card.querySelector('.price').textContent.replace('€', '').trim();
                addToCart(name, priceRaw);
            }
        });
    });

    // Render commander page if we are on it
    renderCommanderPage();

    // Update cart button text state on load
    updateCartButton();

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

    const btn = document.querySelector('.btn-checkout');
    btn.textContent = 'Envoi en cours...';
    btn.disabled = true;

    try {
        const res = await fetch('http://localhost:3000/api/commandes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ articles: cart })
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
            `;
            successMsg.innerHTML = `
                <div style="font-size: 3rem; margin-bottom: 1rem;">✅</div>
                <h2 style="font-size: 1.8rem; font-weight: 800; margin-bottom: 0.5rem;">Commande envoyée !</h2>
                <p style="color: #666;">${data.message}</p>
                <button onclick="this.parentElement.remove()" style="margin-top: 1.5rem; padding: 0.8rem 2rem; background: var(--brand-color, #B2653C); color: white; border: none; border-radius: 30px; font-size: 1rem; font-weight: 700; cursor: pointer;">Fermer</button>
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
