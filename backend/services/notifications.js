const nodemailer = require('nodemailer');

// ─── Transporteur Gmail ──────────────────────────────────────────────────────
let transporter = null;

function getTransporter() {
    if (transporter) return transporter;
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.warn('Notifications email désactivées (EMAIL_USER ou EMAIL_PASS manquants dans .env)');
        return null;
    }
    transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
    return transporter;
}

// ─── Template email client ───────────────────────────────────────────────────
function buildClientEmailHTML(commande) {
    const cfg = getRestaurantConfig(commande);
    const articlesRows = commande.articles.map(a => `
        <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-size: 15px; color: #333;">
                ${a.quantity}× ${a.name}
            </td>
            <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; text-align:right; font-weight: 600; color: #333;">
                ${(a.price * a.quantity).toFixed(2).replace('.', ',')}€
            </td>
        </tr>
    `).join('');

    return `
    <!DOCTYPE html>
    <html lang="fr">
    <head><meta charset="UTF-8"></head>
    <body style="margin:0;padding:0;background:#f5f5f5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
        <div style="max-width:580px;margin:30px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
            
            <!-- Header -->
            <div style="background:#111;padding:32px 40px;text-align:center;">
                <h1 style="margin:0;color:#fff;font-size:26px;letter-spacing:2px;text-transform:uppercase;">${cfg.header}</h1>
                <p style="margin:8px 0 0;color:#aaa;font-size:13px;letter-spacing:1px;text-transform:uppercase;">Confirmation de commande</p>
            </div>
            
            <!-- Body -->
            <div style="padding:32px 40px;">
                <p style="font-size:18px;font-weight:600;color:#111;margin:0 0 8px;">Bonjour ${commande.nom} !</p>
                <div style="display:inline-flex;align-items:center;gap:8px;margin:0 0 18px;">
                    <span style="display:inline-block;padding:8px 14px;background:#E3000F;color:#fff;border-radius:999px;font-size:0.85rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;">Commande confirmée</span>
                </div>
                <p style="font-size:15px;color:#555;margin:0 0 28px;line-height:1.6;">
                    Votre commande a bien été reçue et sera préparée avec soin. 
                    Vous serez contacté(e) dès qu'elle sera prête.
                </p>
                
                <!-- Récap commande -->
                <div style="background:#fafafa;border-radius:12px;padding:20px 24px;margin-bottom:24px;">
                    <p style="margin:0 0 16px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#999;">Détail de votre commande</p>
                    <table style="width:100%;border-collapse:collapse;">
                        ${articlesRows}
                        <tr>
                            <td style="padding:14px 0 0;font-size:17px;font-weight:800;color:#111;">TOTAL</td>
                            <td style="padding:14px 0 0;text-align:right;font-size:20px;font-weight:800;color:#E3000F;">${commande.total.toFixed(2).replace('.', ',')}€</td>
                        </tr>
                    </table>
                </div>
                
                <!-- Paiement -->
                <div style="background:#FFF3F3;border-left:4px solid #E3000F;border-radius:8px;padding:14px 18px;margin-bottom:28px;">
                    <p style="margin:0;font-size:14px;color:#333;">
                        <strong>Paiement à la réception</strong> — Espèces, Carte Bancaire ou Ticket Resto
                    </p>
                </div>
                
                <!-- Info -->
                <p style="font-size:14px;color:#777;line-height:1.7;margin:0;">
                    Des questions ? Contactez-nous directement.<br>
                    À très bientôt ${cfg.displayTitle} !
                </p>
            </div>
            
            <!-- Footer -->
            <div style="background:#f5f5f5;padding:20px 40px;text-align:center;border-top:1px solid #eee;">
                <p style="margin:0;font-size:12px;color:#aaa;">
                    ${cfg.header} — Les Délices du Maghreb<br>
                    Cet email a été envoyé automatiquement, merci de ne pas y répondre.
                </p>
            </div>
        </div>
    </body>
    </html>
    `;
}

// ─── Template email Ahmed (notification interne) ─────────────────────────────
function buildAdminEmailHTML(commande) {
    const articlesRows = commande.articles.map(a => `
        <tr>
            <td style="padding:8px 0;border-bottom:1px solid #eee;font-size:14px;">${a.quantity}× ${a.name}</td>
            <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;font-weight:600;">${(a.price * a.quantity).toFixed(2).replace('.', ',')}€</td>
        </tr>
    `).join('');

    return `
    <!DOCTYPE html>
    <html lang="fr">
    <head><meta charset="UTF-8"></head>
    <body style="margin:0;padding:0;background:#f5f5f5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
        <div style="max-width:560px;margin:30px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
            <div style="background:#E3000F;padding:24px 32px;">
                <h1 style="margin:0;color:#fff;font-size:20px;">Nouvelle commande reçue !</h1>
            </div>
            <div style="padding:28px 32px;">
                <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
                    <tr><td style="color:#777;font-size:13px;padding:4px 0;">Client</td><td style="font-weight:700;font-size:15px;padding:4px 0;">${commande.nom}</td></tr>
                    <tr><td style="color:#777;font-size:13px;padding:4px 0;">Téléphone</td><td style="font-weight:700;font-size:15px;padding:4px 0;">${commande.telephone || 'Non renseigné'}</td></tr>
                    <tr><td style="color:#777;font-size:13px;padding:4px 0;">Email</td><td style="font-weight:700;font-size:15px;padding:4px 0;">${commande.email || '-'}</td></tr>
                </table>
                
                <div style="background:#fafafa;border-radius:10px;padding:16px 20px;margin-bottom:20px;">
                    <p style="margin:0 0 12px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#999;">Articles commandés</p>
                    <table style="width:100%;border-collapse:collapse;">
                        ${articlesRows}
                        <tr>
                            <td style="padding:12px 0 0;font-size:16px;font-weight:800;">TOTAL</td>
                            <td style="padding:12px 0 0;text-align:right;font-size:18px;font-weight:800;color:#E3000F;">${commande.total.toFixed(2).replace('.', ',')}€</td>
                        </tr>
                    </table>
                </div>
                
                <p style="font-size:13px;color:#888;margin:0;">
                    Reçu le ${new Date(commande.createdAt).toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })}
                </p>
            </div>
        </div>
    </body>
    </html>
    `;
}

