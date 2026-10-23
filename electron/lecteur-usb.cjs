// Application de bureau (Electron) : signaler le branchement / débranchement du
// lecteur de code-barres à l'interface, qui affiche alors
// « Lecteur de code-barre connecté avec succès » ou « Lecteur déconnecté ».
//
// Dans le navigateur, ce module n'existe pas : l'interface confirme le lecteur
// au premier scan (voir src/Modules/CodeBarre/LecteurCodeBarre.tsx).
//
// Installation dans le projet Electron :
//   npm install node-hid
//
// Processus principal (main.js) :
//   const { surveillerLecteurs } = require("./lecteur-usb.cjs");
//   const fenetre = new BrowserWindow({ webPreferences: { preload: path.join(__dirname, "preload.cjs") } });
//   surveillerLecteurs(fenetre);
//
// Preload (preload.cjs) : expose le pont « lumistockBureau » lu par la page.
//   const { contextBridge, ipcRenderer } = require("electron");
//   contextBridge.exposeInMainWorld("lumistockBureau", {
//     etatLecteur: () => ipcRenderer.invoke("lecteur-code-barre:etat"),
//     surLecteur: (rappel) => {
//       const ecoute = (_e, detail) => rappel(detail);
//       ipcRenderer.on("lecteur-code-barre", ecoute);
//       return () => ipcRenderer.removeListener("lecteur-code-barre", ecoute);
//     },
//   });
//
// Reconnaissance du lecteur : un lecteur USB se déclare comme un clavier (HID).
// On le reconnaît à son nom (« Scanner », « Barcode », « Imager »…) ou à son
// identifiant fabricant:produit, à ajouter dans LECTEURS_CONNUS si son nom est
// générique. Pour le trouver : node -e "console.log(require('node-hid').devices())"
// lecteur branché, puis relancez sans le lecteur et comparez.

const { ipcMain } = require("electron");
const HID = require("node-hid");

/** Identifiants « vendorId:productId » (hexadécimal) de lecteurs au nom générique. */
const LECTEURS_CONNUS = new Set([
  // "1eab:8003",
]);
const NOM_LECTEUR = /scan|barcode|bar code|imager|reader|lecteur|sumicor/i;
const INTERVALLE_MS = 2000;

const hex = (n) => Number(n || 0).toString(16).padStart(4, "0");
const cle = (d) => `${hex(d.vendorId)}:${hex(d.productId)}`;
const estLecteur = (d) =>
  LECTEURS_CONNUS.has(cle(d)) || NOM_LECTEUR.test(`${d.manufacturer || ""} ${d.product || ""}`);

/** Lecteurs branchés : clé -> nom affichable (un même lecteur expose plusieurs interfaces HID). */
const lecteursBranches = () => {
  const trouves = new Map();
  for (const d of HID.devices()) {
    if (estLecteur(d) && !trouves.has(cle(d))) {
      trouves.set(cle(d), [d.manufacturer, d.product].filter(Boolean).join(" ").trim() || "Lecteur de code-barres");
    }
  }
  return trouves;
};

/**
 * Surveille les lecteurs et prévient la fenêtre à chaque branchement / débranchement.
 * Renvoie une fonction qui arrête la surveillance.
 */
function surveillerLecteurs(fenetre) {
  let connus = new Map();
  try {
    connus = lecteursBranches();
  } catch {
    /* liste USB illisible au démarrage : vue au tour suivant */
  }
  const envoyer = (detail) => {
    if (!fenetre.isDestroyed()) fenetre.webContents.send("lecteur-code-barre", detail);
  };
  const verifier = () => {
    let actuels;
    try {
      actuels = lecteursBranches();
    } catch {
      return; // liste USB momentanément illisible : on réessaie au tour suivant
    }
    for (const [id, nom] of actuels) if (!connus.has(id)) envoyer({ connecte: true, nom });
    for (const [id, nom] of connus) if (!actuels.has(id)) envoyer({ connecte: false, nom });
    connus = actuels;
  };
  // La page demande l'état à son ouverture (lecteur déjà branché au démarrage).
  ipcMain.removeHandler("lecteur-code-barre:etat");
  ipcMain.handle("lecteur-code-barre:etat", () => {
    const [premier] = connus.values();
    return premier ? { connecte: true, nom: premier } : null;
  });
  const minuteur = setInterval(verifier, INTERVALLE_MS);
  return () => {
    clearInterval(minuteur);
    ipcMain.removeHandler("lecteur-code-barre:etat");
  };
}

module.exports = { surveillerLecteurs, lecteursBranches };
