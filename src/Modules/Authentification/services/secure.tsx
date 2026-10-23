// src/Secure.tsx
import { ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { effacerSession, garderSessionActive } from "./session";

interface SecureProps {
  children: ReactNode;
}

// Vérification de la session toutes les 30 secondes.
const INTERVALLE_VERIFICATION = 30_000;

/**
 * Garde la session ouverte : l'access token est renouvelé AVANT son
 * expiration (pas après), pour qu'aucune requête ne parte avec un token
 * expiré — y compris les appels `fetch`, que l'intercepteur axios ne voit pas.
 */
export default function Secure({ children }: SecureProps) {
  const navigate = useNavigate();

  useEffect(() => {
    let actif = true;

    const verifier = async () => {
      const ok = await garderSessionActive();
      if (!ok && actif) {
        effacerSession();
        navigate("/login");
      }
    };

    verifier();
    const intervalId = setInterval(verifier, INTERVALLE_VERIFICATION);
    // Au retour sur l'onglet (ordinateur en veille, onglet en arrière-plan).
    const auRetour = () => {
      if (document.visibilityState === "visible") verifier();
    };
    document.addEventListener("visibilitychange", auRetour);

    return () => {
      actif = false;
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", auRetour);
    };
  }, [navigate]);

  return <>{children}</>;
}
