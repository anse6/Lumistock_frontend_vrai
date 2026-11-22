export const getUrlServer = () => {
    // Vite injecte les variables au démarrage. Le repli permet de lancer
    // l'application localement même si frontend/.env n'a pas encore été créé.
    return import.meta.env.VITE_BACKEND_URL?.replace(/\/$/, '') || 'http://localhost:3006';
};

/** Adresse du site grand public de Lumistock (projet séparé ../site). */
export const URL_SITE = (import.meta.env.VITE_SITE_URL || 'http://localhost:5180').replace(/\/$/, '');

/** Pages qui appartiennent au site public (anciens liens, favoris). */
export const CHEMINS_SITE = [
    '/register-store', '/contact', '/modules', '/fonctionnalites', '/tarifs', '/securite', '/telecharger',
];

/** Adresse complète d'une page du site public, dans la langue de l'application. */
export const versSite = (chemin = '/') => {
    const url = new URL(URL_SITE + chemin);
    let langue: string | null = null;
    try {
        langue = localStorage.getItem('app-language');
    } catch {
        /* navigation privée */
    }
    if (langue) url.searchParams.set('lang', langue);
    return url.toString();
};
