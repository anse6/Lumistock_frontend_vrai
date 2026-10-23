import React, { useMemo } from "react";
import { ConfigProvider, Input, Select } from "antd";
import * as Drapeaux from "country-flag-icons/react/3x2";
import {
  CountryCode,
  getCountries,
  getCountryCallingCode,
  getExampleNumber,
  isValidPhoneNumber,
  parsePhoneNumberFromString,
  validatePhoneNumberLength,
} from "libphonenumber-js";
import exemples from "libphonenumber-js/examples.mobile.json";

export const PAYS_PAR_DEFAUT: CountryCode = "CM";

const nomsPays = (() => {
  try {
    return new Intl.DisplayNames(["fr"], { type: "region" });
  } catch {
    return null;
  }
})();

export type Pays = { code: CountryCode; nom: string; indicatif: string };

/** Nom du pays en français (« Cameroun ») à partir de son code ISO. */
export const nomPays = (code?: string | null) => (code ? nomsPays?.of(code.toUpperCase()) || code : "");

// Pays connus de libphonenumber, triés par nom français ; le Cameroun en tête.
export const LISTE_PAYS: Pays[] = getCountries()
  .map((code) => ({
    code,
    nom: nomsPays?.of(code) || code,
    indicatif: getCountryCallingCode(code),
  }))
  .sort((a, b) =>
    a.code === PAYS_PAR_DEFAUT
      ? -1
      : b.code === PAYS_PAR_DEFAUT
        ? 1
        : a.nom.localeCompare(b.nom, "fr"),
  );

export const Drapeau: React.FC<{ code: CountryCode | string; className?: string }> = ({ code, className }) => {
  const Svg = (
    Drapeaux as Record<
      string,
      React.ComponentType<React.SVGProps<SVGSVGElement>>
    >
  )[code];
  return Svg ? (
    <Svg
      className={className || "h-[14px] w-5 shrink-0 rounded-[2px] shadow-sm"}
      aria-hidden="true"
    />
  ) : (
    <span className={`inline-block shrink-0 rounded-[2px] bg-slate-200 ${className || "h-[14px] w-5"}`} />
  );
};

/** Nombre de chiffres attendu (numéro national) : exemple de numéro mobile du pays. */
export const longueurAttendue = (pays: CountryCode): number | undefined =>
  getExampleNumber(pays, exemples)?.nationalNumber.length;

/** Numéro national valide pour le pays (le Cameroun exige exactement 9 chiffres). */
export const numeroValide = (pays: CountryCode, chiffres: string): boolean => {
  if (!chiffres) return false;
  if (pays === "CM") return /^\d{9}$/.test(chiffres);
  return isValidPhoneNumber(chiffres, pays);
};

/** Format international E.164 envoyé au serveur, ex. +237690123456. */
export const numeroInternational = (pays: CountryCode, chiffres: string) =>
  `+${getCountryCallingCode(pays)}${chiffres}`;

/** Découpe un numéro enregistré (« +237 690… », « 690… ») en pays + chiffres nationaux. */
export const decouperNumero = (
  valeur: string,
  paysParDefaut: CountryCode = PAYS_PAR_DEFAUT,
) => {
  const brut = (valeur || "").trim();
  let chiffres = brut.replace(/\D/g, "");
  let pays = paysParDefaut;
  if (
    brut.startsWith("+") ||
    chiffres.length > (longueurAttendue(paysParDefaut) ?? 9)
  ) {
    // Indicatif le plus long d'abord (ex. +1 vs +1268).
    const trouve = [...LISTE_PAYS]
      .sort((a, b) => b.indicatif.length - a.indicatif.length)
      .find((p) => chiffres.startsWith(p.indicatif));
    if (trouve) {
      pays =
        trouve.indicatif === getCountryCallingCode(paysParDefaut)
          ? paysParDefaut
          : trouve.code;
      chiffres = chiffres.slice(trouve.indicatif.length);
    }
  }
  return { pays, chiffres };
};

interface TelephoneInternationalProps {
  pays: CountryCode;
  chiffres: string;
  onChange: (pays: CountryCode, chiffres: string) => void;
  disabled?: boolean;
}

