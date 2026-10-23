// Éléments communs aux rapports : période, barre d'actions (imprimer,
// télécharger), cartes de chiffres, chargement des données.
import React, { useCallback, useEffect, useRef, useState } from "react";
import { App, Button, DatePicker, Dropdown, Select, Tooltip } from "antd";
import { Download, FileSpreadsheet, FileText, Printer, RotateCcw } from "lucide-react";
import dayjs, { type Dayjs } from "dayjs";

export const PURPLE_950 = "#3b0764";

// ---------------------------------------------------------------- formats
const nombre = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 });
export const fmt = (n: number | null | undefined) => nombre.format(Number(n) || 0);
export const argent = (n: number | null | undefined, devise: string) => `${fmt(n)} ${devise}`;
export const dateCourte = (iso?: string | null) => (iso ? dayjs(iso).format("DD/MM/YYYY") : "—");
export const dateHeure = (iso?: string | null) => (iso ? dayjs(iso).format("DD/MM/YYYY HH:mm") : "—");

// ---------------------------------------------------------------- période
export interface Periode {
  debut: Dayjs;
  fin: Dayjs;
}

export const PRESETS: { value: string; label: string; calcul: () => Periode }[] = [
  { value: "jour", label: "Aujourd'hui", calcul: () => ({ debut: dayjs().startOf("day"), fin: dayjs() }) },
  { value: "hier", label: "Hier", calcul: () => ({ debut: dayjs().subtract(1, "day"), fin: dayjs().subtract(1, "day") }) },
  {
    value: "semaine",
    label: "Cette semaine",
    // Semaine du lundi au dimanche (comme le serveur)
    calcul: () => ({ debut: dayjs().subtract((dayjs().day() + 6) % 7, "day"), fin: dayjs() }),
  },
  { value: "mois", label: "Ce mois", calcul: () => ({ debut: dayjs().startOf("month"), fin: dayjs() }) },
  {
    value: "mois_precedent",
    label: "Mois précédent",
    calcul: () => ({
      debut: dayjs().subtract(1, "month").startOf("month"),
      fin: dayjs().subtract(1, "month").endOf("month"),
    }),
  },
  { value: "trimestre", label: "3 derniers mois", calcul: () => ({ debut: dayjs().subtract(3, "month").add(1, "day"), fin: dayjs() }) },
  { value: "annee", label: "Cette année", calcul: () => ({ debut: dayjs().startOf("year"), fin: dayjs() }) },
  {
    value: "annee_precedente",
    label: "Année précédente",
    calcul: () => ({
      debut: dayjs().subtract(1, "year").startOf("year"),
      fin: dayjs().subtract(1, "year").endOf("year"),
    }),
  },
];

export const periodeDe = (preset: string): Periode =>
  (PRESETS.find((p) => p.value === preset) || PRESETS[3]).calcul();

export const libellePeriode = ({ debut, fin }: Periode) =>
  debut.isSame(fin, "day") ? `Le ${debut.format("DD/MM/YYYY")}` : `Du ${debut.format("DD/MM/YYYY")} au ${fin.format("DD/MM/YYYY")}`;

export const paramsPeriode = ({ debut, fin }: Periode) => ({
  debut: debut.format("YYYY-MM-DD"),
  fin: fin.format("YYYY-MM-DD"),
});

/** Raccourcis (Ce mois, Cette année…) et dates libres. */
export const ChoixPeriode: React.FC<{
  preset: string;
  periode: Periode;
  onChange: (preset: string, periode: Periode) => void;
}> = ({ preset, periode, onChange }) => (
  <div className="flex flex-wrap items-center gap-2">
    <Select
      value={preset}
      onChange={(v) => onChange(v, v === "perso" ? periode : periodeDe(v))}
      options={[...PRESETS.map((p) => ({ value: p.value, label: p.label })), { value: "perso", label: "Période personnalisée" }]}
      className="w-full sm:w-48"
    />
    <DatePicker.RangePicker
      value={[periode.debut, periode.fin]}
      format="DD/MM/YYYY"
      allowClear={false}
      disabledDate={(d) => d.isAfter(dayjs(), "day")}
      onChange={(valeurs) => {
        if (valeurs?.[0] && valeurs[1]) onChange("perso", { debut: valeurs[0], fin: valeurs[1] });
      }}
      className="w-full sm:w-64"
    />
  </div>
);

// ---------------------------------------------------------------- en-tête
export const EnteteRapport: React.FC<{
  icone: React.ReactNode;
  titre: string;
  description: string;
  actions?: React.ReactNode;
}> = ({ icone, titre, description, actions }) => (
  <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
    <div className="flex items-center gap-3">
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-md shadow-purple-950/20"
        style={{ backgroundColor: PURPLE_950 }}
      >
        {icone}
      </span>
      <div>
        <h2 className="m-0 text-lg font-bold text-purple-950">{titre}</h2>
        <p className="m-0 text-xs text-slate-500">{description}</p>
      </div>
    </div>
    {actions}
  </div>
);

