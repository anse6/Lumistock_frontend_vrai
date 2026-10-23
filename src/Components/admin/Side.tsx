// Menu latéral de l'espace magasin (admin, manager, caissier).
// Organisation : sections (Ventes, Stock, Clients, Finances…) contenant des liens
// et des groupes repliables (ex. Comptabilité → ses onglets). Les onglets des pages
// sont ouverts par l'adresse (?onglet=…, voir hooks/useOngletUrl).
import { useEffect, useMemo, useState } from "react";
import { Dropdown, Popover, Tooltip } from "antd";
import type { MenuProps } from "antd";
import {
  LayoutGrid,
  PackageCheck,
  Boxes,
  Users,
  Sliders,
  Sparkles,
  ShieldCheck,
  BarChart3,
  DollarSign,
  PieChart,
  Settings,
  LogOut,
  MessageSquare,
  MoreVertical,
  Vault,
  ReceiptText,
  ShoppingCart,
  LayoutList,
  PanelLeft,
  PanelLeftClose,
  Check,
  LifeBuoy,
  ChevronDown,
  Truck,
  ScanBarcode,
} from "lucide-react";
import logoLumistock from "@/assets/logo-lumistock.png";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { demanderDeconnexion } from "../../Modules/Authentification/ConfirmationDeconnexion";
import useCompteConnecte from "../../hooks/useCompteConnecte";
import { compterSupport, EVENEMENT_SUPPORT } from "../../services/support";

// --------------------------------------------------------------------------- modèle du menu
interface Lien {
  type: "lien";
  id: string;
  label: string;
  icon?: React.ReactNode;
  path: string;
  /** Onglet de la page ouvert par ce lien (?onglet=…). */
  onglet?: string;
  /** Lien actif aussi sur les sous-pages (ex. fiche d'un produit). */
  sousPages?: boolean;
  /** Sous-pages qui appartiennent à un autre lien (ex. Nouvelle vente). */
  exclure?: string[];
  badge?: number;
}
interface Groupe {
  type: "groupe";
  id: string;
  label: string;
  icon: React.ReactNode;
  enfants: Lien[];
}
type Element = Lien | Groupe;
interface Section {
  titre?: string;
  elements: Element[];
}

const lien = (l: Omit<Lien, "type">): Lien => ({ type: "lien", ...l });
const groupe = (g: Omit<Groupe, "type">): Groupe => ({ type: "groupe", ...g });

/** Le lien correspond-il à la page affichée ? */
const estActif = (l: Lien, pathname: string, onglet: string | null) => {
  if (l.exclure?.some((x) => pathname === x || pathname.startsWith(`${x}/`))) return false;
  const surSousPage = !!l.sousPages && pathname.startsWith(`${l.path}/`);
  if (l.onglet) return (pathname === l.path && onglet === l.onglet) || surSousPage;
  return pathname === l.path || surSousPage;
};
const versLien = (l: Lien) => (l.onglet ? { pathname: l.path, search: `?onglet=${l.onglet}` } : l.path);

const CLE_GROUPES = "sidebar_groupes_ouverts";
const lireGroupes = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(CLE_GROUPES) || "[]");
  } catch {
    return [];
  }
};

// --------------------------------------------------------------------------- éléments
// Couleurs en « ! » : antd impose sa couleur de lien (bleu) avant celle de Tailwind.
// Classes d'origine des boutons du menu.
const classeLien = (actif: boolean, reduit?: boolean) =>
  `flex items-center cursor-pointer gap-3 px-4 py-2.5 w-full rounded-lg transition-all duration-200 border-l-4 ${reduit ? "lg:justify-center lg:px-0" : ""} ${
    actif
      ? "bg-white/10 text-white border-white shadow-md"
      : "text-white/90 border-transparent hover:bg-white/5 hover:text-white"
  }`;

