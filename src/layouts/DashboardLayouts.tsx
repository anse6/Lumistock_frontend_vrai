// src/Layouts/DashboardLayout.tsx
import { useState } from "react";
import Side, { type ModeSidebar } from "../Components/admin/Side";

import { Outlet } from "react-router-dom";
//import { Header } from "../Components";
import Header from "../Components/admin/Header";
import { LecteurCodeBarreProvider } from "../Modules/CodeBarre/LecteurCodeBarre";

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Affichage du sidebar sur grand écran, mémorisé entre les visites
  const [modeSidebar, setModeSidebarState] = useState<ModeSidebar>(() => {
    try {
      const m = localStorage.getItem("sidebar_mode");
      return m === "icones" || m === "cache" ? m : "complet";
    } catch {
      return "complet";
    }
  });
  const setModeSidebar = (m: ModeSidebar) => {
    setModeSidebarState(m);
    try {
      localStorage.setItem("sidebar_mode", m);
    } catch {
      /* stockage indisponible */
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-gray-100">
      <Side
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        mode={modeSidebar}
        setMode={setModeSidebar}
      />

      {/* min-w-0 : un contenu large (tableau, barre défilante) défile dans son
          cadre au lieu d'élargir toute la page — comme DashboardLayoutes. */}
      <div className="flex flex-col flex-1 w-full min-w-0">
        <Header
          toggleSidebar={toggleSidebar}
          sidebarMasque={modeSidebar === "cache"}
          afficherSidebar={() => setModeSidebar("complet")}
        />

        <main className="flex-1 min-w-0 p-6 overflow-y-auto">
          {/* Lecteur de code-barres : actif sur tout l'espace magasin (vente, produits…). */}
          <LecteurCodeBarreProvider>
            <Outlet />
          </LecteurCodeBarreProvider>
        </main>
      </div>
    </div>
  );
}
