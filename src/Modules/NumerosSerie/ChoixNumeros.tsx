// Choix des unités qui SORTENT (vente, avarie, retour) d'un article suivi par
// numéro de série : dans la liste des numéros disponibles, ou au lecteur.
import { Select, Spin } from "antd";
import { useNumerosDisponibles } from "./api";

interface Props {
  articleId: string;
  value?: string[];
  onChange?: (numeros: string[]) => void;
  /** Numéros proposés à la place des numéros en stock (ex. : unités d'une vente, pour un retour). */
  parmi?: string[];
  /** Nombre maximum d'unités à choisir. */
  maximum?: number;
  placeholder?: string;
  disabled?: boolean;
}

const ChoixNumeros = ({ articleId, value = [], onChange, parmi, maximum, placeholder, disabled }: Props) => {
  const { data, isLoading } = useNumerosDisponibles(parmi ? undefined : articleId);
  const proposes = parmi ?? data?.numeros ?? [];
  // Les numéros déjà choisis restent visibles (ex. : unités d'une vente modifiée).
  const options = [...new Set([...value, ...proposes])].map((n) => ({ value: n, label: n }));
  return (
    <div data-saisie-code-barre>
    <Select
      mode="multiple"
      value={value}
      onChange={(liste: string[]) => onChange?.(maximum ? liste.slice(0, maximum) : liste)}
      options={options}
      disabled={disabled}
      loading={isLoading}
      notFoundContent={isLoading ? <Spin size="small" /> : "Aucune unité disponible"}
      placeholder={placeholder ?? "Choisissez ou scannez les numéros de série"}
      style={{ width: "100%" }}
      maxCount={maximum}
      allowClear
      showSearch
    />
    </div>
  );
};

export default ChoixNumeros;
