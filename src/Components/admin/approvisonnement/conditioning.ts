// Identifiant d'un conditionnement : l'API actuelle (MySQL) l'envoie en texte,
// l'ancienne API Mongo l'envoyait sous la forme { $oid: "..." }.
export type ConditioningId = string | { $oid: string };

export const getConditioningId = (id: ConditioningId | undefined | null): string =>
  typeof id === "string" ? id : id?.$oid ?? "";
