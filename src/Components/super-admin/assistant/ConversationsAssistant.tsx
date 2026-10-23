// Super-admin : conversations du chat public avec Nansé.
// À gauche la liste (celles qui attendent un conseiller d'abord), à droite la
// conversation choisie. Le staff peut suivre plusieurs visiteurs à la fois :
// chaque conversation garde sa pastille de messages non lus, la liste et la
// conversation ouverte se mettent à jour toutes les quelques secondes.
// ?c=<id> ouvre directement une conversation (lien de l'email d'alerte).
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { App, Empty, Input, Skeleton, Tooltip } from "antd";
import { ArrowLeft, Bot, CircleCheck, Globe, Mail, MessagesSquare, Search, Send, Undo2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import dayjs from "dayjs";
import "dayjs/locale/fr";
import relativeTime from "dayjs/plugin/relativeTime";
import AvatarNanse from "../../../Modules/Public/components/AvatarNanse";
import {
  NOM_ASSISTANT,
  EVENEMENT_ASSISTANT,
  changerStatutConversation,
  erreurAssistant,
  listerConversations,
  ouvrirConversation,
  repondreConversation,
  type ConversationStaff,
  type ListeConversations,
  type MessageAssistant,
  type StatutConversation,
} from "../../../services/assistant";

dayjs.extend(relativeTime);

const RELEVE_LISTE = 5000;
const RELEVE_CONVERSATION = 3000;

const ONGLETS: { cle: StatutConversation | "tous"; libelle: string }[] = [
  { cle: "tous", libelle: "Toutes" },
  { cle: "attente", libelle: "À traiter" },
  { cle: "conseiller", libelle: "En cours" },
  { cle: "ia", libelle: NOM_ASSISTANT },
  { cle: "fermee", libelle: "Fermées" },
];

const STYLE_STATUT: Record<StatutConversation, string> = {
  ia: "bg-purple-50 text-purple-800 ring-purple-200",
  attente: "bg-amber-50 text-amber-800 ring-amber-200",
  conseiller: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  fermee: "bg-slate-100 text-slate-600 ring-slate-200",
};

const initiales = (nom?: string | null) =>
  (nom || "?").split(/\s+/).filter(Boolean).slice(0, 2).map((m) => m[0]?.toUpperCase()).join("");
const quand = (iso?: string | null) => (iso ? dayjs(iso).locale("fr").fromNow() : "");
const heure = (iso: string) => dayjs(iso).locale("fr").format("HH:mm");
const annoncer = () => window.dispatchEvent(new Event(EVENEMENT_ASSISTANT));

const Pastille: React.FC<{ statut: StatutConversation; libelle: string }> = ({ statut, libelle }) => (
  <span className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${STYLE_STATUT[statut]}`}>{libelle}</span>
);

const Texte: React.FC<{ texte: string; clair?: boolean }> = ({ texte, clair }) => (
  <div className={`space-y-2 break-words text-[14px] leading-relaxed [&_li]:ml-4 [&_ol]:list-decimal [&_ul]:list-disc [&_strong]:font-semibold ${clair ? "text-white" : "text-slate-800"}`}>
    <ReactMarkdown remarkPlugins={[remarkGfm]}>{texte}</ReactMarkdown>
  </div>
);

const Bulle: React.FC<{ m: MessageAssistant }> = ({ m }) => {
  if (m.auteur === "systeme") {
    return <p className="mx-auto w-fit max-w-[85%] rounded-full bg-slate-100 px-3.5 py-1.5 text-center text-[12.5px] font-medium text-slate-600">{m.texte}</p>;
  }
  if (m.auteur === "visiteur") {
    return (
      <div className="flex items-end gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[12px] font-bold text-slate-700">{initiales(m.auteur_nom)}</span>
        <div className="max-w-[75%]">
          <p className="mb-1 text-[12px] font-semibold text-slate-600">
            {m.auteur_nom} · {heure(m.created_at)}
            {m.pertinente && (
              <Tooltip title="Question pertinente : elle compte pour l'alerte au staff">
                <CircleCheck size={13} className="ml-1.5 inline text-emerald-600" />
              </Tooltip>
            )}
          </p>
          <div className="rounded-2xl rounded-bl-md bg-white px-3.5 py-2.5 shadow-sm ring-1 ring-slate-200">
            <p className="whitespace-pre-wrap break-words text-[14px] leading-relaxed text-slate-800">{m.texte}</p>
          </div>
        </div>
      </div>
    );
  }
  const ia = m.auteur === "ia";
  return (
    <div className="flex flex-row-reverse items-end gap-2.5">
      {ia ? <AvatarNanse taille={32} /> : (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[12px] font-bold text-white">{initiales(m.auteur_nom)}</span>
      )}
      <div className="max-w-[75%]">
        <p className="mb-1 text-right text-[12px] font-semibold text-slate-600">{ia ? `${NOM_ASSISTANT} (IA)` : m.auteur_nom} · {heure(m.created_at)}</p>
        <div className={`rounded-2xl rounded-br-md px-3.5 py-2.5 ${ia ? "bg-purple-50 ring-1 ring-purple-100" : "bg-[#3b1558]"}`}>
          <Texte texte={m.texte} clair={!ia} />
        </div>
      </div>
    </div>
  );
};

const ConversationsAssistant: React.FC = () => {
  const { message, modal } = App.useApp();
  const [params, setParams] = useSearchParams();
  const choisie = params.get("c");
  const [onglet, setOnglet] = useState<StatutConversation | "tous">("tous");
  const [recherche, setRecherche] = useState("");
  const [liste, setListe] = useState<ListeConversations | null>(null);
  const [detail, setDetail] = useState<ConversationStaff | null>(null);
  const [chargement, setChargement] = useState(false);
  const [reponse, setReponse] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const fil = useRef<HTMLDivElement>(null);
  // Brouillon gardé par conversation : on peut passer d'un visiteur à l'autre sans perdre sa réponse.
  const brouillons = useRef<Record<string, string>>({});

  const chargerListe = useCallback(async () => {
    try {
      setListe(await listerConversations(onglet === "tous" ? undefined : onglet, recherche.trim()));
      setErreur(null);
    } catch (e) {
      setErreur(erreurAssistant(e, "Impossible de charger les conversations."));
    }
  }, [onglet, recherche]);

  useEffect(() => {
    void chargerListe();
    const t = window.setInterval(chargerListe, RELEVE_LISTE);
    return () => window.clearInterval(t);
  }, [chargerListe]);

  // Conversation ouverte : chargement, puis relevé régulier (marque les messages comme lus).
  useEffect(() => {
    if (!choisie) {
      setDetail(null);
      return;
    }
    let actif = true;
    setChargement(true);
    setReponse(brouillons.current[choisie] ?? "");
    const charger = async (premier = false) => {
      try {
        const d = await ouvrirConversation(choisie);
        if (!actif) return;
        setDetail((ancien) => (premier || !ancien || ancien.id !== d.id || (d.messages?.length ?? 0) !== (ancien.messages?.length ?? 0) || d.statut !== ancien.statut || d.en_ligne !== ancien.en_ligne ? d : ancien));
        if (premier) annoncer();
      } catch (e) {
        if (actif && premier) message.error(erreurAssistant(e, "Conversation introuvable."));
      } finally {
        if (actif && premier) setChargement(false);
      }
    };
    void charger(true);
    const t = window.setInterval(() => void charger(), RELEVE_CONVERSATION);
    return () => {
      actif = false;
      window.clearInterval(t);
    };
  }, [choisie, message]);

  useEffect(() => {
    fil.current?.scrollTo({ top: fil.current.scrollHeight, behavior: "smooth" });
  }, [detail?.messages?.length, detail?.id]);

  const ouvrir = (id: string | null) => {
    if (choisie) brouillons.current[choisie] = reponse;
    setParams(id ? { c: id } : {}, { replace: true });
  };

  const envoyer = async () => {
    if (!detail || !reponse.trim()) return;
    setEnvoi(true);
    try {
      const d = await repondreConversation(detail.id, reponse.trim());
      setDetail(d);
      setReponse("");
      brouillons.current[detail.id] = "";
      void chargerListe();
      annoncer();
    } catch (e) {
      message.error(erreurAssistant(e, "La réponse n'a pas pu être envoyée."));
    } finally {
      setEnvoi(false);
    }
  };

  const changerStatut = (statut: "ia" | "fermee") => {
    if (!detail) return;
    modal.confirm({
      title: statut === "fermee" ? "Fermer cette conversation ?" : `Rendre la main à ${NOM_ASSISTANT} ?`,
      content: statut === "fermee"
        ? "Le visiteur est prévenu que la conversation est terminée ; il pourra en commencer une nouvelle."
        : `${NOM_ASSISTANT} répondra de nouveau automatiquement aux messages du visiteur.`,
      okText: statut === "fermee" ? "Fermer" : "Rendre la main",
      cancelText: "Annuler",
      onOk: async () => {
        try {
          setDetail(await changerStatutConversation(detail.id, statut));
          void chargerListe();
          annoncer();
        } catch (e) {
          message.error(erreurAssistant(e));
        }
      },
    });
  };

  const conversations = liste?.conversations ?? [];
  const compteurs = liste?.compteurs;
  const statuts = liste?.statuts;
  const libelleStatut = useMemo(() => (s: StatutConversation) => statuts?.[s] ?? s, [statuts]);

  return (
    <div className="flex h-[calc(100dvh-7rem)] min-h-[520px] overflow-hidden rounded-2xl border border-slate-200 bg-white">
      {/* ------------------------------------------------------------ liste */}
      <aside className={`flex w-full flex-col border-r border-slate-200 md:w-[360px] md:shrink-0 ${choisie ? "hidden md:flex" : "flex"}`}>
        <div className="border-b border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <AvatarNanse taille={36} />
            <div className="min-w-0">
              <h1 className="text-lg font-bold leading-tight text-slate-900">Chat {NOM_ASSISTANT}</h1>
              <p className="text-[12.5px] text-slate-500">
                Alerte après {liste?.seuil ?? 3} questions pertinentes · {compteurs?.non_lus ?? 0} à traiter
              </p>
            </div>
          </div>
          <Input
            allowClear
            prefix={<Search size={15} className="text-slate-400" />}
            placeholder="Nom, email ou message"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            className="!mt-3"
          />
          <div className="-mx-1 mt-3 flex gap-1 overflow-x-auto pb-0.5 [scrollbar-width:none]">
            {ONGLETS.map((o) => {
              const n = o.cle === "tous" ? compteurs?.tous : compteurs?.[o.cle];
              const actif = onglet === o.cle;
              return (
                <button key={o.cle} type="button" onClick={() => setOnglet(o.cle)}
                        className={`shrink-0 cursor-pointer rounded-full px-3 py-1.5 text-[12.5px] font-semibold transition-colors ${actif ? "bg-[#3b1558] text-white" : "text-slate-600 hover:bg-slate-100"}`}>
                  {o.libelle}{typeof n === "number" ? ` · ${n}` : ""}
                </button>
              );
            })}
          </div>
        </div>
        <ul className="flex-1 overflow-y-auto">
          {!liste && !erreur && <li className="p-4"><Skeleton active avatar paragraph={{ rows: 2 }} /></li>}
          {erreur && <li className="p-4 text-sm font-semibold text-red-600">{erreur}</li>}
          {liste && conversations.length === 0 && (
            <li className="p-8"><Empty description="Aucune conversation pour le moment" /></li>
          )}
          {conversations.map((c) => {
            const actif = c.id === choisie;
            return (
              <li key={c.id}>
                <button type="button" onClick={() => ouvrir(c.id)}
                        className={`flex w-full cursor-pointer gap-3 border-b border-slate-100 px-4 py-3.5 text-left transition-colors ${actif ? "bg-purple-50" : "hover:bg-slate-50"}`}>
                  <span className="relative">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-[13px] font-bold text-slate-700">{initiales(c.nom)}</span>
                    {c.en_ligne && <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white" title="En ligne" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className={`truncate text-[14px] ${c.non_lus ? "font-bold text-slate-900" : "font-semibold text-slate-800"}`}>{c.nom}</span>
                      <span className="shrink-0 text-[11.5px] text-slate-400">{quand(c.updated_at)}</span>
                    </span>
                    <span className={`mt-0.5 block truncate text-[13px] ${c.non_lus ? "font-semibold text-slate-700" : "text-slate-500"}`}>{c.dernier_message || "—"}</span>
                    <span className="mt-1.5 flex items-center gap-1.5">
                      <Pastille statut={c.statut} libelle={libelleStatut(c.statut)} />
                      {c.statut === "conseiller" && c.agent_nom && <span className="truncate text-[11.5px] text-slate-500">{c.agent_nom}</span>}
                      {c.non_lus > 0 && (
                        <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 text-[11px] font-bold text-white">{c.non_lus}</span>
                      )}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      {/* ------------------------------------------------------------ conversation */}
      <section className={`min-w-0 flex-1 flex-col ${choisie ? "flex" : "hidden md:flex"}`}>
        {!choisie && (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center text-slate-500">
            <MessagesSquare size={40} className="text-slate-300" />
            <p className="max-w-xs text-sm">Choisissez une conversation pour la lire et répondre au visiteur. Vous pouvez en suivre plusieurs à la fois.</p>
          </div>
        )}
        {choisie && (chargement || !detail) && <div className="p-6"><Skeleton active paragraph={{ rows: 6 }} /></div>}
        {choisie && detail && !chargement && (
          <>
            <header className="flex flex-wrap items-center gap-3 border-b border-slate-200 px-4 py-3">
              <button type="button" onClick={() => ouvrir(null)} aria-label="Retour à la liste" className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 md:hidden">
                <ArrowLeft size={18} />
              </button>
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-[13px] font-bold text-slate-700">{initiales(detail.nom)}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-bold text-slate-900">{detail.nom}</p>
                <p className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[12.5px] text-slate-500">
                  <span className={`font-medium ${detail.en_ligne ? "text-emerald-600" : "text-slate-400"}`}>
                    {detail.en_ligne ? "● En ligne" : `Vu ${quand(detail.derniere_activite)}`}
                  </span>
                  <a href={`mailto:${detail.email}`} className="inline-flex items-center gap-1 !text-slate-500 hover:!text-[#3b1558]"><Mail size={12} /> {detail.email}</a>
                  {detail.page && <span className="inline-flex items-center gap-1" title="Page d'où le visiteur a ouvert le chat"><Globe size={12} /> {detail.page}</span>}
                  <span>{detail.questions_pertinentes} question{detail.questions_pertinentes > 1 ? "s" : ""} pertinente{detail.questions_pertinentes > 1 ? "s" : ""}</span>
                  <span>{detail.langue === "en" ? "Anglais" : "Français"}</span>
                </p>
              </div>
              <Pastille statut={detail.statut} libelle={libelleStatut(detail.statut)} />
              {detail.statut === "conseiller" && (
                <button type="button" onClick={() => changerStatut("ia")} className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-[13px] font-semibold text-slate-700 hover:bg-slate-50">
                  <Undo2 size={14} /> Rendre à {NOM_ASSISTANT}
                </button>
              )}
              {detail.statut !== "fermee" && (
                <button type="button" onClick={() => changerStatut("fermee")} className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-[13px] font-semibold text-slate-700 hover:bg-slate-50">
                  <CircleCheck size={14} /> Fermer
                </button>
              )}
            </header>

            <div ref={fil} className="flex-1 space-y-4 overflow-y-auto bg-slate-50 px-4 py-5 sm:px-6">
              {(detail.messages ?? []).map((m) => <Bulle key={m.id} m={m} />)}
            </div>

            {detail.statut !== "fermee" ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void envoyer();
                }}
                className="border-t border-slate-200 bg-white p-3"
              >
                {detail.statut !== "conseiller" && (
                  <p className="mb-2 flex items-center gap-1.5 px-1 text-[12.5px] text-slate-500">
                    <Bot size={13} /> En répondant, vous reprenez la main : {NOM_ASSISTANT} ne répondra plus et le visiteur verra votre nom.
                  </p>
                )}
                <div className="flex items-end gap-2">
                  <Input.TextArea
                    value={reponse}
                    onChange={(e) => setReponse(e.target.value)}
                    onPressEnter={(e) => {
                      if (!e.shiftKey) {
                        e.preventDefault();
                        void envoyer();
                      }
                    }}
                    autoSize={{ minRows: 1, maxRows: 6 }}
                    maxLength={2000}
                    placeholder={`Répondre à ${detail.nom}… (Entrée pour envoyer, Maj+Entrée pour aller à la ligne)`}
                  />
                  <button type="submit" disabled={envoi || !reponse.trim()}
                          className="flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-lg bg-[#3b1558] px-4 text-sm font-semibold text-white hover:bg-[#2d1045] disabled:cursor-default disabled:opacity-50">
                    <Send size={15} /> Envoyer
                  </button>
                </div>
              </form>
            ) : (
              <p className="border-t border-slate-200 bg-white p-4 text-center text-sm text-slate-500">Conversation fermée.</p>
            )}
          </>
        )}
      </section>
    </div>
  );
};

export default ConversationsAssistant;
