// Assistant IA de Lumistock : discussions avec l'IA sur les données du magasin
// et analyse de l'activité. Couleurs de la marque : purple-950 / #3b1558, accents fuchsia.
import { useEffect, useMemo, useRef, useState } from "react";
import { Drawer, Dropdown, Input, Modal, Spin, message } from "antd";
import type { MenuProps } from "antd";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  AlertTriangle, ArrowUp, Boxes, Calculator, Check, Copy, HandCoins, Menu as MenuIcon, MessageSquare,
  MoonStar, MoreHorizontal, Pencil, Plus, RefreshCw, Search, Sparkles, Trash2, TrendingUp, UsersRound, Wallet, X,
} from "lucide-react";
import { getUrlServer } from "../../../configServer";
import PageTitle from "../../PageTitle";
import MarkdownIA from "./MarkdownIA";

/* ------------------------------------------------------------------ */
/* Types et appels au serveur                                           */
/* ------------------------------------------------------------------ */

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  /** Réponse en échec : affichée en orange avec un bouton « Réessayer » */
  erreur?: boolean;
  /** Question à renvoyer si l'on réessaie */
  question?: string;
}

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

interface Analyse { insights: string; genere_le?: string }

const entetes = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("access_token") ?? ""}` } });
const api = (chemin: string) => `${getUrlServer()}/ai${chemin}`;
const fetchMoi = async (): Promise<{ first_name?: string }> => (await axios.get(`${getUrlServer()}/users/me`, entetes())).data;

/** Message d'erreur clair renvoyé par le serveur ({ error: "..." }), sinon le message par défaut. */
const messageErreur = (e: unknown, defaut: string): string => {
  const d = (e as { response?: { data?: { error?: unknown; message?: unknown } } })?.response?.data;
  const texte = d?.error ?? d?.message;
  return typeof texte === "string" && texte ? texte : defaut;
};

/** Nombre de jours calendaires entre une date et aujourd'hui. */
const joursDepuis = (iso: string) => {
  const d = new Date(iso);
  const debut = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  return Math.round((debut(new Date()) - debut(d)) / 86400000);
};

/* ------------------------------------------------------------------ */
/* Petits composants                                                    */
/* ------------------------------------------------------------------ */

/** Pastille de l'assistant (étincelle blanche sur violet Lumistock). */
const AvatarIA: React.FC<{ taille?: "sm" | "lg" }> = ({ taille = "sm" }) => (
  <span
    className={`relative flex shrink-0 items-center justify-center bg-purple-950 text-white shadow-sm ${
      taille === "lg" ? "h-14 w-14 rounded-2xl" : "h-8 w-8 rounded-xl"
    }`}
  >
    <Sparkles size={taille === "lg" ? 26 : 16} />
    {taille === "lg" && <span className="absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full bg-fuchsia-400 ring-4 ring-white" />}
  </span>
);

const PointsAttente: React.FC = () => (
  <span className="flex items-center gap-1">
    {[0, 150, 300].map((d) => (
      <span key={d} className="h-1.5 w-1.5 animate-bounce rounded-full bg-fuchsia-500" style={{ animationDelay: `${d}ms` }} />
    ))}
  </span>
);

const BoutonCopier: React.FC<{ texte: string }> = ({ texte }) => {
  const { t } = useTranslation();
  const [copie, setCopie] = useState(false);
  const copier = async () => {
    try {
      await navigator.clipboard.writeText(texte);
      setCopie(true);
      setTimeout(() => setCopie(false), 1800);
    } catch { /* presse-papiers indisponible */ }
  };
  return (
    <button
      onClick={copier}
      className="inline-flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
    >
      {copie ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
      {copie ? t("admin.ia.chat.copied") : t("admin.ia.chat.copy")}
    </button>
  );
};

/* ------------------------------------------------------------------ */
/* Page                                                                 */
/* ------------------------------------------------------------------ */

const AIChat = () => {
  const { t, i18n } = useTranslation();
  const locale = i18n.language?.startsWith("en") ? "en-US" : "fr-FR";
  const role = localStorage.getItem("role");
  const vueMagasin = role === "admin" || role === "manager";
  const caissier = role === "caissier";
  const moi = useQuery({ queryKey: ["moi"], queryFn: fetchMoi, staleTime: 5 * 60 * 1000 });
  const prenom = (moi.data?.first_name || "").trim();

  /* ── Discussions ── */
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [chargementListe, setChargementListe] = useState(true);
  const [recherche, setRecherche] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chargementConv, setChargementConv] = useState(false);
  const [saisie, setSaisie] = useState("");
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [renommageId, setRenommageId] = useState<string | null>(null);
  const [titreRenomme, setTitreRenomme] = useState("");
  const [panneauMobile, setPanneauMobile] = useState(false);

  /* ── Analyse de l'activité ── */
  const [analyseOuverte, setAnalyseOuverte] = useState(false);
  const [analyse, setAnalyse] = useState<Analyse | null>(null);
  const [analyseEnCours, setAnalyseEnCours] = useState(false);
  const [analyseErreur, setAnalyseErreur] = useState<string | null>(null);

  const zoneMessages = useRef<HTMLDivElement>(null);
  const champ = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    zoneMessages.current?.scrollTo({ top: zoneMessages.current.scrollHeight, behavior: "smooth" });
  }, [messages, envoiEnCours]);

  const chargerConversations = async () => {
    try {
      const res = await axios.get(api("/conversations"), entetes());
      setConversations(res.data.conversations || []);
    } catch {
      message.error(t("admin.ia.messages.loadError"));
    } finally {
      setChargementListe(false);
    }
  };

  useEffect(() => {
    chargerConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ouvrirConversation = async (id: string) => {
    setPanneauMobile(false);
    if (id === activeId) return;
    setActiveId(id);
    setMessages([]);
    setChargementConv(true);
    try {
      const res = await axios.get(api(`/conversations/${id}`), entetes());
      setMessages(res.data.messages || []);
    } catch {
      message.error(t("admin.ia.messages.loadConvError"));
    } finally {
      setChargementConv(false);
    }
  };

  /** Nouvelle discussion : rien n'est créé côté serveur avant le premier message. */
  const nouvelleDiscussion = () => {
    setActiveId(null);
    setMessages([]);
    setSaisie("");
    setPanneauMobile(false);
    setTimeout(() => champ.current?.focus(), 50);
  };

  /** `nouvelle` : envoie dans une nouvelle discussion, quelle que soit celle ouverte. */
  const envoyer = async (texteForce?: string, nouvelle = false) => {
    const texte = (texteForce ?? saisie).trim();
    const convId = nouvelle ? null : activeId;
    if (!texte || envoiEnCours) return;

    setMessages((prev) => [
      ...prev.filter((m) => !m.erreur),
      { id: `u-${Date.now()}`, role: "user", content: texte, timestamp: new Date().toISOString() },
    ]);
    setSaisie("");
    setEnvoiEnCours(true);

    try {
      const res = await axios.post(api("/chat"), { message: texte, conversation_id: convId }, entetes());
      setMessages((prev) => [
        ...prev,
        {
          id: res.data.message_id || `a-${Date.now()}`,
          role: "assistant",
          content: res.data.response || t("admin.ia.messages.aiNoResponse"),
          timestamp: new Date().toISOString(),
        },
      ]);
      if (!convId && res.data.conversation_id) setActiveId(res.data.conversation_id);
      chargerConversations();
    } catch (e) {
      // La question reste affichée ; on propose de réessayer sans la retaper.
      setMessages((prev) => [
        ...prev.slice(0, -1),
        {
          id: `e-${Date.now()}`,
          role: "assistant",
          content: messageErreur(e, t("admin.ia.messages.commError")),
          timestamp: new Date().toISOString(),
          erreur: true,
          question: texte,
        },
      ]);
    } finally {
      setEnvoiEnCours(false);
      champ.current?.focus();
    }
  };

  const renommer = async (id: string) => {
    const titre = titreRenomme.trim();
    setRenommageId(null);
    const actuel = conversations.find((c) => c.id === id);
    if (!titre || titre === actuel?.title) return;
    try {
      await axios.patch(api(`/conversations/${id}`), { title: titre }, entetes());
      setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, title: titre } : c)));
      message.success(t("admin.ia.messages.renameSuccess"));
    } catch {
      message.error(t("admin.ia.messages.renameError"));
    }
  };

  const supprimer = (id: string) =>
    Modal.confirm({
      title: t("admin.ia.modals.deleteTitle"),
      content: t("admin.ia.modals.deleteContent"),
      okText: t("admin.ia.modals.delete"),
      okType: "danger",
      cancelText: t("admin.ia.modals.cancel"),
      onOk: async () => {
        try {
          await axios.delete(api(`/conversations/${id}`), entetes());
          setConversations((prev) => prev.filter((c) => c.id !== id));
          if (activeId === id) nouvelleDiscussion();
          message.success(t("admin.ia.messages.deleteSuccess"));
        } catch {
          message.error(t("admin.ia.messages.deleteError"));
        }
      },
    });

  const toutEffacer = () =>
    Modal.confirm({
      title: t("admin.ia.modals.clearTitle"),
      content: t("admin.ia.modals.clearContent"),
      okText: t("admin.ia.modals.clear"),
      okType: "danger",
      cancelText: t("admin.ia.modals.cancel"),
      onOk: async () => {
        try {
          await axios.delete(api("/conversations"), entetes());
          setConversations([]);
          nouvelleDiscussion();
          message.success(t("admin.ia.messages.clearSuccess"));
        } catch {
          message.error(t("admin.ia.messages.clearError"));
        }
      },
    });

  /** Analyse à la demande (appel payant, mis en cache 15 min par le serveur). */
  const lancerAnalyse = async (forcer = false) => {
    setAnalyseOuverte(true);
    if (analyse && !forcer) return;
    setAnalyseEnCours(true);
    setAnalyseErreur(null);
    try {
      const res = await axios.get(api(`/insights${forcer ? "?forcer=1" : ""}`), entetes());
      setAnalyse(res.data);
    } catch (e) {
      setAnalyseErreur(messageErreur(e, t("admin.ia.insights.error")));
    } finally {
      setAnalyseEnCours(false);
    }
  };

  const discuterAnalyse = () => {
    setAnalyseOuverte(false);
    nouvelleDiscussion();
    envoyer(t("admin.ia.insights.discussPrompt"), true);
  };

  /* ── Données dérivées ── */
  const heure = (iso: string) => new Date(iso).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });

  const groupes = useMemo(() => {
    const filtre = recherche.trim().toLowerCase();
    const liste = filtre ? conversations.filter((c) => c.title.toLowerCase().includes(filtre)) : conversations;
    const ordre: { cle: string; libelle: string; items: Conversation[] }[] = [
      { cle: "today", libelle: t("admin.ia.sidebar.groups.today"), items: [] },
      { cle: "yesterday", libelle: t("admin.ia.sidebar.groups.yesterday"), items: [] },
      { cle: "week", libelle: t("admin.ia.sidebar.groups.week"), items: [] },
      { cle: "older", libelle: t("admin.ia.sidebar.groups.older"), items: [] },
    ];
    for (const c of liste) {
      const j = joursDepuis(c.updated_at);
      ordre[j <= 0 ? 0 : j === 1 ? 1 : j <= 7 ? 2 : 3].items.push(c);
    }
    return ordre.filter((g) => g.items.length > 0);
  }, [conversations, recherche, t]);

  const titreActif = conversations.find((c) => c.id === activeId)?.title;

  const suggestions = vueMagasin
    ? [
        { cle: "stock", icone: <Boxes size={19} />, teinte: "bg-emerald-100 text-emerald-800" },
        { cle: "sales", icone: <TrendingUp size={19} />, teinte: "bg-orange-100 text-orange-700" },
        { cle: "debts", icone: <HandCoins size={19} />, teinte: "bg-sky-100 text-sky-800" },
        { cle: "margin", icone: <Calculator size={19} />, teinte: "bg-teal-100 text-teal-800" },
        { cle: "sleeping", icone: <MoonStar size={19} />, teinte: "bg-amber-100 text-amber-800" },
        { cle: "team", icone: <UsersRound size={19} />, teinte: "bg-indigo-100 text-indigo-800" },
      ].map((s) => ({ ...s, categorie: t(`admin.ia.welcome.admin.${s.cle}.cat`), question: t(`admin.ia.welcome.admin.${s.cle}.q`) }))
    : caissier
    ? [
        { cle: "jour", icone: <TrendingUp size={19} />, teinte: "bg-orange-100 text-orange-700" },
        { cle: "caisse", icone: <Wallet size={19} />, teinte: "bg-teal-100 text-teal-800" },
        { cle: "debts", icone: <HandCoins size={19} />, teinte: "bg-sky-100 text-sky-800" },
        { cle: "push", icone: <Boxes size={19} />, teinte: "bg-emerald-100 text-emerald-800" },
      ].map((s) => ({ ...s, categorie: t(`admin.ia.welcome.cashier.${s.cle}.cat`), question: t(`admin.ia.welcome.cashier.${s.cle}.q`) }))
    : [
        { cle: "sales", icone: <TrendingUp size={19} />, teinte: "bg-orange-100 text-orange-700" },
        { cle: "debts", icone: <HandCoins size={19} />, teinte: "bg-sky-100 text-sky-800" },
        { cle: "stock", icone: <Boxes size={19} />, teinte: "bg-emerald-100 text-emerald-800" },
        { cle: "push", icone: <Wallet size={19} />, teinte: "bg-teal-100 text-teal-800" },
      ].map((s) => ({ ...s, categorie: t(`admin.ia.welcome.seller.${s.cle}.cat`), question: t(`admin.ia.welcome.seller.${s.cle}.q`) }));

  /* ------------------------------------------------------------------ */
  /* Panneau des discussions                                              */
  /* ------------------------------------------------------------------ */

  const menuConversation = (c: Conversation): MenuProps["items"] => [
    {
      key: "rename",
      icon: <Pencil size={14} />,
      label: t("admin.ia.sidebar.rename"),
      onClick: ({ domEvent }) => { domEvent.stopPropagation(); setRenommageId(c.id); setTitreRenomme(c.title); },
    },
    {
      key: "delete",
      danger: true,
      icon: <Trash2 size={14} />,
      label: t("admin.ia.sidebar.delete"),
      onClick: ({ domEvent }) => { domEvent.stopPropagation(); supprimer(c.id); },
    },
  ];

  const panneau = (
    <div className="flex h-full flex-col">
      <div className="space-y-3 border-b border-slate-100 p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <AvatarIA />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-purple-950">{t("admin.ia.chat.aiName")}</p>
              <p className="flex items-center gap-1.5 text-[11px] text-slate-500">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> {t("admin.ia.header.period")}
              </p>
            </div>
          </div>
          <button
            onClick={() => setPanneauMobile(false)}
            className="cursor-pointer rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 md:hidden"
          >
            <X size={18} />
          </button>
        </div>
        <button
          onClick={nouvelleDiscussion}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl !bg-purple-950 px-4 py-2.5 text-sm font-semibold !text-white shadow-sm shadow-purple-950/20 transition-colors hover:!bg-purple-900"
        >
          <Plus size={17} /> {t("admin.ia.sidebar.newChat")}
        </button>
        {conversations.length > 0 && (
          <div className="relative">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder={t("admin.ia.sidebar.search")}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-purple-300 focus:bg-white focus:ring-2 focus:ring-purple-100"
            />
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-2.5 py-3 scrollbar-hide">
        {chargementListe ? (
          <div className="space-y-2 px-1.5">
            {[0, 1, 2, 3].map((i) => <div key={i} className="h-11 animate-pulse rounded-xl bg-slate-100" />)}
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center px-4 py-10 text-center">
            <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-700">
              <MessageSquare size={22} />
            </span>
            <p className="text-sm font-semibold text-slate-700">{t("admin.ia.sidebar.noChat")}</p>
            <p className="mt-1 text-xs text-slate-400">{t("admin.ia.sidebar.startChat")}</p>
          </div>
        ) : groupes.length === 0 ? (
          <p className="px-3 py-8 text-center text-sm text-slate-400">{t("admin.ia.sidebar.noResult")}</p>
        ) : (
          groupes.map((g) => (
            <div key={g.cle} className="mb-4 last:mb-0">
              <p className="mb-1.5 px-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{g.libelle}</p>
              {g.items.map((c) => {
                const actif = c.id === activeId;
                return (
                  <div
                    key={c.id}
                    onClick={() => renommageId !== c.id && ouvrirConversation(c.id)}
                    className={`group relative mb-0.5 flex cursor-pointer items-center gap-2 rounded-xl px-2.5 py-2 transition-colors ${
                      actif ? "bg-purple-50 text-purple-950" : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {actif && <span className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-purple-700" />}
                    <MessageSquare size={15} className={`shrink-0 ${actif ? "text-purple-700" : "text-slate-400"}`} />
                    {renommageId === c.id ? (
                      <Input
                        size="small"
                        value={titreRenomme}
                        onChange={(e) => setTitreRenomme(e.target.value)}
                        onPressEnter={() => renommer(c.id)}
                        onKeyDown={(e) => e.key === "Escape" && setRenommageId(null)}
                        onBlur={() => renommer(c.id)}
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                      />
                    ) : (
                      <>
                        <span className={`min-w-0 flex-1 truncate text-sm ${actif ? "font-semibold" : "font-medium"}`}>{c.title}</span>
                        <span className="shrink-0 text-[11px] text-slate-400 group-hover:hidden">
                          {joursDepuis(c.updated_at) <= 0
                            ? heure(c.updated_at)
                            : new Date(c.updated_at).toLocaleDateString(locale, { day: "numeric", month: "short" })}
                        </span>
                        <Dropdown menu={{ items: menuConversation(c) }} trigger={["click"]} placement="bottomRight">
                          <button
                            onClick={(e) => e.stopPropagation()}
                            className="hidden shrink-0 cursor-pointer rounded-lg p-1 text-slate-500 hover:bg-white hover:text-slate-800 group-hover:block"
                          >
                            <MoreHorizontal size={16} />
                          </button>
                        </Dropdown>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>

      {conversations.length > 0 && (
        <div className="border-t border-slate-100 p-3">
          <button
            onClick={toutEffacer}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-slate-500 transition-colors hover:bg-rose-50 hover:text-rose-700"
          >
            <Trash2 size={14} /> {t("admin.ia.sidebar.clearAll")}
          </button>
        </div>
      )}
    </div>
  );

  /* ------------------------------------------------------------------ */
  /* Rendu                                                                */
  /* ------------------------------------------------------------------ */

  return (
    <>
      <PageTitle>{t("admin.ia.title")}</PageTitle>

      <div className="relative flex h-[calc(100dvh-7.5rem)] min-h-[520px] overflow-hidden rounded-2xl border border-purple-100/70 bg-white shadow-sm">
        {/* Panneau des discussions : fixe sur grand écran, tiroir sur mobile */}
        {panneauMobile && <div className="absolute inset-0 z-20 bg-purple-950/20 md:hidden" onClick={() => setPanneauMobile(false)} />}
        <aside
          className={`absolute inset-y-0 left-0 z-30 w-[280px] shrink-0 border-r border-slate-100 bg-white transition-transform duration-300 md:relative md:translate-x-0 ${
            panneauMobile ? "translate-x-0 shadow-xl" : "-translate-x-full"
          }`}
        >
          {panneau}
        </aside>

        <main className="flex min-w-0 flex-1 flex-col bg-slate-50/60">
          {/* Barre du haut */}
          <div className="flex items-center gap-3 border-b border-slate-100 bg-white px-3 py-2.5 sm:px-5">
            <button
              onClick={() => setPanneauMobile(true)}
              className="cursor-pointer rounded-lg p-2 text-slate-500 hover:bg-slate-100 md:hidden"
            >
              <MenuIcon size={18} />
            </button>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900 sm:text-[15px]">
                {titreActif || t("admin.ia.header.newChat")}
              </p>
              <p className="hidden text-xs text-slate-500 sm:block">{t("admin.ia.header.subtitle")}</p>
            </div>
            <button
              onClick={() => lancerAnalyse()}
              className="inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-xl border border-purple-200 bg-white px-3 py-2 text-sm font-semibold text-purple-950 transition-colors hover:bg-purple-50"
            >
              <Sparkles size={16} className="text-fuchsia-500" />
              <span className="hidden sm:inline">{t("admin.ia.header.analysis")}</span>
            </button>
          </div>

          {/* Messages ou accueil */}
          <div ref={zoneMessages} className="flex-1 overflow-y-auto scrollbar-hide">
            {chargementConv ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-sm text-slate-500">
                <Spin /> {t("admin.ia.chat.loadingConv")}
              </div>
            ) : messages.length === 0 ? (
              <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col justify-center px-4 py-8 sm:px-6">
                <div className="mb-7 flex flex-col items-center text-center">
                  <AvatarIA taille="lg" />
                  <h1 className="mt-5 text-2xl font-bold leading-tight text-purple-950 sm:text-3xl">
                    {prenom
                      ? t("admin.ia.welcome.hello", { name: prenom.charAt(0).toUpperCase() + prenom.slice(1) })
                      : t("admin.ia.welcome.helloNoName")}
                  </h1>
                  <p className="mt-1.5 text-lg font-medium text-slate-700 sm:text-xl">{t("admin.ia.welcome.title")}</p>
                  <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-500">{t("admin.ia.welcome.subtitle")}</p>
                </div>

                {/* Analyse de l'activité : même style que le bandeau de l'accueil */}
                <div className="relative mb-6 overflow-hidden rounded-2xl bg-purple-950 p-5 text-white shadow-lg shadow-purple-950/15 sm:p-6">
                  <div className="pointer-events-none absolute -right-16 -top-20 h-44 w-44 rounded-full bg-purple-900/70" />
                  <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-fuchsia-500 px-2.5 py-1 text-[11px] font-semibold">
                        <Sparkles size={12} /> {t("admin.ia.welcome.analysisBadge")}
                      </span>
                      <h2 className="mt-3 text-lg font-bold">{t("admin.ia.welcome.analysisTitle")}</h2>
                      <p className="mt-1 text-sm text-purple-100">{t("admin.ia.welcome.analysisText")}</p>
                    </div>
                    <button
                      onClick={() => lancerAnalyse()}
                      className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl !bg-white px-4 py-2.5 text-sm font-semibold !text-purple-950 shadow-md transition-colors hover:!bg-purple-50"
                    >
                      <Sparkles size={16} /> {t("admin.ia.welcome.analysisButton")}
                    </button>
                  </div>
                </div>

                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">{t("admin.ia.welcome.suggestionsTitle")}</p>
                <div className={`grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3 ${vueMagasin ? "lg:grid-cols-3" : ""}`}>
                  {suggestions.map((s) => (
                    <button
                      key={s.cle}
                      onClick={() => envoyer(s.question)}
                      disabled={envoiEnCours}
                      className="group flex cursor-pointer items-start gap-3 rounded-2xl border border-purple-100/70 bg-white p-3.5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-purple-200 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${s.teinte}`}>{s.icone}</span>
                      <span className="min-w-0">
                        <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">{s.categorie}</span>
                        <span className="mt-0.5 block text-sm font-medium leading-snug text-slate-800 group-hover:text-purple-950">{s.question}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mx-auto w-full max-w-3xl space-y-6 px-3 py-6 sm:px-6">
                {messages.map((m) =>
                  m.role === "user" ? (
                    <div key={m.id} className="flex flex-col items-end">
                      <div className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-purple-950 px-4 py-2.5 text-[14.5px] leading-relaxed text-white shadow-sm sm:max-w-[75%]">
                        {m.content}
                      </div>
                      <span className="mt-1 pr-1 text-[11px] text-slate-400">{heure(m.timestamp)}</span>
                    </div>
                  ) : m.erreur ? (
                    <div key={m.id} className="flex gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
                        <AlertTriangle size={16} />
                      </span>
                      <div className="min-w-0 flex-1 rounded-2xl rounded-tl-md bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
                        <p>{m.content}</p>
                        {m.question && (
                          <button
                            onClick={() => envoyer(m.question)}
                            className="mt-2.5 inline-flex cursor-pointer items-center gap-1.5 rounded-lg !bg-white px-3 py-1.5 text-xs font-semibold !text-amber-900 ring-1 ring-amber-200 hover:!bg-amber-100"
                          >
                            <RefreshCw size={13} /> {t("admin.ia.chat.retry")}
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div key={m.id} className="flex gap-3">
                      <AvatarIA />
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          <span className="text-[13px] font-semibold text-purple-950">{t("admin.ia.chat.aiName")}</span>
                          <span className="text-[11px] text-slate-400">{heure(m.timestamp)}</span>
                        </div>
                        <div className="rounded-2xl rounded-tl-md bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200/80">
                          <MarkdownIA texte={m.content} />
                        </div>
                        <div className="mt-1">
                          <BoutonCopier texte={m.content} />
                        </div>
                      </div>
                    </div>
                  ),
                )}

                {envoiEnCours && (
                  <div className="flex gap-3">
                    <AvatarIA />
                    <div className="flex items-center gap-3 rounded-2xl rounded-tl-md bg-white px-4 py-3 text-sm text-slate-500 shadow-sm ring-1 ring-slate-200/80">
                      <PointsAttente /> {t("admin.ia.chat.typing")}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Zone de saisie */}
          <div className="border-t border-slate-100 bg-white px-3 pb-3 pt-3 sm:px-6">
            <div className="mx-auto w-full max-w-3xl">
              <div className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-white p-2 pl-4 shadow-sm transition focus-within:border-purple-300 focus-within:ring-4 focus-within:ring-purple-100">
                <Input.TextArea
                  ref={(r) => { champ.current = r?.resizableTextArea?.textArea ?? null; }}
                  value={saisie}
                  onChange={(e) => setSaisie(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); envoyer(); }
                  }}
                  placeholder={t("admin.ia.chat.placeholder")}
                  autoSize={{ minRows: 1, maxRows: 6 }}
                  variant="borderless"
                  className="scrollbar-hide !px-0 !py-2 !text-[15px] !text-slate-900"
                  style={{ resize: "none", boxShadow: "none" }}
                />
                <button
                  onClick={() => envoyer()}
                  disabled={!saisie.trim() || envoiEnCours}
                  title={t("admin.ia.chat.send")}
                  className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl !bg-purple-950 !text-white shadow-sm transition-colors hover:!bg-purple-900 disabled:cursor-not-allowed disabled:!bg-slate-200 disabled:!text-slate-400 disabled:shadow-none"
                >
                  {envoiEnCours ? <Spin size="small" /> : <ArrowUp size={19} />}
                </button>
              </div>
              <div className="mt-2 flex items-center justify-between gap-3 px-1 text-[11px] text-slate-400">
                <span className="hidden sm:inline">{t("admin.ia.chat.hint")}</span>
                <span className="text-center sm:text-right">{t("admin.ia.chat.disclaimer")}</span>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Analyse de l'activité */}
      <Drawer
        open={analyseOuverte}
        onClose={() => setAnalyseOuverte(false)}
        placement="right"
        width={Math.min(480, typeof window !== "undefined" ? window.innerWidth : 480)}
        closable={false}
        styles={{ body: { padding: 0 } }}
      >
        <div className="flex h-full flex-col">
          <div className="relative overflow-hidden bg-purple-950 px-5 pb-5 pt-4 text-white">
            <div className="pointer-events-none absolute -right-14 -top-16 h-40 w-40 rounded-full bg-purple-900/70" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-fuchsia-500 px-2.5 py-1 text-[11px] font-semibold">
                  <Sparkles size={12} /> {t("admin.ia.welcome.analysisBadge")}
                </span>
                <button onClick={() => setAnalyseOuverte(false)} className="cursor-pointer rounded-lg p-1.5 text-purple-200 hover:bg-white/10 hover:text-white">
                  <X size={18} />
                </button>
              </div>
              <h2 className="mt-3 text-lg font-bold">{t("admin.ia.insights.title")}</h2>
              <p className="mt-0.5 text-sm text-purple-100">{t("admin.ia.insights.subtitle")}</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-5 scrollbar-hide">
            {analyseEnCours ? (
              <div className="space-y-4">
                <p className="flex items-center gap-2.5 text-sm text-slate-500"><PointsAttente /> {t("admin.ia.insights.loading")}</p>
                {[80, 95, 60, 90, 70].map((w, i) => (
                  <div key={i} className="h-3 animate-pulse rounded bg-slate-100" style={{ width: `${w}%` }} />
                ))}
              </div>
            ) : analyseErreur ? (
              <div className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-200">
                <p className="flex items-start gap-2"><AlertTriangle size={17} className="mt-0.5 shrink-0" /> {analyseErreur}</p>
                <button
                  onClick={() => lancerAnalyse(true)}
                  className="mt-3 inline-flex cursor-pointer items-center gap-1.5 rounded-lg !bg-white px-3 py-1.5 text-xs font-semibold !text-amber-900 ring-1 ring-amber-200 hover:!bg-amber-100"
                >
                  <RefreshCw size={13} /> {t("admin.ia.chat.retry")}
                </button>
              </div>
            ) : analyse ? (
              <MarkdownIA texte={analyse.insights} />
            ) : null}
          </div>

          {analyse && !analyseEnCours && (
            <div className="space-y-2.5 border-t border-slate-100 bg-white p-4">
              <button
                onClick={discuterAnalyse}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl !bg-purple-950 px-4 py-2.5 text-sm font-semibold !text-white hover:!bg-purple-900"
              >
                <MessageSquare size={16} /> {t("admin.ia.insights.discuss")}
              </button>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>{analyse.genere_le ? t("admin.ia.insights.generatedAt", { time: heure(analyse.genere_le) }) : ""}</span>
                <button
                  onClick={() => lancerAnalyse(true)}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1 font-medium text-purple-800 hover:bg-purple-50"
                >
                  <RefreshCw size={13} /> {t("admin.ia.insights.refresh")}
                </button>
              </div>
            </div>
          )}
        </div>
      </Drawer>
    </>
  );
};

export default AIChat;
