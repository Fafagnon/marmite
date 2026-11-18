/**
 * Simulations de Marmite, à lancer avec : npm run simulate
 *
 * Chaque vérification teste le vrai code de lib/, jamais une copie.
 * Le script sort avec un code non nul si une seule vérification échoue.
 */

import {
  arrondirAchat,
  calculerListe,
  formaterFCFA,
  formaterQuantite,
  type ResultatCalcul,
} from "../lib/calculate";
import {
  INGREDIENTS,
  PERSONNES_MAX,
  PERSONNES_REFERENCE,
  RECETTES,
  trouverIngredientParId,
} from "../lib/recipes";
import { DECLARATIONS_OUTILS, executerOutil } from "../lib/tools";

let reussites = 0;
let total = 0;
const echecs: string[] = [];

function check(nom: string, condition: boolean, detail = "") {
  total += 1;
  if (condition) {
    reussites += 1;
    console.log(`OK   ${nom}`);
  } else {
    echecs.push(nom);
    console.log(`KO   ${nom}${detail ? ` : ${detail}` : ""}`);
  }
}

function ligneDe(resultat: ResultatCalcul, id: string) {
  return resultat.lignes.find((ligne) => ligne.ingredientId === id);
}

function calculOk(valeur: unknown): valeur is ResultatCalcul {
  return (
    typeof valeur === "object" &&
    valeur !== null &&
    (valeur as { ok?: unknown }).ok === true
  );
}

// Données : intégrité de la base recettes et prix.
check("6 recettes", RECETTES.length === 6);
check("référence 4 personnes", PERSONNES_REFERENCE === 4);
check("maximum 50 personnes", PERSONNES_MAX === 50);
check(
  "identifiants de recettes uniques",
  new Set(RECETTES.map((r) => r.id)).size === RECETTES.length,
);
check(
  "identifiants d'ingrédients uniques",
  new Set(INGREDIENTS.map((i) => i.id)).size === INGREDIENTS.length,
);
for (const recette of RECETTES) {
  check(
    `${recette.id} : au moins 5 ingrédients`,
    recette.ingredients.length >= 5,
  );
  check(
    `${recette.id} : tous les ingrédients existent, quantités positives`,
    recette.ingredients.every((item) => {
      const ingredient = trouverIngredientParId(item.ingredientId);
      return ingredient !== undefined && item.quantite > 0;
    }),
  );
  check(
    `${recette.id} : ingrédients centraux dans la recette`,
    recette.ingredientsCentrale.every((id) =>
      recette.ingredients.some((item) => item.ingredientId === id),
    ),
  );
  check(
    `${recette.id} : au moins 3 étapes`,
    recette.etapes.length >= 3,
  );
}
check(
  "tous les prix indicatifs sont des entiers positifs",
  INGREDIENTS.every(
    (ingredient) =>
      Number.isInteger(ingredient.prixIndicatif) && ingredient.prixIndicatif > 0,
  ),
);

// Arrondis à l'achat.
check("arrondi 0,0625 L devient 0,1", arrondirAchat(0.0625, "L") === 0.1);
check("arrondi 0,125 L devient 0,15", arrondirAchat(0.125, "L") === 0.15);
check("arrondi 0,3 kg reste 0,3", arrondirAchat(0.3, "kg") === 0.3);
check("arrondi 0,31 kg devient 0,35", arrondirAchat(0.31, "kg") === 0.35);
check("arrondi 0,75 pièce devient 1", arrondirAchat(0.75, "piece") === 1);
check("arrondi 4,5 pièces devient 5", arrondirAchat(4.5, "piece") === 5);
check("arrondi 2 pièces reste 2", arrondirAchat(2, "piece") === 2);
check("arrondi 12 g devient 15", arrondirAchat(12, "g") === 15);
check("arrondi 20 g reste 20", arrondirAchat(20, "g") === 20);
check("arrondi 0 reste 0", arrondirAchat(0, "kg") === 0);

