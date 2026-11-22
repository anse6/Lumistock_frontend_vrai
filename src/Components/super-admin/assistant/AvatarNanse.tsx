// Avatar de Nansé, l'assistante Lumistock : un « N » sur un disque purple-950,
// avec une petite étincelle (l'IA). Utilisé dans le chat public et chez le staff.
import React from "react";

const AvatarNanse: React.FC<{ taille?: number; className?: string }> = ({ taille = 36, className = "" }) => (
  <svg width={taille} height={taille} viewBox="0 0 40 40" aria-hidden="true" className={`shrink-0 ${className}`}>
    <defs>
      <linearGradient id="nanse-fond" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#6b21a8" />
        <stop offset="1" stopColor="#3b0764" />
      </linearGradient>
    </defs>
    <circle cx="20" cy="20" r="20" fill="url(#nanse-fond)" />
    <path d="M13 28V12.5h1.6L25 25.2V12h2v16h-1.6L15 15.3V28z" fill="#ffffff" />
    <path d="M30.5 6.5l1 2.6 2.6 1-2.6 1-1 2.6-1-2.6-2.6-1 2.6-1z" fill="#fcd34d" />
  </svg>
);

export default AvatarNanse;
