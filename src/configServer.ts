export const getUrlServer = () => {
    // Vite injecte les variables au démarrage. Le repli permet de lancer
    // l'application localement même si frontend/.env n'a pas encore été créé.
    return import.meta.env.VITE_BACKEND_URL?.replace(/\/$/, '') || 'http://localhost:3006';
};