const LienMenu: React.FC<{ l: Lien; actif: boolean; reduit?: boolean; onClick: () => void }> = ({ l, actif, reduit, onClick }) => (
  // En mode réduit, le nom du menu s'affiche au survol de l'icône
  <Tooltip title={reduit ? l.label : ""} placement="right">
    <Link to={versLien(l)} aria-current={actif ? "page" : undefined}>
      <button className={classeLien(actif, reduit)} onClick={onClick}>
        <div className={`relative shrink-0 ${actif ? "text-white" : ""}`}>
          {l.icon}
          {/* En mode réduit, la pastille se pose sur l'icône. */}
          {!!l.badge && reduit && (
            <span className="absolute -right-2 -top-2 hidden h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white lg:flex">
              {l.badge}
            </span>
          )}
        </div>
        <span className={`whitespace-nowrap ${actif ? "font-bold" : "font-medium"} ${reduit ? "lg:hidden" : ""}`}>{l.label}</span>
        {!!l.badge && (
          <span className={`ml-auto rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-[#3b1558] ${reduit ? "lg:hidden" : ""}`}>
            {l.badge}
          </span>
        )}
      </button>
    </Link>
  </Tooltip>
);

// Compteur rond (ex. messages non lus) affiché à droite d'une sous-section.
const Pastille: React.FC<{ n?: number; reduit?: boolean }> = ({ n, reduit }) =>
  n ? (
    <span className={`ml-auto rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-[#3b1558] ${reduit ? "lg:hidden" : ""}`}>
      {n}
    </span>
  ) : null;

