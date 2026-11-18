# Marmite

Agent cuisine et courses pour les familles à Lomé, construit pour le
Défi Agents IA (https://aiagent.reinvent-labs.com/).

Marmite prend une recette, un nombre de personnes et un budget, puis
rend les quantités à l'échelle, la liste de courses et le total en
FCFA. Une seule page de chat, publique, sans connexion ni inscription,
pensée pour le téléphone.

## Règles du projet

- 6 recettes fixes, dans un seul fichier : `lib/recipes.ts`.
- Prix = estimations étiquetées à vérifier au marché. Si l'utilisateur
  donne ses propres prix, le total est recalculé avec ses prix.
- Tous les calculs sont faits par du code (`lib/calculate.ts`), jamais
  par le modèle. Le total est toujours la somme exacte des lignes.
- Hors base, l'agent dit non et propose la liste, sans inventer.
- Aucun secret dans le code. La clé Gemini est lue uniquement dans les
  variables d'environnement.

## Données brouillon à valider

Les quantités pour 4 personnes, les prix indicatifs et les étapes des
recettes dans `lib/recipes.ts` sont des brouillons écrits pour lancer
le projet. Ce ne sont pas des prix de marché vérifiés. Sam doit les
relire et les corriger avant la soumission au défi.

## Variables d'environnement

| Variable | Obligatoire | Valeur |
| --- | --- | --- |
| `GEMINI_API_KEY` | Oui, en production | Clé créée dans Google AI Studio |
| `GEMINI_MODEL` | Non | Défaut : `gemini-3.8-flash` |

Le build réussit sans clé. Sans clé, la page répond un message clair
en français au lieu de planter.

## Choix du modèle

- `gemini-3.8-flash` (défaut) : niveau payant, 5 $ prépayés minimum
  dans Google AI Studio. Recommandé pour le test du juge, car le
  niveau gratuit ne donne que 20 requêtes par jour pour ce modèle.
- `gemini-3.5-flash-lite` : niveau gratuit, 500 requêtes par jour.
  Moins fort, mais suffisant pour tester sans payer.
- Pour changer de modèle, mets le nom du modèle dans `GEMINI_MODEL`.

## Développement local

1. Installe les dépendances : `npm install`
2. Copie `.env.example` vers `.env.local`.
3. Colle ta clé dans `.env.local`, sur la ligne `GEMINI_API_KEY=`.
4. Lance : `npm run dev`
5. Ouvre http://localhost:3000

## Vérifications

- Simulations de la logique : `npm run simulate`
- Typecheck : `npm run typecheck`
- Lint : `npm run lint`
- Build de production : `npm run build`

## Déploiement sur Vercel

1. Crée un dépôt GitHub pour ce code, puis pousse le code sur la
   branche principale.
2. Ouvre https://vercel.com, puis clique sur Add New, puis Project.
3. Choisis le dépôt Marmite, puis clique sur Import.
4. Laisse les réglages par défaut (Framework Preset : Next.js).
5. Ouvre la section Environment Variables.
6. Ajoute `GEMINI_API_KEY` avec ta clé, puis clique sur Add.
7. Si tu veux le modèle gratuit, ajoute aussi `GEMINI_MODEL` avec
   `gemini-3.5-flash-lite`, puis clique sur Add.
8. Clique sur Deploy.
9. Quand le déploiement est Ready, ouvre le lien fourni par Vercel.
10. Teste en navigation privée : la page doit s'ouvrir sans connexion,
    et tu dois pouvoir discuter avec Marmite.

Garde l'agent en ligne jusqu'à la publication des résultats du défi :
le juge le teste à ce moment-là.

## Limites connues

- Aucun appel réel à Gemini n'a été testé ici : aucune clé n'était
  disponible pendant la construction. Le premier vrai test demande
  une clé et le déploiement Vercel.
- Aucun test sur un vrai téléphone n'a été fait. Sam doit tester sur
  son téléphone avant la soumission.
- Les recettes et les prix sont des brouillons à valider (voir plus haut).
