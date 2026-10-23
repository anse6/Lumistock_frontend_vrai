// Bips de la caisse : court et aigu quand l'article est ajouté, grave et double en cas de problème.
let contexte: AudioContext | null = null;

const jouer = (frequence: number, duree: number, debut = 0) => {
  try {
    contexte ??= new AudioContext();
    const osc = contexte.createOscillator();
    const volume = contexte.createGain();
    const t0 = contexte.currentTime + debut;
    osc.type = "square";
    osc.frequency.value = frequence;
    volume.gain.setValueAtTime(0.06, t0);
    volume.gain.exponentialRampToValueAtTime(0.0001, t0 + duree);
    osc.connect(volume).connect(contexte.destination);
    osc.start(t0);
    osc.stop(t0 + duree);
  } catch {
    /* pas de son disponible : on continue sans */
  }
};

export const bipOk = () => jouer(1400, 0.09);
export const bipErreur = () => {
  jouer(320, 0.14);
  jouer(260, 0.18, 0.18);
};
