// Libellés de dates des graphiques.

/** Libellé d'axe et titre d'infobulle pour un intervalle (jour, semaine ou mois). */
export const libellesIntervalle = (debut: string, granularite: "jour" | "semaine" | "mois", locale: string) => {
  const d = new Date(`${debut}T00:00:00`);
  if (granularite === "mois") {
    return { axe: d.toLocaleDateString(locale, { month: "short" }), titre: d.toLocaleDateString(locale, { month: "long", year: "numeric" }) };
  }
  const court = d.toLocaleDateString(locale, { day: "numeric", month: "short" });
  if (granularite === "semaine") return { axe: court, titre: `${locale.startsWith("en") ? "Week of" : "Semaine du"} ${d.toLocaleDateString(locale, { day: "numeric", month: "long" })}` };
  return { axe: court, titre: d.toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" }) };
};
