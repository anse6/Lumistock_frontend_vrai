// Chat du site public avec Nansé, l'assistante Lumistock.
//
// - Bouton flottant en bas à droite ; le panneau s'ouvre en plein écran sur mobile.
// - Dès que le visiteur commence à écrire, Nansé lui demande son nom et son
//   email ; ensuite il continue son message là où il l'avait laissé.
// - Nansé répond tout de suite (IA + base de connaissances Lumistock). À la 3e
//   question pertinente, un conseiller est prévenu par email ; quand il
//   répond, son nom s'affiche sur ses messages et dans l'en-tête.
// - La conversation est gardée dans le navigateur (jeton secret) et les
//   nouveaux messages sont relevés toutes les quelques secondes.
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowUp, Headset, LoaderCircle, MessageCirclePlus, RotateCcw, X } from "lucide-react";
import AvatarNanse from "./AvatarNanse";
import logoLumistock from "../../../assets/logo-lumistock-icone.png";
import { useLangue } from "../site";
import {
  NOM_ASSISTANT,
  demarrerConversation,
  ecrireSession,
  envoyerMessage,
  erreurAssistant,
  lireConversation,
  lireSession,
  statutHttp,
  type MessageAssistant,
  type SessionVisiteur,
  type StatutConversation,
} from "../../../services/assistant";

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const ATTENTE_OUVERT = 4000; // ms entre deux relevés, chat ouvert
const ATTENTE_FERME = 15000; // chat fermé, seulement si un conseiller est attendu

const initiales = (nom?: string | null) =>
  (nom || "?").split(/\s+/).filter(Boolean).slice(0, 2).map((m) => m[0]?.toUpperCase()).join("");

const heure = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

/** Ajoute des messages sans doublon, dans l'ordre chronologique. */
const fusionner = (actuels: MessageAssistant[], ajouts: MessageAssistant[]) => {
  const parId = new Map(actuels.filter((m) => !m.id.startsWith("local-")).map((m) => [m.id, m]));
  ajouts.forEach((m) => parId.set(m.id, m));
  const locaux = actuels.filter((m) => m.id.startsWith("local-") && !ajouts.some((a) => a.auteur === "visiteur" && a.texte === m.texte));
  return [...parId.values(), ...locaux].sort((a, b) => a.created_at.localeCompare(b.created_at));
};

const Texte: React.FC<{ texte: string; clair?: boolean }> = ({ texte, clair }) => (
  <div className={`space-y-2 break-words text-[14.5px] leading-relaxed [&_li]:ml-4 [&_ol]:list-decimal [&_ul]:list-disc [&_strong]:font-semibold ${clair ? "text-white" : "text-encre"}`}>
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        a: ({ children, href }) => (
          <a href={href} target="_blank" rel="noreferrer" className={`underline underline-offset-2 ${clair ? "!text-white" : "!text-marque"}`}>
            {children}
          </a>
        ),
      }}
    >
      {texte}
    </ReactMarkdown>
  </div>
);

