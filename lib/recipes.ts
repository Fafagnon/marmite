/**
 * BROUILLON A VALIDER PAR SAM.
 *
 * Ce fichier est la SEULE source des recettes et des prix de Marmite.
 * Les quantités pour 4 personnes et les prix sont des estimations de
 * départ, écrites pour lancer le projet. Ce ne sont PAS des prix de
 * marché vérifiés et les recettes n'ont pas été relues par Sam.
 * Corrige ce fichier avant la soumission au Défi Agents IA.
 *
 * Règles : quantités pour 4 personnes, prix en FCFA entiers par unité,
 * sel et eau supposés déjà à la maison, donc absents des listes.
 */

export type Unite = "kg" | "g" | "L" | "piece" | "sachet";

export interface Ingredient {
  /** Identifiant stable, sans accent, utilisé par les outils. */
  id: string;
  /** Nom affiché. */
  nom: string;
  unite: Unite;
  /** Prix indicatif en FCFA par unité. Estimation, à vérifier au marché. */
  prixIndicatif: number;
}

export interface IngredientRecette {
  ingredientId: string;
  /** Quantité pour 4 personnes, dans l'unité de l'ingrédient. */
  quantite: number;
}

export interface Recette {
  id: string;
  nom: string;
  description: string;
  /** Ingrédients sans lesquels la recette change de nature. */
  ingredientsCentrale: string[];
  ingredients: IngredientRecette[];
  /** Étapes courtes, brouillon à valider par Sam. */
  etapes: string[];
}

/** Nombre de personnes de référence pour toutes les quantités. */
export const PERSONNES_REFERENCE = 4;

/** Nombre maximum de personnes accepté par le calcul. */
export const PERSONNES_MAX = 50;

export const INGREDIENTS: Ingredient[] = [
  { id: "riz", nom: "Riz", unite: "kg", prixIndicatif: 600 },
  { id: "poulet", nom: "Poulet", unite: "kg", prixIndicatif: 2500 },
  { id: "pate-arachide", nom: "Pâte d'arachide", unite: "kg", prixIndicatif: 1500 },
  { id: "tomate", nom: "Tomate fraîche", unite: "kg", prixIndicatif: 500 },
  { id: "oignon", nom: "Oignon", unite: "piece", prixIndicatif: 100 },
  { id: "huile", nom: "Huile", unite: "L", prixIndicatif: 1200 },
  { id: "cube", nom: "Cube Maggi", unite: "piece", prixIndicatif: 50 },
  { id: "piment", nom: "Piment", unite: "piece", prixIndicatif: 25 },
  { id: "farine-manioc", nom: "Farine de manioc (fufu)", unite: "kg", prixIndicatif: 500 },
  { id: "noix-palme", nom: "Noix de palme", unite: "kg", prixIndicatif: 400 },
  { id: "boeuf", nom: "Viande de bœuf", unite: "kg", prixIndicatif: 3000 },
  { id: "farine-mais", nom: "Farine de maïs", unite: "kg", prixIndicatif: 450 },
  { id: "feuilles-ademe", nom: "Feuilles d'adémè", unite: "kg", prixIndicatif: 500 },
  { id: "poisson-fume", nom: "Poisson fumé", unite: "kg", prixIndicatif: 3500 },
  { id: "poisson-frais", nom: "Poisson frais", unite: "kg", prixIndicatif: 2000 },
  { id: "concentre-tomate", nom: "Concentré de tomate", unite: "sachet", prixIndicatif: 300 },
  { id: "attieke", nom: "Attiéké", unite: "kg", prixIndicatif: 700 },
  { id: "carotte", nom: "Carotte", unite: "kg", prixIndicatif: 800 },
];

