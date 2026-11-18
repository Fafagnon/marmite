"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  formaterFCFA,
  formaterQuantite,
  libellerUnite,
  type ResultatCalcul,
} from "@/lib/calculate";

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  calculation?: ResultatCalcul;
}

const MESSAGE_ACCUEIL =
  "Bonjour, je suis Marmite. Dis-moi une recette et le nombre de personnes, et je te donne les quantités, la liste de courses et le budget en FCFA. Je connais 6 recettes : riz sauce arachide au poulet, fufu sauce graine, akoumé sauce feuille, pâte sauce tomate au poisson, attiéké poisson frit, riz gras.";

const SUGGESTIONS = [
  "Riz gras pour 6 personnes",
  "Riz sauce arachide au poulet pour 8 personnes avec 8000 F",
  "Quelles recettes connais-tu ?",
];

const MESSAGE_ERREUR =
  "Je n'ai pas pu répondre pour le moment. Réessaie dans une minute.";

function CarteListe({ calcul }: { calcul: ResultatCalcul }) {
  return (
    <div className="mt-2 rounded-xl border border-line bg-card p-3">
      <p className="font-semibold">
        {calcul.recetteNom} pour {calcul.personnes}{" "}
        {calcul.personnes > 1 ? "personnes" : "personne"}
      </p>
      <ul className="mt-2 space-y-1">
        {calcul.lignes.map((ligne) => (
          <li key={ligne.ingredientId} className="flex justify-between gap-3">
            <span className="min-w-0 break-words">
              {formaterQuantite(ligne.quantite)}{" "}
              {libellerUnite(ligne.unite, ligne.quantite)} {ligne.nom}
            </span>
            <span className="shrink-0 font-medium">{formaterFCFA(ligne.montant)}</span>
          </li>
        ))}
      </ul>
      <p className="mt-2 flex justify-between gap-3 border-t border-line pt-2 font-semibold">
        <span>Total</span>
        <span>{formaterFCFA(calcul.total)}</span>
      </p>
      {calcul.budget !== undefined && calcul.depassement !== undefined ? (
        <p className="mt-1">
          Budget dépassé de {formaterFCFA(calcul.depassement)}. Budget donné :{" "}
          {formaterFCFA(calcul.budget)}.
        </p>
      ) : null}
      {calcul.budget !== undefined &&
      calcul.depassement === undefined &&
      calcul.ecartBudget !== undefined ? (
        <p className="mt-1">
          Il reste {formaterFCFA(calcul.ecartBudget)} sur ton budget de{" "}
          {formaterFCFA(calcul.budget)}.
        </p>
      ) : null}
      {calcul.exclusions.length > 0 ? (
        <p className="mt-1">Exclu : {calcul.exclusions.join(", ")}.</p>
      ) : null}
      {calcul.avertissements.map((avertissement) => (
        <p key={avertissement} className="mt-1">
          {avertissement}
        </p>
      ))}
      {calcul.prixEstimes ? (
        <p className="mt-1 text-muted">
          Prix estimations, à vérifier au marché.
        </p>
      ) : null}
    </div>
  );
}

export default function PageAccueil() {
  const [messages, setMessages] = useState<Message[]>([
    { id: 0, role: "assistant", content: MESSAGE_ACCUEIL },
  ]);
  const [saisie, setSaisie] = useState("");
  const [enCours, setEnCours] = useState(false);
  const finListeRef = useRef<HTMLDivElement>(null);
  const prochainIdRef = useRef(1);

  function nouvelId(): number {
    const id = prochainIdRef.current;
    prochainIdRef.current += 1;
    return id;
  }

  useEffect(() => {
    finListeRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, enCours]);

  async function envoyer(texteBrut: string) {
    const texte = texteBrut.trim();
    if (texte.length === 0 || enCours) return;
    const messageUtilisateur: Message = {
      id: nouvelId(),
      role: "user",
      content: texte,
    };
    const historique = [...messages, messageUtilisateur];
    setMessages(historique);
    setSaisie("");
    setEnCours(true);
    try {
      const reponse = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: historique.map((message) => ({
            role: message.role,
            content: message.content,
          })),
        }),
      });
      const donnees = (await reponse.json()) as {
        reply?: string;
        calculation?: ResultatCalcul;
        error?: string;
      };
      const contenu =
        typeof donnees.reply === "string" && donnees.reply.trim().length > 0
          ? donnees.reply
          : MESSAGE_ERREUR;
      setMessages((precedents) => [
        ...precedents,
        {
          id: nouvelId(),
          role: "assistant",
          content: contenu,
          calculation: donnees.calculation,
        },
      ]);
    } catch {
      setMessages((precedents) => [
        ...precedents,
        { id: nouvelId(), role: "assistant", content: MESSAGE_ERREUR },
      ]);
    } finally {
      setEnCours(false);
    }
  }

  function soumettreFormulaire(evenement: FormEvent<HTMLFormElement>) {
    evenement.preventDefault();
    void envoyer(saisie);
  }

  return (
    <main className="mx-auto flex h-dvh w-full max-w-2xl flex-col bg-background text-foreground">
      <header className="border-b border-line px-4 py-3">
        <h1 className="text-xl font-bold">Marmite</h1>
        <p className="text-sm text-muted">
          Cuisine et courses pour les familles à Lomé. Recette, nombre de
          personnes, liste de courses et budget en FCFA.
        </p>
        <p className="text-sm text-muted">
          Prix estimations, à vérifier au marché.
        </p>
      </header>

      <div
        aria-live="polite"
        className="flex-1 space-y-3 overflow-y-auto px-4 py-4"
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={
              message.role === "user"
                ? "ml-auto w-fit max-w-[85%] rounded-2xl bg-brand px-3 py-2 text-white"
                : "mr-auto w-fit max-w-[92%] rounded-2xl bg-soft px-3 py-2"
            }
          >
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
            {message.calculation ? (
              <CarteListe calcul={message.calculation} />
            ) : null}
          </div>
        ))}
        {enCours ? (
          <p className="mr-auto w-fit rounded-2xl bg-soft px-3 py-2 text-muted">
            Marmite réfléchit...
          </p>
        ) : null}
        <div ref={finListeRef} />
      </div>

      <div className="flex flex-wrap gap-2 px-4 pb-2">
        {SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            disabled={enCours}
            onClick={() => void envoyer(suggestion)}
            className="min-h-11 rounded-full border border-line bg-background px-3 py-2 text-left text-sm disabled:opacity-50"
          >
            {suggestion}
          </button>
        ))}
      </div>

      <form
        onSubmit={soumettreFormulaire}
        className="flex gap-2 border-t border-line px-4 py-3"
      >
        <label htmlFor="message" className="sr-only">
          Écris ton message à Marmite
        </label>
        <input
          id="message"
          type="text"
          value={saisie}
          onChange={(evenement) => setSaisie(evenement.target.value)}
          placeholder="Exemple : riz gras pour 6 personnes"
          autoComplete="off"
          disabled={enCours}
          className="min-h-11 min-w-0 flex-1 rounded-full border border-line bg-background px-4 py-2 text-base outline-none focus:border-brand disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={enCours || saisie.trim().length === 0}
          className="min-h-11 shrink-0 rounded-full bg-brand px-5 py-2 font-semibold text-white disabled:opacity-50"
        >
          Envoyer
        </button>
      </form>
    </main>
  );
}