const ChatNanse: React.FC = () => {
  const L = useLangue();
  const { pathname } = useLocation();
  const [ouvert, setOuvert] = useState(false);
  const [session, setSession] = useState<SessionVisiteur | null>(() => lireSession());
  const [messages, setMessages] = useState<MessageAssistant[]>([]);
  const [statut, setStatut] = useState<StatutConversation>("ia");
  const [agent, setAgent] = useState<string | null>(null);
  const [brouillon, setBrouillon] = useState("");
  const [identification, setIdentification] = useState(false);
  const [nom, setNom] = useState(session?.nom ?? "");
  const [email, setEmail] = useState(session?.email ?? "");
  const [piege, setPiege] = useState("");
  const [erreurIdent, setErreurIdent] = useState<string | null>(null);
  const [creation, setCreation] = useState(false);
  const [attente, setAttente] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [nonLus, setNonLus] = useState(0);
  const [accroche, setAccroche] = useState(false);
  const envoiApres = useRef<string | null>(null);
  const fil = useRef<HTMLDivElement>(null);
  const saisie = useRef<HTMLTextAreaElement>(null);
  const champNom = useRef<HTMLInputElement>(null);
  const ouvertRef = useRef(ouvert);
  ouvertRef.current = ouvert;

  const suggestions = [
    L("Combien coûte Lumistock ?", "How much does Lumistock cost?"),
    L("Lumistock gère-t-il Orange Money ?", "Does Lumistock handle Orange Money?"),
    L("Comment créer mon magasin ?", "How do I create my store?"),
  ];

  const oublier = useCallback(() => {
    ecrireSession(null);
    setSession(null);
    setMessages([]);
    setStatut("ia");
    setAgent(null);
  }, []);

  // Petite bulle d'accroche, une fois par visite.
  useEffect(() => {
    let vue = false;
    try {
      vue = sessionStorage.getItem("lumistock-assistant-accroche") === "1";
    } catch {
      /* stockage indisponible */
    }
    if (vue || session) return;
    const t = window.setTimeout(() => setAccroche(true), 5000);
    return () => window.clearTimeout(t);
  }, [session]);

  const fermerAccroche = () => {
    setAccroche(false);
    try {
      sessionStorage.setItem("lumistock-assistant-accroche", "1");
    } catch {
      /* stockage indisponible */
    }
  };

  // Reprise d'une conversation déjà commencée (même navigateur).
  useEffect(() => {
    if (!session) return;
    let actif = true;
    lireConversation(session)
      .then((c) => {
        if (!actif) return;
        setMessages((m) => fusionner(m, c.messages ?? []));
        setStatut(c.statut);
        setAgent(c.agent_nom);
      })
      .catch((e) => statutHttp(e) === 404 && oublier());
    return () => {
      actif = false;
    };
  }, [session, oublier]);

  // Relevé des nouveaux messages (réponses du conseiller).
  useEffect(() => {
    if (!session) return;
    if (!ouvert && statut !== "attente" && statut !== "conseiller") return;
    let actif = true;
    let minuterie: number;
    const relever = async () => {
      try {
        const dernier = [...messages].reverse().find((m) => !m.id.startsWith("local-"));
        const c = await lireConversation(session, dernier?.created_at);
        if (!actif) return;
        const ajouts = c.messages ?? [];
        if (ajouts.length) {
          setMessages((m) => fusionner(m, ajouts));
          if (!ouvertRef.current) setNonLus((n) => n + ajouts.filter((m) => m.auteur !== "visiteur").length);
        }
        setStatut(c.statut);
        setAgent(c.agent_nom);
      } catch (e) {
        if (statutHttp(e) === 404) oublier();
      }
      if (actif) minuterie = window.setTimeout(relever, ouvertRef.current ? ATTENTE_OUVERT : ATTENTE_FERME);
    };
    minuterie = window.setTimeout(relever, ouvert ? ATTENTE_OUVERT : ATTENTE_FERME);
    return () => {
      actif = false;
      window.clearTimeout(minuterie);
    };
  }, [session, ouvert, statut, messages, oublier]);

  // Défilement vers le dernier message.
  useEffect(() => {
    fil.current?.scrollTo({ top: fil.current.scrollHeight, behavior: "smooth" });
  }, [messages, attente, identification, ouvert]);

  useEffect(() => {
    if (ouvert) {
      setNonLus(0);
      fermerAccroche();
    }
  }, [ouvert]);

  useEffect(() => {
    if (identification) champNom.current?.focus();
  }, [identification]);

  // Échap ferme le chat.
  useEffect(() => {
    if (!ouvert) return;
    const echap = (e: KeyboardEvent) => e.key === "Escape" && setOuvert(false);
    document.addEventListener("keydown", echap);
    return () => document.removeEventListener("keydown", echap);
  }, [ouvert]);

  const envoyer = async (texte: string, s: SessionVisiteur | null = session) => {
    const propre = texte.trim();
    if (!propre || attente) return;
    if (!s) {
      envoiApres.current = null;
      setIdentification(true);
      return;
    }
    setErreur(null);
    setBrouillon("");
    const local: MessageAssistant = {
      id: `local-${Date.now()}`, auteur: "visiteur", auteur_nom: s.nom, texte: propre, pertinente: null,
      created_at: new Date().toISOString(),
    };
    setMessages((m) => [...m, local]);
    setAttente(statut !== "conseiller");
    try {
      const c = await envoyerMessage(s, propre);
      setMessages((m) => fusionner(m.filter((x) => x.id !== local.id), c.nouveaux ?? []));
      setStatut(c.statut);
      setAgent(c.agent_nom);
    } catch (e) {
      setMessages((m) => m.filter((x) => x.id !== local.id));
      setBrouillon(propre);
      if (statutHttp(e) === 409) setStatut("fermee");
      else if (statutHttp(e) === 404) oublier();
      else setErreur(erreurAssistant(e, L("Le message n'a pas pu être envoyé. Réessayez.", "The message couldn't be sent. Please try again.")));
    } finally {
      setAttente(false);
      saisie.current?.focus();
    }
  };

  const demarrer = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (nom.trim().length < 2) return setErreurIdent(L("Indiquez votre nom.", "Please enter your name."));
    if (!EMAIL.test(email.trim())) return setErreurIdent(L("Adresse email invalide.", "Invalid email address."));
    setErreurIdent(null);
    setCreation(true);
    try {
      const c = await demarrerConversation({
        nom: nom.trim(), email: email.trim(), langue: L("fr", "en"), page: pathname,
        ...(piege ? { site_web_societe: piege } : {}),
      });
      const s = { id: c.id, jeton: c.jeton!, nom: c.nom, email: email.trim() };
      ecrireSession(s);
      setSession(s);
      setMessages([]);
      setStatut(c.statut);
      setAgent(null);
      setIdentification(false);
      const aEnvoyer = envoiApres.current;
      envoiApres.current = null;
      if (aEnvoyer) await envoyer(aEnvoyer, s);
      else window.setTimeout(() => saisie.current?.focus(), 50);
    } catch (err) {
      setErreurIdent(erreurAssistant(err, L("Impossible de démarrer la conversation.", "Couldn't start the conversation.")));
    } finally {
      setCreation(false);
    }
  };

  const nouvelleConversation = () => {
    ecrireSession(null);
    setSession(null);
    setMessages([]);
    setStatut("ia");
    setAgent(null);
    setErreur(null);
    if (nom && EMAIL.test(email)) void demarrer();
  };

  const surSaisie = (valeur: string) => {
    setBrouillon(valeur);
    if (!session && valeur.trim()) setIdentification(true);
  };

  const choisirSuggestion = (texte: string) => {
    if (session) return void envoyer(texte);
    setBrouillon(texte);
    envoiApres.current = texte;
    setIdentification(true);
  };

  const sousTitre =
    statut === "conseiller" && agent
      ? L(`Conseiller Lumistock · avec ${NOM_ASSISTANT}`, `Lumistock advisor · with ${NOM_ASSISTANT}`)
      : statut === "attente"
        ? L("Un conseiller a été prévenu", "An advisor has been notified")
        : statut === "fermee"
          ? L("Conversation terminée", "Conversation ended")
          : L("Assistante Lumistock · en ligne", "Lumistock assistant · online");

  return (
    <>
      {/* ------------------------------------------------------------ bouton flottant */}
      {!ouvert && (
        <div className="fixed bottom-5 right-5 z-[60] flex flex-col items-end gap-3">
          {accroche && (
            <div className="relative max-w-[16rem] rounded-2xl rounded-br-md border border-trait bg-white p-4 pr-9 shadow-[0_20px_40px_-20px_rgba(15,23,42,0.45)]">
              <button type="button" onClick={fermerAccroche} aria-label={L("Fermer", "Close")} className="absolute right-2 top-2 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-attenue hover:bg-fond">
                <X size={14} />
              </button>
              <p className="text-[14px] font-semibold text-encre">{L(`Bonjour, je suis ${NOM_ASSISTANT} 👋`, `Hi, I'm ${NOM_ASSISTANT} 👋`)}</p>
              <p className="mt-1 text-[13.5px] leading-snug text-texte">{L("Une question sur Lumistock ? Je vous réponds tout de suite.", "A question about Lumistock? I'll answer right away.")}</p>
            </div>
          )}
          <button
            type="button"
            onClick={() => setOuvert(true)}
            aria-label={L(`Discuter avec ${NOM_ASSISTANT}, l'assistante Lumistock`, `Chat with ${NOM_ASSISTANT}, the Lumistock assistant`)}
            className="group relative flex h-16 w-16 cursor-pointer items-center justify-center rounded-full bg-marque shadow-[0_16px_30px_-12px_rgba(59,7,100,0.8)] transition-transform duration-200 hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-marque"
          >
            <AvatarNanse taille={52} />
            {nonLus > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-6 min-w-6 items-center justify-center rounded-full bg-red-600 px-1.5 text-xs font-bold text-white ring-2 ring-white">
                {nonLus}
              </span>
            )}
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------ panneau */}
      {ouvert && (
        <section
          role="dialog"
          aria-label={L(`Discussion avec ${NOM_ASSISTANT}`, `Chat with ${NOM_ASSISTANT}`)}
          className="fixed inset-0 z-[60] flex flex-col overflow-hidden bg-white sm:inset-auto sm:bottom-5 sm:right-5 sm:h-[min(640px,calc(100dvh-2.5rem))] sm:w-[400px] sm:rounded-3xl sm:border sm:border-trait sm:shadow-[0_30px_70px_-20px_rgba(15,23,42,0.45)]"
        >
          {/* en-tête */}
          <header className="flex items-center gap-3 bg-marque px-4 py-3.5 text-white">
            <span className="relative">
              {/* Logo Lumistock sur pastille blanche : le chat est bien celui de Lumistock. */}
              <span className="flex h-[42px] w-[42px] items-center justify-center rounded-xl bg-white shadow-sm">
                <img src={logoLumistock} alt="Lumistock" className="h-7 w-7 object-contain" />
              </span>
              {statut === "conseiller" && agent && (
                <span className="absolute -bottom-1 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white ring-2 ring-marque">
                  {initiales(agent)}
                </span>
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-titre text-[16px] font-bold leading-tight !text-white">{statut === "conseiller" && agent ? agent : NOM_ASSISTANT}</p>
              <p className="flex items-center gap-1.5 truncate text-[12.5px] text-white/75">
                <span className={`h-2 w-2 shrink-0 rounded-full ${statut === "fermee" ? "bg-slate-400" : statut === "attente" ? "bg-amber-400" : "bg-emerald-400"}`} />
                {sousTitre}
              </p>
            </div>
            {session && (
              <button type="button" onClick={nouvelleConversation} title={L("Nouvelle conversation", "New conversation")} aria-label={L("Nouvelle conversation", "New conversation")} className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-white/80 hover:bg-white/10 hover:text-white">
                <RotateCcw size={17} />
              </button>
            )}
            <button type="button" onClick={() => setOuvert(false)} aria-label={L("Fermer le chat", "Close chat")} className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-white/80 hover:bg-white/10 hover:text-white">
              <X size={20} />
            </button>
          </header>

          {/* fil de discussion */}
          <div ref={fil} className="scrollbar-hide flex-1 space-y-4 overflow-y-auto bg-fond px-4 py-5" aria-live="polite">
            <BulleNanse>
              <Texte
                texte={L(
                  `Bonjour 👋 Je suis **${NOM_ASSISTANT}**, l'assistante de Lumistock. Posez-moi vos questions : fonctionnalités, tarifs, inscription, comptabilité… Je vous réponds tout de suite, et un conseiller peut prendre le relais si besoin.`,
                  `Hi 👋 I'm **${NOM_ASSISTANT}**, Lumistock's assistant. Ask me anything: features, pricing, sign-up, accounting… I answer right away, and an advisor can take over if needed.`,
                )}
              />
            </BulleNanse>

            {!session && !identification && messages.length === 0 && (
              <div className="flex flex-wrap gap-2 pl-11">
                {suggestions.map((s) => (
                  <button key={s} type="button" onClick={() => choisirSuggestion(s)} className="cursor-pointer rounded-full border border-marque-200 bg-white px-3.5 py-2 text-left text-[13.5px] font-semibold text-marque transition-colors hover:bg-marque-50">
                    {s}
                  </button>
                ))}
              </div>
            )}

            {messages.map((m) => (
              <Message key={m.id} message={m} />
            ))}

            {attente && (
              <BulleNanse>
                <span className="flex items-center gap-1.5 py-1" aria-label={L(`${NOM_ASSISTANT} écrit…`, `${NOM_ASSISTANT} is typing…`)}>
                  {[0, 150, 300].map((d) => (
                    <span key={d} className="h-2 w-2 animate-bounce rounded-full bg-marque-300" style={{ animationDelay: `${d}ms` }} />
                  ))}
                </span>
              </BulleNanse>
            )}

            {identification && !session && (
              <BulleNanse>
                <form onSubmit={demarrer} className="space-y-3" noValidate>
                  <p className="text-[14.5px] leading-relaxed text-encre">
                    {L("Avec plaisir ! Avant de continuer, comment vous appelez-vous et quelle est votre adresse email ? Elle nous permet de vous répondre si vous quittez le chat.", "Happy to help! Before we continue, what's your name and email address? It lets us reply if you leave the chat.")}
                  </p>
                  {/* Champ invisible anti-robots : de type « url » et placé avant le nom pour que
                      le remplissage automatique du navigateur ne le prenne pas pour un email. */}
                  <input value={piege} onChange={(e) => setPiege(e.target.value)} type="url" name="site_web" placeholder="https://" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute left-[-10000px] h-px w-px" />
                  <input ref={champNom} value={nom} onChange={(e) => setNom(e.target.value)} placeholder={L("Votre nom", "Your name")} autoComplete="name" maxLength={80}
                         className="h-11 w-full rounded-xl border border-trait bg-white px-3.5 text-[15px] text-encre outline-none focus:border-marque focus:ring-2 focus:ring-marque-100" />
                  <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder={L("Votre email", "Your email")} type="email" autoComplete="email" inputMode="email" maxLength={150}
                         className="h-11 w-full rounded-xl border border-trait bg-white px-3.5 text-[15px] text-encre outline-none focus:border-marque focus:ring-2 focus:ring-marque-100" />
                  {erreurIdent && <p className="text-[13px] font-semibold text-danger">{erreurIdent}</p>}
                  <button type="submit" disabled={creation} className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-marque text-[15px] font-semibold text-white transition-colors hover:bg-marque-fonce disabled:opacity-70">
                    {creation && <LoaderCircle size={16} className="animate-spin" />}
                    {L("Continuer la discussion", "Continue the chat")}
                  </button>
                  <p className="text-[12px] leading-snug text-attenue">{L("Vos informations servent uniquement à répondre à votre demande.", "Your details are only used to answer your request.")}</p>
                </form>
              </BulleNanse>
            )}

            {statut === "fermee" && (
              <div className="rounded-2xl border border-trait bg-white p-4 text-center">
                <p className="text-[14px] text-texte">{L("Cette conversation est terminée.", "This conversation has ended.")}</p>
                <button type="button" onClick={nouvelleConversation} className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-marque px-4 py-2 text-[14px] font-semibold text-white hover:bg-marque-fonce">
                  <MessageCirclePlus size={16} /> {L("Nouvelle conversation", "New conversation")}
                </button>
              </div>
            )}
          </div>

          {/* saisie */}
          {statut !== "fermee" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void envoyer(brouillon);
              }}
              className="border-t border-trait bg-white px-3 pb-3 pt-2.5"
            >
              {erreur && <p className="mb-2 px-1 text-[13px] font-semibold text-danger">{erreur}</p>}
              <div className="flex items-end gap-2 rounded-2xl border border-trait bg-fond px-3 py-2 focus-within:border-marque focus-within:ring-2 focus-within:ring-marque-100">
                <textarea
                  ref={saisie}
                  value={brouillon}
                  onChange={(e) => surSaisie(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void envoyer(brouillon);
                    }
                  }}
                  rows={1}
                  maxLength={2000}
                  placeholder={L("Écrivez votre question…", "Type your question…")}
                  aria-label={L("Votre message", "Your message")}
                  className="scrollbar-hide max-h-32 min-h-7 flex-1 resize-none bg-transparent py-1 text-[15px] text-encre outline-none [field-sizing:content] placeholder:text-attenue"
                />
                <button
                  type="submit"
                  disabled={!brouillon.trim() || attente}
                  aria-label={L("Envoyer", "Send")}
                  className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-marque text-white transition-colors hover:bg-marque-fonce disabled:cursor-default disabled:bg-slate-300"
                >
                  <ArrowUp size={18} strokeWidth={2.5} />
                </button>
              </div>
              <p className="mt-2 flex items-center justify-center gap-1.5 text-[11.5px] text-attenue">
                <Headset size={12} /> {L("Un conseiller Lumistock peut reprendre la conversation", "A Lumistock advisor can take over the conversation")}
              </p>
            </form>
          )}
        </section>
      )}
    </>
  );
};

