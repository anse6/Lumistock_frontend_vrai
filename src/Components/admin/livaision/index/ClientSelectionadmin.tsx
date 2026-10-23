// Configurattionadmin.tsx — étape 2 de la vente : client, articles, paiement.
import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ConfigProvider, Input } from "antd";
import { ArrowLeftOutlined, BarcodeOutlined } from "@ant-design/icons";
import {
  User,
  ShoppingBag,
  CreditCard,
  ReceiptText,
  Check,
  BadgePercent,
  Landmark,
} from "lucide-react";
import { ClientSection } from "../selectionproduct/Clients/ClientSection";
import { ProductsSection } from "../selectionproduct/Clients/ProductsSection";
import { PaymentStatusSection } from "../selectionproduct/Clients/PaymentStatusSection";
import { TotalSection } from "../selectionproduct/Clients/TotalSection";
import { ReductionsSection } from "../selectionproduct/Clients/ReductionsSection";
import { TvaSection } from "../selectionproduct/Clients/TvaSection";
import { ActionsSection } from "../selectionproduct/Clients/ActionsSection";
import { useProductStore } from "../selectionproduct/Clients/api/useProductStore";
import PageTitle from "../../../PageTitle";
import { cheminsVente, estCaissier } from "../venteRole";
import { useContexteCaisse } from "../../../../Modules/Caisse/hooks";
import { useDeliveryStore } from "../newdelivery/deliveryStore";
import { useScanVente } from "../scanVente";
import IndicateurLecteur from "../../../../Modules/CodeBarre/IndicateurLecteur";
import AssocierCodeModal from "../../../../Modules/CodeBarre/AssocierCodeModal";
import { variantesSaisie } from "../../../../Modules/CodeBarre/detecteur";

const PURPLE_950 = "#3b0764";

export const SaleCard: React.FC<{
  numero?: number;
  icone: React.ReactNode;
  titre: string;
  sousTitre?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}> = ({ numero, icone, titre, sousTitre, action, children }) => (
  <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
    <div className="mb-4 flex items-start justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-purple-950">
          {icone}
          {numero !== undefined && (
            <span className="absolute -left-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-purple-950 text-[10px] font-bold text-white">
              {numero}
            </span>
          )}
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900">{titre}</h2>
          {sousTitre && <p className="text-xs text-slate-500">{sousTitre}</p>}
        </div>
      </div>
      {action}
    </div>
    {children}
  </section>
);

export const SaleStepper: React.FC<{ etape2: string }> = ({ etape2 }) => (
  <div className="flex items-center gap-2 text-xs font-semibold">
    <span className="flex items-center gap-1.5 text-emerald-700">
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white">
        <Check size={12} />
      </span>
      Produits
    </span>
    <span className="h-px w-6 bg-slate-300" />
    <span className="flex items-center gap-1.5 text-purple-950">
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-950 text-[10px] text-white">
        2
      </span>
      {etape2}
    </span>
  </div>
);

// Saisie d'un code à la main (ou scan quand le curseur est dans ce champ).
const SaisieCodeBarre: React.FC<{ onCode: (code: string, variantes: string[]) => void }> = ({ onCode }) => {
  const [valeur, setValeur] = React.useState("");
  return (
    <div data-saisie-code-barre className="w-full sm:w-64">
      <Input
        size="middle"
        value={valeur}
        onChange={(e) => setValeur(e.target.value)}
        onPressEnter={(e) => {
          e.preventDefault();
          const variantes = variantesSaisie(valeur);
          setValeur("");
          if (variantes.length) onCode(variantes[0], variantes);
        }}
        prefix={<BarcodeOutlined className="text-purple-950" />}
        placeholder="Code-barre + Entrée"
        allowClear
      />
    </div>
  );
};