/** Boutons Imprimer et Télécharger (PDF ou Excel). */
export const ActionsRapport: React.FC<{
  disabled?: boolean;
  onPdf: (mode: "download" | "print") => Promise<unknown>;
  onExcel?: () => void;
  onReset?: () => void;
}> = ({ disabled, onPdf, onExcel, onReset }) => {
  const { message } = App.useApp();
  const [enCours, setEnCours] = useState<"" | "download" | "print">("");
  const lancer = async (mode: "download" | "print") => {
    setEnCours(mode);
    try {
      await onPdf(mode);
      if (mode === "download") message.success("Rapport téléchargé.");
    } catch (erreur) {
      message.error(erreur instanceof Error ? erreur.message : "Le document n'a pas pu être généré.");
    } finally {
      setEnCours("");
    }
  };
  return (
    <div className="flex flex-wrap items-center gap-2">
      {onReset && (
        <Tooltip title="Réinitialiser les filtres">
          <Button icon={<RotateCcw size={15} />} onClick={onReset} />
        </Tooltip>
      )}
      <Button
        icon={<Printer size={15} />}
        loading={enCours === "print"}
        disabled={disabled || !!enCours}
        onClick={() => lancer("print")}
        className="!border-purple-200 !text-purple-950 hover:!bg-purple-50"
      >
        Imprimer
      </Button>
      {onExcel ? (
        <Dropdown
          disabled={disabled || !!enCours}
          menu={{
            items: [
              { key: "pdf", icon: <FileText size={15} />, label: "Document PDF", onClick: () => lancer("download") },
              { key: "excel", icon: <FileSpreadsheet size={15} />, label: "Tableau Excel (CSV)", onClick: onExcel },
            ],
          }}
        >
          <Button
            icon={<Download size={15} />}
            loading={enCours === "download"}
            className="!border-0 !text-white"
            style={{ backgroundColor: PURPLE_950 }}
          >
            Télécharger
          </Button>
        </Dropdown>
      ) : (
        <Button
          icon={<Download size={15} />}
          loading={enCours === "download"}
          disabled={disabled || !!enCours}
          onClick={() => lancer("download")}
          className="!border-0 !text-white"
          style={{ backgroundColor: PURPLE_950 }}
        >
          Télécharger
        </Button>
      )}
    </div>
  );
};

// ---------------------------------------------------------------- filtres et cartes
export const BarreFiltres: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-purple-100 bg-purple-50/50 p-3">
    {children}
  </div>
);

type Ton = "violet" | "vert" | "orange" | "rouge" | "gris";
const TONS: Record<Ton, { fond: string; texte: string; icone: string }> = {
  violet: { fond: "bg-white", texte: "text-purple-950", icone: "bg-purple-100 text-purple-900" },
  vert: { fond: "bg-white", texte: "text-emerald-700", icone: "bg-emerald-100 text-emerald-700" },
  orange: { fond: "bg-white", texte: "text-orange-600", icone: "bg-orange-100 text-orange-600" },
  rouge: { fond: "bg-white", texte: "text-red-600", icone: "bg-red-100 text-red-600" },
  gris: { fond: "bg-white", texte: "text-slate-700", icone: "bg-slate-100 text-slate-600" },
};

export const CarteChiffre: React.FC<{
  libelle: string;
  valeur: string;
  detail?: React.ReactNode;
  icone: React.ReactNode;
  ton?: Ton;
  principale?: boolean;
}> = ({ libelle, valeur, detail, icone, ton = "violet", principale }) =>
  principale ? (
    <div className="rounded-2xl p-4 text-white shadow-md shadow-purple-950/20" style={{ backgroundColor: PURPLE_950 }}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-purple-200">{libelle}</span>
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15">{icone}</span>
      </div>
      <div className="mt-2 truncate text-xl font-bold">{valeur}</div>
      {detail && <div className="mt-1 text-xs text-purple-200">{detail}</div>}
    </div>
  ) : (
    <div className={`rounded-2xl border border-purple-100 p-4 shadow-sm ${TONS[ton].fond}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{libelle}</span>
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${TONS[ton].icone}`}>{icone}</span>
      </div>
      <div className={`mt-2 truncate text-xl font-bold ${TONS[ton].texte}`}>{valeur}</div>
      {detail && <div className="mt-1 text-xs text-slate-500">{detail}</div>}
    </div>
  );

export const Pastille: React.FC<{ ton: Ton; children: React.ReactNode }> = ({ ton, children }) => {
  const classes: Record<Ton, string> = {
    violet: "bg-purple-100 text-purple-900",
    vert: "bg-emerald-100 text-emerald-700",
    orange: "bg-orange-100 text-orange-700",
    rouge: "bg-red-100 text-red-700",
    gris: "bg-slate-100 text-slate-600",
  };
  return (
    <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-bold ${classes[ton]}`}>
      {children}
    </span>
  );
};

export const Section: React.FC<{ titre: string; note?: React.ReactNode; children: React.ReactNode }> = ({
  titre,
  note,
  children,
}) => (
  <div className="rounded-2xl border border-purple-100 bg-white p-4 shadow-sm">
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
      <h3 className="m-0 text-sm font-bold text-purple-950">{titre}</h3>
      {note && <span className="text-xs text-slate-500">{note}</span>}
    </div>
    {children}
  </div>
);

// ---------------------------------------------------------------- données
/** Charge un rapport à chaque changement de `cle` ; annule la demande précédente. */
export function useRapport<T>(charger: (signal: AbortSignal) => Promise<T>, cle: string) {
  const { message } = App.useApp();
  const [donnees, setDonnees] = useState<T | null>(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const chargerRef = useRef(charger);
  chargerRef.current = charger;
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const controleur = new AbortController();
    setChargement(true);
    setErreur(null);
    chargerRef
      .current(controleur.signal)
      .then((d) => !controleur.signal.aborted && setDonnees(d))
      .catch((e) => {
        if (controleur.signal.aborted) return;
        const texte = e instanceof Error ? e.message : "Rapport indisponible";
        setErreur(texte);
        message.error(texte);
      })
      .finally(() => !controleur.signal.aborted && setChargement(false));
    return () => controleur.abort();
  }, [cle, version, message]);

  const recharger = useCallback(() => setVersion((v) => v + 1), []);
  return { donnees, chargement, erreur, recharger };
}
