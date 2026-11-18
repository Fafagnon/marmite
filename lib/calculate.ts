/**
 * Logique pure de Marmite : mise à l'échelle, total, budget, exclusions.
 * Aucun appel réseau, aucun état. Chaque chiffre affiché par l'agent
 * vient d'ici, jamais du modèle.
 *
 * Règles d'arrondi à l'achat (on arrondit vers le haut, pour acheter
 * assez) :
 * - kg et L : au pas de 0,05, minimum 0,05.
 * - g : au pas de 5 g, minimum 5 g.
 * - pièce et sachet : à l'entier supérieur, minimum 1.
 *
 * Règles d'argent : FCFA entiers, chaque ligne est arrondie au franc,
 * le total est la somme exacte des lignes arrondies.
 */

import {
  PERSONNES_MAX,
  PERSONNES_REFERENCE,
  RECETTES,
  nomsRecettes,
  trouverIngredient,
  trouverIngredientParId,
  trouverRecette,
  type Recette,
  type Unite,
} from "./recipes";

export interface PrixUtilisateur {
  /** Clé : identifiant ou nom d'ingrédient. Valeur : prix en FCFA. */
  ingredient: string;
  prix: number;
}

export interface LigneListe {
  ingredientId: string;
  nom: string;
  quantite: number;
  unite: Unite;
  prixUnitaire: number;
  /** Montant de la ligne en FCFA entiers. */
  montant: number;
  /** "estimation" : prix indicatif du fichier. "utilisateur" : prix donné. */
  prixSource: "estimation" | "utilisateur";
}

export interface ResultatCalcul {
  ok: true;
  recetteId: string;
  recetteNom: string;
  personnes: number;
  lignes: LigneListe[];
  /** Total en FCFA entiers, égal à la somme des lignes. */
  total: number;
  /** Budget donné par l'utilisateur, si fourni. */
  budget?: number;
  /** Budget moins total. Négatif quand le budget est dépassé. */
  ecartBudget?: number;
  /** Total moins budget, seulement quand le budget est dépassé. */
  depassement?: number;
  /** Noms des ingrédients exclus. */
  exclusions: string[];
  /** Messages à relayer : ingrédient central exclu, nom ignoré, etc. */
  avertissements: string[];
  /** Vrai quand un ingrédient central a été exclu. */
  recetteInadaptee: boolean;
  /** Vrai quand au moins une ligne utilise un prix indicatif. */
  prixEstimes: boolean;
  etapes: string[];
}

export type CodeErreur =
  | "recette_inconnue"
  | "personnes_invalides"
  | "budget_invalide"
  | "prix_invalide"
  | "tous_exclus";

export interface ErreurCalcul {
  ok: false;
  code: CodeErreur;
  message: string;
  /** Liste des recettes, fournie pour l'erreur recette_inconnue. */
  recettes?: string[];
}

export type CalculListe = ResultatCalcul | ErreurCalcul;

export interface OptionsCalcul {
  recette: string;
  personnes: number;
  budget?: number;
  /** Identifiants ou noms d'ingrédients à retirer. */
  exclus?: string[];
  /** Prix donnés par l'utilisateur, qui remplacent les estimations. */
  prix?: PrixUtilisateur[];
}

/** Arrondit une quantité vers le haut, au pas d'achat de son unité. */
export function arrondirAchat(quantite: number, unite: Unite): number {
  if (quantite <= 0) return 0;
  switch (unite) {
    case "kg":
    case "L": {
      const pas = 0.05;
      const marches = Math.ceil(quantite / pas - 1e-9);
      // Arrondi à 2 décimales pour effacer la poussière de virgule
      // flottante : 6 pas de 0,05 doivent donner 0,3 exactement.
      return Math.round(marches * pas * 100) / 100;
    }
    case "g":
      return Math.ceil(quantite / 5 - 1e-9) * 5;
    case "piece":
    case "sachet":
      return Math.ceil(quantite - 1e-9);
  }
}

/** Formate un montant entier en FCFA, exemple : 1250 devient "1 250 F". */
export function formaterFCFA(montant: number): string {
  return `${Math.round(montant).toLocaleString("fr-FR")} F`;
}

/** Formate une quantité : 1, 0,5, 0,25, sans zéros inutiles. */
export function formaterQuantite(quantite: number): string {
  const arrondi = Math.round(quantite * 100) / 100;
  return arrondi.toLocaleString("fr-FR", { maximumFractionDigits: 2 });
}

export function libellerUnite(unite: Unite, quantite: number): string {
  if (unite === "piece") return quantite > 1 ? "pièces" : "pièce";
  if (unite === "sachet") return quantite > 1 ? "sachets" : "sachet";
  return unite;
}

function erreur(code: CodeErreur, message: string, recettes?: string[]): ErreurCalcul {
  return recettes ? { ok: false, code, message, recettes } : { ok: false, code, message };
}

