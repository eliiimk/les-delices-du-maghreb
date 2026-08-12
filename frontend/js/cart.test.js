/**
 * @jest-environment jsdom
 */

/**
 * Tests unitaires — classe Cart (frontend/js/cart.js)
 * Couvre la logique métier du panier : ajout, incrémentation, suppression,
 * calcul du total, persistance localStorage.
 */

const { Cart } = require('./cart.js');

describe('Cart', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    test('un panier neuf est vide', () => {
        const cart = new Cart('test_cart');
        expect(cart.isEmpty()).toBe(true);
        expect(cart.items).toEqual([]);
    });

    test('add() ajoute un nouvel article avec quantité 1', () => {
        const cart = new Cart('test_cart');
        cart.add('Tajine de Poulet', '14,50');

        expect(cart.items).toHaveLength(1);
        expect(cart.items[0]).toMatchObject({ name: 'Tajine de Poulet', price: 14.5, quantity: 1 });
    });

    test('add() incrémente la quantité si l\'article existe déjà', () => {
        const cart = new Cart('test_cart');
        cart.add('Couscous Royal', 16);
        cart.add('Couscous Royal', 16);

        expect(cart.items).toHaveLength(1);
        expect(cart.items[0].quantity).toBe(2);
    });

    test('add() convertit correctement les prix au format français (virgule)', () => {
        const cart = new Cart('test_cart');
        cart.add('Tajine', '14,50');
        expect(cart.items[0].price).toBe(14.5);
    });

    test('getTotal() calcule le montant total pondéré par quantité', () => {
        const cart = new Cart('test_cart');
        cart.add('Tajine de Poulet', 14.5);
        cart.add('Couscous Royal', 16);
        cart.add('Tajine de Poulet', 14.5); // quantité -> 2

        expect(cart.getTotal()).toBe(45); // 14.5*2 + 16
    });

    test('getItemCount() renvoie la somme des quantités, pas le nombre de lignes', () => {
        const cart = new Cart('test_cart');
        cart.add('Naan', 3);
        cart.add('Naan', 3);
        cart.add('Tacos M', 8.5);

        expect(cart.getItemCount()).toBe(3); // 2 Naan + 1 Tacos
        expect(cart.items).toHaveLength(2); // 2 lignes distinctes
    });

    test('changeQuantity() décrémente la quantité', () => {
        const cart = new Cart('test_cart');
        cart.add('Tacos L', 12);
        cart.add('Tacos L', 12);
        cart.changeQuantity(0, -1);

        expect(cart.items[0].quantity).toBe(1);
    });

    test('changeQuantity() supprime l\'article quand la quantité atteint zéro', () => {
        const cart = new Cart('test_cart');
        cart.add('Tacos L', 12);
        cart.changeQuantity(0, -1);

        expect(cart.items).toHaveLength(0);
    });

    test('changeQuantity() ne fait rien si l\'index est invalide', () => {
        const cart = new Cart('test_cart');
        cart.add('Tacos L', 12);
        expect(() => cart.changeQuantity(5, -1)).not.toThrow();
        expect(cart.items).toHaveLength(1);
    });

    test('clear() vide entièrement le panier', () => {
        const cart = new Cart('test_cart');
        cart.add('Tajine', 14.5);
        cart.add('Couscous', 16);
        cart.clear();

        expect(cart.isEmpty()).toBe(true);
        expect(cart.items).toEqual([]);
    });

    test('le panier persiste dans localStorage entre deux instances', () => {
        const cart1 = new Cart('test_cart');
        cart1.add('Naan', 3);

        const cart2 = new Cart('test_cart');
        expect(cart2.items).toHaveLength(1);
        expect(cart2.items[0].name).toBe('Naan');
    });

    test('deux clés localStorage différentes ne se mélangent pas (isolation multi-enseignes)', () => {
        const cartDelices = new Cart('cart_delices');
        const cartAhmed = new Cart('cart_ahmed');

        cartDelices.add('Tajine', 14.5);
        cartAhmed.add('Tacos L', 12);

        expect(cartDelices.items).toHaveLength(1);
        expect(cartAhmed.items).toHaveLength(1);
        expect(cartDelices.items[0].name).toBe('Tajine');
        expect(cartAhmed.items[0].name).toBe('Tacos L');
    });
});
