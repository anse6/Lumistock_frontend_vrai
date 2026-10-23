
import { Menu, MoreVertical, Settings, LogOut } from "lucide-react";
import { Dropdown } from "antd";
import type { MenuProps } from "antd";
import Profile from "./Profile";
import Notification from "./Notification";
import SearchComponent from "./Search";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { demanderDeconnexion } from '../../Modules/Authentification/ConfirmationDeconnexion';

// Page de paramètres de chaque espace.
const PAGE_PARAMETRES: Record<string, string> = {
  staff: '/superadmin/dashboard/settingstaff',
  admin: '/admin/dashboard/parameter',
  manager: '/admin/dashboard/parameter',
};

interface HeaderProps {
  toggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  const navigate = useNavigate();
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
      onClick: () => navigate(PAGE_PARAMETRES[localStorage.getItem('role') || ''] || '/dashboard/settings'),
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
    <div className="flex w-full min-w-0 items-center justify-between gap-2 border-b border-slate-100 bg-white px-3 py-3 shadow-sm sm:gap-4 sm:px-4">
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-4">
        <button
          className="shrink-0 rounded-xl p-2 text-slate-600 transition-colors hover:bg-slate-50 lg:hidden"
          onClick={toggleSidebar}
          aria-label="Ouvrir le menu"
        >
          <Menu size={24} />
        </button>
        <SearchComponent />
      </div>

      <div className="flex shrink-0 items-center gap-1 sm:gap-2 md:gap-3">
        <Notification />
        <Profile />

        <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block"></div>

        <Dropdown menu={{ items }} placement="bottomRight" arrow trigger={['click']}>
          <button className="p-2 hover:bg-slate-50 rounded-xl transition-all active:scale-95 text-slate-400 hover:text-slate-900 group">
            <MoreVertical size={20} className="group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </Dropdown>
      </div>
    </div>
  );
};

export default Header;