// Mise à l'échelle, recette de référence : riz gras.
const ref4 = calculerListe({ recette: "riz-gras", personnes: 4 });
check("riz gras 4 personnes : calcul ok", calculOk(ref4));
if (calculOk(ref4)) {
  check("riz gras 4 personnes : total 4015 F", ref4.total === 4015, `total=${ref4.total}`);
  check("riz gras 4 personnes : riz 1 kg", ligneDe(ref4, "riz")?.quantite === 1);
  check(
    "riz gras 4 personnes : prix tous estimés",
    ref4.prixEstimes === true && ref4.lignes.every((l) => l.prixSource === "estimation"),
  );
}

const ref1 = calculerListe({ recette: "riz-gras", personnes: 1 });
check("riz gras 1 personne : calcul ok", calculOk(ref1));
if (calculOk(ref1)) {
  check("riz gras 1 personne : riz 0,25 kg", ligneDe(ref1, "riz")?.quantite === 0.25);
  check("riz gras 1 personne : oignon 1 pièce", ligneDe(ref1, "oignon")?.quantite === 1);
  check("riz gras 1 personne : huile 0,1 L", ligneDe(ref1, "huile")?.quantite === 0.1);
  check("riz gras 1 personne : cube 1 pièce", ligneDe(ref1, "cube")?.quantite === 1);
}

const ref2 = calculerListe({ recette: "riz-gras", personnes: 2 });
check("riz gras 2 personnes : calcul ok", calculOk(ref2));
if (calculOk(ref2)) {
  check("riz gras 2 personnes : riz 0,5 kg", ligneDe(ref2, "riz")?.quantite === 0.5);
  check("riz gras 2 personnes : oignon 2 pièces", ligneDe(ref2, "oignon")?.quantite === 2);
  check("riz gras 2 personnes : huile 0,15 L", ligneDe(ref2, "huile")?.quantite === 0.15);
}

const ref6 = calculerListe({ recette: "riz-gras", personnes: 6 });
check("riz gras 6 personnes : calcul ok", calculOk(ref6));
if (calculOk(ref6)) {
  check("riz gras 6 personnes : riz 1,5 kg", ligneDe(ref6, "riz")?.quantite === 1.5);
  check("riz gras 6 personnes : poulet 1,15 kg", ligneDe(ref6, "poulet")?.quantite === 1.15);
  check("riz gras 6 personnes : oignon 5 pièces", ligneDe(ref6, "oignon")?.quantite === 5);
  check("riz gras 6 personnes : huile 0,4 L", ligneDe(ref6, "huile")?.quantite === 0.4);
}

const ref8 = calculerListe({ recette: "riz-gras", personnes: 8 });
check("riz gras 8 personnes : calcul ok", calculOk(ref8));
if (calculOk(ref8)) {
  check("riz gras 8 personnes : riz 2 kg", ligneDe(ref8, "riz")?.quantite === 2);
  check("riz gras 8 personnes : poulet 1,5 kg", ligneDe(ref8, "poulet")?.quantite === 1.5);
}

const ref10 = calculerListe({ recette: "riz-gras", personnes: 10 });
check("riz gras 10 personnes : calcul ok", calculOk(ref10));
if (calculOk(ref10)) {
  check("riz gras 10 personnes : riz 2,5 kg", ligneDe(ref10, "riz")?.quantite === 2.5);
  check("riz gras 10 personnes : poulet 1,9 kg", ligneDe(ref10, "poulet")?.quantite === 1.9);
  check("riz gras 10 personnes : oignon 8 pièces", ligneDe(ref10, "oignon")?.quantite === 8);
}

// Nombre de personnes invalide.
check(
  "0 personne refusé",
  (() => {
    const r = calculerListe({ recette: "riz-gras", personnes: 0 });
    return !r.ok && r.code === "personnes_invalides";
  })(),
);
check(
  "-3 personnes refusé",
  (() => {
    const r = calculerListe({ recette: "riz-gras", personnes: -3 });
    return !r.ok && r.code === "personnes_invalides";
  })(),
);
check(
  "2,5 personnes refusé",
  (() => {
    const r = calculerListe({ recette: "riz-gras", personnes: 2.5 });
    return !r.ok && r.code === "personnes_invalides";
  })(),
);
check(
  "51 personnes refusé",
  (() => {
    const r = calculerListe({ recette: "riz-gras", personnes: 51 });
    return !r.ok && r.code === "personnes_invalides";
  })(),
);
check(
  "50 personnes accepté",
  calculOk(calculerListe({ recette: "riz-gras", personnes: 50 })),
);

