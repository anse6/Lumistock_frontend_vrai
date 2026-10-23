// Messagerie de support entre l'administrateur d'un magasin et le staff
// Lumistock. Le même écran sert aux deux côtés :
// - « admin » : il écrit à l'équipe Lumistock et voit ses conversations ;
// - « staff » : il voit toutes les conversations et peut en ouvrir une avec
//   l'administrateur de son choix.
// Chacun peut lancer une conversation. Liste et conversation ouverte se
// mettent à jour toutes les quelques secondes ; ?c=<id> ouvre une
// conversation (lien des emails).
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { App, Empty, Form, Input, Modal, Select, Skeleton } from "antd";
import { ArrowLeft, CheckCheck, CircleCheck, LifeBuoy, MessageSquarePlus, RotateCcw, Search, Send, Store } from "lucide-react";
import dayjs from "dayjs";
import "dayjs/locale/fr";
import relativeTime from "dayjs/plugin/relativeTime";
import {
  EVENEMENT_SUPPORT,
  creerSupport,
  ecrireSupport,
  erreurSupport,
  listerAdmins,
  listerSupport,
  ouvrirSupport,
  statutSupport,
  type AdminSupport,
  type ConversationSupport,
  type ListeSupport,
  type MessageSupport,
  type StatutSupport,
} from "../../services/support";

dayjs.extend(relativeTime);

type Cote = "admin" | "staff";

const RELEVE_LISTE = 8000;
const RELEVE_CONVERSATION = 4000;
const VIOLET = "#3b1558";

const initiales = (nom?: string | null) =>
  (nom || "?").split(/\s+/).filter(Boolean).slice(0, 2).map((m) => m[0]?.toUpperCase()).join("");
const quand = (iso?: string | null) => (iso ? dayjs(iso).locale("fr").fromNow() : "");
const heure = (iso: string) => dayjs(iso).locale("fr").format("D MMM · HH:mm");
const annoncer = () => window.dispatchEvent(new Event(EVENEMENT_SUPPORT));

