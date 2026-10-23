// Super-admin : messages reçus par le formulaire de contact du site public.
// Liste filtrable (statut, recherche) ; le détail permet de changer le statut,
// garder une note interne et répondre par email au visiteur.
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, App, Button, Drawer, Empty, Input, Select, Skeleton, Tag } from "antd";
import { Building2, Inbox, Mail, MessageSquareReply, Phone, Search, Send, StickyNote, Trash2 } from "lucide-react";
import dayjs from "dayjs";
import "dayjs/locale/fr";
import relativeTime from "dayjs/plugin/relativeTime";
import {
  DetailContact,
  erreurContact,
  EVENEMENT_CONTACT,
  ListeContact,
  lireMessage,
  listerMessages,
  modifierMessage,
  repondreMessage,
  StatutContact,
  supprimerMessage,
} from "../../../services/contact";

dayjs.extend(relativeTime);

const STYLE_STATUT: Record<StatutContact, string> = {
  nouveau: "!border-purple-200 !bg-purple-50 !text-purple-900",
  en_cours: "!border-amber-200 !bg-amber-50 !text-amber-800",
  repondu: "!border-emerald-200 !bg-emerald-50 !text-emerald-800",
  clos: "!border-slate-200 !bg-slate-50 !text-slate-600",
};
const ONGLETS: (StatutContact | "tous")[] = ["tous", "nouveau", "en_cours", "repondu", "clos"];
const LIBELLES: Record<StatutContact | "tous", string> = {
  tous: "Tous", nouveau: "Nouveaux", en_cours: "En cours", repondu: "Répondus", clos: "Clos",
};

const quand = (iso: string) => dayjs(iso).locale("fr").fromNow();
const date = (iso: string) => dayjs(iso).locale("fr").format("D MMM YYYY à HH:mm");
const annoncer = () => window.dispatchEvent(new Event(EVENEMENT_CONTACT));