export function calculerListe(options: OptionsCalcul): CalculListe {
  const recette: Recette | undefined = trouverRecette(options.recette);
  if (!recette) {
    return erreur(
      "recette_inconnue",
      `Je ne connais pas la recette "${options.recette}". Voici les recettes que je connais.`,
      nomsRecettes(),
    );
  }

  const personnes = options.personnes;
  if (!Number.isInteger(personnes) || personnes < 1 || personnes > PERSONNES_MAX) {
    return erreur(
      "personnes_invalides",
      `Le nombre de personnes doit être un nombre entier entre 1 et ${PERSONNES_MAX}.`,
    );
  }

  if (
    options.budget !== undefined &&
    (!Number.isInteger(options.budget) || options.budget < 0)
  ) {
    return erreur(
      "budget_invalide",
      "Le budget doit être un montant positif en FCFA, sans virgule.",
    );
  }

  const avertissements: string[] = [];

  // Prix donnés par l'utilisateur. Valeur invalide : erreur, car le total
  // serait faux. Nom inconnu : avertissement, le prix est ignoré.
  const prixParIngredient = new Map<string, number>();
  for (const entree of options.prix ?? []) {
    if (typeof entree.prix !== "number" || !Number.isFinite(entree.prix) || entree.prix <= 0) {
      return erreur(
        "prix_invalide",
        `Le prix donné pour "${entree.ingredient}" n'est pas un montant positif.`,
      );
    }
    const ingredient = trouverIngredient(entree.ingredient);
    if (!ingredient) {
      avertissements.push(
        `Je ne connais pas l'ingrédient "${entree.ingredient}", son prix est ignoré.`,
      );
      continue;
    }
    prixParIngredient.set(ingredient.id, Math.round(entree.prix));
  }

  // Exclusions. Nom inconnu : avertissement, l'exclusion est ignorée.
  const exclusIds = new Set<string>();
  const exclusions: string[] = [];
  for (const nom of options.exclus ?? []) {
    const ingredient = trouverIngredient(nom);
    if (!ingredient) {
      avertissements.push(
        `Je ne connais pas l'ingrédient "${nom}", l'exclusion est ignorée.`,
      );
      continue;
    }
    if (!exclusIds.has(ingredient.id)) {
      exclusIds.add(ingredient.id);
      exclusions.push(ingredient.nom);
    }
  }

  const facteur = personnes / PERSONNES_REFERENCE;
  const lignes: LigneListe[] = [];
  let prixEstimes = false;

  for (const item of recette.ingredients) {
    if (exclusIds.has(item.ingredientId)) continue;
    const ingredient = trouverIngredientParId(item.ingredientId);
    if (!ingredient) continue;
    const quantite = arrondirAchat(item.quantite * facteur, ingredient.unite);
    const prixUtilisateur = prixParIngredient.get(ingredient.id);
    const prixUnitaire = prixUtilisateur ?? ingredient.prixIndicatif;
    const prixSource = prixUtilisateur !== undefined ? "utilisateur" : "estimation";
    if (prixSource === "estimation") prixEstimes = true;
    lignes.push({
      ingredientId: ingredient.id,
      nom: ingredient.nom,
      quantite: Math.round(quantite * 100) / 100,
      unite: ingredient.unite,
      prixUnitaire,
      montant: Math.round(quantite * prixUnitaire),
      prixSource,
    });
  }

  if (lignes.length === 0) {
    return erreur(
      "tous_exclus",
      "Tous les ingrédients de cette recette sont exclus, je ne peux pas faire de liste de courses.",
    );
  }

  const recetteInadaptee = recette.ingredientsCentrale.some((id) => exclusIds.has(id));
  if (recetteInadaptee) {
    const centraux = recette.ingredientsCentrale
      .filter((id) => exclusIds.has(id))
      .map((id) => trouverIngredientParId(id)?.nom ?? id);
    avertissements.push(
      `Attention, ${centraux.join(", ")} est un ingrédient central de cette recette. Sans cet ingrédient, la recette change de nature, choisis plutôt une autre recette.`,
    );
  }

  const total = lignes.reduce((somme, ligne) => somme + ligne.montant, 0);

  const resultat: ResultatCalcul = {
    ok: true,
    recetteId: recette.id,
    recetteNom: recette.nom,
    personnes,
    lignes,
    total,
    exclusions,
    avertissements,
    recetteInadaptee,
    prixEstimes,
    etapes: recette.etapes,
  };

  if (options.budget !== undefined) {
    resultat.budget = options.budget;
    resultat.ecartBudget = options.budget - total;
    if (total > options.budget) {
      resultat.depassement = total - options.budget;
    }
  }

  return resultat;
}

/** Liste des recettes, pour l'outil lister_recettes. */
export function listerRecettes(): { id: string; nom: string; description: string }[] {
  return RECETTES.map((recette) => ({
    id: recette.id,
    nom: recette.nom,
    description: recette.description,
  }));
}