export const RECETTES: Recette[] = [
  {
    id: "riz-sauce-arachide-poulet",
    nom: "Riz sauce arachide au poulet",
    description: "Riz blanc avec une sauce arachide au poulet.",
    ingredientsCentrale: ["poulet", "pate-arachide"],
    ingredients: [
      { ingredientId: "riz", quantite: 1 },
      { ingredientId: "poulet", quantite: 1 },
      { ingredientId: "pate-arachide", quantite: 0.4 },
      { ingredientId: "tomate", quantite: 0.5 },
      { ingredientId: "oignon", quantite: 3 },
      { ingredientId: "huile", quantite: 0.25 },
      { ingredientId: "cube", quantite: 2 },
      { ingredientId: "piment", quantite: 2 },
    ],
    etapes: [
      "Lave le riz et mets-le à cuire dans l'eau salée.",
      "Fais revenir le poulet en morceaux avec l'oignon émincé et la tomate.",
      "Ajoute la pâte d'arachide délayée dans un peu d'eau chaude, puis laisse mijoter à feu doux.",
      "Sale, ajoute le piment, goûte et sers la sauce sur le riz.",
    ],
  },
  {
    id: "fufu-sauce-graine",
    nom: "Fufu sauce graine",
    description: "Fufu de manioc avec une sauce graine de palme à la viande.",
    ingredientsCentrale: ["farine-manioc", "noix-palme"],
    ingredients: [
      { ingredientId: "farine-manioc", quantite: 1 },
      { ingredientId: "noix-palme", quantite: 1 },
      { ingredientId: "boeuf", quantite: 0.75 },
      { ingredientId: "tomate", quantite: 0.4 },
      { ingredientId: "oignon", quantite: 3 },
      { ingredientId: "cube", quantite: 2 },
      { ingredientId: "piment", quantite: 2 },
    ],
    etapes: [
      "Fais bouillir les noix de palme, pile-les et extrais le jus.",
      "Fais cuire la viande avec l'oignon, la tomate et le cube.",
      "Verse le jus de palme, ajoute le piment et laisse mijoter.",
      "Prépare le fufu avec la farine et l'eau chaude, puis sers avec la sauce.",
    ],
  },
  {
    id: "akoume-sauce-feuille",
    nom: "Akoumé sauce feuille",
    description: "Akoumé de maïs avec une sauce feuille au poisson fumé.",
    ingredientsCentrale: ["farine-mais", "feuilles-ademe"],
    ingredients: [
      { ingredientId: "farine-mais", quantite: 1 },
      { ingredientId: "feuilles-ademe", quantite: 0.8 },
      { ingredientId: "poisson-fume", quantite: 0.5 },
      { ingredientId: "tomate", quantite: 0.3 },
      { ingredientId: "oignon", quantite: 2 },
      { ingredientId: "huile", quantite: 0.2 },
      { ingredientId: "cube", quantite: 2 },
      { ingredientId: "piment", quantite: 2 },
    ],
    etapes: [
      "Lave et découpe les feuilles.",
      "Fais revenir l'oignon et la tomate dans l'huile, ajoute le poisson fumé émietté.",
      "Ajoute les feuilles, un peu d'eau, le cube et le piment, puis laisse cuire.",
      "Prépare l'akoumé avec la farine de maïs et l'eau chaude, puis sers.",
    ],
  },
  {
    id: "pate-sauce-tomate-poisson",
    nom: "Pâte sauce tomate au poisson",
    description: "Pâte de maïs avec une sauce tomate au poisson frais.",
    ingredientsCentrale: ["farine-mais", "poisson-frais"],
    ingredients: [
      { ingredientId: "farine-mais", quantite: 1 },
      { ingredientId: "poisson-frais", quantite: 1 },
      { ingredientId: "tomate", quantite: 0.8 },
      { ingredientId: "concentre-tomate", quantite: 1 },
      { ingredientId: "oignon", quantite: 3 },
      { ingredientId: "huile", quantite: 0.25 },
      { ingredientId: "cube", quantite: 2 },
      { ingredientId: "piment", quantite: 2 },
    ],
    etapes: [
      "Fais frire légèrement le poisson, puis réserve-le.",
      "Fais revenir l'oignon et la tomate dans l'huile, ajoute le concentré de tomate.",
      "Remets le poisson, ajoute de l'eau, le cube et le piment, laisse mijoter.",
      "Prépare la pâte avec la farine de maïs et l'eau chaude, puis sers.",
    ],
  },
  {
    id: "attieke-poisson-frit",
    nom: "Attiéké poisson frit",
    description: "Attiéké avec du poisson frit et une salade tomate oignon.",
    ingredientsCentrale: ["attieke", "poisson-frais"],
    ingredients: [
      { ingredientId: "attieke", quantite: 1 },
      { ingredientId: "poisson-frais", quantite: 1 },
      { ingredientId: "tomate", quantite: 0.4 },
      { ingredientId: "oignon", quantite: 3 },
      { ingredientId: "piment", quantite: 3 },
      { ingredientId: "huile", quantite: 0.5 },
      { ingredientId: "cube", quantite: 1 },
    ],
    etapes: [
      "Fais frire le poisson dans l'huile chaude jusqu'à ce qu'il soit doré.",
      "Prépare la salade avec la tomate, l'oignon et le piment découpés.",
      "Égrène l'attiéké à la fourchette.",
      "Sers l'attiéké avec le poisson frit et la salade.",
    ],
  },
  {
    id: "riz-gras",
    nom: "Riz gras",
    description: "Riz cuit dans une sauce tomate au poulet, avec carotte.",
    ingredientsCentrale: ["riz", "poulet"],
    ingredients: [
      { ingredientId: "riz", quantite: 1 },
      { ingredientId: "poulet", quantite: 0.75 },
      { ingredientId: "tomate", quantite: 0.5 },
      { ingredientId: "concentre-tomate", quantite: 1 },
      { ingredientId: "oignon", quantite: 3 },
      { ingredientId: "carotte", quantite: 0.3 },
      { ingredientId: "huile", quantite: 0.25 },
      { ingredientId: "cube", quantite: 2 },
      { ingredientId: "piment", quantite: 2 },
    ],
    etapes: [
      "Fais revenir le poulet avec l'oignon dans l'huile.",
      "Ajoute la tomate, le concentré, la carotte découpée et de l'eau.",
      "Verse le riz lavé, ajoute le cube et le piment, puis laisse cuire à feu doux, couvert.",
      "Goûte, rectifie le sel et sers chaud.",
    ],
  },
];

