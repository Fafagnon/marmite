/**
 * Outils de l'agent Marmite, appelés par Gemini.
 * L'exécution est pure et synchrone : elle délègue à lib/calculate.ts,
 * donc les chiffres retournés au modèle viennent du code, jamais du modèle.
 */

import { calculerListe, listerRecettes, type CalculListe } from "./calculate";

export type OutilNom = "lister_recettes" | "calculer_liste";

export interface ResultatOutil {
  ok: boolean;
  [cle: string]: unknown;
}

/**
 * Déclarations des fonctions, au format de l'API REST Gemini
 * (generateContent, champ tools[].functionDeclarations).
 */
export const DECLARATIONS_OUTILS = [
  {
    name: "lister_recettes",
    description:
      "Liste les 6 recettes connues de Marmite, avec leur description. " +
      "A appeler quand l'utilisateur demande ce que Marmite sait cuisiner, " +
      "ou quand il demande une recette inconnue.",
    parameters: {
      type: "OBJECT",
      properties: {},
    },
  },
  {
    name: "calculer_liste",
    description:
      "Calcule la liste de courses d'une recette pour un nombre de personnes : " +
      "quantités mises à l'échelle, prix par ligne, total en FCFA, comparaison " +
      "avec le budget, ingrédients exclus. Tous les chiffres viennent du code. " +
      "A appeler dès que la recette et le nombre de personnes sont connus. " +
      "En cas de relance qui change la recette, les personnes, le budget, " +
      "les exclusions ou les prix, rappeler l'outil avec les nouvelles valeurs.",
    parameters: {
      type: "OBJECT",
      properties: {
        recette: {
          type: "STRING",
          description:
            "Nom ou identifiant de la recette, par exemple 'Riz gras' ou 'riz-gras'.",
        },
        personnes: {
          type: "INTEGER",
          description: "Nombre de personnes, entier entre 1 et 50.",
        },
        budget: {
          type: "INTEGER",
          description:
            "Budget maximum en FCFA entiers, si l'utilisateur en donne un. Absent sinon.",
        },
        exclus: {
          type: "ARRAY",
          items: { type: "STRING" },
          description:
            "Ingrédients à retirer, par exemple pour une allergie : ['arachide'] ou ['poisson frais']. Absent si aucun.",
        },
        prix: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              ingredient: {
                type: "STRING",
                description: "Nom ou identifiant de l'ingrédient.",
              },
              prix: {
                type: "NUMBER",
                description: "Prix en FCFA par unité, donné par l'utilisateur.",
              },
            },
            required: ["ingredient", "prix"],
          },
          description:
            "Prix donnés par l'utilisateur, qui remplacent les estimations. Absent si aucun.",
        },
      },
      required: ["recette", "personnes"],
    },
  },
];

/** Exécute un outil et retourne un objet JSON sérialisable pour Gemini. */
export function executerOutil(nom: string, args: unknown): ResultatOutil {
  if (nom === "lister_recettes") {
    return { ok: true, recettes: listerRecettes() };
  }

  if (nom === "calculer_liste") {
    const params = (args ?? {}) as Record<string, unknown>;
    const prixBruts = Array.isArray(params.prix) ? params.prix : [];
    const resultat: CalculListe = calculerListe({
      recette: typeof params.recette === "string" ? params.recette : "",
      personnes: typeof params.personnes === "number" ? params.personnes : Number.NaN,
      budget: typeof params.budget === "number" ? params.budget : undefined,
      exclus: Array.isArray(params.exclus)
        ? params.exclus.filter((e): e is string => typeof e === "string")
        : undefined,
      prix: prixBruts
        .filter(
          (e): e is { ingredient: string; prix: number } =>
            typeof e === "object" &&
            e !== null &&
            typeof (e as { ingredient?: unknown }).ingredient === "string" &&
            typeof (e as { prix?: unknown }).prix === "number",
        )
        .map((e) => ({ ingredient: e.ingredient, prix: e.prix })),
    });
    return resultat as unknown as ResultatOutil;
  }

  return { ok: false, message: `Outil inconnu : ${nom}.` };
}
