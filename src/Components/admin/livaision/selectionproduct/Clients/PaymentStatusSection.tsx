import React, { useState, useEffect } from "react";
import { InputNumber } from "antd";
import { Banknote, Smartphone, Landmark, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useDeliveryStore } from "../../newdelivery/deliveryStore";
import { useMontantsVente } from "./reductions";
import { arrondirMontant } from "./tva";
import { estCaissier } from "../../venteRole";
import { useGetClients, estClientDePassage, type Client } from "./api/clientApi";
import SituationClient from "../../../../Client/SituationClient";

type StatutLocal = "total" | "none" | "partiellement payé";

const determineLocalStatus = (statut: string): StatutLocal => {
  if (statut === "payé" || statut === "paye") return "total";
  if (statut === "partiellement payé") return "partiellement payé";
  return "none";
};

const versStatutStore = (status: StatutLocal) =>
  status === "total" ? "payé" : status === "partiellement payé" ? "partiellement payé" : "non payé";

export const PaymentStatusSection: React.FC = () => {
  const { t } = useTranslation();
  const statutStore = useDeliveryStore((state) => state.statut_paiement);
  // Les paiements n'existent qu'à un seul endroit : le store. Une copie locale
  // synchronisée dans les deux sens faisait boucler React (« Maximum update
  // depth exceeded ») dès que les deux valeurs différaient, par exemple à
  // l'ouverture d'une livraison existante.
  const paiements = useDeliveryStore((state) => state.paiements);
  const defaultDetteAncienne = useDeliveryStore((state) => state.dette_ancienne);
  const defaultIsDetteAncienneActive = useDeliveryStore((state) => state.is_dette_ancienne_active);
  const setPaymentStatus = useDeliveryStore((state) => state.setPaymentStatus);
  const setPaiementsStore = useDeliveryStore((state) => state.setPaiements);
  const setAdvance = useDeliveryStore((state) => state.setAdvanceAmount);
  const setACouche = useDeliveryStore((state) => state.setACouche);
  const clientId = useDeliveryStore((state) => state.clientId);
  const enModification = !!useDeliveryStore((state) => state.editDeliveryId);
  const { data: clients } = useGetClients();
  // Client de passage (aucun client choisi, ou « Autres ») : on ne le connaît
  // pas, la vente doit donc être payée en totalité (le serveur le vérifie aussi).
  const passage =
    !clientId || estClientDePassage((clients as Client[] | undefined)?.find((c) => String(c._id) === String(clientId)));
  const { totalAPayer, decimales } = useMontantsVente();

  const status = determineLocalStatus(statutStore);
  const selectedMethods = paiements.map((p) => p.methode);
  const paymentAmounts: Record<string, number> = Object.fromEntries(
    paiements.map((p) => [p.methode, Number(p.montant) || 0]),
  );

  const [showOldDebtSetting, setShowOldDebtSetting] = useState(
    localStorage.getItem("show_old_debt") !== "false",
  );

  useEffect(() => {
    const handleSettingChange = () => {
      setShowOldDebtSetting(localStorage.getItem("show_old_debt") !== "false");
    };
    window.addEventListener("oldDebtSettingChange", handleSettingChange);
    return () => window.removeEventListener("oldDebtSettingChange", handleSettingChange);
  }, []);

  const paymentOptions = [
    { label: t("admin.deliveries.payment.methods.cash"), value: "cash" },
    { label: t("admin.deliveries.payment.methods.om"), value: "om" },
    { label: t("admin.deliveries.payment.methods.momo"), value: "momo" },
    { label: t("admin.deliveries.payment.methods.bancaire"), value: "bancaire" },
  ];

  // Écrit les paiements et le montant payé (leur somme) en une fois.
  const ecrirePaiements = (liste: { methode: string; montant: number }[]) => {
    setPaiementsStore(liste);
    setAdvance(liste.reduce((sum, p) => sum + (Number(p.montant) || 0), 0));
  };

  // « Payé » = tout le montant est encaissé : on préremplit le montant
  // (espèces par défaut). Avec plusieurs modes, l'utilisateur répartit.
  const choisirStatut = (valeur: StatutLocal) => {
    setPaymentStatus(versStatutStore(valeur));
    if (valeur === "none") {
      ecrirePaiements([]);
      setACouche(false);
    } else if (valeur === "total") {
      const modes = selectedMethods.length ? selectedMethods : ["cash"];
      ecrirePaiements(
        modes.length === 1
          ? [{ methode: modes[0], montant: totalAPayer }]
          : modes.map((m) => ({ methode: m, montant: paymentAmounts[m] || 0 })),
      );
    }
  };

  const toggleMethod = (methode: string) => {
    const suivants = selectedMethods.includes(methode)
      ? selectedMethods.filter((m) => m !== methode)
      : [...selectedMethods, methode];
    if (status === "total" && suivants.length === 1) {
      ecrirePaiements([{ methode: suivants[0], montant: totalAPayer }]);
    } else {
      ecrirePaiements(suivants.map((m) => ({ methode: m, montant: paymentAmounts[m] || 0 })));
    }
  };

  const handleAmountChange = (method: string, amount: number | null) => {
    // Pas de centimes en franc CFA : montant arrondi à l'unité de la monnaie.
    const montant = arrondirMontant(Number(amount) || 0, decimales);
    ecrirePaiements(paiements.map((p) => (p.methode === method ? { ...p, montant } : p)));
  };

  // Vente « Payée » avec un seul mode : le montant encaissé suit le total
  // (quantités, réductions, dette…). Sans mode choisi (« Payé » est le statut
  // par défaut d'une nouvelle vente), on encaisse en espèces : une vente payée
  // a toujours un encaissement. Converge en un passage : après l'écriture, le
  // montant est égal au total et l'effet ne réécrit plus rien.
  // (En modification, une vente sans mode de paiement n'est pas complétée d'office.)
  const modeUnique =
    selectedMethods.length === 1 ? selectedMethods[0] : selectedMethods.length === 0 && !enModification ? "cash" : null;
  const montantUnique = selectedMethods.length === 1 ? paymentAmounts[selectedMethods[0]] : undefined;
  useEffect(() => {
    if (status === "total" && modeUnique && montantUnique !== totalAPayer) {
      ecrirePaiements([{ methode: modeUnique, montant: totalAPayer }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, totalAPayer, montantUnique, modeUnique]);

  // Nouvelle vente : choisir le client de passage (ou retirer le client)
  // ramène sur « Payé ». Une vente que l'on modifie garde son statut.
  useEffect(() => {
    if (passage && status !== "total" && !enModification) choisirStatut("total");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passage, status, enModification]);

  const totalPaye = Object.values(paymentAmounts).reduce((a, b) => a + (Number(b) || 0), 0);
  const depassement = status !== "none" && totalPaye > totalAPayer;
  const icones: Record<string, React.ReactNode> = {
    cash: <Banknote size={16} />,
    om: <Smartphone size={16} />,
    momo: <Smartphone size={16} />,
    bancaire: <Landmark size={16} />,
  };
  const statuts: { value: "none" | "partiellement payé" | "total"; label: string; actif: string }[] = [
    { value: "total", label: t("admin.deliveries.payment.status.total"), actif: "bg-emerald-600 text-white border-emerald-600" },
    { value: "partiellement payé", label: t("admin.deliveries.payment.status.partial"), actif: "bg-amber-500 text-white border-amber-500" },
    { value: "none", label: t("admin.deliveries.payment.status.none"), actif: "bg-slate-700 text-white border-slate-700" },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Statut du paiement */}
      <div>
        <div className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
          {t("admin.deliveries.payment.status.label")}
        </div>
        <div className="grid grid-cols-3 gap-2" role="radiogroup">
          {statuts.map((s) => {
            const interdit = passage && s.value !== "total";
            return (
              <button
                key={s.value}
                type="button"
                role="radio"
                aria-checked={status === s.value}
                disabled={interdit}
                title={interdit ? "Choisissez un client enregistré pour vendre à crédit" : undefined}
                onClick={() => choisirStatut(s.value)}
                className={`rounded-lg border px-2 py-2.5 text-xs font-semibold transition sm:text-sm ${
                  status === s.value
                    ? s.actif
                    : interdit
                      ? "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300"
                      : "border-slate-200 bg-white text-slate-600 hover:border-purple-300 hover:bg-purple-50"
                }`}
              >
                {s.label}
              </button>
            );
          })}
        </div>
        {passage && (
          <p className={`mt-2 text-xs ${status === "total" ? "text-slate-500" : "font-semibold text-red-600"}`}>
            Client de passage : la vente doit être payée en totalité. Pour un paiement partiel ou à crédit, choisissez
            un client enregistré.
          </p>
        )}
      </div>

      {status !== "none" && (
        <>
          {/* Modes de paiement */}
          <div>
            <div className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
              {t("admin.deliveries.payment.methods.label")}
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {paymentOptions.map((option) => {
                const actif = selectedMethods.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={actif}
                    onClick={() => toggleMethod(option.value)}
                    className={`relative flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-semibold transition ${
                      actif ? "border-emerald-600 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-600 hover:border-emerald-300"
                    }`}
                  >
                    {icones[option.value]}
                    <span className="truncate">{option.label}</span>
                    {actif && (
                      <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-white">
                        <Check size={10} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Montants encaissés */}
          {selectedMethods.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {selectedMethods.map((method) => (
                  <label key={method} className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-slate-500">
                      {t("admin.deliveries.payment.details.amountLabel", {
                        method: t(`admin.deliveries.payment.methods.${method}`),
                      })}
                    </span>
                    <InputNumber
                      className="w-full"
                      size="large"
                      placeholder="0"
                      min={0}
                      precision={decimales}
                      value={paymentAmounts[method]}
                      onChange={(val) => handleAmountChange(method, val)}
                      formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, " ")}
                      parser={(value) => value!.replace(/\s?|CFA/g, "") as any}
                      addonAfter="CFA"
                    />
                  </label>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-2 text-sm">
                <span className="font-medium text-slate-600">{t("admin.deliveries.payment.details.totalPaid")}</span>
                <span className={`text-base font-bold ${depassement ? "text-red-600" : "text-purple-950"}`}>
                  {totalPaye.toLocaleString("fr-FR")} CFA
                </span>
              </div>
              {depassement && (
                <div className="mt-2 rounded-lg border border-red-200 bg-red-50 p-2 text-xs font-medium text-red-600">
                  Le montant encaissé ({totalPaye.toLocaleString("fr-FR")} CFA) dépasse le total à payer (
                  {totalAPayer.toLocaleString("fr-FR")} CFA).
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Dette du client (admin et manager) : la dette d'avant Lumistock se saisit
          sur sa fiche et se règle à part ; elle n'est plus ajoutée à la vente. */}
      {showOldDebtSetting && !estCaissier() && <SituationClient clientId={clientId} compact />}
      {defaultIsDetteAncienneActive && defaultDetteAncienne > 0 && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
          Cette ancienne vente inclut une dette ancienne de {defaultDetteAncienne.toLocaleString("fr-FR")} CFA
          (ancienne méthode, conservée telle quelle).
        </div>
      )}
    </div>
  );
};