const Bulle: React.FC<{ m: MessageSupport; moi: boolean; conv: ConversationSupport }> = ({ m, moi, conv }) => {
  if (m.auteur === "systeme") {
    return <p className="mx-auto w-fit max-w-[85%] rounded-full bg-slate-100 px-3.5 py-1.5 text-center text-[12.5px] font-medium text-slate-600">{m.texte}</p>;
  }
  const precision = m.auteur === "staff" ? "Équipe Lumistock" : conv.magasin_nom || "Administrateur";
  return (
    <div className={`flex items-end gap-2.5 ${moi ? "flex-row-reverse" : ""}`}>
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[12px] font-bold ${m.auteur === "staff" ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-700"}`}
      >
        {initiales(m.auteur_nom)}
      </span>
      <div className="max-w-[75%]">
        <p className={`mb-1 text-[12px] text-slate-500 ${moi ? "text-right" : ""}`}>
          <span className="font-semibold text-slate-700">{moi ? "Vous" : m.auteur_nom}</span> · {precision} · {heure(m.created_at)}
        </p>
        <div className={`rounded-2xl px-3.5 py-2.5 ${moi ? "rounded-br-md text-white" : "rounded-bl-md bg-white ring-1 ring-slate-200"}`} style={moi ? { backgroundColor: VIOLET } : undefined}>
          <p className={`whitespace-pre-wrap break-words text-[14px] leading-relaxed ${moi ? "text-white" : "text-slate-800"}`}>{m.texte}</p>
        </div>
      </div>
    </div>
  );
};

/** Fenêtre « Nouvelle conversation » : le staff choisit l'administrateur, l'admin écrit à l'équipe. */
const NouvelleConversation: React.FC<{ cote: Cote; ouvert: boolean; fermer: () => void; creee: (c: ConversationSupport) => void }> = ({
  cote,
  ouvert,
  fermer,
  creee,
}) => {
  const { message } = App.useApp();
  const [form] = Form.useForm<{ admin_id?: string; sujet: string; texte: string }>();
  const [admins, setAdmins] = useState<AdminSupport[]>([]);
  const [chargement, setChargement] = useState(false);
  const [envoi, setEnvoi] = useState(false);

  useEffect(() => {
    if (!ouvert || cote !== "staff") return;
    setChargement(true);
    listerAdmins()
      .then(setAdmins)
      .catch((e) => message.error(erreurSupport(e, "Impossible de charger les administrateurs.")))
      .finally(() => setChargement(false));
  }, [ouvert, cote, message]);

  const envoyer = async () => {
    const v = await form.validateFields();
    setEnvoi(true);
    try {
      const c = await creerSupport({ ...v, sujet: v.sujet.trim(), texte: v.texte.trim() });
      form.resetFields();
      creee(c);
    } catch (e) {
      message.error(erreurSupport(e, "La conversation n'a pas pu être créée."));
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <Modal
      open={ouvert}
      onCancel={fermer}
      onOk={envoyer}
      okText="Envoyer"
      cancelText="Annuler"
      confirmLoading={envoi}
      okButtonProps={{ style: { backgroundColor: VIOLET } }}
      title={cote === "staff" ? "Écrire à un administrateur" : "Écrire à l'équipe Lumistock"}
      destroyOnHidden
    >
      <p className="mb-4 text-[13.5px] text-slate-500">
        {cote === "staff"
          ? "L'administrateur reçoit votre message dans son espace et par email."
          : "Une question, un problème, une demande ? L'équipe Lumistock vous répond ici même ; vous êtes prévenu par email."}
      </p>
      <Form form={form} layout="vertical" requiredMark={false}>
        {cote === "staff" && (
          <Form.Item name="admin_id" label="Administrateur" rules={[{ required: true, message: "Choisissez l'administrateur." }]}>
            <Select
              showSearch
              loading={chargement}
              placeholder="Rechercher par nom, email ou magasin"
              optionFilterProp="recherche"
              options={admins.map((a) => ({
                value: a.id,
                recherche: `${a.nom} ${a.email} ${a.magasin_nom ?? ""}`,
                label: (
                  <span className="flex items-center justify-between gap-3">
                    <span className="min-w-0 truncate">
                      <span className="font-semibold">{a.nom}</span>
                      <span className="text-slate-500"> · {a.magasin_nom || "Sans magasin"}</span>
                    </span>
                    {!a.actif && <span className="shrink-0 text-[11px] font-semibold text-amber-700">inactif</span>}
                  </span>
                ),
              }))}
            />
          </Form.Item>
        )}
        <Form.Item name="sujet" label="Sujet" rules={[{ required: true, whitespace: true, message: "Indiquez le sujet." }]}>
          <Input maxLength={150} placeholder={cote === "staff" ? "Ex. : Renouvellement de votre licence" : "Ex. : Problème d'import de produits"} />
        </Form.Item>
        <Form.Item name="texte" label="Message" rules={[{ required: true, whitespace: true, message: "Écrivez votre message." }]}>
          <Input.TextArea autoSize={{ minRows: 4, maxRows: 10 }} maxLength={4000} showCount placeholder="Votre message…" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

const MessagerieSupport: React.FC<{ cote: Cote }> = ({ cote }) => {
  const { message, modal } = App.useApp();
  const [params, setParams] = useSearchParams();
  const choisie = params.get("c");
  const [onglet, setOnglet] = useState<StatutSupport | "tous">("ouverte");
  const [recherche, setRecherche] = useState("");
  const [liste, setListe] = useState<ListeSupport | null>(null);
  const [detail, setDetail] = useState<ConversationSupport | null>(null);
  const [chargement, setChargement] = useState(false);
  const [reponse, setReponse] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [nouvelle, setNouvelle] = useState(false);
  const fil = useRef<HTMLDivElement>(null);
  const brouillons = useRef<Record<string, string>>({});

  const chargerListe = useCallback(async () => {
    try {
      setListe(await listerSupport(onglet === "tous" ? undefined : onglet, recherche.trim()));
      setErreur(null);
    } catch (e) {
      setErreur(erreurSupport(e, "Impossible de charger les conversations."));
    }
  }, [onglet, recherche]);

  useEffect(() => {
    void chargerListe();
    const t = window.setInterval(chargerListe, RELEVE_LISTE);
    return () => window.clearInterval(t);
  }, [chargerListe]);

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
        const d = await ouvrirSupport(choisie);
        if (!actif) return;
        setDetail((ancien) =>
          premier || !ancien || ancien.id !== d.id || (ancien.messages?.length ?? 0) !== (d.messages?.length ?? 0) ||
          ancien.statut !== d.statut || ancien.vu_par_autre_le !== d.vu_par_autre_le ? d : ancien);
        if (premier) {
          annoncer();
          void chargerListe();
        }
      } catch (e) {
        if (actif && premier) {
          message.error(erreurSupport(e, "Conversation introuvable."));
          setParams({}, { replace: true });
        }
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
    // chargerListe change avec les filtres : inutile de recharger la conversation pour autant.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [choisie, message, setParams]);

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
      setDetail(await ecrireSupport(detail.id, reponse.trim()));
      setReponse("");
      brouillons.current[detail.id] = "";
      void chargerListe();
    } catch (e) {
      message.error(erreurSupport(e, "Le message n'a pas pu être envoyé."));
    } finally {
      setEnvoi(false);
    }
  };

  const basculerStatut = () => {
    if (!detail) return;
    const fermer = detail.statut === "ouverte";
    modal.confirm({
      title: fermer ? "Marquer cette conversation comme résolue ?" : "Rouvrir cette conversation ?",
      content: fermer ? "Elle sera fermée pour les deux côtés. Un nouveau message la rouvrira." : undefined,
      okText: fermer ? "Fermer" : "Rouvrir",
      cancelText: "Annuler",
      okButtonProps: { style: { backgroundColor: VIOLET } },
      onOk: async () => {
        try {
          setDetail(await statutSupport(detail.id, fermer ? "fermee" : "ouverte"));
          void chargerListe();
        } catch (e) {
          message.error(erreurSupport(e));
        }
      },
    });
  };

  const conversations = liste?.conversations ?? [];
  const compteurs = liste?.compteurs;
  const onglets = useMemo(
    () => [
      { cle: "ouverte" as const, libelle: "Ouvertes", n: compteurs?.ouverte },
      { cle: "fermee" as const, libelle: "Résolues", n: compteurs?.fermee },
      { cle: "tous" as const, libelle: "Toutes", n: compteurs?.tous },
    ],
    [compteurs],
  );
  const interlocuteur = (c: ConversationSupport) => (cote === "staff" ? c.admin_nom : "Équipe Lumistock");
  const sousTitre = (c: ConversationSupport) =>
    cote === "staff" ? c.magasin_nom || "Sans magasin" : c.staff_nom ? `Suivi par ${c.staff_nom}` : "En attente d'une réponse";
  const dernierDeMoi = detail?.messages?.length ? [...detail.messages].reverse().find((m) => m.auteur !== "systeme") : undefined;
  const luParAutre = Boolean(
    dernierDeMoi && dernierDeMoi.auteur === cote && detail?.vu_par_autre_le && detail.vu_par_autre_le > dernierDeMoi.created_at,
  );

  return (
    <div className="flex h-[calc(100dvh-7rem)] min-h-[520px] overflow-hidden rounded-2xl border border-slate-200 bg-white">
      {/* ------------------------------------------------------------ liste */}
      <aside className={`w-full flex-col border-r border-slate-200 md:w-[360px] md:shrink-0 ${choisie ? "hidden md:flex" : "flex"}`}>
        <div className="border-b border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl text-white" style={{ backgroundColor: VIOLET }}>
              <LifeBuoy size={20} />
            </span>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-bold leading-tight text-slate-900">{cote === "staff" ? "Support magasins" : "Support Lumistock"}</h1>
              <p className="text-[12.5px] text-slate-500">
                {cote === "staff" ? "Échanges avec les administrateurs" : "Échangez avec l'équipe Lumistock"}
                {compteurs?.non_lus ? ` · ${compteurs.non_lus} non lue${compteurs.non_lus > 1 ? "s" : ""}` : ""}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setNouvelle(true)}
            className="mt-3 flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-lg text-sm font-semibold text-white hover:opacity-90"
            style={{ backgroundColor: VIOLET }}
          >
            <MessageSquarePlus size={16} /> {cote === "staff" ? "Écrire à un administrateur" : "Nouvelle question"}
          </button>
          <Input
            allowClear
            prefix={<Search size={15} className="text-slate-400" />}
            placeholder={cote === "staff" ? "Sujet, administrateur, magasin…" : "Rechercher un sujet…"}
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            className="!mt-3"
          />
          <div className="mt-3 flex gap-1">
            {onglets.map((o) => (
              <button
                key={o.cle}
                type="button"
                onClick={() => setOnglet(o.cle)}
                className={`cursor-pointer rounded-full px-3 py-1.5 text-[12.5px] font-semibold transition-colors ${onglet === o.cle ? "text-white" : "text-slate-600 hover:bg-slate-100"}`}
                style={onglet === o.cle ? { backgroundColor: VIOLET } : undefined}
              >
                {o.libelle}
                {typeof o.n === "number" ? ` · ${o.n}` : ""}
              </button>
            ))}
          </div>
        </div>
        <ul className="scrollbar-hide flex-1 overflow-y-auto">
          {!liste && !erreur && <li className="p-4"><Skeleton active avatar paragraph={{ rows: 2 }} /></li>}
          {erreur && <li className="p-4 text-sm font-semibold text-red-600">{erreur}</li>}
          {liste && conversations.length === 0 && (
            <li className="p-8">
              <Empty description={cote === "staff" ? "Aucune conversation" : "Aucune conversation : posez votre première question à l'équipe Lumistock."} />
            </li>
          )}
          {conversations.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => ouvrir(c.id)}
                className={`flex w-full cursor-pointer gap-3 border-b border-slate-100 px-4 py-3.5 text-left transition-colors ${c.id === choisie ? "bg-purple-50" : "hover:bg-slate-50"}`}
              >
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[13px] font-bold ${cote === "staff" ? "bg-slate-200 text-slate-700" : "bg-emerald-600 text-white"}`}>
                  {cote === "staff" ? initiales(c.admin_nom) : "L"}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className={`truncate text-[14px] ${c.non_lus ? "font-bold text-slate-900" : "font-semibold text-slate-800"}`}>{c.sujet}</span>
                    <span className="shrink-0 text-[11.5px] text-slate-400">{quand(c.updated_at)}</span>
                  </span>
                  <span className="mt-0.5 block truncate text-[12.5px] text-slate-500">
                    {interlocuteur(c)} · {sousTitre(c)}
                  </span>
                  <span className="mt-1 flex items-center gap-2">
                    <span className={`min-w-0 flex-1 truncate text-[13px] ${c.non_lus ? "font-semibold text-slate-700" : "text-slate-500"}`}>{c.dernier_message || "—"}</span>
                    {c.statut === "fermee" && <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">Résolue</span>}
                    {c.non_lus > 0 && (
                      <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-red-600 px-1.5 text-[11px] font-bold text-white">{c.non_lus}</span>
                    )}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* ------------------------------------------------------------ conversation */}
      <section className={`min-w-0 flex-1 flex-col ${choisie ? "flex" : "hidden md:flex"}`}>
        {!choisie && (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center text-slate-500">
            <LifeBuoy size={40} className="text-slate-300" />
            <p className="max-w-xs text-sm">
              {cote === "staff"
                ? "Choisissez une conversation, ou écrivez à un administrateur de magasin."
                : "Choisissez une conversation, ou posez une nouvelle question à l'équipe Lumistock."}
            </p>
          </div>
        )}
        {choisie && (chargement || !detail) && <div className="p-6"><Skeleton active paragraph={{ rows: 6 }} /></div>}
        {choisie && detail && !chargement && (
          <>
            <header className="flex flex-wrap items-center gap-3 border-b border-slate-200 px-4 py-3">
              <button type="button" onClick={() => ouvrir(null)} aria-label="Retour à la liste" className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 md:hidden">
                <ArrowLeft size={18} />
              </button>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-bold text-slate-900">{detail.sujet}</p>
                <p className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[12.5px] text-slate-500">
                  {cote === "staff" ? (
                    <>
                      <span className="font-semibold text-slate-700">{detail.admin_nom}</span>
                      <span className="inline-flex items-center gap-1"><Store size={12} /> {detail.magasin_nom || "Sans magasin"}</span>
                    </>
                  ) : (
                    <span>{detail.staff_nom ? `Suivi par ${detail.staff_nom}, équipe Lumistock` : "L'équipe Lumistock va vous répondre"}</span>
                  )}
                  <span>Ouverte {quand(detail.created_at)} par {detail.initie_par === "staff" ? "l'équipe Lumistock" : detail.admin_nom}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={basculerStatut}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-[13px] font-semibold text-slate-700 hover:bg-slate-50"
              >
                {detail.statut === "ouverte" ? <><CircleCheck size={14} /> Marquer résolue</> : <><RotateCcw size={14} /> Rouvrir</>}
              </button>
            </header>

            <div ref={fil} className="scrollbar-hide flex-1 space-y-4 overflow-y-auto bg-slate-50 px-4 py-5 sm:px-6">
              {(detail.messages ?? []).map((m) => <Bulle key={m.id} m={m} moi={m.auteur === cote} conv={detail} />)}
              {luParAutre && (
                <p className="flex items-center justify-end gap-1 text-[11.5px] text-slate-400">
                  <CheckCheck size={13} className="text-emerald-600" /> Vu {quand(detail.vu_par_autre_le)}
                </p>
              )}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                void envoyer();
              }}
              className="border-t border-slate-200 bg-white p-3"
            >
              {detail.statut === "fermee" && <p className="mb-2 px-1 text-[12.5px] text-slate-500">Conversation résolue : votre message la rouvrira.</p>}
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
                  maxLength={4000}
                  placeholder="Votre message… (Entrée pour envoyer, Maj+Entrée pour aller à la ligne)"
                />
                <button
                  type="submit"
                  disabled={envoi || !reponse.trim()}
                  className="flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-lg px-4 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-default disabled:opacity-50"
                  style={{ backgroundColor: VIOLET }}
                >
                  <Send size={15} /> Envoyer
                </button>
              </div>
            </form>
          </>
        )}
      </section>

      <NouvelleConversation
        cote={cote}
        ouvert={nouvelle}
        fermer={() => setNouvelle(false)}
        creee={(c) => {
          setNouvelle(false);
          setOnglet("ouverte");
          void chargerListe();
          setParams({ c: c.id }, { replace: true });
        }}
      />
    </div>
  );
};

export default MessagerieSupport;
