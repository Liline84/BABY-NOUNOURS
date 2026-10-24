
/* ==========================================================================
   KN-BEAUTY — home.js
   Page d'accueil : nouveautés, produits populaires et rails défilants
   Dépendances : shop.js
   Catalogue : product.json
   ========================================================================== */

"use strict";

// Correspondance entre les rails HTML et les propriétés du catalogue.
const FILTRES_RAILS = {
  nouveautes: (produit) => produit.nouveau === true,
  vendus: (produit) => produit.populaire === true
};

const MAX_PAR_RAIL = 8;

// --------------------------------------------------------------------------
// Tuile « Voir plus »
// --------------------------------------------------------------------------

function creerTuileVoirPlus() {
  const li = document.createElement("li");
  li.className = "card more";

  const lien = document.createElement("a");
  lien.href = LIEN_LISTE;
  lien.setAttribute("aria-label", "Voir tous les produits");

  const fleche = document.createElement("span");
  fleche.className = "arrow";
  fleche.setAttribute("aria-hidden", "true");
  fleche.textContent = "›";

  const texte = document.createElement("span");
  texte.textContent = "Voir plus";

  lien.append(fleche, texte);
  li.appendChild(lien);

  return li;
}

// --------------------------------------------------------------------------
// Affichage d'une erreur dans un rail
// --------------------------------------------------------------------------

function afficherErreurRail(rail) {
  const li = document.createElement("li");
  li.className = "rail-error";
  li.textContent = MESSAGE_ERREUR;

  rail.replaceChildren(li);
}

// --------------------------------------------------------------------------
// Chargement des rails de la page d'accueil
// --------------------------------------------------------------------------

async function initialiserRails() {
  const rails = document.querySelectorAll("[data-rail]");

  if (!rails.length) return;

  try {
    const { devise, produits } = await chargerProduits();

    rails.forEach((rail) => {
      const nomRail = rail.dataset.rail;
      const filtre = FILTRES_RAILS[nomRail];

      // Évite les rails inconnus ou mal configurés.
      if (!filtre) {
        rail.replaceChildren();
        return;
      }

      const selection = produits
        .filter(filtre)
        .slice(0, MAX_PAR_RAIL);

      rail.replaceChildren();

      if (selection.length === 0) {
        const message = document.createElement("li");
        message.className = "rail-error";
        message.textContent =
          "Aucun produit disponible dans cette sélection pour le moment.";

        rail.appendChild(message);
        return;
      }

      const cartes = selection.map((produit) =>
        creerCarte(produit, devise)
      );

      rail.append(...cartes, creerTuileVoirPlus());
    });
  } catch (erreur) {
    console.error("KN-BEAUTY : erreur de chargement de l'accueil.", erreur);

    rails.forEach(afficherErreurRail);
  }
}

// --------------------------------------------------------------------------
// Flèches de navigation des rails
// --------------------------------------------------------------------------

function initialiserNavigationRails() {
  document.querySelectorAll(".rail-wrap").forEach((wrap) => {
    const rail = wrap.querySelector(".rail");
    const precedent = wrap.querySelector(".prev");
    const suivant = wrap.querySelector(".next");

    // Ignore les blocs incomplets.
    if (!rail || !precedent || !suivant) return;

    // Évite d'enregistrer plusieurs fois les mêmes événements.
    if (wrap.dataset.navigationInitialisee === "true") return;
    wrap.dataset.navigationInitialisee = "true";

    const pas = () => Math.max(rail.clientWidth * 0.8, 200);

    precedent.addEventListener("click", () => {
      rail.scrollBy({
        left: -pas(),
        behavior: "smooth"
      });
    });

    suivant.addEventListener("click", () => {
      rail.scrollBy({
        left: pas(),
        behavior: "smooth"
      });
    });
  });
}

// --------------------------------------------------------------------------
// Démarrage
// --------------------------------------------------------------------------

initialiserRails();
initialiserNavigationRails();
