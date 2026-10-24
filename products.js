
/* ==========================================================================
   KN-BEAUTY — products.js
   Catalogue : catégories, recherche, tri et mise en évidence
   Dépendances : shop.js
   Données : product.json
   ========================================================================== */

"use strict";

const grid = document.getElementById("grid");
const chips = document.getElementById("chips");
const search = document.getElementById("search");
const sort = document.getElementById("sort");
const count = document.getElementById("count");
const empty = document.getElementById("empty");

const TOUT = "Tout";

let tous = [];
let devise = "HTG";
let categorieActive = TOUT;

// --------------------------------------------------------------------------
// Normalisation : ignore les accents et la casse
// --------------------------------------------------------------------------

function normaliser(texte = "") {
  return String(texte)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("fr");
}

// --------------------------------------------------------------------------
// Tri des produits
// --------------------------------------------------------------------------

function trier(liste) {
  const copie = [...liste];

  if (!sort) return copie;

  switch (sort.value) {
    case "prix-asc":
      return copie.sort((a, b) => a.prix - b.prix);

    case "prix-desc":
      return copie.sort((a, b) => b.prix - a.prix);

    case "nom":
      return copie.sort((a, b) =>
        a.nom.localeCompare(b.nom, "fr", {
          sensitivity: "base"
        })
      );

    default:
      return copie;
  }
}

// --------------------------------------------------------------------------
// Affichage du catalogue
// --------------------------------------------------------------------------

function afficher() {
  if (!grid) return;

  const recherche = normaliser(search?.value.trim() || "");

  const visibles = trier(
    tous.filter((produit) => {
      const bonneCategorie =
        categorieActive === TOUT ||
        produit.categorie === categorieActive;

      const texteProduit = normaliser(
        `${produit.nom} ${produit.categorie || ""} ${produit.description || ""}`
      );

      const bonneRecherche = texteProduit.includes(recherche);

      return bonneCategorie && bonneRecherche;
    })
  );

  grid.replaceChildren(
    ...visibles.map((produit) => creerCarte(produit, devise))
  );

  if (empty) {
    empty.hidden = visibles.length > 0;
    empty.textContent = visibles.length
      ? ""
      : "Aucun produit ne correspond à ta recherche.";
  }

  if (count) {
    count.textContent =
      `${visibles.length} ${visibles.length > 1 ? "produits" : "produit"}`;
  }
}

// --------------------------------------------------------------------------
// Création des boutons de catégorie
// --------------------------------------------------------------------------

function creerPastilles() {
  if (!chips) return;

  chips.replaceChildren();

  const categories = [
    TOUT,
    ...new Set(
      tous
        .map((produit) => produit.categorie)
        .filter(Boolean)
    )
  ];

  categories.forEach((nom) => {
    const bouton = document.createElement("button");

    bouton.type = "button";
    bouton.className =
      "chip" + (nom === categorieActive ? " active" : "");
    bouton.textContent = nom;
    bouton.setAttribute(
      "aria-pressed",
      String(nom === categorieActive)
    );

    bouton.addEventListener("click", () => {
      categorieActive = nom;

      chips.querySelectorAll(".chip").forEach((chip) => {
        const actif = chip.textContent === nom;

        chip.classList.toggle("active", actif);
        chip.setAttribute("aria-pressed", String(actif));
      });

      afficher();
    });

    chips.appendChild(bouton);
  });
}

// --------------------------------------------------------------------------
// Mise en évidence d'un produit indiqué par son identifiant dans l'URL
// Exemple : products.html#p-serum-vitamine-c
// --------------------------------------------------------------------------

function montrerProduitDuLien() {
  if (!location.hash) return;

  let identifiant;

  try {
    identifiant = decodeURIComponent(location.hash.slice(1));
  } catch {
    identifiant = location.hash.slice(1);
  }

  const carte = document.getElementById(identifiant);

  if (!carte) return;

  carte.scrollIntoView({
    behavior: "smooth",
    block: "center"
  });

  carte.classList.add("highlight");
}

// --------------------------------------------------------------------------
// Initialisation
// --------------------------------------------------------------------------

async function initialiserCatalogue() {
  try {
    const donnees = await chargerProduits();

    tous = donnees.produits;
    devise = donnees.devise || "HTG";

    // Catégorie éventuellement demandée dans l'URL.
    const demandee =
      new URLSearchParams(location.search).get("cat");

    if (
      demandee &&
      tous.some((produit) => produit.categorie === demandee)
    ) {
      categorieActive = demandee;
    }

    creerPastilles();
    afficher();

    // Le navigateur doit d'abord avoir rendu les cartes.
    requestAnimationFrame(montrerProduitDuLien);
  } catch (erreur) {
    console.error("KN-BEAUTY : impossible de charger le catalogue.", erreur);

    if (count) count.textContent = "";

    if (grid) grid.replaceChildren();

    if (empty) {
      empty.textContent =
        typeof MESSAGE_ERREUR !== "undefined"
          ? MESSAGE_ERREUR
          : "Impossible de charger les produits. Réessaie plus tard.";

      empty.hidden = false;
    }
  }
}

// Les événements ne sont enregistrés qu'une fois.
search?.addEventListener("input", afficher);
sort?.addEventListener("change", afficher);

initialiserCatalogue();
