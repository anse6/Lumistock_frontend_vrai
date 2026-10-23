// Captures de l'application dessinées en HTML/CSS pour le site public : nettes
// à toutes les tailles, traduites, et fidèles aux écrans de Lumistock (menu
// violet, tuiles blanches, statuts vert/ambre/rouge). Données d'exemple,
// masquées aux lecteurs d'écran.
import React from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Barcode,
  Bot,
  CalendarClock,
  Check,
  CircleDollarSign,
  FileSpreadsheet,
  FileText,
  Mail,
  MessageSquareText,
  Moon,
  PackageMinus,
  PackagePlus,
  Printer,
  RotateCcw,
  Search,
  Send,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Truck,
  UserRound,
  Volume2,
} from "lucide-react";
import { ApercuApplication, VisuelCaisse, VisuelDroits } from "./Visuels";
import { useLangue, type CleEcran } from "../site";

const fcfa = (n: number) => `${Math.round(n).toLocaleString("fr-FR").replace(/[\u202f\u00a0]/g, " ")} F`;

/* ------------------------------------------------------------ cadres */

const Fenetre: React.FC<{ titre: string; children: React.ReactNode; actions?: React.ReactNode; large?: boolean }> = ({
  titre,
  children,
  actions,
  large,
}) => (
  <div
    aria-hidden="true"
    className={`mx-auto w-full select-none overflow-hidden rounded-xl border border-trait bg-white text-left shadow-[0_1px_2px_rgba(15,23,42,0.05),0_30px_60px_-30px_rgba(59,7,100,0.35)] ${large ? "max-w-3xl" : "max-w-xl"}`}
  >
    <div className="flex items-center gap-3 border-b border-trait bg-fond px-4 py-2.5">
      <span className="flex gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
      </span>
      <span className="truncate text-xs font-semibold text-texte">{titre}</span>
      {actions && <span className="ml-auto flex shrink-0 gap-1.5">{actions}</span>}
    </div>
    <div className="p-4 sm:p-5">{children}</div>
  </div>
);

const Pastille: React.FC<{ ton: "vert" | "ambre" | "rouge" | "violet" | "gris"; children: React.ReactNode }> = ({ ton, children }) => {
  const styles = {
    vert: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    ambre: "bg-amber-50 text-amber-700 ring-amber-200",
    rouge: "bg-red-50 text-red-700 ring-red-200",
    violet: "bg-marque-50 text-marque ring-marque-200",
    gris: "bg-slate-50 text-slate-600 ring-slate-200",
  }[ton];
  return <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[10.5px] font-semibold ring-1 ${styles}`}>{children}</span>;
};

const Bouton: React.FC<{ children: React.ReactNode; plein?: boolean }> = ({ children, plein }) => (
  <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10.5px] font-semibold ${plein ? "bg-marque text-white" : "border border-trait bg-white text-texte"}`}>
    {children}
  </span>
);

const Ligne: React.FC<{ g: React.ReactNode; d: React.ReactNode; fort?: boolean; className?: string }> = ({ g, d, fort, className = "" }) => (
  <div className={`flex items-center justify-between gap-3 text-[13px] ${className}`}>
    <span className={fort ? "font-semibold text-encre" : "text-attenue"}>{g}</span>
    <span className={`tabular-nums ${fort ? "font-bold text-encre" : "text-texte"}`}>{d}</span>
  </div>
);

/* ------------------------------------------------------------ caisse */

