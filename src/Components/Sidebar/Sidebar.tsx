// src/Components/Sidebar/Sidebar.tsx
import { useEffect } from 'react';
import { Popover } from 'antd';
import { LayoutGrid, PackageCheck, Boxes, Users, Sliders, BarChart3, Sparkles, LogOut } from 'lucide-react';
import logo1 from "@/assets/logo1.svg";
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { demanderDeconnexion } from '../../Modules/Authentification/ConfirmationDeconnexion';

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  path: string;
  onClick?: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon, label, path, onClick }) => {
  return (
    <NavLink to={path}>
      {({ isActive }) => (
        <button
          className={`flex items-center cursor-pointer gap-3 px-4 py-2.5 w-full rounded-lg transition-all duration-200 border-l-4 ${isActive
            ? 'bg-white/10 text-white border-white shadow-md'
            : 'text-slate-400 border-transparent hover:bg-white/5 hover:text-white'
            }`}
          onClick={onClick}
        >
          <div className={`${isActive ? 'text-white' : ''}`}>{icon}</div>
          <span className={`${isActive ? 'font-bold' : 'font-medium'}`}>{label}</span>
        </button>
      )}
    </NavLink>
  );
};

const Sidebar: React.FC<{ isOpen: boolean; setIsOpen: (isOpen: boolean) => void }> = ({
  isOpen,
  setIsOpen,
}) => {
  const location = useLocation();
  const { t } = useTranslation();
  //const companyName = localStorage.getItem('denomination_magasin')

  // Ferme le menu quand l'URL change
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname, setIsOpen]);

  // Fonction de déconnexion
  // Demande confirmation, puis révoque la session côté serveur (voir ConfirmationDeconnexion).
  const handleLogout = () => {
    demanderDeconnexion('/login');
  };


  const companyName = localStorage.getItem('denomination_magasin') || '';

  const allMenuItems = [
    { id: 'accueil', label: t('sidebar.accueil'), icon: <LayoutGrid size={20} /> },
    { id: 'home', label: t('sidebar.dashboard'), icon: <BarChart3 size={20} /> },
    { id: 'delivery', label: t('sidebar.delivery'), icon: <PackageCheck size={20} /> },
    { id: 'products', label: t('sidebar.products'), icon: <Boxes size={20} /> },
    { id: 'clients', label: t('sidebar.customers'), icon: <Users size={20} /> },
    { id: 'reports', label: t('sidebar.reports'), icon: <BarChart3 size={20} /> },
    { id: 'ia', label: t('sidebar.ai_assistant'), icon: <Sparkles size={20} /> },
    { id: 'settings', label: t('sidebar.settings'), icon: <Sliders size={20} /> },
  ];



  // Ferme le menu en cliquant sur l'overlay
  const handleOverlayClick = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* Overlay pour mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-transparent bg-opacity-30 z-40"
          onClick={handleOverlayClick}
        />
      )}

      {/* Sidebar */}
      <div
        className={`${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          } fixed lg:sticky top-0 left-0 h-screen w-64 bg-[#3b1558] border-r border-[#2d1045] z-40 transition-transform duration-300 flex flex-col`}
      >
        {/* Logo et titre */}
        <div className="flex flex-col gap-1 p-4 border-b border-[#2d1045]">
          <div className="flex items-center gap-3">
            <img src={logo1} alt="Logo" className="w-10 h-10" />
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">LUMISTOCK</h1>
              {companyName && (
                <Popover
                  content={
                    <div className="pt-2 min-w-[200px]">
                      <p className="text-slate-800 font-bold text-base leading-snug uppercase tracking-tight">
                        {companyName}
                      </p>
                    </div>
                  }
                  placement="right"
                  trigger="hover"
                >
                  <p className="text-lg font-bold text-teal-400 mt-0 uppercase tracking-wide block truncate max-w-[150px] cursor-pointer hover:text-teal-300 transition-colors">
                    {companyName}
                  </p>
                </Popover>
              )}
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="flex flex-col gap-1 p-4 flex-1 overflow-y-auto scrollbar-hide">
          {allMenuItems.map((item) => (
            <SidebarItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              path={`/dashboard/${item.id}`} // ✅ correction ici
              onClick={() => setIsOpen(false)} // Fermer au clic
            />
          ))}
        </div>

        {/* Bouton de déconnexion */}
        <div className="p-4 border-t border-[#2d1045]">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2.5 w-full rounded-lg transition-all duration-200 border border-white/10 bg-[#3b1558] text-white hover:bg-[#2d1045]"
          >
            <LogOut size={20} />
            <span className="font-medium">{t('sidebar.logout')}</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;



