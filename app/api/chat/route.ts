/**
 * Route agent de Marmite.
 *
 * Boucle serveur : l'historique arrive du client, Gemini choisit les
 * outils, les outils calculent, Gemini rédige la réponse. Les chiffres
 * affichés viennent des outils, jamais du modèle.
 *
 * La clé Gemini est lue uniquement dans GEMINI_API_KEY, le modèle dans
 * GEMINI_MODEL (défaut gemini-3.8-flash). Sans clé, la route répond
 * un message clair en français, sans planter. En cas de quota dépassé
 * (429), elle répond aussi un message clair, sans inventer de réponse.
 */

import { executerOutil, DECLARATIONS_OUTILS } from "@/lib/tools";
import type { ResultatCalcul } from "@/lib/calculate";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODELE_DEFAUT = "gemini-3.8-flash";
const MAX_ETAPES_OUTILS = 5;
const MAX_MESSAGES = 30;
const MAX_CARACTERES_MESSAGE = 2000;

const PROMPT_SYSTEME = [
  "Tu es Marmite, une aide cuisine et courses pour les familles à Lomé. Tu parles français, avec des phrases courtes.",
  "Tu connais exactement 6 recettes, données par l'outil lister_recettes. Tu ne connais aucune autre recette. Si on te demande une recette inconnue, dis-le clairement, puis propose la liste des 6 recettes. N'invente jamais une recette, une quantité ou un prix.",
  "Pour toute demande de quantités, de liste de courses ou de budget, appelle l'outil calculer_liste. Ne calcule jamais toi-même. Ne donne jamais un chiffre qui ne vient pas d'un outil. Reproduis les chiffres de l'outil exactement, sans les arrondir ni les modifier.",
  "Il te faut la recette et le nombre de personnes pour calculer. S'il en manque un, pose une seule question courte pour le demander. Le budget est facultatif. Si l'utilisateur donne un budget, passe-le à l'outil et annonce le résultat exact : dépassement ou reste.",
  "Les prix de l'outil sont des estimations à vérifier au marché, sauf les prix donnés par l'utilisateur. Quand un total utilise des estimations, dis-le en une phrase : les prix sont des estimations, à vérifier au marché.",
  "Allergie ou ingrédient exclu : passe l'exclusion à l'outil, puis relaie son avertissement. Si l'outil dit que la recette devient inadaptée, propose de choisir une autre recette.",
  "Nombre de personnes égal à 0 ou impossible : refuse poliment et demande un nombre entre 1 et 50. Ne calcule rien dans ce cas.",
  "Demande hors cuisine : recentre poliment en une phrase, puis propose les recettes. Ne réponds pas à la demande hors sujet.",
  "Suis la conversation. Si l'utilisateur change le nombre de personnes, la recette, le budget, les exclusions ou les prix, rappelle calculer_liste avec les nouvelles valeurs et le reste du contexte.",
  "Réponses courtes et structurées. Présente la liste de courses ligne par ligne, puis le total, puis le budget si fourni. Ne mets jamais le caractère tiret cadratin dans tes réponses. Utilise des virgules, des points ou des deux-points. N'utilise aucun emoji.",
].join(" ");

interface MessageClient {
  role: "user" | "assistant";
  content: string;
}

interface PartieGemini {
  text?: string;
  functionCall?: { name?: string; args?: unknown };
  functionResponse?: { name?: string; response?: unknown };
}

interface ContenuGemini {
  role: "user" | "model";
  parts: PartieGemini[];
}

interface ReponseGemini {
  candidates?: { content?: { parts?: PartieGemini[] } }[];
  error?: { message?: string; status?: string };
}

function modeleDemande(): string {
  const modele = (process.env.GEMINI_MODEL ?? "").trim();
  if (modele.length === 0) return MODELE_DEFAUT;
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(modele)) return MODELE_DEFAUT;
  return modele;
}

function reponseAmie(message: string, erreur: string) {
  return NextResponse.json({ reply: message, error: erreur });
}