const EcranCaisse: React.FC = () => {
  const L = useLangue();
  const articles = [
    { n: "Ciment CPJ 45 · 50 kg", p: 5200, q: 4 },
    { n: "Fer à béton 10 mm", p: 3800, q: 6 },
    { n: "Pointes 70 mm · 1 kg", p: 1200, q: 2 },
  ];
  const total = articles.reduce((s, a) => s + a.p * a.q, 0);
  const tva = Math.round(total * 0.1925);
  const recu = 60000;
  const tuiles = ["Ciment CPJ 45", "Tôle bac alu", "Fer à béton 8", "Fer à béton 10", "Peinture 20 L", "Pointes 70 mm"];
  return (
    <Fenetre titre={L("Caisse · Nouvelle vente", "Register · New sale")} large actions={<Pastille ton="vert">{L("Caisse ouverte", "Register open")}</Pastille>}>
      <div className="grid gap-4 sm:grid-cols-[1.25fr_1fr]">
        <div>
          <div className="flex items-center gap-2 rounded-lg border border-marque-200 bg-white px-3 py-2 text-[12px] text-attenue ring-2 ring-marque-100">
            <Barcode size={15} className="text-marque" />
            <span className="font-mono text-encre">6 151 000 213 457</span>
            <span className="ml-auto"><Search size={14} /></span>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {tuiles.map((t, i) => (
              <div key={t} className={`rounded-lg border p-2 ${i === 0 ? "border-marque bg-marque-50" : "border-trait bg-fond"}`}>
                <div className="h-7 rounded bg-white ring-1 ring-trait" />
                <p className="mt-1.5 truncate text-[10.5px] font-semibold text-encre">{t}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col rounded-lg border border-trait bg-fond p-3">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold text-texte"><UserRound size={12} /> {L("Client de passage", "Walk-in customer")}</p>
          <ul className="mt-2 space-y-1.5 border-b border-trait pb-2">
            {articles.map((a) => (
              <li key={a.n} className="flex justify-between gap-2 text-[11.5px]">
                <span className="truncate text-encre">{a.q} × {a.n}</span>
                <span className="shrink-0 tabular-nums text-texte">{fcfa(a.p * a.q)}</span>
              </li>
            ))}
          </ul>
          <Ligne g={L("Total HT", "Total excl. VAT")} d={fcfa(total)} className="mt-2" />
          <Ligne g="TVA 19,25 %" d={fcfa(tva)} className="mt-1" />
          <Ligne g={L("Total TTC", "Total incl. VAT")} d={fcfa(total + tva)} fort className="mt-1" />
          <Ligne g={L("Reçu en espèces", "Cash received")} d={fcfa(recu)} className="mt-1" />
          <div className="mt-2 flex items-center justify-between rounded-md bg-emerald-50 px-2.5 py-1.5 text-[12px] font-semibold text-emerald-800">
            <span>{L("Monnaie à rendre", "Change due")}</span>
            <span className="tabular-nums">{fcfa(recu - total - tva)}</span>
          </div>
          <span className="mt-3 flex items-center justify-center gap-1.5 rounded-md bg-marque py-2 text-[12px] font-semibold text-white">
            <Printer size={13} /> {L("Encaisser et imprimer", "Collect and print")}
          </span>
        </div>
      </div>
    </Fenetre>
  );
};

const EcranTicket: React.FC = () => {
  const L = useLangue();
  return (
    <div aria-hidden="true" className="mx-auto flex w-full max-w-md select-none items-start justify-center gap-4">
      <div className="w-56 rounded-sm bg-white px-4 pb-6 pt-5 font-mono text-[10.5px] leading-relaxed text-slate-700 shadow-[0_24px_40px_-20px_rgba(15,23,42,0.45)] ring-1 ring-trait [mask-image:linear-gradient(to_bottom,black_92%,transparent)]">
        <p className="text-center text-[12px] font-bold text-encre">QUINCAILLERIE DU MARCHÉ</p>
        <p className="text-center">Douala · +237 6xx xx xx xx</p>
        <p className="mt-2 border-y border-dashed border-slate-300 py-1 text-center">{L("Ticket", "Receipt")} V-1043 · 14:32</p>
        <div className="mt-2 space-y-0.5">
          <p className="flex justify-between"><span>4 Ciment CPJ 45</span><span>20 800</span></p>
          <p className="flex justify-between"><span>6 Fer à béton 10</span><span>22 800</span></p>
          <p className="flex justify-between"><span>2 Pointes 70 mm</span><span>2 400</span></p>
        </div>
        <div className="mt-2 space-y-0.5 border-t border-dashed border-slate-300 pt-1.5">
          <p className="flex justify-between"><span>{L("HT", "Excl. VAT")}</span><span>46 000</span></p>
          <p className="flex justify-between"><span>TVA 19,25 %</span><span>8 855</span></p>
          <p className="flex justify-between text-[12px] font-bold text-encre"><span>TOTAL TTC</span><span>54 855</span></p>
          <p className="flex justify-between"><span>Orange Money</span><span>30 000</span></p>
          <p className="flex justify-between"><span>{L("Espèces", "Cash")}</span><span>24 855</span></p>
        </div>
        <p className="mt-3 text-center">{L("Merci de votre visite !", "Thank you for your visit!")}</p>
      </div>
      <div className="mt-6 hidden w-44 space-y-2 sm:block">
        {[
          { i: CircleDollarSign, t: L("Espèces", "Cash"), m: "24 855 F" },
          { i: Smartphone, t: "Orange Money", m: "30 000 F" },
        ].map((p) => (
          <div key={p.t} className="rounded-lg border border-trait bg-white p-2.5 shadow-sm">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold text-encre"><p.i size={13} className="text-marque" /> {p.t}</p>
            <p className="mt-0.5 text-[12px] tabular-nums text-texte">{p.m}</p>
          </div>
        ))}
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 text-[11px] font-semibold text-emerald-800">
          <Check size={12} className="mr-1 inline" />{L("Vente payée", "Sale paid")}
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------ ventes */

const EcranVente: React.FC = () => {
  const L = useLangue();
  return (
    <Fenetre titre={L("Vente V-1042 · Ets Fotso & Fils", "Sale V-1042 · Ets Fotso & Fils")} actions={<Pastille ton="ambre">{L("Partielle", "Partial")}</Pastille>}>
      <table className="w-full text-[12px]">
        <thead>
          <tr className="text-left text-[10.5px] uppercase tracking-wide text-attenue">
            <th className="pb-1.5 font-semibold">{L("Article", "Item")}</th>
            <th className="pb-1.5 text-right font-semibold">{L("Qté", "Qty")}</th>
            <th className="pb-1.5 text-right font-semibold">{L("Montant", "Amount")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-encre">
          <tr><td className="py-1.5">Tôle bac alu 0,4 mm</td><td className="text-right">{L("12 feuilles", "12 sheets")}</td><td className="text-right tabular-nums">{fcfa(102000)}</td></tr>
          <tr><td className="py-1.5">Ciment CPJ 45</td><td className="text-right">{L("1 palette (40 sacs)", "1 pallet (40 bags)")}</td><td className="text-right tabular-nums">{fcfa(204000)}</td></tr>
        </tbody>
      </table>
      <div className="mt-3 space-y-1.5 rounded-lg bg-fond p-3">
        <Ligne g={L("Montant des produits", "Products amount")} d={fcfa(306000)} />
        <Ligne g={<span className="flex items-center gap-1.5">{L("Remise", "Discount")} <Pastille ton="violet">{L("client fidèle", "loyal customer")}</Pastille></span>} d={`− ${fcfa(6000)}`} />
        <Ligne g={L("Montant net HT", "Net excl. VAT")} d={fcfa(300000)} />
        <Ligne g="TVA 19,25 %" d={fcfa(57750)} />
        <Ligne g={L("Total TTC", "Total incl. VAT")} d={fcfa(357750)} fort className="border-t border-trait pt-1.5" />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-[12px]">
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
          <p className="text-[10.5px] font-semibold text-emerald-700">{L("Payé", "Paid")}</p>
          <p className="font-bold tabular-nums text-emerald-800">{fcfa(250000)}</p>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2">
          <p className="text-[10.5px] font-semibold text-red-700">{L("Reste au compte client", "Balance to customer account")}</p>
          <p className="font-bold tabular-nums text-red-800">{fcfa(107750)}</p>
        </div>
      </div>
    </Fenetre>
  );
};

/* ------------------------------------------------------------ stock */

const EcranStock: React.FC = () => {
  const L = useLangue();
  const produits = [
    { n: "Ciment CPJ 45 · 50 kg", c: L("Matériaux", "Materials"), q: 6, s: 20, u: L("sacs", "bags") },
    { n: "Tôle bac alu 0,4 mm", c: L("Couverture", "Roofing"), q: 43, s: 15, u: L("feuilles", "sheets") },
    { n: "Peinture glycéro 20 L", c: L("Peinture", "Paint"), q: 0, s: 4, u: L("seaux", "buckets") },
    { n: "Fer à béton 10 mm", c: L("Matériaux", "Materials"), q: 182, s: 50, u: L("barres", "bars") },
    { n: "Robinet laiton 1/2", c: L("Plomberie", "Plumbing"), q: 27, s: 5, u: L("pièces", "pieces"), dort: true },
  ];
  return (
    <Fenetre
      titre={L("Produits · 1 248 articles", "Products · 1,248 items")}
      large
      actions={<><Bouton><FileSpreadsheet size={11} /> {L("Importer", "Import")}</Bouton><Bouton plein><PackagePlus size={11} /> {L("Nouveau", "New")}</Bouton></>}
    >
      <div className="mb-3 grid grid-cols-3 gap-2">
        {[
          { l: L("Valeur du stock", "Stock value"), v: fcfa(18452300), t: "text-encre" },
          { l: L("Sous le seuil", "Below threshold"), v: "14", t: "text-amber-700" },
          { l: L("En rupture", "Out of stock"), v: "3", t: "text-red-700" },
        ].map((k) => (
          <div key={k.l} className="rounded-lg border border-trait bg-white p-2.5">
            <p className="text-[10.5px] text-attenue">{k.l}</p>
            <p className={`text-[14px] font-bold tabular-nums ${k.t}`}>{k.v}</p>
          </div>
        ))}
      </div>
      <ul className="divide-y divide-slate-100 rounded-lg border border-trait">
        {produits.map((p) => {
          const etat = p.q === 0 ? "rouge" : p.q <= p.s ? "ambre" : "vert";
          return (
            <li key={p.n} className="flex items-center gap-3 px-3 py-2">
              <span className="h-7 w-7 shrink-0 rounded-md bg-fond ring-1 ring-trait" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[12px] font-semibold text-encre">{p.n}</span>
                <span className="block text-[10.5px] text-attenue">{p.c} · {L("seuil", "threshold")} {p.s}</span>
              </span>
              {p.dort && <Pastille ton="gris"><Moon size={10} /> {L("dort", "sleeping")}</Pastille>}
              <Pastille ton={etat}>
                {p.q === 0 ? L("Rupture", "Out") : `${p.q} ${p.u}`}
              </Pastille>
            </li>
          );
        })}
      </ul>
    </Fenetre>
  );
};

const EcranMouvements: React.FC = () => {
  const L = useLangue();
  const lignes = [
    { i: PackagePlus, t: L("Approvisionnement", "Restock"), d: "18/10 · 09:12", q: "+ 40", ton: "vert" as const },
    { i: ArrowUpRight, t: L("Vente V-1043", "Sale V-1043"), d: "18/10 · 14:32", q: "− 4", ton: "gris" as const },
    { i: RotateCcw, t: L("Retour sur V-1038", "Return on V-1038"), d: "19/10 · 10:05", q: "+ 2", ton: "violet" as const },
    { i: PackageMinus, t: L("Avarie · sacs déchirés", "Damage · torn bags"), d: "19/10 · 17:40", q: "− 3", ton: "rouge" as const },
    { i: ArrowUpRight, t: L("Vente V-1047", "Sale V-1047"), d: "20/10 · 08:51", q: "− 10", ton: "gris" as const },
  ];
  return (
    <Fenetre titre={L("Ciment CPJ 45 · Mouvements de stock", "Ciment CPJ 45 · Stock movements")}>
      <ol className="relative space-y-3 border-l-2 border-marque-100 pl-5">
        {lignes.map((l) => (
          <li key={l.t + l.d} className="relative flex items-center gap-3">
            <span className="absolute -left-[31px] flex h-5 w-5 items-center justify-center rounded-full bg-white text-marque ring-2 ring-marque-100">
              <l.i size={11} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[12.5px] font-semibold text-encre">{l.t}</span>
              <span className="block text-[10.5px] text-attenue">{l.d}</span>
            </span>
            <Pastille ton={l.ton}>{l.q}</Pastille>
          </li>
        ))}
      </ol>
      <div className="mt-4 flex items-center justify-between rounded-lg bg-fond px-3 py-2 text-[12px]">
        <span className="text-attenue">{L("Stock actuel", "Current stock")}</span>
        <span className="font-bold text-encre">{L("63 sacs", "63 bags")}</span>
      </div>
    </Fenetre>
  );
};

const EcranValorisation: React.FC = () => {
  const L = useLangue();
  const lots = [
    { d: "02/09", q: 20, p: 4300 },
    { d: "24/09", q: 40, p: 4450 },
    { d: "18/10", q: 40, p: 4600 },
  ];
  return (
    <Fenetre titre={L("Valorisation · Ciment CPJ 45", "Valuation · Ciment CPJ 45")}>
      <div className="inline-flex rounded-lg border border-trait bg-fond p-0.5 text-[11px] font-semibold">
        {["CMUP", "FIFO", "LIFO"].map((m, i) => (
          <span key={m} className={`rounded-md px-3 py-1 ${i === 1 ? "bg-marque text-white" : "text-attenue"}`}>{m}</span>
        ))}
      </div>
      <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-attenue">{L("Lots d'achat", "Purchase batches")}</p>
      <ul className="mt-1.5 space-y-1.5">
        {lots.map((l, i) => (
          <li key={l.d} className={`flex items-center justify-between rounded-lg border px-3 py-2 text-[12px] ${i === 0 ? "border-marque-200 bg-marque-50" : "border-trait"}`}>
            <span className="text-encre">{L("Lot du", "Batch of")} {l.d} · {l.q} {L("sacs", "bags")}</span>
            <span className="tabular-nums text-texte">{fcfa(l.p)} / {L("sac", "bag")}</span>
          </li>
        ))}
      </ul>
      <div className="mt-3 rounded-lg bg-fond p-3">
        <Ligne g={L("Vente de 10 sacs à 5 200 F", "Sale of 10 bags at 5,200 F")} d={fcfa(52000)} />
        <Ligne g={L("Coût FIFO (lot du 02/09)", "FIFO cost (batch of 02/09)")} d={`− ${fcfa(43000)}`} className="mt-1" />
        <Ligne g={L("Marge exacte", "Exact margin")} d={fcfa(9000)} fort className="mt-1.5 border-t border-trait pt-1.5" />
      </div>
    </Fenetre>
  );
};

/* ------------------------------------------------------------ achats */

const EcranApprovisionnement: React.FC = () => {
  const L = useLangue();
  return (
    <Fenetre titre={L("Nouvel approvisionnement", "New restock")} actions={<Bouton plein><Check size={11} /> {L("Valider", "Confirm")}</Bouton>}>
      <div className="flex items-center gap-2 rounded-lg border border-trait bg-fond px-3 py-2 text-[12px]">
        <Truck size={14} className="text-marque" />
        <span className="text-attenue">{L("Fournisseur", "Supplier")}</span>
        <span className="ml-auto font-semibold text-encre">Cimencam Bonabéri</span>
      </div>
      <table className="mt-3 w-full text-[12px]">
        <thead>
          <tr className="text-left text-[10.5px] uppercase tracking-wide text-attenue">
            <th className="pb-1.5 font-semibold">{L("Produit", "Product")}</th>
            <th className="pb-1.5 text-right font-semibold">{L("Qté", "Qty")}</th>
            <th className="pb-1.5 text-right font-semibold">{L("Prix d'achat", "Purchase price")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-encre">
          <tr><td className="py-1.5">Ciment CPJ 45</td><td className="text-right">40</td><td className="text-right tabular-nums">{fcfa(4600)}</td></tr>
          <tr><td className="py-1.5">Ciment CPJ 35</td><td className="text-right">20</td><td className="text-right tabular-nums">{fcfa(4250)}</td></tr>
        </tbody>
      </table>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {[
          { l: L("Stock", "Stock"), v: L("+ 60 sacs", "+ 60 bags") },
          { l: L("Nouveaux lots", "New batches"), v: "2" },
          { l: L("Total achat", "Purchase total"), v: fcfa(269000) },
        ].map((k) => (
          <div key={k.l} className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
            <p className="text-[10.5px] font-semibold text-emerald-700">{k.l}</p>
            <p className="text-[13px] font-bold tabular-nums text-emerald-900">{k.v}</p>
          </div>
        ))}
      </div>
    </Fenetre>
  );
};

const EcranFactures: React.FC = () => {
  const L = useLangue();
  const factures = [
    { f: "Cimencam Bonabéri", n: "FA-2210", e: "25/10", ttc: 320755, paye: 150000 },
    { f: "Alucam Distribution", n: "F-0981", e: "02/11", ttc: 612000, paye: 0 },
    { f: "Peintures Seigneurie", n: "PS-554", e: "12/10", ttc: 184500, paye: 184500 },
  ];
  return (
    <Fenetre titre={L("Factures fournisseurs", "Supplier invoices")} large>
      <ul className="space-y-2">
        {factures.map((f) => {
          const reste = f.ttc - f.paye;
          const ton = reste === 0 ? "vert" : f.paye > 0 ? "ambre" : "rouge";
          const libelle = reste === 0 ? L("Payée", "Paid") : f.paye > 0 ? L("Partielle", "Partial") : L("À payer", "To pay");
          return (
            <li key={f.n} className="rounded-lg border border-trait p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="min-w-0">
                  <span className="block truncate text-[12.5px] font-semibold text-encre">{f.f}</span>
                  <span className="block text-[10.5px] text-attenue">{f.n} · {L("échéance", "due")} {f.e}</span>
                </span>
                <Pastille ton={ton}>{libelle}</Pastille>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-marque" style={{ width: `${(f.paye / f.ttc) * 100}%` }} />
              </div>
              <div className="mt-1.5 flex justify-between text-[11px] text-attenue">
                <span>{L("Payé", "Paid")} {fcfa(f.paye)}</span>
                <span className="font-semibold text-encre">{L("Reste", "Left")} {fcfa(reste)}</span>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 flex items-center gap-1.5 text-[11px] text-attenue"><FileText size={12} /> {L("Facture scannée jointe à chaque opération", "Scanned invoice attached to each transaction")}</p>
    </Fenetre>
  );
};

const EcranGerant: React.FC = () => {
  const L = useLangue();
  const lignes = [
    { n: "Ciment CPJ 45", r: 50, v: 38 },
    { n: "Fer à béton 10 mm", r: 80, v: 72 },
    { n: "Tôle bac alu", r: 30, v: 12 },
  ];
  return (
    <Fenetre titre={L("Stock du gérant · Paul (dépôt de Bonamoussadi)", "Agent stock · Paul (Bonamoussadi depot)")}>
      <ul className="space-y-3">
        {lignes.map((l) => (
          <li key={l.n}>
            <div className="flex justify-between text-[12px]">
              <span className="font-semibold text-encre">{l.n}</span>
              <span className="text-attenue">{l.v} / {l.r} {L("vendus", "sold")}</span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-marque" style={{ width: `${(l.v / l.r) * 100}%` }} />
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-4 grid grid-cols-2 gap-2 text-[12px]">
        <span className="flex items-center justify-center gap-1.5 rounded-lg border border-trait py-2 font-semibold text-encre"><ArrowDownLeft size={13} /> {L("Recevoir du stock", "Receive stock")}</span>
        <span className="flex items-center justify-center gap-1.5 rounded-lg bg-marque py-2 font-semibold text-white"><RotateCcw size={13} /> {L("Rendre les invendus", "Return unsold")}</span>
      </div>
    </Fenetre>
  );
};

/* ------------------------------------------------------------ clients */

const EcranCompteClient: React.FC = () => {
  const L = useLangue();
  return (
    <Fenetre titre={L("Fiche client · Mme Ngo Biyong", "Customer · Mrs Ngo Biyong")}>
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-marque-100 text-[13px] font-bold text-marque">NB</span>
        <span>
          <span className="block text-[13px] font-semibold text-encre">Mme Ngo Biyong</span>
          <span className="block text-[11px] text-attenue">Douala · Akwa · +237 6xx xx xx xx</span>
        </span>
      </div>
      <div className="mt-4 space-y-2">
        <Ligne g={L("Dette d'avant Lumistock", "Debt from before Lumistock")} d={fcfa(85000)} />
        <Ligne g={L("V-1031 · 02/10", "V-1031 · 02/10")} d={fcfa(27500)} />
        <Ligne g={L("V-1040 · 16/10", "V-1040 · 16/10")} d={fcfa(15000)} />
        <div className="flex items-center justify-between border-t border-trait pt-2">
          <span className="text-[13px] font-semibold text-encre">{L("Total dû", "Total owed")}</span>
          <span className="text-lg font-bold tabular-nums text-danger">{fcfa(127500)}</span>
        </div>
      </div>
      <span className="mt-4 flex items-center justify-center gap-1.5 rounded-lg bg-marque py-2.5 text-[12.5px] font-semibold text-white">
        <CircleDollarSign size={14} /> {L("Encaisser un règlement", "Collect a payment")}
      </span>
    </Fenetre>
  );
};

const EcranReglement: React.FC = () => {
  const L = useLangue();
  const repartition = [
    { l: L("Dette d'avant Lumistock", "Debt from before Lumistock"), m: 85000 },
    { l: "V-1031 · 02/10", m: 27500 },
    { l: "V-1040 · 16/10", m: 15000 },
    { l: L("Avance sur le compte", "Credit on account"), m: 22500, avance: true },
  ];
  return (
    <Fenetre titre={L("Règlement · Mme Ngo Biyong", "Payment · Mrs Ngo Biyong")}>
      <div className="flex items-center justify-between rounded-lg border border-marque-200 bg-marque-50 px-3 py-2.5">
        <span className="text-[12px] font-semibold text-marque">{L("Montant reçu · MTN MoMo", "Amount received · MTN MoMo")}</span>
        <span className="text-[15px] font-bold tabular-nums text-marque">{fcfa(150000)}</span>
      </div>
      <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-attenue">{L("Répartition automatique", "Automatic allocation")}</p>
      <ol className="mt-1.5 space-y-1.5">
        {repartition.map((r, i) => (
          <li key={r.l} className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 text-[12px] ${r.avance ? "border-emerald-200 bg-emerald-50" : "border-trait"}`}>
            <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${r.avance ? "bg-emerald-600 text-white" : "bg-marque text-white"}`}>{i + 1}</span>
            <span className={`flex-1 ${r.avance ? "font-semibold text-emerald-800" : "text-encre"}`}>{r.l}</span>
            <span className="tabular-nums text-texte">{fcfa(r.m)}</span>
            {!r.avance && <Check size={13} className="text-emerald-600" />}
          </li>
        ))}
      </ol>
    </Fenetre>
  );
};

/* ------------------------------------------------------------ messagerie */

const EcranMessagerie: React.FC = () => {
  const L = useLangue();
  return (
    <div aria-hidden="true" className="mx-auto grid w-full max-w-2xl select-none items-center gap-5 sm:grid-cols-[1.2fr_1fr]">
      <Fenetre titre={L("Nouvelle campagne", "New campaign")}>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-attenue">{L("Destinataires", "Recipients")}</p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          <Pastille ton="violet"><Check size={10} /> {L("Débiteurs · 38", "Debtors · 38")}</Pastille>
          <Pastille ton="gris">{L("Avances · 12", "Credit · 12")}</Pastille>
          <Pastille ton="gris">{L("Tous · 214", "All · 214")}</Pastille>
        </div>
        <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-attenue">{L("Message", "Message")}</p>
        <p className="mt-1.5 rounded-lg border border-trait bg-fond p-2.5 text-[12px] leading-relaxed text-encre">
          {L("Bonjour ", "Hello ")}<span className="rounded bg-marque-100 px-1 font-semibold text-marque">{"{nom}"}</span>
          {L(", il vous reste ", ", you still owe ")}<span className="rounded bg-marque-100 px-1 font-semibold text-marque">{"{dette}"}</span>
          {L(" chez ", " at ")}<span className="rounded bg-marque-100 px-1 font-semibold text-marque">{"{magasin}"}</span>.
          {L(" Merci de passer régler.", " Please come and settle it.")}
        </p>
        <div className="mt-3 flex items-center gap-2">
          <Pastille ton="vert"><MessageSquareText size={10} /> SMS</Pastille>
          <Pastille ton="vert"><Mail size={10} /> Email</Pastille>
          <span className="ml-auto"><Bouton plein><Send size={11} /> {L("Envoyer", "Send")}</Bouton></span>
        </div>
      </Fenetre>
      <div className="mx-auto w-52 rounded-[2rem] border-[6px] border-slate-800 bg-slate-50 p-3 shadow-xl">
        <p className="text-center text-[10px] font-semibold text-attenue">QUINCAILLERIE</p>
        <div className="mt-3 rounded-2xl rounded-tl-sm bg-white p-2.5 text-[11.5px] leading-snug text-encre shadow-sm ring-1 ring-trait">
          {L("Bonjour Mme Ngo Biyong, il vous reste 127 500 F chez Quincaillerie du Marché. Merci de passer régler.", "Hello Mrs Ngo Biyong, you still owe 127,500 F at Quincaillerie du Marché. Please come and settle it.")}
        </div>
        <p className="mt-1 text-[9.5px] text-attenue">09:00</p>
      </div>
    </div>
  );
};

const EcranPlanification: React.FC = () => {
  const L = useLangue();
  const historique = [
    { t: L("Rappel de dette", "Debt reminder"), d: "20/10 · 09:00", n: 38, s: L("Envoyé", "Sent"), ton: "vert" as const },
    { t: L("Arrivage de tôles", "Roofing sheets in stock"), d: "22/10 · 08:00", n: 214, s: L("Programmé", "Scheduled"), ton: "violet" as const },
    { t: L("Merci pour votre fidélité", "Thanks for your loyalty"), d: "15/10 · 17:30", n: 12, s: L("Envoyé", "Sent"), ton: "vert" as const },
  ];
  return (
    <Fenetre titre={L("Envois programmés et relances", "Scheduled sends and reminders")}>
      <div className="flex items-center justify-between rounded-lg border border-trait bg-fond px-3 py-2.5">
        <span className="flex items-center gap-2 text-[12px] font-semibold text-encre"><CalendarClock size={14} className="text-marque" /> {L("Relance automatique des débiteurs", "Automatic debtor reminders")}</span>
        <span className="relative inline-flex h-5 w-9 items-center rounded-full bg-marque"><span className="absolute left-[18px] h-4 w-4 rounded-full bg-white" /></span>
      </div>
      <p className="mt-2 text-[11px] text-attenue">{L("Tous les lundis · 7 jours minimum entre deux messages", "Every Monday · at least 7 days between two messages")}</p>
      <ul className="mt-3 divide-y divide-slate-100 rounded-lg border border-trait">
        {historique.map((h) => (
          <li key={h.t} className="flex items-center gap-3 px-3 py-2">
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[12px] font-semibold text-encre">{h.t}</span>
              <span className="block text-[10.5px] text-attenue">{h.d} · {h.n} {L("clients", "customers")}</span>
            </span>
            <Pastille ton={h.ton}>{h.s}</Pastille>
          </li>
        ))}
      </ul>
    </Fenetre>
  );
};

/* ------------------------------------------------------------ comptabilité */

const EcranJournal: React.FC = () => {
  const L = useLangue();
  const ecritures = [
    { c: "571", l: L("Caisse", "Cash"), d: 357750, k: 0 },
    { c: "701", l: L("Ventes de marchandises", "Sales of goods"), d: 0, k: 300000 },
    { c: "4431", l: L("TVA facturée sur ventes", "VAT invoiced on sales"), d: 0, k: 57750 },
  ];
  return (
    <Fenetre titre={L("Journal des ventes · V-1043", "Sales journal · V-1043")} actions={<Pastille ton="vert"><Check size={10} /> {L("Équilibrée", "Balanced")}</Pastille>}>
      <table className="w-full text-[12px]">
        <thead>
          <tr className="text-left text-[10.5px] uppercase tracking-wide text-attenue">
            <th className="pb-1.5 font-semibold">{L("Compte", "Account")}</th>
            <th className="pb-1.5 text-right font-semibold">{L("Débit", "Debit")}</th>
            <th className="pb-1.5 text-right font-semibold">{L("Crédit", "Credit")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {ecritures.map((e) => (
            <tr key={e.c}>
              <td className="py-2">
                <span className="mr-2 rounded bg-marque-50 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-marque">{e.c}</span>
                <span className="text-encre">{e.l}</span>
              </td>
              <td className="whitespace-nowrap pl-3 text-right tabular-nums text-encre">{e.d ? fcfa(e.d) : ""}</td>
              <td className="whitespace-nowrap pl-3 text-right tabular-nums text-encre">{e.k ? fcfa(e.k) : ""}</td>
            </tr>
          ))}
          <tr className="font-bold text-encre">
            <td className="pt-2">{L("Total", "Total")}</td>
            <td className="whitespace-nowrap pl-3 pt-2 text-right tabular-nums">{fcfa(357750)}</td>
            <td className="whitespace-nowrap pl-3 pt-2 text-right tabular-nums">{fcfa(357750)}</td>
          </tr>
        </tbody>
      </table>
      <p className="mt-3 flex items-center gap-1.5 rounded-lg bg-fond px-3 py-2 text-[11px] text-attenue">
        <Sparkles size={12} className="text-marque" /> {L("Écriture générée automatiquement à l'enregistrement de la vente", "Entry generated automatically when the sale was saved")}
      </p>
    </Fenetre>
  );
};

const EcranTva: React.FC = () => {
  const L = useLangue();
  const mois = [
    { m: L("Août", "Aug"), c: 1120000, r: 640000 },
    { m: L("Sept.", "Sep"), c: 1340000, r: 1510000 },
    { m: L("Oct.", "Oct"), c: 1480000, r: 690000 },
  ];
  const max = 1600000;
  return (
    <Fenetre titre={L("TVA à déclarer", "VAT to declare")}>
      <div className="flex h-32 items-end justify-around gap-4 border-b border-trait px-2">
        {mois.map((m) => (
          <div key={m.m} className="flex h-full flex-1 items-end justify-center gap-1.5">
            <div className="w-5 rounded-t bg-marque" style={{ height: `${(m.c / max) * 100}%` }} />
            <div className="w-5 rounded-t bg-marque-200" style={{ height: `${(m.r / max) * 100}%` }} />
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex justify-around text-[10.5px] text-attenue">
        {mois.map((m) => <span key={m.m}>{m.m}</span>)}
      </div>
      <div className="mt-2 flex gap-4 text-[10.5px] text-attenue">
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-marque" /> {L("Collectée", "Collected")}</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-marque-200" /> {L("Récupérable", "Recoverable")}</span>
      </div>
      <div className="mt-3 space-y-1.5 rounded-lg bg-fond p-3">
        <Ligne g={L("Octobre : collectée − récupérable", "October: collected − recoverable")} d={fcfa(790000)} />
        <Ligne g={L("Crédit reporté de septembre", "Credit carried from September")} d={`− ${fcfa(170000)}`} />
        <Ligne g={L("TVA à reverser", "VAT to pay")} d={fcfa(620000)} fort className="border-t border-trait pt-1.5" />
      </div>
    </Fenetre>
  );
};

const EcranBilan: React.FC = () => {
  const L = useLangue();
  const actif = [
    { l: L("Immobilisations", "Fixed assets"), m: 4200000 },
    { l: L("Stocks de marchandises", "Merchandise stock"), m: 18452300 },
    { l: L("Clients", "Customers"), m: 2146300 },
    { l: L("Trésorerie", "Cash and bank"), m: 6913500 },
  ];
  const passif = [
    { l: L("Capital et réserves", "Equity"), m: 20000000 },
    { l: L("Résultat de l'exercice", "Profit for the year"), m: 5268100 },
    { l: L("Emprunts", "Loans"), m: 3500000 },
    { l: L("Fournisseurs et TVA", "Suppliers and VAT"), m: 2944000 },
  ];
  const total = actif.reduce((s, a) => s + a.m, 0);
  const Colonne: React.FC<{ titre: string; lignes: { l: string; m: number }[] }> = ({ titre, lignes }) => (
    <div className="rounded-lg border border-trait p-3">
      <p className="text-[11px] font-bold uppercase tracking-wide text-marque">{titre}</p>
      <div className="mt-2 space-y-1.5">
        {lignes.map((l) => <Ligne key={l.l} g={l.l} d={fcfa(l.m)} className="!text-[11.5px]" />)}
        <Ligne g={L("Total", "Total")} d={fcfa(total)} fort className="border-t border-trait pt-1.5 !text-[11.5px]" />
      </div>
    </div>
  );
  return (
    <Fenetre titre={L("Bilan SYSCOHADA · au 31/12", "SYSCOHADA balance sheet · at 31/12")} large actions={<Pastille ton="violet"><ShieldCheck size={10} /> {L("Période verrouillée", "Period locked")}</Pastille>}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Colonne titre={L("Actif", "Assets")} lignes={actif} />
        <Colonne titre={L("Passif", "Liabilities")} lignes={passif} />
      </div>
      <div className="mt-3 flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12px]">
        <span className="font-semibold text-emerald-800">{L("Rapprochement Orange Money · octobre", "Orange Money reconciliation · October")}</span>
        <span className="flex items-center gap-1 font-semibold text-emerald-800"><Check size={13} /> {L("0 écart", "0 difference")}</span>
      </div>
    </Fenetre>
  );
};

/* ------------------------------------------------------------ pilotage */

const EcranRapport: React.FC = () => {
  const L = useLangue();
  const lignes = [
    { n: "V-1047", c: "Chantier Bonabéri", ttc: 412000, m: 61800, s: "rouge" as const },
    { n: "V-1046", c: "Boutique Aïcha", ttc: 93200, m: 15900, s: "vert" as const },
    { n: "V-1045", c: "M. Ekane", ttc: 46000, m: 7400, s: "ambre" as const },
    { n: "V-1044", c: "Ets Fotso & Fils", ttc: 182500, m: 29200, s: "vert" as const },
  ];
  return (
    <Fenetre
      titre={L("Rapport des ventes · 1er au 20 octobre", "Sales report · 1 to 20 October")}
      large
      actions={<><Bouton><FileSpreadsheet size={11} /> Excel</Bouton><Bouton><FileText size={11} /> PDF</Bouton><Bouton plein><Printer size={11} /> {L("Imprimer", "Print")}</Bouton></>}
    >
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          { l: L("Ventes", "Sales"), v: "412" },
          { l: L("Chiffre d'affaires TTC", "Revenue incl. VAT"), v: fcfa(24873400) },
          { l: L("Encaissé", "Collected"), v: fcfa(21927100) },
          { l: L("Marge", "Margin"), v: fcfa(3912600) },
        ].map((k) => (
          <div key={k.l} className="rounded-lg border border-marque-100 bg-white p-2.5">
            <p className="text-[10px] text-attenue">{k.l}</p>
            <p className="text-[13px] font-bold tabular-nums text-marque-fonce">{k.v}</p>
          </div>
        ))}
      </div>
      <table className="mt-3 w-full text-[11.5px]">
        <thead>
          <tr className="text-left text-[10px] uppercase tracking-wide text-attenue">
            <th className="pb-1.5 font-semibold">N°</th>
            <th className="pb-1.5 font-semibold">{L("Client", "Customer")}</th>
            <th className="pb-1.5 text-right font-semibold">TTC</th>
            <th className="hidden pb-1.5 text-right font-semibold sm:table-cell">{L("Marge", "Margin")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-encre">
          {lignes.map((l) => (
            <tr key={l.n}>
              <td className="py-1.5 font-mono text-[11px] text-attenue">{l.n}</td>
              <td className="truncate">{l.c}</td>
              <td className="text-right tabular-nums">{fcfa(l.ttc)}</td>
              <td className="hidden text-right tabular-nums text-emerald-700 sm:table-cell">{fcfa(l.m)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Fenetre>
  );
};

const EcranIa: React.FC = () => {
  const L = useLangue();
  return (
    <Fenetre titre={L("Assistant IA", "AI assistant")} actions={<Bouton><Volume2 size={11} /> {L("Écouter", "Listen")}</Bouton>}>
      <div className="space-y-3">
        <p className="ml-auto max-w-[80%] rounded-2xl rounded-br-sm bg-marque px-3 py-2 text-[12px] text-white">
          {L("Quels produits dois-je racheter cette semaine ?", "Which products should I reorder this week?")}
        </p>
        <div className="flex gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-marque-100 text-marque"><Bot size={14} /></span>
          <div className="rounded-2xl rounded-tl-sm border border-trait bg-fond px-3 py-2 text-[12px] leading-relaxed text-encre">
            <p className="font-semibold">{L("Priorités de la semaine", "Priorities for the week")}</p>
            <ol className="mt-1 list-decimal space-y-0.5 pl-4">
              <li>{L("Ciment CPJ 45 : 6 sacs restants pour un seuil de 20. Vous en vendez environ 14 par jour.", "Ciment CPJ 45: 6 bags left for a threshold of 20. You sell about 14 a day.")}</li>
              <li>{L("Peinture glycéro 20 L : en rupture depuis 3 jours.", "Peinture glycéro 20 L: out of stock for 3 days.")}</li>
              <li>{L("Robinet laiton 1/2 : 27 pièces sans vente depuis 74 jours, ne pas racheter.", "Robinet laiton 1/2: 27 pieces unsold for 74 days, don't reorder.")}</li>
            </ol>
          </div>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2 rounded-lg border border-trait px-3 py-2 text-[12px] text-attenue">
        {L("Posez votre question…", "Ask your question…")}
        <span className="ml-auto flex h-6 w-6 items-center justify-center rounded-md bg-marque text-white"><Send size={12} /></span>
      </div>
    </Fenetre>
  );
};

/* ------------------------------------------------------------ équipe */

const EcranEquipe: React.FC = () => {
  const L = useLangue();
  const membres = [
    { i: "JM", n: "Jean Mbarga", r: L("Administrateur", "Administrator"), ton: "violet" as const, actif: true },
    { i: "CE", n: "Carine Etoa", r: "Manager", ton: "violet" as const, actif: true },
    { i: "PN", n: "Paul Nkoulou", r: L("Gérant", "Sales agent"), ton: "gris" as const, actif: true },
    { i: "AM", n: "Awa Mballa", r: L("Caissière", "Cashier"), ton: "gris" as const, actif: true },
    { i: "SK", n: "Serge Kamga", r: L("Caissier", "Cashier"), ton: "gris" as const, actif: false },
  ];
  return (
    <Fenetre titre={L("Équipe", "Team")} actions={<Bouton plein><Mail size={11} /> {L("Inviter", "Invite")}</Bouton>}>
      <ul className="divide-y divide-slate-100">
        {membres.map((m) => (
          <li key={m.n} className="flex items-center gap-3 py-2">
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${m.actif ? "bg-marque-100 text-marque" : "bg-slate-100 text-slate-400"}`}>{m.i}</span>
            <span className={`min-w-0 flex-1 truncate text-[12.5px] font-semibold ${m.actif ? "text-encre" : "text-slate-400 line-through"}`}>{m.n}</span>
            <Pastille ton={m.ton}>{m.r}</Pastille>
            {!m.actif && <Pastille ton="rouge">{L("Désactivé", "Deactivated")}</Pastille>}
          </li>
        ))}
      </ul>
    </Fenetre>
  );
};

const ECRANS: Record<CleEcran, React.FC> = {
  tableau: ApercuApplication,
  caisse: EcranCaisse,
  session: VisuelCaisse,
  ticket: EcranTicket,
  vente: EcranVente,
  stock: EcranStock,
  mouvements: EcranMouvements,
  valorisation: EcranValorisation,
  approvisionnement: EcranApprovisionnement,
  factures: EcranFactures,
  gerant: EcranGerant,
  compteClient: EcranCompteClient,
  reglement: EcranReglement,
  journal: EcranJournal,
  tva: EcranTva,
  bilan: EcranBilan,
  messagerie: EcranMessagerie,
  planification: EcranPlanification,
  rapport: EcranRapport,
  ia: EcranIa,
  droits: VisuelDroits,
  equipe: EcranEquipe,
};

export const Ecran: React.FC<{ cle: CleEcran }> = ({ cle }) => {
  const Composant = ECRANS[cle];
  return <Composant />;
};
