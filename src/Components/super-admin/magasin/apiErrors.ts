// Transforme une réponse d'erreur du backend en message lisible.
// Le backend renvoie soit { message }, soit { errors: { champ: [messages] } }
// (validation Marshmallow), éventuellement imbriqué (licence, admin).

const FIELD_LABELS: Record<string, string> = {
  denomination: 'Dénomination',
  raison_sociale: 'Raison sociale',
  forme_juridique: 'Forme juridique',
  pays: 'Pays',
  country_code: 'Code pays',
  region: 'Région',
  ville: 'Ville',
  quartier: 'Quartier',
  adresse_ligne_1: 'Adresse',
  adresse_ligne_2: "Complément d'adresse",
  code_postal: 'Code postal',
  email: 'Email',
  telephone: 'Téléphone',
  site_web: 'Site web',
  numero_immatriculation: "Numéro d'immatriculation",
  numero_fiscal: 'Numéro fiscal',
  devise: 'Devise',
  fuseau_horaire: 'Fuseau horaire',
  'activité': 'Activité',
  nombre_manager: 'Nombre de managers',
  nombre_livreur: 'Nombre de gérants',
  licence: 'Licence',
  max_managers: 'Managers maximum',
  max_livreurs: 'Gérants maximum',
  nombre_caissier: 'Nombre de caissiers',
  max_caissiers: 'Caissiers maximum',
  admin: 'Administrateur',
  admin_name: "Nom de l'administrateur",
  admin_first_name: "Prénom de l'administrateur",
  admin_email: "Email de l'administrateur",
  image: 'Logo',
  body: 'Formulaire',
};

// Messages Marshmallow les plus courants, traduits pour l'utilisateur.
const MESSAGE_TRANSLATIONS: Record<string, string> = {
  'Missing data for required field.': 'champ obligatoire',
  'Not a valid email address.': 'adresse email invalide',
  'Not a valid URL.': 'URL invalide (ex. https://exemple.com)',
  'Not a valid integer.': 'nombre entier attendu',
  'String does not match expected pattern.': 'format invalide',
  'Unknown field.': 'champ non autorisé',
  'Field may not be null.': 'ne peut pas être vide',
};

const translate = (text: string) => {
  if (MESSAGE_TRANSLATIONS[text]) return MESSAGE_TRANSLATIONS[text];
  const shorter = text.match(/^Shorter than minimum length (\d+)\.$/);
  if (shorter) return `${shorter[1]} caractères minimum`;
  const longer = text.match(/^Longer than maximum length (\d+)\.$/);
  if (longer) return `${longer[1]} caractères maximum`;
  const range = text.match(/^Must be greater than or equal to (\d+)\.$/);
  if (range) return `doit être au moins ${range[1]}`;
  return text;
};

const flattenErrors = (errors: unknown, prefix?: string): string[] => {
  if (typeof errors === 'string') {
    return [prefix ? `${prefix} : ${translate(errors)}` : translate(errors)];
  }
  if (Array.isArray(errors)) {
    return errors.flatMap((item) => flattenErrors(item, prefix));
  }
  if (errors && typeof errors === 'object') {
    return Object.entries(errors as Record<string, unknown>).flatMap(([field, value]) =>
      flattenErrors(value, FIELD_LABELS[field] || field),
    );
  }
  return [];
};

export const getApiErrorMessage = (data: unknown, fallback: string): string => {
  if (!data || typeof data !== 'object') return fallback;
  const payload = data as { message?: unknown; error?: unknown; errors?: unknown };
  const details = flattenErrors(payload.errors ?? (typeof payload.error === 'object' ? payload.error : undefined));
  if (details.length > 0) return details.join(' · ');
  if (typeof payload.message === 'string' && payload.message) return payload.message;
  if (typeof payload.error === 'string' && payload.error) return payload.error;
  return fallback;
};
