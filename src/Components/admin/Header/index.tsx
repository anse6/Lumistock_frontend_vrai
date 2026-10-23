// src/Components/Header/Header.tsx
import { Menu, MoreVertical, Settings, LogOut } from "lucide-react";
import { Dropdown } from "antd";
import type { MenuProps } from "antd";
import SearchComponent from "./Search";
import Profile from "./Profile";
import Notification from "./Notification";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { demanderDeconnexion } from '../../../Modules/Authentification/ConfirmationDeconnexion';
import EtatCaisse from '../../../Modules/Caisse/EtatCaisse';

interface HeaderProps {
  toggleSidebar: () => void;
  /** Sidebar masqué sur grand écran : on affiche ☰ pour le faire revenir */
  sidebarMasque?: boolean;
  afficherSidebar?: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar, sidebarMasque, afficherSidebar }) => {
  const navigate = useNavigate();
  const caissier = localStorage.getItem('role') === 'caissier';
  const { t } = useTranslation();

  // Demande confirmation, puis révoque la session côté serveur (voir ConfirmationDeconnexion).
  const handleLogout = () => {
    demanderDeconnexion('/login');
  };

  const items: MenuProps['items'] = [
    {
      key: 'settings',
      label: (
        <div className="flex items-center gap-2 py-1 px-1">
          <Settings size={16} className="text-slate-500" />
          <span className="font-medium text-slate-700">{t('sidebar.settings', { defaultValue: 'Paramètres' })}</span>
        </div>
      ),
      onClick: () => navigate('/admin/dashboard/parameter'),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      label: (
        <div className="flex items-center gap-2 py-1 px-1 text-red-600">
          <LogOut size={16} />
          <span className="font-medium">{t('sidebar.logout', { defaultValue: 'Déconnexion' })}</span>
        </div>
      ),
      onClick: handleLogout,
    },
  ];

  return (
    <div className="w-full flex items-center justify-between bg-white px-4 py-3 border-b border-slate-100 shadow-sm">
      <div className="flex flex-1 min-w-0 items-center gap-4 mr-3">
        <button
          className="text-slate-600 lg:hidden hover:bg-slate-50 p-2 rounded-xl transition-colors"
          onClick={toggleSidebar}
        >
          <Menu size={24} />
        </button>
        {sidebarMasque && (
          <button
            className="hidden lg:block text-slate-600 hover:bg-slate-50 p-2 rounded-xl transition-colors"
            onClick={afficherSidebar}
            title={t('sidebar.show', { defaultValue: 'Afficher le menu' })}
          >
            <Menu size={24} />
          </button>
        )}
        {/* Caissier : état de sa caisse à la place de la recherche du magasin. */}
        {caissier ? <EtatCaisse /> : <SearchComponent />}
      </div>

      <div className="flex shrink-0 items-center space-x-2 md:space-x-4">
        {!caissier && <Notification />}
        <Profile />

        <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block"></div>

        <Dropdown menu={{ items: caissier ? items.filter((i) => i?.key === 'logout') : items }} placement="bottomRight" arrow trigger={['click']}>
          <button className="p-2 hover:bg-slate-50 rounded-xl transition-all active:scale-95 text-slate-400 hover:text-slate-900 group">
            <MoreVertical size={20} className="group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </Dropdown>
      </div>
    </div>
  );
};

export default Header;