// ─── Template email changement de statut ─────────────────────────────────────
function buildStatusEmailHTML(commande, statutLabel, message) {
    const cfg = getRestaurantConfig(commande);
    return `
    <!DOCTYPE html>
    <html lang="fr">
    <head><meta charset="UTF-8"></head>
    <body style="margin:0;padding:0;background:#f5f5f5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
        <div style="max-width:560px;margin:30px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
            <div style="background:#111;padding:28px 40px;text-align:center;">
                <h1 style="margin:0;color:#fff;font-size:22px;letter-spacing:2px;">${cfg.header}</h1>
            </div>
            <div style="padding:32px 40px;text-align:center;">
                <span style="display:inline-block;padding:8px 16px;border-radius:999px;background:${statutLabel.color};color:#fff;font-size:0.85rem;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:16px;">${statutLabel.badge}</span>
                <h2 style="font-size:22px;font-weight:800;color:#111;margin:0 0 12px;">${statutLabel.titre}</h2>
                <p style="font-size:15px;color:#555;line-height:1.7;margin:0 0 24px;">${message}</p>
                <div style="background:#fafafa;border-radius:12px;padding:16px;display:inline-block;">
                    <p style="margin:0;font-size:14px;color:#777;">
                        Commande de <strong>${commande.nom}</strong><br>
                        Total : <strong style="color:#E3000F;">${commande.total.toFixed(2).replace('.', ',')}€</strong>
                    </p>
                </div>
            </div>
            <div style="background:#f5f5f5;padding:16px 40px;text-align:center;border-top:1px solid #eee;">
                <p style="margin:0;font-size:12px;color:#aaa;">${cfg.header} — Les Délices du Maghreb</p>
            </div>
        </div>
    </body>
    </html>
    `;
}

// ─── Helper: configuration des textes selon le restaurant ─────────────────
function getRestaurantConfig(commande) {
    const key = (commande && commande.restaurant) ? commande.restaurant : 'chez_ahmed';
    if (key === 'les_delices' || key === 'les_delices_du') {
        return {
            header: 'LES DÉLICES DU MAGHREB',
            displayTitle: 'Les Délices du Maghreb',
            fromName: 'Les Délices du Maghreb'
        };
    }
    // default: Chez Ahmed
    return {
        header: 'CHEZ AHMED',
        displayTitle: 'Chez Ahmed',
        fromName: 'Chez Ahmed'
    };
}

// ─── Envoi email confirmation nouvelle commande ──────────────────────────────
async function sendCommandeEmail(commande) {
    const t = getTransporter();
    if (!t) return;

    const adminEmail = process.env.ADMIN_EMAIL;

    try {
        const cfg = getRestaurantConfig(commande);
        // Email client (si email fourni)
        if (commande.email) {
            await t.sendMail({
                from: `"${cfg.fromName}" <${process.env.EMAIL_USER}>`,
                to: commande.email,
                subject: `Votre commande est confirmée — ${cfg.displayTitle}`,
                html: buildClientEmailHTML(commande)
            });
            console.log(`Email confirmation envoyé à ${commande.email}`);
        }

        // Email admin
        if (adminEmail) {
            await t.sendMail({
                from: `"Bot Commandes" <${process.env.EMAIL_USER}>`,
                to: adminEmail,
                subject: `Nouvelle commande — ${commande.nom} — ${commande.total.toFixed(2)}€`,
                html: buildAdminEmailHTML(commande)
            });
            console.log(`Notification admin envoyée à ${adminEmail}`);
        }
    } catch (err) {
        console.error('Erreur envoi email:', err.message);
    }
}

// ─── Envoi email changement de statut ────────────────────────────────────────
async function sendStatusEmail(commande, newStatut) {
    const t = getTransporter();
    if (!t || !commande.email) return;
    const cfg = getRestaurantConfig(commande);

    const statutInfos = {
        'en_preparation': {
            badge: 'Préparation',
            color: '#E3000F',
            titre: 'Votre commande est en préparation !',
            message: `Bonne nouvelle ! ${cfg.displayTitle} prépare votre commande avec soin. Elle sera bientôt prête.`
        },
        'prête': {
            badge: 'Prête',
            color: '#0E9488',
            titre: 'Votre commande est prête !',
            message: `Votre commande est prête à être récupérée. À tout de suite ${cfg.displayTitle} !`
        },
        'livrée': {
            badge: 'Livrée',
            color: '#111111',
            titre: 'Commande terminée !',
            message: `Merci pour votre commande. Bonne dégustation et à bientôt ${cfg.displayTitle} !`
        }
    };

    const info = statutInfos[newStatut];
    if (!info) return; // pas d'email pour 'nouvelle'

    try {
        await t.sendMail({
            from: `"${cfg.fromName}" <${process.env.EMAIL_USER}>`,
            to: commande.email,
            subject: `${info.titre} — ${cfg.displayTitle}`,
            html: buildStatusEmailHTML(commande, info, info.message)
        });
        console.log(`Email statut (${newStatut}) envoyé à ${commande.email}`);
    } catch (err) {
        console.error('Erreur envoi email statut:', err.message);
    }
}

module.exports = { sendCommandeEmail, sendStatusEmail };