// Budget : montants exacts.
const budgetBas = calculerListe({ recette: "riz-gras", personnes: 4, budget: 3000 });
check("budget 3000 F : calcul ok", calculOk(budgetBas));
if (calculOk(budgetBas)) {
  check("budget 3000 F : dépassement exact 1015 F", budgetBas.depassement === 1015);
  check("budget 3000 F : écart exact -1015 F", budgetBas.ecartBudget === -1015);
}
const budgetHaut = calculerListe({ recette: "riz-gras", personnes: 4, budget: 5000 });
check("budget 5000 F : calcul ok", calculOk(budgetHaut));
if (calculOk(budgetHaut)) {
  check("budget 5000 F : pas de dépassement", budgetHaut.depassement === undefined);
  check("budget 5000 F : reste exact 985 F", budgetHaut.ecartBudget === 985);
}
const budgetEgal = calculerListe({ recette: "riz-gras", personnes: 4, budget: 4015 });
check("budget 4015 F : calcul ok", calculOk(budgetEgal));
if (calculOk(budgetEgal)) {
  check("budget 4015 F : écart 0, pas de dépassement", budgetEgal.ecartBudget === 0 && budgetEgal.depassement === undefined);
}
check(
  "budget négatif refusé",
  (() => {
    const r = calculerListe({ recette: "riz-gras", personnes: 4, budget: -100 });
    return !r.ok && r.code === "budget_invalide";
  })(),
);
check(
  "budget non entier refusé",
  (() => {
    const r = calculerListe({ recette: "riz-gras", personnes: 4, budget: 100.5 });
    return !r.ok && r.code === "budget_invalide";
  })(),
);

// Exclusions.
const sansPoulet = calculerListe({ recette: "riz-gras", personnes: 4, exclus: ["poulet"] });
check("exclusion poulet : calcul ok", calculOk(sansPoulet));
if (calculOk(sansPoulet)) {
  check("exclusion poulet : ligne absente", ligneDe(sansPoulet, "poulet") === undefined);
  check("exclusion poulet : total 2140 F", sansPoulet.total === 2140, `total=${sansPoulet.total}`);
  check("exclusion poulet : recette inadaptée", sansPoulet.recetteInadaptee === true);
  check("exclusion poulet : avertissement présent", sansPoulet.avertissements.length >= 1);
  check("exclusion poulet : exclusion listée", sansPoulet.exclusions.includes("Poulet"));
}
const sansArachide = calculerListe({
  recette: "riz-sauce-arachide-poulet",
  personnes: 4,
  exclus: ["arachide"],
});
check("exclusion partielle arachide : calcul ok", calculOk(sansArachide));
if (calculOk(sansArachide)) {
  check(
    "exclusion partielle arachide : pâte retirée",
    ligneDe(sansArachide, "pate-arachide") === undefined,
  );
  check("exclusion partielle arachide : recette inadaptée", sansArachide.recetteInadaptee === true);
}
const sansOignon = calculerListe({ recette: "riz-gras", personnes: 4, exclus: ["oignon"] });
check("exclusion oignon : calcul ok", calculOk(sansOignon));
if (calculOk(sansOignon)) {
  check("exclusion oignon : recette adaptée", sansOignon.recetteInadaptee === false);
  check("exclusion oignon : ligne absente", ligneDe(sansOignon, "oignon") === undefined);
}
const exclusionInconnue = calculerListe({
  recette: "riz-gras",
  personnes: 4,
  exclus: ["chocolat"],
});
check("exclusion inconnue : calcul ok avec avertissement", calculOk(exclusionInconnue));
if (calculOk(exclusionInconnue)) {
  check(
    "exclusion inconnue : avertissement présent",
    exclusionInconnue.avertissements.length >= 1,
  );
  check("exclusion inconnue : 9 lignes gardées", exclusionInconnue.lignes.length === 9);
}
check(
  "tous ingrédients exclus : erreur",
  (() => {
    const r = calculerListe({
      recette: "riz-gras",
      personnes: 4,
      exclus: ["riz", "poulet", "tomate", "concentre-tomate", "oignon", "carotte", "huile", "cube", "piment"],
    });
    return !r.ok && r.code === "tous_exclus";
  })(),
);