// Saisie d'un numéro : drapeau + initiales + indicatif, puis le numéro national.
const TelephoneInternational: React.FC<TelephoneInternationalProps> = ({
  pays,
  chiffres,
  onChange,
  disabled,
}) => {
  const longueur = longueurAttendue(pays);
  const valide = numeroValide(pays, chiffres);

  const options = useMemo(
    () =>
      LISTE_PAYS.map((p) => ({
        value: p.code,
        recherche: `${p.nom} ${p.code} +${p.indicatif}`.toLowerCase(),
        label: (
          <span className="flex items-center gap-2">
            <Drapeau code={p.code} />
            <span className="font-semibold">{p.code}</span>
            <span className="text-slate-500">+{p.indicatif}</span>
            <span className="truncate text-xs text-slate-400">{p.nom}</span>
          </span>
        ),
        affichage: (
          <span className="flex items-center gap-1.5 font-semibold text-slate-700">
            <Drapeau code={p.code} />
            {p.code} +{p.indicatif}
          </span>
        ),
      })),
    [],
  );

  const saisir = (texte: string) => {
    const nouveaux = texte.replace(/\D/g, "");
    if (
      pays === "CM"
        ? nouveaux.length > 9
        : nouveaux && validatePhoneNumberLength(nouveaux, pays) === "TOO_LONG"
    )
      return;
    onChange(pays, nouveaux);
  };

  return (
    <ConfigProvider
      theme={{
        components: {
          Select: { optionSelectedBg: "#f3e8ff", optionActiveBg: "#faf5ff" },
        },
      }}
    >
      <div>
        <div className="flex">
          <Select
            value={pays}
            onChange={(code: CountryCode) => onChange(code, chiffres)}
            options={options}
            optionLabelProp="affichage"
            showSearch
            filterOption={(saisie, option) =>
              !!option?.recherche.includes(
                saisie.toLowerCase().replace(/^\+/, ""),
              )
            }
            popupMatchSelectWidth={300}
            disabled={disabled}
            className="shrink-0 [&_.ant-select-selector]:!rounded-r-none"
            style={{ width: 140 }}
            size="large"
            aria-label="Pays"
          />
          <Input
            value={chiffres}
            onChange={(e) => saisir(e.target.value)}
            inputMode="numeric"
            placeholder={
              getExampleNumber(pays, exemples)?.nationalNumber || "Numéro"
            }
            disabled={disabled}
            className="!-ml-px !rounded-l-none"
            size="large"
            status={chiffres.length > 0 && !valide ? "error" : undefined}
            suffix={
              longueur ? (
                <span
                  className={`text-[11px] ${valide ? "text-emerald-600" : "text-slate-400"}`}
                >
                  {chiffres.length}/{longueur}
                </span>
              ) : undefined
            }
          />
        </div>
        {chiffres.length > 0 && !valide && (
          <span className="mt-1 block text-xs text-red-600">
            {pays === "CM"
              ? "Le numéro doit avoir exactement 9 chiffres."
              : `Numéro invalide pour ${nomsPays?.of(pays) || pays}${longueur ? ` (${longueur} chiffres attendus)` : ""}.`}
          </span>
        )}
      </div>
    </ConfigProvider>
  );
};

export default TelephoneInternational;

/** Numéro enregistré → forme internationale (les anciens numéros à 9 chiffres sont camerounais). */
export const versInternational = (numero?: string | null): string | null => {
  const brut = (numero || "").trim();
  const chiffres = brut.replace(/\D/g, "");
  if (!chiffres || /^0+$/.test(chiffres)) return null;
  if (brut.startsWith("+")) return `+${chiffres}`;
  if (chiffres.length === 9) return `+237${chiffres}`;
  if (chiffres.length === 12 && chiffres.startsWith("237")) return `+${chiffres}`;
  return null;
};

/** Affichage d'un numéro : drapeau du pays + « +237 6 90 12 34 56 ». */
export const NumeroAvecDrapeau: React.FC<{ numero?: string | null; className?: string }> = ({ numero, className }) => {
  const international = versInternational(numero);
  const analyse = international ? parsePhoneNumberFromString(international) : undefined;
  if (!analyse) {
    return <span className={className}>{numero && !/^0+$/.test(numero) ? numero : "—"}</span>;
  }
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap ${className || ""}`}>
      {analyse.country && <Drapeau code={analyse.country} />}
      {analyse.formatInternational()}
    </span>
  );
};