const MessagesContact: React.FC = () => {
  const { message, modal } = App.useApp();
  const [onglet, setOnglet] = useState<StatutContact | "tous">("tous");
  const [recherche, setRecherche] = useState("");
  const [donnees, setDonnees] = useState<ListeContact | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [ouvert, setOuvert] = useState<DetailContact | null>(null);
  const [chargementDetail, setChargementDetail] = useState(false);
  const [note, setNote] = useState("");
  const [reponse, setReponse] = useState("");
  const [envoi, setEnvoi] = useState(false);

  const charger = useCallback(async () => {
    try {
      setErreur(null);
      setDonnees(await listerMessages(onglet === "tous" ? undefined : onglet, recherche.trim()));
    } catch (e) {
      setErreur(erreurContact(e, "Impossible de charger les messages."));
    }
  }, [onglet, recherche]);

  useEffect(() => {
    const minuteur = setTimeout(charger, recherche ? 300 : 0);
    return () => clearTimeout(minuteur);
  }, [charger, recherche]);

  const ouvrir = async (id: string) => {
    setChargementDetail(true);
    setReponse("");
    try {
      const d = await lireMessage(id);
      setOuvert(d);
      setNote(d.note || "");
      setDonnees((v) => v && { ...v, messages: v.messages.map((m) => (m.id === id ? { ...m, lu: true } : m)) });
      annoncer();
    } catch (e) {
      message.error(erreurContact(e));
    } finally {
      setChargementDetail(false);
    }
  };

  const appliquer = (d: DetailContact) => {
    setOuvert(d);
    charger();
    annoncer();
  };

  const changerStatut = async (statut: StatutContact) => {
    if (!ouvert) return;
    try {
      appliquer(await modifierMessage(ouvert.id, { statut }));
      message.success("Statut mis à jour.");
    } catch (e) {
      message.error(erreurContact(e));
    }
  };

  const enregistrerNote = async () => {
    if (!ouvert) return;
    try {
      appliquer(await modifierMessage(ouvert.id, { note }));
      message.success("Note enregistrée.");
    } catch (e) {
      message.error(erreurContact(e));
    }
  };

  const envoyerReponse = async () => {
    if (!ouvert || reponse.trim().length < 2) return;
    setEnvoi(true);
    try {
      appliquer(await repondreMessage(ouvert.id, reponse.trim()));
      setReponse("");
      message.success(`Réponse envoyée à ${ouvert.email}.`);
    } catch (e) {
      message.error(erreurContact(e));
    } finally {
      setEnvoi(false);
    }
  };

  const supprimer = () => {
    if (!ouvert) return;
    modal.confirm({
      title: "Supprimer ce message ?",
      content: `Le message de ${ouvert.nom} et ses réponses seront supprimés définitivement.`,
      okText: "Supprimer",
      okButtonProps: { danger: true },
      cancelText: "Annuler",
      onOk: async () => {
        try {
          await supprimerMessage(ouvert.id);
          setOuvert(null);
          charger();
          annoncer();
          message.success("Message supprimé.");
        } catch (e) {
          message.error(erreurContact(e));
        }
      },
    });
  };

  const messages = useMemo(() => donnees?.messages || [], [donnees]);

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-[1400px] flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-purple-950">Messages de contact</h1>
          <p className="mt-1 text-sm text-slate-500">
            Demandes envoyées depuis la page Contact du site. Ouvrez un message pour y répondre par email.
          </p>
        </div>
        {donnees && donnees.compteurs.non_lus > 0 && (
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-purple-950 px-3 py-1 text-sm font-semibold text-white">
            <Inbox size={15} /> {donnees.compteurs.non_lus} non lu{donnees.compteurs.non_lus > 1 ? "s" : ""}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-purple-100/70 bg-white p-3 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div role="tablist" aria-label="Filtrer par statut" className="flex gap-1 overflow-x-auto">
          {ONGLETS.map((o) => {
            const actif = onglet === o;
            const n = donnees?.compteurs[o];
            return (
              <button
                key={o}
                type="button"
                role="tab"
                aria-selected={actif}
                onClick={() => setOnglet(o)}
                className={`flex min-h-10 shrink-0 cursor-pointer items-center gap-2 rounded-xl px-3.5 text-sm font-semibold transition-colors ${
                  actif ? "bg-purple-950 text-white" : "text-slate-600 hover:bg-purple-50 hover:text-purple-950"
                }`}
              >
                {LIBELLES[o]}
                {n !== undefined && (
                  <span className={`rounded-full px-1.5 text-xs ${actif ? "bg-white/20" : "bg-slate-100 text-slate-600"}`}>{n}</span>
                )}
              </button>
            );
          })}
        </div>
        <Input
          allowClear
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          prefix={<Search size={16} className="text-slate-400" />}
          placeholder="Nom, email, entreprise, contenu…"
          className="!h-10 lg:!w-80"
          aria-label="Rechercher un message"
        />
      </div>

      {erreur && <Alert type="error" showIcon message={erreur} action={<Button onClick={charger}>Réessayer</Button>} />}

      <div className="overflow-hidden rounded-2xl border border-purple-100/70 bg-white shadow-sm">
        {!donnees && !erreur ? (
          <div className="p-6"><Skeleton active paragraph={{ rows: 6 }} /></div>
        ) : messages.length === 0 ? (
          <Empty className="!py-16" image={Empty.PRESENTED_IMAGE_SIMPLE} description={recherche ? "Aucun message ne correspond." : "Aucun message pour le moment."} />
        ) : (
          <ul className="divide-y divide-slate-100">
            {messages.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => ouvrir(m.id)}
                  className={`flex w-full cursor-pointer gap-4 px-4 py-4 text-left transition-colors hover:bg-purple-50/50 sm:px-5 ${m.lu ? "" : "bg-purple-50/40"}`}
                >
                  <span className="mt-1.5 flex w-2.5 shrink-0 justify-center" aria-hidden="true">
                    {!m.lu && <span className="h-2.5 w-2.5 rounded-full bg-purple-700" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className={`truncate text-[15px] ${m.lu ? "font-semibold text-slate-800" : "font-bold text-purple-950"}`}>{m.nom}</span>
                      {m.entreprise && <span className="truncate text-sm text-slate-500">{m.entreprise}</span>}
                      {!m.lu && <span className="sr-only">(non lu)</span>}
                    </span>
                    <span className="mt-0.5 block truncate text-sm font-medium text-slate-700">{m.sujet_libelle}</span>
                    <span className="mt-0.5 block truncate text-sm text-slate-500">{m.extrait}</span>
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-2">
                    <span className="text-xs text-slate-500">{quand(m.created_at)}</span>
                    <Tag className={`!m-0 !rounded-full !px-2.5 !text-[11px] !font-semibold ${STYLE_STATUT[m.statut]}`}>
                      {donnees?.statuts[m.statut]}
                    </Tag>
                    {m.nb_reponses > 0 && (
                      <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                        <MessageSquareReply size={13} /> {m.nb_reponses}
                      </span>
                    )}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Drawer
        open={!!ouvert || chargementDetail}
        onClose={() => setOuvert(null)}
        width={620}
        title={ouvert ? ouvert.sujet_libelle : "Message"}
        extra={ouvert && <Button danger type="text" icon={<Trash2 size={16} />} onClick={supprimer} aria-label="Supprimer le message" />}
        styles={{ body: { padding: 0 } }}
      >
        {!ouvert ? (
          <div className="p-6"><Skeleton active paragraph={{ rows: 8 }} /></div>
        ) : (
          <div className="flex flex-col">
            <div className="border-b border-slate-100 p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-lg font-bold text-purple-950">{ouvert.nom}</p>
                  <p className="text-sm text-slate-500">Reçu le {date(ouvert.created_at)}</p>
                </div>
                <Select
                  value={ouvert.statut}
                  onChange={changerStatut}
                  className="w-40"
                  aria-label="Statut du message"
                  options={Object.entries(donnees?.statuts || {}).map(([value, label]) => ({ value, label }))}
                />
              </div>
              <ul className="mt-4 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                <li className="flex min-w-0 items-center gap-2">
                  <Mail size={15} className="shrink-0 text-purple-700" />
                  <a href={`mailto:${ouvert.email}`} className="truncate font-medium !text-purple-900 hover:underline">{ouvert.email}</a>
                </li>
                {ouvert.telephone && (
                  <li className="flex items-center gap-2">
                    <Phone size={15} className="shrink-0 text-purple-700" />
                    <a href={`tel:${ouvert.telephone.replace(/[^\d+]/g, "")}`} className="font-medium !text-purple-900 hover:underline">{ouvert.telephone}</a>
                  </li>
                )}
                {ouvert.entreprise && (
                  <li className="flex min-w-0 items-center gap-2">
                    <Building2 size={15} className="shrink-0 text-purple-700" />
                    <span className="truncate">{ouvert.entreprise}</span>
                  </li>
                )}
              </ul>
            </div>

            <div className="p-5 sm:p-6">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Message</p>
              <p className="whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-[15px] leading-relaxed text-slate-800 ring-1 ring-slate-100">{ouvert.message}</p>

              {ouvert.reponses.length > 0 && (
                <div className="mt-6">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Réponses envoyées</p>
                  <ul className="space-y-3">
                    {ouvert.reponses.map((r, i) => (
                      <li key={i} className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
                        <p className="text-xs font-semibold text-emerald-800">{r.par} · {date(r.le)}</p>
                        <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-slate-800">{r.texte}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-6">
                <label htmlFor="reponse-contact" className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <Send size={13} /> Répondre par email
                </label>
                <Input.TextArea
                  id="reponse-contact"
                  value={reponse}
                  onChange={(e) => setReponse(e.target.value)}
                  rows={5}
                  maxLength={5000}
                  showCount
                  placeholder={`Bonjour ${ouvert.nom.split(" ")[0]}, …`}
                />
                <div className="mt-7 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-slate-500">Envoyée à {ouvert.email}, avec son message en citation.</p>
                  <Button type="primary" icon={<Send size={15} />} loading={envoi} disabled={reponse.trim().length < 2} onClick={envoyerReponse} className={reponse.trim().length < 2 ? "" : "!bg-purple-950 hover:!bg-purple-900"}>
                    Envoyer la réponse
                  </Button>
                </div>
              </div>

              <div className="mt-8 border-t border-slate-100 pt-6">
                <label htmlFor="note-contact" className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <StickyNote size={13} /> Note interne (jamais envoyée)
                </label>
                <Input.TextArea id="note-contact" value={note} onChange={(e) => setNote(e.target.value)} rows={3} maxLength={2000} placeholder="Ex. : rappeler mardi, intéressé par 3 magasins…" />
                <div className="mt-2 flex justify-end">
                  <Button onClick={enregistrerNote} disabled={(ouvert.note || "") === note}>Enregistrer la note</Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default MessagesContact;