// Recette inconnue et variantes de nom.
check(
  "recette pizza : erreur avec liste des 6",
  (() => {
    const r = calculerListe({ recette: "pizza", personnes: 4 });
    return !r.ok && r.code === "recette_inconnue" && (r.recettes?.length ?? 0) === 6;
  })(),
);
check(
  "recette vide : erreur",
  (() => {
    const r = calculerListe({ recette: "", personnes: 4 });
    return !r.ok && r.code === "recette_inconnue";
  })(),
);
check(
  "recette ambiguë riz : erreur",
  (() => {
    const r = calculerListe({ recette: "riz", personnes: 4 });
    return !r.ok && r.code === "recette_inconnue";
  })(),
);
check("variante RIZ GRAS acceptée", calculOk(calculerListe({ recette: "RIZ GRAS", personnes: 4 })));
check("variante riz gras acceptée", calculOk(calculerListe({ recette: "riz gras", personnes: 4 })));
check(
  "variante sans accent Attieke acceptée",
  calculOk(calculerListe({ recette: "Attieke poisson frit", personnes: 4 })),
);
check("variante identifiant riz-gras acceptée", calculOk(calculerListe({ recette: "riz-gras", personnes: 4 })));

// Prix donnés par l'utilisateur.
const prixPoulet = calculerListe({
  recette: "riz-gras",
  personnes: 4,
  prix: [{ ingredient: "poulet", prix: 2000 }],
});
check("prix utilisateur poulet 2000 F : calcul ok", calculOk(prixPoulet));
if (calculOk(prixPoulet)) {
  check("prix utilisateur : total 3640 F", prixPoulet.total === 3640, `total=${prixPoulet.total}`);
  check(
    "prix utilisateur : ligne marquée utilisateur",
    ligneDe(prixPoulet, "poulet")?.prixSource === "utilisateur" &&
      ligneDe(prixPoulet, "poulet")?.prixUnitaire === 2000,
  );
  check(
    "prix utilisateur : autres lignes estimées",
    ligneDe(prixPoulet, "riz")?.prixSource === "estimation" && prixPoulet.prixEstimes === true,
  );
}
const prixTous = calculerListe({
  recette: "riz-gras",
  personnes: 4,
  prix: [
    { ingredient: "riz", prix: 600 },
    { ingredient: "poulet", prix: 2000 },
    { ingredient: "tomate", prix: 500 },
    { ingredient: "concentre-tomate", prix: 300 },
    { ingredient: "oignon", prix: 100 },
    { ingredient: "carotte", prix: 800 },
    { ingredient: "huile", prix: 1200 },
    { ingredient: "cube", prix: 50 },
    { ingredient: "piment", prix: 25 },
  ],
});
check("tous prix utilisateur : calcul ok", calculOk(prixTous));
if (calculOk(prixTous)) {
  check("tous prix utilisateur : plus aucune estimation", prixTous.prixEstimes === false);
}
check(
  "prix 0 refusé",
  (() => {
    const r = calculerListe({
      recette: "riz-gras",
      personnes: 4,
      prix: [{ ingredient: "poulet", prix: 0 }],
    });
    return !r.ok && r.code === "prix_invalide";
  })(),
);
check(
  "prix négatif refusé",
  (() => {
    const r = calculerListe({
      recette: "riz-gras",
      personnes: 4,
      prix: [{ ingredient: "poulet", prix: -100 }],
    });
    return !r.ok && r.code === "prix_invalide";
  })(),
);
const prixInconnu = calculerListe({
  recette: "riz-gras",
  personnes: 4,
  prix: [{ ingredient: "chocolat", prix: 500 }],
});
check("prix ingrédient inconnu : calcul ok avec avertissement", calculOk(prixInconnu));
if (calculOk(prixInconnu)) {
  check("prix ingrédient inconnu : avertissement présent", prixInconnu.avertissements.length >= 1);
  check("prix ingrédient inconnu : total inchangé 4015 F", prixInconnu.total === 4015);
}