const Configurattionadmin: React.FC = () => {
  const { t } = useTranslation();
  // Lecteur : chaque scan ajoute l'article ici, ou augmente sa quantité de 1.
  const scan = useScanVente();
  const nbArticles = useProductStore((state) => state.selectedProducts.length);
  const chemins = cheminsVente();
  // Caissier : remises seulement si l'admin les autorise, jamais de dette ancienne.
  const caissier = estCaissier();
  const { data: ctxCaisse } = useContexteCaisse(caissier);
  const remisesPermises = !caissier || !!ctxCaisse?.parametres.remises_autorisees;
  const reductions = useDeliveryStore((state) => state.reductions);
  const setReductions = useDeliveryStore((state) => state.setReductions);
  const detteActive = useDeliveryStore((state) => state.is_dette_ancienne_active);
  const setDetteActive = useDeliveryStore((state) => state.setIsDetteAncienneActive);
  React.useEffect(() => {
    if (!caissier) return;
    if (ctxCaisse && !remisesPermises && reductions.length > 0) setReductions([]);
    if (detteActive) setDetteActive(false);
  }, [caissier, ctxCaisse, remisesPermises, reductions.length, setReductions, detteActive, setDetteActive]);

  return (
    <ConfigProvider
      theme={{ token: { colorPrimary: PURPLE_950, borderRadius: 10 } }}
    >
      <PageTitle>Finaliser la vente</PageTitle>
      <div className="min-h-screen bg-white pb-16">
        {/* Fil d'Ariane */}
        <div className="flex flex-wrap items-center gap-2 px-4 pt-4 pb-3 text-sm font-medium sm:px-6">
          <Link
            to={chemins.liste}
            style={{ backgroundColor: "#3b0764" }}
            className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold !text-white shadow-sm hover:opacity-90"
          >
            <ArrowLeftOutlined className="text-xs" />
            {chemins.libelleListe ?? t("sidebar.delivery")}
          </Link>
          <span className="font-bold text-gray-300">›</span>
          <Link
            to={chemins.selection}
            className="rounded-xl bg-gray-100 px-3 py-1.5 text-xs !text-gray-600 hover:bg-gray-200"
          >
            Nouvelle vente
          </Link>
          <span className="font-bold text-gray-300">›</span>
          <span className="rounded-xl bg-purple-100 px-3 py-1.5 text-xs font-semibold text-purple-950">
            Client et paiement
          </span>
        </div>

        {/* En-tête */}
        <div className="mx-4 mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-purple-50 bg-white to-white p-4 shadow-sm sm:mx-6">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-purple-900/70">
              Étape 2 sur 2
            </div>
            <h1 className="text-lg font-bold text-purple-950">
              Finaliser la vente
            </h1>
            <p className="text-xs text-slate-500">
              Choisissez le client, ajustez les quantités et enregistrez le
              paiement.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <IndicateurLecteur />
            <SaleStepper etape2="Client et paiement" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 px-4 sm:px-6 lg:grid-cols-3">
          <div className="space-y-5 lg:col-span-2">
            <SaleCard
              numero={1}
              icone={<User size={18} />}
              titre="Client"
              sousTitre={caissier ? "Client de passage par défaut : pour une vente à crédit, choisissez un client enregistré" : "Facultatif : client de passage par défaut"}
            >
              <ClientSection />
            </SaleCard>
            <SaleCard
              numero={2}
              icone={<ShoppingBag size={18} />}
              titre="Articles"
              sousTitre={`${nbArticles} article${nbArticles > 1 ? "s" : ""} dans la vente — scannez pour ajouter`}
              action={<SaisieCodeBarre onCode={(code, variantes) => scan.traiterScan({ code, variantes })} />}
            >
              <ProductsSection />
            </SaleCard>
            {remisesPermises && (
              <SaleCard
                numero={3}
                icone={<BadgePercent size={18} />}
                titre="Réductions"
                sousTitre="Facultatif : rabais, remise ou ristourne accordés au client"
              >
                <ReductionsSection />
              </SaleCard>
            )}
            <SaleCard
              numero={remisesPermises ? 4 : 3}
              icone={<Landmark size={18} />}
              titre="TVA"
              sousTitre="Taxe sur la valeur ajoutée du pays du magasin"
            >
              <TvaSection />
            </SaleCard>
            <SaleCard
              numero={remisesPermises ? 5 : 4}
              icone={<CreditCard size={18} />}
              titre="Paiement"
            >
              <PaymentStatusSection />
            </SaleCard>
          </div>

          <aside className="lg:col-span-1">
            <div className="sticky top-4">
              <SaleCard icone={<ReceiptText size={18} />} titre="Récapitulatif">
                <TotalSection />
                <div className="mt-4 border-t border-slate-100 pt-4">
                  <ActionsSection />
                </div>
              </SaleCard>
            </div>
          </aside>
        </div>
      </div>
      <AssocierCodeModal code={scan.codeInconnu} onFermer={scan.fermerCodeInconnu} onAssocie={scan.ajouterProduit} />
    </ConfigProvider>
  );
};

export default Configurattionadmin;