const BulleNanse: React.FC<{ children: React.ReactNode; heureMessage?: string }> = ({ children, heureMessage }) => (
  <div className="flex items-end gap-2.5">
    <AvatarNanse taille={32} />
    <div className="max-w-[85%]">
      <p className="mb-1 text-[12px] font-semibold text-attenue">{NOM_ASSISTANT}{heureMessage && <span className="font-normal"> · {heureMessage}</span>}</p>
      <div className="rounded-2xl rounded-bl-md border border-trait bg-white px-3.5 py-2.5 shadow-sm">{children}</div>
    </div>
  </div>
);

const Message: React.FC<{ message: MessageAssistant }> = ({ message: m }) => {
  const L = useLangue();
  if (m.auteur === "systeme") {
    return (
      <p className="mx-auto w-fit max-w-[90%] rounded-full bg-marque-50 px-3.5 py-1.5 text-center text-[12.5px] font-semibold text-marque">
        {m.texte}
      </p>
    );
  }
  if (m.auteur === "visiteur") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%]">
          <div className="rounded-2xl rounded-br-md bg-marque px-3.5 py-2.5 text-white">
            <p className="whitespace-pre-wrap break-words text-[14.5px] leading-relaxed">{m.texte}</p>
          </div>
          <p className={`mt-1 text-right text-[11px] ${m.id.startsWith("local-") ? "text-attenue/70" : "text-attenue"}`}>{heure(m.created_at)}</p>
        </div>
      </div>
    );
  }
  if (m.auteur === "conseiller") {
    return (
      <div className="flex items-end gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[12px] font-bold text-white">{initiales(m.auteur_nom)}</span>
        <div className="max-w-[85%]">
          <p className="mb-1 text-[12px] font-semibold text-encre">
            {m.auteur_nom} <span className="font-normal text-attenue">· {L("Conseiller Lumistock", "Lumistock advisor")} · {heure(m.created_at)}</span>
          </p>
          <div className="rounded-2xl rounded-bl-md border border-emerald-200 bg-emerald-50 px-3.5 py-2.5">
            <Texte texte={m.texte} />
          </div>
        </div>
      </div>
    );
  }
  return (
    <BulleNanse heureMessage={heure(m.created_at)}>
      <Texte texte={m.texte} />
    </BulleNanse>
  );
};

export default ChatNanse;