/** Minuscules, sans accent, espaces condensés. Pour comparer les saisies. */
export function normaliser(texte: string): string {
  return texte
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function trouverIngredientParId(id: string): Ingredient | undefined {
  return INGREDIENTS.find((ingredient) => ingredient.id === id);
}

/**
 * Trouve un ingrédient par identifiant, par nom exact, ou par nom partiel
 * non ambigu. Exemple : "arachide" trouve "Pâte d'arachide".
 * Retourne undefined si rien ne correspond, ou si plusieurs correspondent.
 */
export function trouverIngredient(requete: string): Ingredient | undefined {
  const parId = trouverIngredientParId(requete.trim());
  if (parId) return parId;
  const recherche = normaliser(requete);
  if (recherche.length === 0) return undefined;
  const exact = INGREDIENTS.find(
    (ingredient) => normaliser(ingredient.nom) === recherche,
  );
  if (exact) return exact;
  const partiels = INGREDIENTS.filter((ingredient) =>
    normaliser(ingredient.nom).includes(recherche),
  );
  if (partiels.length === 1) return partiels[0];
  return undefined;
}

/**
 * Trouve une recette par identifiant, par nom exact, ou par nom partiel
 * non ambigu. Exemple : "riz gras" trouve "Riz gras".
 */
export function trouverRecette(requete: string): Recette | undefined {
  const parId = RECETTES.find((recette) => recette.id === requete.trim());
  if (parId) return parId;
  const recherche = normaliser(requete);
  if (recherche.length === 0) return undefined;
  const exact = RECETTES.find((recette) => normaliser(recette.nom) === recherche);
  if (exact) return exact;
  const partiels = RECETTES.filter((recette) =>
    normaliser(recette.nom).includes(recherche),
  );
  if (partiels.length === 1) return partiels[0];
  return undefined;
}

export function nomsRecettes(): string[] {
  return RECETTES.map((recette) => recette.nom);
}
