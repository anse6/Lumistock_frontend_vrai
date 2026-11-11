// Couleurs des pages Fournisseurs et Catégories.
export const PURPLE_950 = "#3b0764";

/**
 * Thème des pages Fournisseurs et Catégories : la couleur de l'application
 * (purple-950). Le réglage du composant Button est repris ici, sinon celui de
 * App.tsx (couleur de thème du magasin, bleu nuit par défaut) l'emporte.
 */
export const THEME_PAGE = {
  token: { colorPrimary: PURPLE_950, colorLink: PURPLE_950, borderRadius: 10 },
  components: {
    Button: { colorPrimary: PURPLE_950, colorPrimaryHover: "#581c87", colorPrimaryActive: "#2e0550" },
    Pagination: { itemActiveBg: "#faf5ff" },
  },
};
