# 🧠 README DEV – Brief technique complet du projet `stained-glass-shop`

## 🧱 Stack utilisée

- **Front** : Hugo (JAMstack)
- **Backend API** : Dolibarr (gestion produits, clients, factures, stock)
- **Paiement** : Paymee (sandbox puis live)
- **Fonctions Serveur** : Netlify Functions (create-order, get-products, get-invoice-pdf, webhook...)
- **Panier** : JavaScript pur / localStorage (`cart.js`)
- **Pages clés** : /checkout, /merci, /merci-livraison, /products (rendu dynamique)

---

## ✅ Fonctions Netlify disponibles

### `get-products.js`
- Récupère tous les produits depuis l’API Dolibarr
- Sert au rendu dynamique front + gestion stock + prix

### `create-order.js`
- Reçoit le panier + infos client (livraison)
- Crée client, commande, facture brouillon + valide la facture
- Génère le PDF via Dolibarr
- Envoie un mail avec lien de téléchargement (SMTP OVH)
- Retourne `invoiceId`, `ref`, `pdfUrl`

### `create-payment.js`
- Crée un paiement Paymee côté serveur
- Redirige vers l’URL de paiement

### `webhook.js`
- Reçoit les callbacks Paymee (paiement validé)
- À connecter à `create-order` pour facturer une commande en statut **payé**

### `get-invoice-pdf.js`
- Récupère un PDF de facture via son ID et sa ref
- Génère à la volée si nécessaire
- Renvoie le fichier encodé base64 pour téléchargement dans le navigateur

---

## 🔥 CAS CRITIQUE : `cart.js`

- Gère tout le système panier (ajout, suppression, total, persisté en localStorage)
- ⚠️ S'exécute **en fonction du DOM**, nécessite `DOMContentLoaded`
- Boutons `.add-to-cart` dynamiques à gérer avec `attachAddToCartButtons()`

---

## 📦 Produits & Pages

- Produits depuis Dolibarr via `get-products.js`
- Affichage dynamique prévu sur `/products`
- Fichiers `.md` avec `id_dolibarr:` pour storytelling

### Liens logiques :
- Chaque produit `.add-to-cart` a un `data-id` = ID Dolibarr
- `product-connect.js` lie les boutons front aux vrais produits Dolibarr

---

## 📄 Téléchargement de facture

- `create-order.js` stocke `pdfUrl` et `ref` en localStorage
- `merci-facture.js` lit ces données et injecte le bouton dans `/merci` ou `/merci-livraison`

---

## 📬 Email

- Envoi SMTP via OVH (`commande@stainedglass.tn`)
- Contient le bouton de téléchargement PDF
- Identifiants stockés via `process.env.SMTP_USER` et `SMTP_PASS`

---

## 🧩 À FAIRE (prochain sprint)

- [x] Création + validation facture livraison ✅
- [x] Génération PDF ✅
- [x] Email avec lien PDF ✅
- [x] Stockage `pdfUrl` pour `/merci-livraison` ✅
- [x] Injection bouton dynamiquement ✅
- [ ] 🔗 Intégrer webhook Paymee → facturation en **payé**
- [ ] 💳 Différencier état des factures : `à payer` vs `payée`
- [ ] 🔒 Protection lien PDF ? (optionnel)
- [ ] 🎨 Améliorer responsive, favicon, SEO title etc.

---

## 🧠 Message au moi de demain / GPT :

> Tout marche 🔥 garde le flow clair :<br>
> `checkout.js` appelle la bonne function (`create-order`) quand livraison,<br>
> `create-order` = tout en un : client, commande, facture + PDF + email.<br>
> `/merci` = injecte `pdfUrl` via `localStorage`, propre.<br>
> Pour Paymee : on déclenche facture uniquement après validation via `webhook.js`, et on la marque en **payée**.<br>
> Pense à ne pas casser `cart.js`. C’est la colonne vertébrale UX du projet 🧠
