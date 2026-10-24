
/* ==========================================================================
   KN-BEAUTY — shop.js
   Fonctions partagées : accueil, catalogue, fiche produit et panier
   Catalogue : product.json
   ========================================================================== */

"use strict";

const LIEN_LISTE = "products.html";

const MESSAGE_ERREUR =
  "Impossible de charger les produits. Vérifie le fichier product.json et ouvre le site avec un serveur local, par exemple Live Server dans VS Code.";

/* --------------------------------------------------------------------------
   CHARGEMENT DU CATALOGUE
   -------------------------------------------------------------------------- */

async function chargerProduits() {
  const reponse = await fetch("product.json", {
    cache: "no-cache"
  });

  if (!reponse.ok) {
    throw new Error(
      `Impossible de charger product.json : erreur HTTP ${reponse.status}.`
    );
  }

  const donnees = await reponse.json();

  if (
    !donnees ||
    !Array.isArray(donnees.produits)
  ) {
    throw new Error(
      "Le fichier product.json ne contient pas de tableau produits valide."
    );
  }

  return {
    devise: donnees.devise || "HTG",
    produits: donnees.produits
  };
}

/* --------------------------------------------------------------------------
   FORMATAGE DES PRIX
   -------------------------------------------------------------------------- */

function formaterPrix(montant, devise = "HTG") {
  const prix = Number(montant);

  if (!Number.isFinite(prix)) {
    return "Prix indisponible";
  }

  return (
    prix.toLocaleString("fr-FR", {
      maximumFractionDigits: 2
    }) +
    " " +
    devise
  );
}

/* --------------------------------------------------------------------------
   CRÉATION D'UNE CARTE PRODUIT
   -------------------------------------------------------------------------- */

function creerCarte(produit, devise = "HTG") {
  const li = document.createElement("li");
  li.className = "card";
  li.id = "p-" + produit.id;

  const lien = document.createElement("a");
  lien.href =
    "product.html?id=" +
    encodeURIComponent(produit.id);
  lien.setAttribute(
    "aria-label",
    `Voir le produit ${produit.nom}`
  );

  const img = document.createElement("img");
  img.className = "card-img";
  img.src = produit.image;
  img.alt = produit.nom;
  img.loading = "lazy";

  img.addEventListener("error", () => {
    img.alt = `Image indisponible : ${produit.nom}`;
  }, { once: true });

  const nom = document.createElement("p");
  nom.className = "card-name";
  nom.textContent = produit.nom;

  const prix = document.createElement("p");
  prix.className = "card-price";
  prix.textContent = formaterPrix(produit.prix, devise);

  lien.append(img, nom, prix);
  li.appendChild(lien);

  return li;
}
