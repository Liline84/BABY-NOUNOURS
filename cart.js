```javascript
// ==========================================================================
// KN-BEAUTY — cart.js
// Gestion du panier avec localStorage
// Format : { "id-produit": quantité, ... }
// ==========================================================================

"use strict";

const CLE_PANIER = "kn-beauty-panier";
const QTE_MAX = 99;

/**
 * Vérifie qu'une quantité est un nombre entier positif.
 */
function quantiteValide(quantite) {
  return Number.isFinite(quantite) && Number.isInteger(quantite);
}

/**
 * Nettoie les données du panier.
 */
function nettoyerPanier(donnees) {
  if (!donnees || typeof donnees !== "object" || Array.isArray(donnees)) {
    return {};
  }

  const panier = {};

  for (const [id, quantite] of Object.entries(donnees)) {
    if (
      typeof id === "string" &&
      id.trim() !== "" &&
      quantiteValide(quantite) &&
      quantite > 0
    ) {
      panier[id] = Math.min(quantite, QTE_MAX);
    }
  }

  return panier;
}

/**
 * Lit le panier enregistré.
 */
function lirePanier() {
  try {
    const donnees = localStorage.getItem(CLE_PANIER);
    return donnees ? nettoyerPanier(JSON.parse(donnees)) : {};
  } catch (erreur) {
    console.warn("KN-BEAUTY : impossible de lire le panier.", erreur);
    return {};
  }
}

/**
 * Enregistre le panier puis actualise l'interface.
 */
function ecrirePanier(panier) {
  const panierPropre = nettoyerPanier(panier);

  try {
    localStorage.setItem(CLE_PANIER, JSON.stringify(panierPropre));
  } catch (erreur) {
    console.warn("KN-BEAUTY : impossible d'enregistrer le panier.", erreur);
  }

  majPastille();

  // Informe les autres scripts de la page.
  window.dispatchEvent(
    new CustomEvent("kn:panier-modifie", {
      detail: { panier: { ...panierPropre } }
    })
  );
}

/**
 * Ajoute un produit au panier.
 */
function ajouterAuPanier(id, quantite = 1) {
  if (typeof id !== "string" || !id.trim()) return;

  const qte = Number(quantite);
  if (!quantiteValide(qte) || qte <= 0) return;

  const panier = lirePanier();
  panier[id] = Math.min((panier[id] || 0) + qte, QTE_MAX);

  ecrirePanier(panier);
}

/**
 * Modifie la quantité d'un produit.
 * Une quantité égale à zéro retire le produit.
 */
function changerQuantite(id, quantite) {
  if (typeof id !== "string" || !id.trim()) return;

  const qte = Number(quantite);
  if (!quantiteValide(qte)) return;

  const panier = lirePanier();

  if (qte <= 0) {
    delete panier[id];
  } else {
    panier[id] = Math.min(qte, QTE_MAX);
  }

  ecrirePanier(panier);
}

/**
 * Retire complètement un produit.
 */
function retirerDuPanier(id) {
  changerQuantite(id, 0);
}

/**
 * Retourne le nombre total d'unités dans le panier.
 */
function nombreArticles() {
  return Object.values(lirePanier()).reduce(
    (total, quantite) => total + quantite,
    0
  );
}

/**
 * Actualise le compteur du panier dans l'en-tête.
 */
function majPastille() {
  const total = nombreArticles();

  document.querySelectorAll(".cart-count").forEach((element) => {
    element.textContent = total;
    element.hidden = total === 0;
    element.setAttribute("aria-label", `${total} article(s) dans le panier`);
  });
}

/**
 * Synchronise le compteur lorsqu'un autre onglet modifie le panier.
 */
window.addEventListener("storage", (evenement) => {
  if (evenement.key === CLE_PANIER || evenement.key === null) {
    majPastille();
  }
});

// Initialise le compteur au chargement du script.
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", majPastille, { once: true });
} else {
  majPastille();
}
```