
/* ==========================================================================
   KN-BEAUTY — cart-page.js
   Affichage, modification et commande du panier
   Dépendances : shop.js et cart.js
   Catalogue : product.json
   ========================================================================== */

"use strict";

// Numéro WhatsApp international sans le signe +
// Exemple de format : indicatif du pays + numéro, uniquement des chiffres.
// Laisse vide pour désactiver les commandes WhatsApp.
const WHATSAPP_NUMERO = "50948268584";

const liste = document.getElementById("cart-list");
const layout = document.getElementById("cart-layout");
const vide = document.getElementById("cart-empty");
const totalEl = document.getElementById("cart-total");
const noteEl = document.getElementById("order-note");
const boutonCommande = document.getElementById("order");

let parId = {};
let devise = "HTG";
let catalogueCharge = false;

/* --------------------------------------------------------------------------
   UTILITAIRES
   -------------------------------------------------------------------------- */

function afficherNote(message) {
  if (noteEl) noteEl.textContent = message;
}

function formaterMontant(montant) {
  return formaterPrix(montant, devise);
}

/* --------------------------------------------------------------------------
   CRÉATION D'UNE LIGNE DU PANIER
   -------------------------------------------------------------------------- */

function creerLigne(produit, quantite) {
  const li = document.createElement("li");
  li.className = "cart-line";

  li.innerHTML = `
    <a class="cart-img-link">
      <img class="cart-img" loading="lazy">
    </a>

    <div class="cart-info">
      <a class="cart-name"></a>
      <p class="cart-unit"></p>
      <button class="link-btn" type="button">Retirer</button>
    </div>

    <div class="qty" role="group">
      <button class="qty-minus" type="button">−</button>
      <output></output>
      <button class="qty-plus" type="button">+</button>
    </div>

    <p class="cart-line-total"></p>
  `;

  const urlProduit =
    "product.html?id=" + encodeURIComponent(produit.id);

  const lienImage = li.querySelector(".cart-img-link");
  const image = li.querySelector(".cart-img");
  const lienNom = li.querySelector(".cart-name");
  const unite = li.querySelector(".cart-unit");
  const quantiteEl = li.querySelector("output");
  const totalLigne = li.querySelector(".cart-line-total");
  const moins = li.querySelector(".qty-minus");
  const plus = li.querySelector(".qty-plus");
  const retirer = li.querySelector(".link-btn");
  const groupeQuantite = li.querySelector(".qty");

  lienImage.href = urlProduit;
  lienNom.href = urlProduit;

  image.src = produit.image;
  image.alt = produit.nom;

  lienNom.textContent = produit.nom;
  unite.textContent = formaterMontant(produit.prix);
  quantiteEl.textContent = quantite;
  totalLigne.textContent = formaterMontant(
    produit.prix * quantite
  );

  groupeQuantite.setAttribute(
    "aria-label",
    "Quantité de " + produit.nom
  );

  moins.setAttribute(
    "aria-label",
    "Diminuer la quantité de " + produit.nom
  );

  plus.setAttribute(
    "aria-label",
    "Augmenter la quantité de " + produit.nom
  );

  moins.disabled = quantite <= 1;
  plus.disabled = quantite >= 99;

  moins.addEventListener("click", () => {
    changerQuantite(produit.id, quantite - 1);
    afficher();
  });

  plus.addEventListener("click", () => {
    changerQuantite(produit.id, quantite + 1);
    afficher();
  });

  retirer.addEventListener("click", () => {
    retirerDuPanier(produit.id);
    afficher();
    afficherNote("Produit retiré du panier.");
  });

  image.addEventListener("error", () => {
    image.alt = "Image indisponible pour " + produit.nom;
  }, { once: true });

  return li;
}

/* --------------------------------------------------------------------------
   RÉCUPÉRATION DES ARTICLES
   -------------------------------------------------------------------------- */

function lignesDuPanier() {
  const panier = lirePanier();

  return Object.entries(panier)
    .filter(([id, quantite]) => {
      return (
        parId[id] &&
        Number.isInteger(quantite) &&
        quantite > 0
      );
    })
    .map(([id, quantite]) => ({
      p: parId[id],
      quantite
    }));
}

/* --------------------------------------------------------------------------
   CALCUL DU TOTAL
   -------------------------------------------------------------------------- */

function calculerTotal(lignes) {
  return lignes.reduce((somme, ligne) => {
    return somme + ligne.p.prix * ligne.quantite;
  }, 0);
}

/* --------------------------------------------------------------------------
   AFFICHAGE DU PANIER
   -------------------------------------------------------------------------- */

function afficher() {
  if (!catalogueCharge || !liste || !layout || !vide) return;

  const lignes = lignesDuPanier();
  const panierVide = lignes.length === 0;

  vide.hidden = !panierVide;
  layout.hidden = panierVide;

  if (panierVide) {
    liste.replaceChildren();
    if (totalEl) totalEl.textContent = formaterMontant(0);
    return;
  }

  const elements = lignes.map(({ p, quantite }) => {
    return creerLigne(p, quantite);
  });

  liste.replaceChildren(...elements);

  if (totalEl) {
    totalEl.textContent = formaterMontant(
      calculerTotal(lignes)
    );
  }
}

/* --------------------------------------------------------------------------
   COMMANDE WHATSAPP
   -------------------------------------------------------------------------- */

function commanderSurWhatsApp() {
  if (!WHATSAPP_NUMERO) {
    afficherNote(
      "Les commandes WhatsApp ne sont pas encore activées."
    );
    return;
  }

  if (!/^[1-9]\d{7,14}$/.test(WHATSAPP_NUMERO)) {
    afficherNote(
      "Le numéro WhatsApp configuré semble incorrect."
    );
    return;
  }

  const lignes = lignesDuPanier();

  if (lignes.length === 0) {
    afficherNote("Ton panier est vide.");
    return;
  }

  const detailCommande = lignes.map(({ p, quantite }) => {
    const sousTotal = p.prix * quantite;

    return `- ${quantite} x ${p.nom} : ${formaterMontant(sousTotal)}`;
  }).join("\n");

  const total = calculerTotal(lignes);

  const texte = [
    "Bonjour KN-BEAUTY, je souhaite passer cette commande :",
    "",
    detailCommande,
    "",
    `Total des produits : ${formaterMontant(total)}`,
    "",
    "Merci de me confirmer la disponibilité et les frais de livraison."
  ].join("\n");

  const url =
    `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(texte)}`;

  window.open(url, "_blank", "noopener,noreferrer");
}

/* --------------------------------------------------------------------------
   INITIALISATION
   -------------------------------------------------------------------------- */

if (boutonCommande) {
  boutonCommande.addEventListener("click", commanderSurWhatsApp);
}

if (typeof window !== "undefined") {
  window.addEventListener("kn:panier-modifie", afficher);
}

chargerProduits()
  .then((donnees) => {
    if (
      !donnees ||
      !Array.isArray(donnees.produits)
    ) {
      throw new Error("Format du catalogue invalide.");
    }

    devise = donnees.devise || "HTG";

    parId = Object.fromEntries(
      donnees.produits.map((produit) => [
        produit.id,
        produit
      ])
    );

    catalogueCharge = true;
    afficher();
  })
  .catch((erreur) => {
    console.error("Erreur de chargement du panier :", erreur);

    if (layout) layout.hidden = true;
    if (vide) vide.hidden = false;

    const message = vide?.querySelector("p");

    if (message) {
      message.textContent =
        "Impossible de charger les produits. Vérifie ta connexion et réessaie.";
    }
  });
