
/* ==========================================================================
   KN-BEAUTY — product.js
   Détail du produit, quantité, ajout au panier et produits similaires
   Dépendances : shop.js et cart.js
   Catalogue : product.json
   ========================================================================== */

"use strict";

const detail = document.getElementById("detail");
const idProduit = new URLSearchParams(window.location.search).get("id");

function afficherMessage(texte) {
  if (!detail) return;

  detail.replaceChildren();

  const message = document.createElement("p");
  message.className = "page-message";
  message.textContent = texte;

  detail.appendChild(message);
}

function afficherProduit(produit, devise) {
  if (!detail) return;

  document.title = `${produit.nom} | KN-BEAUTY`;

  detail.innerHTML = `
    <img class="detail-img" alt="" />

    <div class="detail-info">
      <a class="detail-cat" href="products.html"></a>
      <h2 class="detail-name"></h2>
      <p class="detail-price"></p>
      <p class="detail-desc"></p>

      <div class="qty" role="group" aria-label="Quantité">
        <button
          type="button"
          data-delta="-1"
          aria-label="Diminuer la quantité"
        >−</button>

        <output id="qty" aria-live="polite">1</output>

        <button
          type="button"
          data-delta="1"
          aria-label="Augmenter la quantité"
        >+</button>
      </div>

      <button class="btn add" type="button">
        Ajouter au panier
      </button>

      <p class="added" id="added" role="status" aria-live="polite"></p>
    </div>
  `;

  // Image
  const image = detail.querySelector(".detail-img");
  image.src = produit.image;
  image.alt = produit.nom;
  image.loading = "eager";

  image.addEventListener("error", () => {
    image.alt = `Image indisponible : ${produit.nom}`;
  }, { once: true });

  // Catégorie
  const categorie = detail.querySelector(".detail-cat");
  categorie.textContent = produit.categorie || "Beauté";
  categorie.href =
    "products.html?cat=" +
    encodeURIComponent(produit.categorie || "");

  // Informations du produit
  detail.querySelector(".detail-name").textContent = produit.nom;
  detail.querySelector(".detail-price").textContent =
    formaterPrix(produit.prix, devise);

  const description = detail.querySelector(".detail-desc");

  if (produit.description) {
    description.textContent = produit.description;
  } else {
    description.hidden = true;
  }

  // Gestion de la quantité
  const sortieQuantite = detail.querySelector("#qty");
  const boutonsQuantite = detail.querySelectorAll(
    ".qty button"
  );

  let quantite = 1;

  function actualiserQuantite() {
    sortieQuantite.textContent = quantite;

    boutonsQuantite.forEach((bouton) => {
      const delta = Number(bouton.dataset.delta);

      bouton.disabled =
        (delta < 0 && quantite <= 1) ||
        (delta > 0 && quantite >= QTE_MAX);
    });
  }

  boutonsQuantite.forEach((bouton) => {
    bouton.addEventListener("click", () => {
      const delta = Number(bouton.dataset.delta);

      quantite = Math.max(
        1,
        Math.min(QTE_MAX, quantite + delta)
      );

      actualiserQuantite();
    });
  });

  // Ajout au panier
  const boutonAjouter = detail.querySelector(".add");
  const message = detail.querySelector("#added");

  boutonAjouter.addEventListener("click", () => {
    if (
      typeof ajouterAuPanier !== "function" ||
      typeof QTE_MAX !== "number"
    ) {
      message.textContent =
        "Le panier est indisponible. Recharge la page et réessaie.";
      return;
    }

    ajouterAuPanier(produit.id, quantite);

    message.replaceChildren();

    const confirmation = document.createElement("span");
    confirmation.textContent = "Produit ajouté au panier. ";
    message.appendChild(confirmation);

    const lienPanier = document.createElement("a");
    lienPanier.href = "cart.html";
    lienPanier.textContent = "Voir le panier";
    message.appendChild(lienPanier);
  });

  actualiserQuantite();
}

/* --------------------------------------------------------------------------
   PRODUITS SIMILAIRES
   -------------------------------------------------------------------------- */

function afficherSimilaires(produit, produits, devise) {
  const section = document.getElementById("similar");
  const grille = document.getElementById("similar-grid");

  if (!section || !grille) return;

  const similaires = produits
    .filter((autre) =>
      autre.categorie === produit.categorie &&
      autre.id !== produit.id
    )
    .slice(0, 4);

  grille.replaceChildren();

  if (
    similaires.length === 0 ||
    typeof creerCarte !== "function"
  ) {
    section.hidden = true;
    return;
  }

  grille.append(
    ...similaires.map((autre) => creerCarte(autre, devise))
  );

  section.hidden = false;
}

/* --------------------------------------------------------------------------
   INITIALISATION
   -------------------------------------------------------------------------- */

if (!detail) {
  console.error("KN-BEAUTY : élément #detail introuvable.");
} else if (!idProduit) {
  afficherMessage(
    "Aucun produit sélectionné. Choisis un produit dans le catalogue."
  );
} else {
  chargerProduits()
    .then(({ devise, produits }) => {
      if (!Array.isArray(produits)) {
        throw new Error("Le catalogue ne contient pas de liste de produits valide.");
      }

      const produit = produits.find(
        (element) => element.id === idProduit
      );

      if (!produit) {
        afficherMessage(
          "Ce produit n'existe pas ou n'est plus disponible."
        );
        return;
      }

      afficherProduit(produit, devise || "HTG");
      afficherSimilaires(produit, produits, devise || "HTG");
    })
    .catch((erreur) => {
      console.error("Erreur sur la page produit :", erreur);

      afficherMessage(
        typeof MESSAGE_ERREUR !== "undefined"
          ? MESSAGE_ERREUR
          : "Impossible de charger ce produit. Vérifie le catalogue et réessaie."
      );
    });
}
