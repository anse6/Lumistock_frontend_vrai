// Saisie des numéros de série des unités qui ENTRENT en stock (création,
// approvisionnement, facture fournisseur) : au clavier, au lecteur (chaque
// scan ajoute un numéro), par collage d'une liste, ou générés par Lumistock.
import { useState } from "react";
import { Button, InputNumber, Select, Tooltip } from "antd";
import { Wand2 } from "lucide-react";
import { cle, decouper, genererNumeros } from "./api";

interface Props {
  value?: string[];
  onChange?: (numeros: string[]) => void;
  /** Nombre d'unités imposé (approvisionnement). Absent : la quantité suit les numéros saisis. */
  attendu?: number;
  disabled?: boolean;
}

const SaisieNumeros = ({ value = [], onChange, attendu, disabled }: Props) => {
  const [generation, setGeneration] = useState(false);
  const [aGenerer, setAGenerer] = useState(1);
  const libre = attendu === undefined;
  const manquants = libre ? aGenerer : Math.max(attendu - value.length, 0);
  const doublons = value.filter((n, i) => value.findIndex((m) => cle(m) === cle(n)) !== i);

  const changer = (liste: string[]) => {
    const vus = new Set<string>();
    onChange?.(liste.flatMap(decouper).filter((n) => !vus.has(cle(n)) && vus.add(cle(n))));
  };

  const generer = async () => {
    setGeneration(true);
    try {
      changer([...value, ...(await genererNumeros(manquants))]);
    } finally {
      setGeneration(false);
    }
  };

  const etat =
    libre
      ? "text-purple-900"
      : attendu <= 0
      ? "text-slate-400"
      : value.length === attendu
        ? "text-emerald-700"
        : value.length > attendu
          ? "text-red-600"
          : "text-amber-700";

  return (
    <div data-saisie-code-barre>
      <Select
        mode="tags"
        value={value}
        onChange={changer}
        tokenSeparators={[",", ";", "\n", "\t"]}
        open={false}
        suffixIcon={null}
        disabled={disabled}
        placeholder="Scannez ou tapez chaque numéro, puis Entrée (vous pouvez coller une liste)"
        style={{ width: "100%" }}
      />
      <div className="mt-1 flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className={`font-semibold ${etat}`}>
          {libre ? `${value.length} numéro(s) = ${value.length} unité(s)` : `${value.length} / ${attendu} numéro(s)`}
          {!libre && value.length > attendu && " — retirez les numéros en trop"}
        </span>
        {manquants > 0 && !disabled && (
          <Tooltip title="Pour des unités sans numéro du fabricant : Lumistock crée des numéros internes uniques (à imprimer sur une étiquette).">
            <span className="flex items-center gap-1">
              {libre && (
                <InputNumber size="small" min={1} max={5000} precision={0} value={aGenerer}
                  onChange={(v) => setAGenerer(Number(v) || 1)} style={{ width: 80 }} />
              )}
              <Button size="small" icon={<Wand2 size={12} />} loading={generation} onClick={generer}>
                {`Générer ${manquants} numéro(s)`}
              </Button>
            </span>
          </Tooltip>
        )}
      </div>
      {doublons.length > 0 && <p className="mt-1 text-xs text-red-600">{`En double : ${doublons.join(", ")}`}</p>}
    </div>
  );
};

export default SaisieNumeros;
