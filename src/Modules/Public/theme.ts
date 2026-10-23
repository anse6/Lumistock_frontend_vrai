// Thème Ant Design des pages publiques (accueil, inscription, connexion) :
// remplace celui de l'application (boutons bleu nuit, champs de 40 px) par les
// jetons du système de design public (voir @theme dans src/index.css).
export const THEME_PUBLIC = {
  token: {
    colorPrimary: "#3b0764",
    colorText: "#0f172a",
    colorTextPlaceholder: "#94a3b8",
    colorBorder: "#cbd5e1",
    borderRadius: 8,
    controlHeight: 44,
    fontSize: 15,
    fontFamily: '"Nunito Sans", "Poppins", system-ui, sans-serif',
  },
  components: {
    // Flat Design : aucune ombre sous les boutons.
    Button: { colorPrimary: "#3b0764", colorPrimaryHover: "#2a0548", colorPrimaryActive: "#1f033a", controlHeight: 44, fontWeight: 600, primaryShadow: "none", defaultShadow: "none", dangerShadow: "none" },
    Input: { controlHeight: 44 },
    Select: { controlHeight: 44 },
    Form: { labelColor: "#0f172a", labelFontSize: 14, verticalLabelPadding: "0 0 6px" },
  },
};