export async function POST(request: Request) {
  let corps: unknown;
  try {
    corps = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Le message envoyé n'est pas lisible. Réessaie." },
      { status: 400 },
    );
  }

  const messagesBruts = (corps as { messages?: unknown }).messages;
  if (!Array.isArray(messagesBruts) || messagesBruts.length === 0) {
    return NextResponse.json(
      { error: "Aucun message reçu. Écris un message pour commencer." },
      { status: 400 },
    );
  }

  const messages: MessageClient[] = [];
  for (const brut of messagesBruts.slice(-MAX_MESSAGES)) {
    if (
      typeof brut !== "object" ||
      brut === null ||
      (brut as { role?: unknown }).role !== "user" &&
      (brut as { role?: unknown }).role !== "assistant" ||
      typeof (brut as { content?: unknown }).content !== "string"
    ) {
      continue;
    }
    const contenu = ((brut as { content: string }).content ?? "").slice(0, MAX_CARACTERES_MESSAGE);
    if (contenu.trim().length === 0) continue;
    messages.push({ role: (brut as { role: "user" | "assistant" }).role, content: contenu });
  }

  if (messages.length === 0 || messages[messages.length - 1].role !== "user") {
    return NextResponse.json(
      { error: "Le dernier message doit être une question. Réessaie." },
      { status: 400 },
    );
  }

  const cle = (process.env.GEMINI_API_KEY ?? "").trim();
  if (cle.length === 0) {
    return reponseAmie(
      "La clé API Gemini n'est pas configurée sur ce déploiement. Ajoute GEMINI_API_KEY dans les variables d'environnement, puis redéploie.",
      "missing_key",
    );
  }

  const contenus: ContenuGemini[] = messages.map((message) => ({
    role: message.role === "assistant" ? "model" : "user",
    parts: [{ text: message.content }],
  }));

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modeleDemande()}:generateContent`;
  let dernierCalcul: ResultatCalcul | undefined;

  for (let etape = 0; etape <= MAX_ETAPES_OUTILS; etape += 1) {
    let reponse: Response;
    try {
      reponse = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": cle },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: PROMPT_SYSTEME }] },
          contents: contenus,
          tools: [{ functionDeclarations: DECLARATIONS_OUTILS }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 1024 },
        }),
        signal: AbortSignal.timeout(30000),
      });
    } catch (erreur) {
      console.error("Marmite, appel Gemini impossible :", erreur);
      return reponseAmie(
        "Je n'arrive pas à joindre le service pour le moment. Réessaie dans une minute.",
        "network_error",
      );
    }

    if (reponse.status === 429) {
      return reponseAmie(
        "Le service est momentanément saturé, le quota de requêtes est atteint. Attends une minute puis réessaie.",
        "rate_limited",
      );
    }

    if (!reponse.ok) {
      console.error("Marmite, erreur Gemini :", reponse.status);
      return reponseAmie(
        "Une erreur est survenue côté service. Réessaie dans une minute, sans changer ton message.",
        "api_error",
      );
    }

    let donnees: ReponseGemini;
    try {
      donnees = (await reponse.json()) as ReponseGemini;
    } catch {
      return reponseAmie(
        "La réponse du service est illisible. Réessaie dans une minute.",
        "api_error",
      );
    }

    const parties = donnees.candidates?.[0]?.content?.parts ?? [];
    const appels = parties.filter(
      (partie): partie is PartieGemini & { functionCall: NonNullable<PartieGemini["functionCall"]> } =>
        partie.functionCall !== undefined && typeof partie.functionCall.name === "string",
    );

    if (appels.length === 0) {
      const texte = parties
        .map((partie) => partie.text ?? "")
        .join("")
        .trim();
      if (texte.length === 0) {
        return reponseAmie(
          "Je n'ai pas pu formuler de réponse. Reformule ta demande, par exemple : riz gras pour 6 personnes.",
          "empty_reply",
        );
      }
      return NextResponse.json({
        reply: texte,
        calculation: dernierCalcul ?? undefined,
      });
    }

    if (etape === MAX_ETAPES_OUTILS) {
      return reponseAmie(
        "Ta demande demande trop d'étapes. Simplifie-la, par exemple : une recette et un nombre de personnes.",
        "too_many_steps",
      );
    }

    contenus.push({ role: "model", parts: parties });
    const reponsesOutils: PartieGemini[] = [];
    for (const appel of appels) {
      const resultat = executerOutil(appel.functionCall.name as string, appel.functionCall.args);
      if (
        appel.functionCall.name === "calculer_liste" &&
        (resultat as unknown as { ok?: unknown }).ok === true
      ) {
        dernierCalcul = resultat as unknown as ResultatCalcul;
      }
      reponsesOutils.push({
        functionResponse: { name: appel.functionCall.name, response: resultat },
      });
    }
    contenus.push({ role: "user", parts: reponsesOutils });
  }

  return reponseAmie(
    "Ta demande demande trop d'étapes. Simplifie-la, par exemple : une recette et un nombre de personnes.",
    "too_many_steps",
  );
}