const SousLien: React.FC<{ l: Lien; actif: boolean; onClick: () => void }> = ({ l, actif, onClick }) => (
  <Link
    to={versLien(l)}
    onClick={onClick}
    aria-current={actif ? "page" : undefined}
    className={`relative flex items-center gap-2 rounded-md py-1.5 pl-3 pr-2 text-[13px] transition-colors ${
      actif ? "bg-white/10 font-semibold !text-white" : "!text-white/70 hover:bg-white/5 hover:!text-white"
    }`}
  >
    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${actif ? "bg-white" : "bg-white/30"}`} />
    <span className="truncate">{l.label}</span>
    <Pastille n={l.badge} />
  </Link>
);

const GroupeMenu: React.FC<{
  g: Groupe;
  ouvert: boolean;
  basculer: () => void;
  actifs: Set<string>;
  reduit?: boolean;
  onClick: () => void;
}> = ({ g, ouvert, basculer, actifs, reduit, onClick }) => {
  const contientActif = g.enfants.some((e) => actifs.has(e.id));

  // Mode icônes : l'icône ouvre la liste des sous-sections au survol.
  const listeFlottante = (
    <div className="min-w-[210px] py-1">
      <div className="px-2 pb-1 text-xs font-bold uppercase tracking-wide text-slate-400">{g.label}</div>
      {g.enfants.map((e) => (
        <Link
          key={e.id}
          to={versLien(e)}
          onClick={onClick}
          className={`block rounded-md px-2 py-1.5 text-sm ${actifs.has(e.id) ? "bg-purple-50 font-semibold !text-[#3b1558]" : "!text-slate-700 hover:bg-slate-50"}`}
        >
          {e.label}
        </Link>
      ))}
    </div>
  );

  return (
    <div>
      {/* Grand écran en mode icônes */}
      {reduit && (
        <Popover content={listeFlottante} placement="rightTop" trigger="hover" arrow={false}>
          <Link to={versLien(g.enfants[0])} className="hidden lg:block">
            <button className={classeLien(contientActif, true)} onClick={onClick}>
              <div className="relative shrink-0">{g.icon}</div>
            </button>
          </Link>
        </Popover>
      )}
      {/* Menu complet (et mobile) */}
      <div className={reduit ? "lg:hidden" : ""}>
        <button
          type="button"
          onClick={basculer}
          aria-expanded={ouvert}
          className={`flex items-center cursor-pointer gap-3 px-4 py-2.5 w-full rounded-lg transition-all duration-200 border-l-4 border-transparent text-left ${
            contientActif ? "text-white" : "text-white/90 hover:bg-white/5 hover:text-white"
          }`}
        >
          <div className="shrink-0">{g.icon}</div>
          <span className={`flex-1 whitespace-nowrap ${contientActif ? "font-bold" : "font-medium"}`}>{g.label}</span>
          <ChevronDown size={16} className={`shrink-0 opacity-70 transition-transform duration-200 ${ouvert ? "rotate-180" : ""}`} />
        </button>
        <div
          className={`grid transition-[grid-template-rows] duration-200 ${ouvert ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
        >
          <div className="overflow-hidden">
            <div className="ml-[22px] mt-0.5 mb-1 flex flex-col gap-0.5 border-l border-white/15 pl-2">
              {g.enfants.map((e) => (
                <SousLien key={e.id} l={e} actif={actifs.has(e.id)} onClick={onClick} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/** Affichage du sidebar sur grand écran : complet, icônes seulement, ou masqué. */
export type ModeSidebar = "complet" | "icones" | "cache";

const Side: React.FC<{
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  mode: ModeSidebar;
  setMode: (mode: ModeSidebar) => void;
}> = ({ isOpen, setIsOpen, mode, setMode }) => {
  const location = useLocation();
  const { t } = useTranslation();
  const companyName = localStorage.getItem("denomination_magasin") || "";
  const reduit = mode === "icones";

  // Les 3 choix proposés par le bouton 3 points (grand écran)
  const choix: { cle: ModeSidebar; libelle: string; icone: React.ReactNode }[] = [
    { cle: "complet", libelle: t("sidebar.mode_full", { defaultValue: "Menu complet" }), icone: <LayoutList size={16} /> },
    { cle: "icones", libelle: t("sidebar.mode_icons", { defaultValue: "Icônes seulement" }), icone: <PanelLeft size={16} /> },
    { cle: "cache", libelle: t("sidebar.mode_hidden", { defaultValue: "Masquer le menu" }), icone: <PanelLeftClose size={16} /> },
  ];
  const itemsMode: MenuProps["items"] = choix.map((c) => ({
    key: c.cle,
    label: (
      <div className="flex min-w-[170px] items-center gap-2 px-1 py-1">
        <span className="text-slate-500">{c.icone}</span>
        <span className={`flex-1 ${mode === c.cle ? "font-semibold text-[#3b1558]" : "text-slate-700"}`}>
          {c.libelle}
        </span>
        {mode === c.cle && <Check size={15} className="text-[#3b1558]" />}
      </div>
    ),
    onClick: () => setMode(c.cle),
  }));

  // Ferme le menu (mobile) quand l'URL change
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname, setIsOpen]);

  const role = localStorage.getItem("role");
  const { peut: peutCompte } = useCompteConnecte();
  // L'admin a tous les droits : pas besoin d'attendre le chargement du compte.
  const peut: typeof peutCompte = (permission) => role === "admin" || peutCompte(permission);

  // Support Lumistock (administrateur seulement) : réponses non lues de l'équipe Lumistock.
  const [supportNonLus, setSupportNonLus] = useState(0);
  useEffect(() => {
    if (role !== "admin") return;
    const actualiser = () => compterSupport().then(setSupportNonLus).catch(() => undefined);
    actualiser();
    const minuteur = setInterval(actualiser, 20_000);
    window.addEventListener(EVENEMENT_SUPPORT, actualiser);
    return () => {
      clearInterval(minuteur);
      window.removeEventListener(EVENEMENT_SUPPORT, actualiser);
    };
  }, [role]);

  // ------------------------------------------------------------------ admin / manager
  const B = "/admin/dashboard";
  const sectionsAdmin: Section[] = [
    {
      elements: [
        lien({ id: "accueil", label: t("sidebar.accueil"), icon: <LayoutGrid size={20} />, path: `${B}/accueil` }),
        lien({ id: "home", label: t("sidebar.dashboard"), icon: <BarChart3 size={20} />, path: `${B}/home` }),
      ],
    },
    {
      titre: t("sidebar.sections.ventes"),
      elements: [
        lien({ id: "vente-nouvelle", label: t("sidebar.items.nouvelleVente"), icon: <ShoppingCart size={20} />, path: `${B}/deliverys/develive`, sousPages: true }),
        lien({
          id: "ventes",
          label: t("sidebar.delivery"),
          icon: <PackageCheck size={20} />,
          path: `${B}/deliverys`,
          sousPages: true,
          exclure: [`${B}/deliverys/develive`],
        }),
        lien({ id: "caisses", label: t("sidebar.caisses"), icon: <Vault size={20} />, path: `${B}/caisses` }),
      ],
    },
    {
      titre: t("sidebar.sections.stock"),
      elements: [
        lien({
          id: "produits",
          label: t("sidebar.products"),
          icon: <Boxes size={20} />,
          path: `${B}/produits_approvisionnements`,
          onglet: "produits",
          sousPages: true,
          exclure: [`${B}/produits_approvisionnements/codes-barres`],
        }),
        lien({
          id: "approvisionnements",
          label: t("sidebar.items.approvisionnements"),
          icon: <Truck size={20} />,
          path: `${B}/produits_approvisionnements`,
          onglet: "approvisionnements",
        }),
        ...(peut("produits.modifier")
          ? [lien({ id: "codes-barres", label: t("sidebar.items.codesBarres"), icon: <ScanBarcode size={20} />, path: `${B}/produits_approvisionnements/codes-barres` })]
          : []),
      ],
    },
    {
      titre: t("sidebar.sections.clients"),
      elements: [
        lien({ id: "clients", label: t("sidebar.customers"), icon: <Users size={20} />, path: `${B}/customers`, sousPages: true }),
        groupe({
          id: "messages",
          label: t("sidebar.messages"),
          icon: <MessageSquare size={20} />,
          enfants: [
            lien({ id: "messages-envoyer", label: t("sidebar.items.msgEnvoyer"), path: `${B}/messages`, onglet: "envoyer" }),
            lien({ id: "messages-planification", label: t("sidebar.items.msgPlanification"), path: `${B}/messages`, onglet: "planification" }),
            lien({ id: "messages-historique", label: t("sidebar.items.msgHistorique"), path: `${B}/messages`, onglet: "historique" }),
            ...(peut("messagerie.parametres")
              ? [lien({ id: "messages-parametres", label: t("sidebar.items.msgParametres"), path: `${B}/messages`, onglet: "parametres" })]
              : []),
          ],
        }),
      ],
    },
    {
      titre: t("sidebar.sections.finances"),
      elements: [
        ...(role === "manager" && !peut("finances.comptabilite")
          ? []
          : [
              groupe({
                id: "comptabilite",
                label: t("sidebar.accounting"),
                icon: <PieChart size={20} />,
                enfants: [
                  "tableau",
                  "resultat",
                  "tresorerie",
                  "impots",
                  "bilan",
                  "journal",
                  "fournisseurs",
                  "rapprochement",
                  "immobilisations",
                  "financements",
                  "cloture",
                ].map((onglet) => lien({ id: `finance-${onglet}`, label: t(`sidebar.items.fin_${onglet}`), path: `${B}/finance`, onglet })),
              }),
            ]),
        lien({ id: "charges", label: t("sidebar.charges"), icon: <DollarSign size={20} />, path: `${B}/charges` }),
        groupe({
          id: "rapports",
          label: t("sidebar.reports"),
          icon: <Sliders size={20} />,
          enfants: [
            "ventes",
            "encaissements",
            "mouvements",
            "annuel",
            "inventaire",
          ].map((onglet) => lien({ id: `rapport-${onglet}`, label: t(`sidebar.items.rap_${onglet}`), path: `${B}/reports`, onglet })),
        }),
      ],
    },
    {
      titre: t("sidebar.sections.outils"),
      elements: [lien({ id: "ia", label: t("sidebar.ai_assistant"), icon: <Sparkles size={20} />, path: `${B}/ia`, sousPages: true })],
    },
    {
      titre: t("sidebar.sections.administration"),
      elements: [
        lien({ id: "equipe", label: t("sidebar.sub_boutique"), icon: <ShieldCheck size={20} />, path: `${B}/users`, sousPages: true }),
        groupe({
          id: "parametres",
          label: t("sidebar.settings"),
          icon: <Settings size={20} />,
          enfants: [
            "profil",
            "magasin",
            "acces",
            "preferences",
            "securite",
          ].map((onglet) => lien({ id: `parametres-${onglet}`, label: t(`sidebar.items.par_${onglet}`), path: `${B}/parameter`, onglet })),
        }),
        ...(role === "admin"
          ? [
              lien({
                id: "support",
                label: t("sidebar.support", { defaultValue: "Support Lumistock" }),
                icon: <LifeBuoy size={20} />,
                path: `${B}/support`,
                badge: supportNonLus,
              }),
            ]
          : []),
      ],
    },
  ];

  // ------------------------------------------------------------------ caissier
  const sectionsCaissier: Section[] = [
    {
      titre: t("sidebar.sections.caisse"),
      elements: [
        lien({ id: "nouvelle", label: t("sidebar.items.nouvelleVente"), icon: <ShoppingCart size={20} />, path: "/caisse/ventes/nouvelle", sousPages: true }),
        lien({ id: "ventes", label: t("sidebar.items.mesVentes"), icon: <ReceiptText size={20} />, path: "/caisse/ventes", exclure: ["/caisse/ventes/nouvelle"] }),
        lien({ id: "session", label: t("sidebar.items.maCaisse"), icon: <Vault size={20} />, path: "/caisse/session" }),
      ],
    },
    {
      titre: t("sidebar.sections.suivi"),
      elements: [lien({ id: "statistiques", label: t("sidebar.items.mesStatistiques"), icon: <BarChart3 size={20} />, path: "/caisse/statistiques" })],
    },
    {
      titre: t("sidebar.sections.outilsCompte"),
      elements: [
        lien({ id: "ia", label: t("sidebar.ai_assistant"), icon: <Sparkles size={20} />, path: "/caisse/ia" }),
        lien({ id: "securite", label: t("sidebar.items.securite"), icon: <ShieldCheck size={20} />, path: "/caisse/securite" }),
      ],
    },
  ];

  const sections = (role === "caissier" ? sectionsCaissier : sectionsAdmin).filter((s) => s.elements.length > 0);

  // Liens actifs pour la page affichée.
  const ongletCourant = new URLSearchParams(location.search).get("onglet");
  const actifs = useMemo(() => {
    const ids = new Set<string>();
    for (const s of sections)
      for (const e of s.elements)
        for (const l of e.type === "groupe" ? e.enfants : [e]) if (estActif(l, location.pathname, ongletCourant)) ids.add(l.id);
    return ids;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, ongletCourant, role, supportNonLus, peutCompte]);

  // Groupes ouverts : mémorisés, et celui de la page affichée s'ouvre tout seul.
  const [ouverts, setOuverts] = useState<string[]>(lireGroupes);
  const groupeActif = sections
    .flatMap((s) => s.elements)
    .find((e): e is Groupe => e.type === "groupe" && e.enfants.some((l) => actifs.has(l.id)))?.id;
  useEffect(() => {
    if (groupeActif && !ouverts.includes(groupeActif)) setOuverts((o) => [...o, groupeActif]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupeActif]);
  useEffect(() => {
    try {
      localStorage.setItem(CLE_GROUPES, JSON.stringify(ouverts));
    } catch {
      /* préférence non conservée */
    }
  }, [ouverts]);
  const basculer = (id: string) => setOuverts((o) => (o.includes(id) ? o.filter((x) => x !== id) : [...o, id]));

  const fermerMobile = () => setIsOpen(false);

  return (
    <>
      {/* Overlay pour mobile */}
      {isOpen && <div className="lg:hidden fixed inset-0 bg-transparent bg-opacity-30 z-40" onClick={fermerMobile} />}

      {/* Sidebar */}
      <div
        className={`${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } fixed lg:sticky top-0 left-0 h-screen w-64 ${reduit ? "lg:w-20" : ""} ${mode === "cache" ? "lg:hidden" : ""} shrink-0 bg-[#3b1558] border-r border-[#2d1045] z-40 transition-all duration-300 flex flex-col`}
      >
        {/* Logo et titre */}
        <div className={`flex flex-col gap-1 p-4 border-b border-[#2d1045] ${reduit ? "lg:px-2" : ""}`}>
          {/* Bouton 3 points */}
          <div className={`flex justify-end ${reduit ? "lg:justify-center" : ""}`}>
            {/* Mobile : ferme simplement le menu */}
            <button
              onClick={fermerMobile}
              className="lg:hidden p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <MoreVertical size={20} />
            </button>
            {/* Grand écran : choix complet / icônes seulement / masqué */}
            <Dropdown menu={{ items: itemsMode, selectedKeys: [mode] }} placement="bottomLeft" arrow trigger={["click"]}>
              <button
                title={t("sidebar.display", { defaultValue: "Affichage du menu" })}
                className="hidden lg:block p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <MoreVertical size={20} />
              </button>
            </Dropdown>
          </div>
          {/* Logo officiel sur fond blanc (logo bleu, illisible sur le violet) */}
          <div className={`rounded-xl bg-white px-3 py-2.5 shadow-sm ${reduit ? "lg:hidden" : ""}`}>
            <img src={logoLumistock} alt="Lumistock" className="mx-auto h-8 w-auto object-contain" />
          </div>
          {/* Mode réduit : initiale du magasin à la place du logo */}
          {reduit && (
            <Tooltip title={companyName || "Lumistock"} placement="right">
              <div className="hidden lg:flex mx-auto h-10 w-10 items-center justify-center rounded-xl bg-white text-lg font-bold text-[#3b1558] shadow-sm">
                {(companyName || "L").charAt(0).toUpperCase()}
              </div>
            </Tooltip>
          )}
          {companyName && (
            <div className={reduit ? "lg:hidden" : ""}>
              <Popover
                content={
                  <p className="pt-2 min-w-[200px] text-slate-800 font-bold text-base leading-snug uppercase tracking-tight">
                    {companyName}
                  </p>
                }
                placement="right"
                trigger="hover"
              >
                <p className="mt-2 truncate text-center text-sm font-semibold uppercase tracking-wide text-white cursor-pointer">
                  {companyName}
                </p>
              </Popover>
            </div>
          )}
        </div>

        {/* Sections du menu */}
        <nav
          aria-label="Menu principal"
          className={`flex flex-col gap-1 p-4 flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide ${reduit ? "lg:px-2" : ""}`}
        >
          {sections.map((s, i) => (
            <div key={s.titre ?? `section-${i}`} className="flex flex-col gap-1">
              {s.titre && (
                <>
                  <div
                    className={`px-3 pb-1 pt-4 text-[10.5px] font-bold uppercase tracking-[0.14em] text-white/45 ${reduit ? "lg:hidden" : ""}`}
                  >
                    {s.titre}
                  </div>
                  {/* Mode icônes : un simple trait sépare les sections */}
                  {reduit && <div className="mx-3 my-2 hidden h-px bg-white/15 lg:block" />}
                </>
              )}
              {s.elements.map((e) =>
                e.type === "groupe" ? (
                  <GroupeMenu
                    key={e.id}
                    g={e}
                    ouvert={ouverts.includes(e.id)}
                    basculer={() => basculer(e.id)}
                    actifs={actifs}
                    reduit={reduit}
                    onClick={fermerMobile}
                  />
                ) : (
                  <LienMenu key={e.id} l={e} actif={actifs.has(e.id)} reduit={reduit} onClick={fermerMobile} />
                ),
              )}
            </div>
          ))}
        </nav>

        {/* Bouton de déconnexion (confirmation avant de fermer la session) */}
        <div className={`p-4 border-t border-[#2d1045] ${reduit ? "lg:px-2" : ""}`}>
          <Tooltip title={reduit ? t("sidebar.logout") : ""} placement="right">
            <button
              onClick={() => demanderDeconnexion("/login")}
              className={`flex items-center gap-3 px-4 py-1 ${reduit ? "lg:justify-center lg:px-0 lg:py-2" : ""} w-full rounded-lg transition-all duration-200 border border-white/10 bg-[#3b1558] text-white hover:bg-[#2d1045]`}
            >
              <LogOut size={20} className="shrink-0" />
              <span
                className={`font-medium whitespace-nowrap ${reduit ? "lg:hidden" : ""}`}
              >
                {t("sidebar.logout")}
              </span>
            </button>
          </Tooltip>
        </div>
      </div>
    </>
  );
};

export default Side;