// Relances : changement de personnes, de recette, de prix.
const relanceA = calculerListe({ recette: "riz-gras", personnes: 4 });
const relanceB = calculerListe({ recette: "riz-gras", personnes: 6 });
check(
  "relance personnes 4 vers 6 : riz 1 vers 1,5 kg, total augmente",
  calculOk(relanceA) &&
    calculOk(relanceB) &&
    ligneDe(relanceA, "riz")?.quantite === 1 &&
    ligneDe(relanceB, "riz")?.quantite === 1.5 &&
    relanceB.total > relanceA.total,
);
const relanceC = calculerListe({ recette: "fufu-sauce-graine", personnes: 6 });
check(
  "relance changement de recette : nom change",
  calculOk(relanceC) && relanceC.recetteNom === "Fufu sauce graine",
);
const relanceD = calculerListe({
  recette: "riz-gras",
  personnes: 4,
  prix: [{ ingredient: "poulet", prix: 3000 }],
});
check(
  "relance changement de prix : écart exact de 375 F",
  calculOk(relanceA) && calculOk(relanceD) && relanceD.total - relanceA.total === 375,
);
const relanceE = calculerListe({ recette: "riz-gras", personnes: 4, exclus: ["oignon"] });
const relanceF = calculerListe({ recette: "riz-gras", personnes: 4 });
check(
  "relance retrait d'exclusion : oignon revient, total de départ",
  calculOk(relanceE) &&
    calculOk(relanceF) &&
    ligneDe(relanceE, "oignon") === undefined &&
    ligneDe(relanceF, "oignon") !== undefined &&
    calculOk(relanceA) &&
    relanceF.total === relanceA.total,
);

// Invariants sur toutes les recettes et tous les nombres testés.
for (const recette of RECETTES) {
  for (const personnes of [1, 2, 3, 4, 5, 6, 8, 10, 12, 20, 50]) {
    const resultat = calculerListe({ recette: recette.id, personnes });
    const somme = calculOk(resultat)
      ? resultat.lignes.reduce((s, l) => s + l.montant, 0)
      : -1;
    check(
      `invariant ${recette.id} ${personnes} pers : total égal somme des lignes`,
      calculOk(resultat) &&
        resultat.total === somme &&
        resultat.lignes.every((l) => Number.isInteger(l.montant) && l.montant > 0 && l.quantite > 0),
    );
  }
}

// Formatages.
check("formaterFCFA 1250 contient 250 et F", formaterFCFA(1250).includes("250") && formaterFCFA(1250).endsWith("F"));
check("formaterFCFA 0 donne 0 F", formaterFCFA(0) === "0 F");
check("formaterQuantite 1 donne 1", formaterQuantite(1) === "1");
check("formaterQuantite 0,5 sans zéros inutiles", formaterQuantite(0.5) === "0,5");

// Outils : répartiteur et déclarations.
const liste = executerOutil("lister_recettes", {});
check(
  "outil lister_recettes : 6 recettes avec id, nom, description",
  liste.ok === true &&
    Array.isArray(liste.recettes) &&
    liste.recettes.length === 6 &&
    (liste.recettes as { id?: unknown; nom?: unknown; description?: unknown }[]).every(
      (r) => typeof r.id === "string" && typeof r.nom === "string" && typeof r.description === "string",
    ),
);
const viaOutil = executerOutil("calculer_liste", { recette: "riz-gras", personnes: 4 });
check(
  "outil calculer_liste : même total que l'appel direct",
  calculOk(viaOutil) && calculOk(relanceA) && viaOutil.total === relanceA.total,
);
check("outil inconnu : erreur", executerOutil("cuisiner", {}).ok === false);
check(
  "outil calculer_liste sans arguments : erreur",
  executerOutil("calculer_liste", {}).ok === false,
);
check(
  "déclarations : 2 outils, recette et personnes requis",
  DECLARATIONS_OUTILS.length === 2 &&
    DECLARATIONS_OUTILS.some(
      (d) =>
        d.name === "calculer_liste" &&
        Array.isArray((d.parameters as { required?: unknown }).required) &&
        ((d.parameters as { required: string[] }).required.includes("recette") ?? false) &&
        (d.parameters as { required: string[] }).required.includes("personnes"),
    ),
);

// Résumé.
console.log("");
console.log(`${reussites}/${total} vérifications réussies.`);
if (echecs.length > 0) {
  console.log("Échecs :");
  for (const nom of echecs) console.log(` - ${nom}`);
  process.exit(1);
}
