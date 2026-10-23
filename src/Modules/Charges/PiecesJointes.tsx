// Pièces justificatives (facture, reçu) d'une charge ou d'une facture
// fournisseur : envoi d'un PDF ou d'une photo, ouverture, suppression.
import React, { useRef, useState } from "react";
import { App, Button, Empty, Popconfirm, Tooltip } from "antd";
import { Download, Eye, FileText, Image as ImageIcon, Paperclip, Trash2, Upload } from "lucide-react";
import { dateCourte } from "../Reports/ReportUi";
import { ajouterPiece, messageErreur, ouvrirPiece, supprimerPiece } from "./chargeService";
import type { Justifiable } from "./chargeService";
import type { PieceJointe } from "./types";

const taille = (octets: number) => (octets > 1024 * 1024 ? `${(octets / 1024 / 1024).toFixed(1)} Mo` : `${Math.ceil(octets / 1024)} Ko`);

const PiecesJointes: React.FC<{
  type: Justifiable;
  id: string;
  pieces: PieceJointe[];
  onChange: () => void;
}> = ({ type, id, pieces, onChange }) => {
  const { message } = App.useApp();
  const entree = useRef<HTMLInputElement>(null);
  const [envoi, setEnvoi] = useState(false);

  const envoyer = async (fichiers: FileList | null) => {
    if (!fichiers?.length) return;
    setEnvoi(true);
    try {
      for (const fichier of Array.from(fichiers)) await ajouterPiece(type, id, fichier);
      message.success(fichiers.length > 1 ? "Pièces jointes ajoutées." : "Pièce jointe ajoutée.");
      onChange();
    } catch (err) {
      message.error(messageErreur(err, "Le fichier n'a pas pu être envoyé."));
    } finally {
      setEnvoi(false);
      if (entree.current) entree.current.value = "";
    }
  };

  const action = (fn: () => Promise<unknown>) => () => fn().catch((err) => message.error(messageErreur(err, "Fichier indisponible.")));

  return (
    <div>
      <input
        ref={entree}
        type="file"
        multiple
        accept="application/pdf,image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => envoyer(e.target.files)}
      />
      <Button block icon={<Upload size={15} />} loading={envoi} onClick={() => entree.current?.click()} className="!mb-3 !border-dashed">
        Joindre la facture ou le reçu (PDF, photo — 10 Mo max.)
      </Button>
      {pieces.length ? (
        <ul className="m-0 list-none space-y-2 p-0">
          {pieces.map((p) => (
            <li key={p.id} className="flex items-center gap-3 rounded-xl border border-purple-100 px-3 py-2">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-100 text-purple-900">
                {p.type === "application/pdf" ? <FileText size={15} /> : <ImageIcon size={15} />}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-slate-800">{p.nom}</div>
                <div className="text-[11px] text-slate-400">
                  {taille(p.taille)} · ajoutée le {dateCourte(p.date)}
                </div>
              </div>
              <Tooltip title="Ouvrir">
                <Button size="small" type="text" icon={<Eye size={14} />} onClick={action(() => ouvrirPiece(type, id, p.id))} />
              </Tooltip>
              <Tooltip title="Télécharger">
                <Button size="small" type="text" icon={<Download size={14} />} onClick={action(() => ouvrirPiece(type, id, p.id, true, p.nom))} />
              </Tooltip>
              <Popconfirm
                title="Retirer cette pièce jointe ?"
                okText="Retirer"
                cancelText="Annuler"
                okButtonProps={{ danger: true }}
                onConfirm={action(async () => {
                  await supprimerPiece(type, id, p.id);
                  onChange();
                })}
              >
                <Button size="small" type="text" danger icon={<Trash2 size={14} />} />
              </Popconfirm>
            </li>
          ))}
        </ul>
      ) : (
        <Empty image={<Paperclip size={28} className="mx-auto text-slate-300" />} description="Aucune pièce jointe" />
      )}
    </div>
  );
};

export default PiecesJointes;
