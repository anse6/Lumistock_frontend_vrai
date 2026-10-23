import { useEffect, useState } from 'react';
import { Images, Inbox, LayoutGrid, LifeBuoy, LogOut, MessagesSquare, Settings, Store, UsersRound } from 'lucide-react';
import logo1 from '@/assets/logo1.svg';
import { NavLink, useLocation } from 'react-router-dom';
import { demanderDeconnexion } from '../../Modules/Authentification/ConfirmationDeconnexion';
import { compterNonLus, EVENEMENT_CONTACT } from '../../services/contact';
import { compterConversations, EVENEMENT_ASSISTANT, NOM_ASSISTANT } from '../../services/assistant';
import { compterSupport, EVENEMENT_SUPPORT } from '../../services/support';

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  path: string;
  onClick?: () => void;
  /** Nombre affiché en pastille (ex. messages non lus). */
  badge?: number;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon, label, path, onClick, badge }) => (
  <NavLink to={path} className="block w-full">
    {({ isActive }) => (
      <button
        type="button"
        onClick={onClick}
        className={`group flex min-h-11 w-full items-center gap-3 rounded-xl border-l-4 px-3 py-2.5 text-left transition-all duration-200 md:px-4 ${isActive
          ? 'border-purple-200 bg-white/15 text-white shadow-sm'
          : 'border-transparent text-purple-100/70 hover:bg-purple-800/70 hover:text-white'
          }`}
      >
        <span className={`flex h-6 w-6 shrink-0 items-center justify-center transition-colors ${isActive ? 'text-white' : 'text-purple-200 group-hover:text-white'}`}>
          {icon}
        </span>
        <span className={`truncate text-sm ${isActive ? 'font-bold' : 'font-medium'}`}>{label}</span>
        {!!badge && (
          <span className="ml-auto rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-[#3b1558]" aria-label={`${badge} non lu${badge > 1 ? 's' : ''}`}>
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </button>
    )}
  </NavLink>
);

const Sidesuperadmin: React.FC<{ isOpen: boolean; setIsOpen: (isOpen: boolean) => void }> = ({ isOpen, setIsOpen }) => {
  const location = useLocation();

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname, setIsOpen]);

  // Demande confirmation, puis révoque la session côté serveur (voir ConfirmationDeconnexion).
  const handleLogout = () => {
    demanderDeconnexion('/login');
  };

  // Messages de contact non lus : pastille dans le menu, actualisée chaque minute.
  const [nonLus, setNonLus] = useState(0);
  useEffect(() => {
    const actualiser = () => compterNonLus().then(setNonLus).catch(() => undefined);
    actualiser();
    const minuteur = setInterval(actualiser, 60_000);
    window.addEventListener(EVENEMENT_CONTACT, actualiser);
    return () => {
      clearInterval(minuteur);
      window.removeEventListener(EVENEMENT_CONTACT, actualiser);
    };
  }, []);

  // Chat Nansé : conversations qui attendent un conseiller ou ont des messages non lus (toutes les 15 s).
  const [chatsATraiter, setChatsATraiter] = useState(0);
  useEffect(() => {
    const actualiser = () => compterConversations().then(setChatsATraiter).catch(() => undefined);
    actualiser();
    const minuteur = setInterval(actualiser, 15_000);
    window.addEventListener(EVENEMENT_ASSISTANT, actualiser);
    return () => {
      clearInterval(minuteur);
      window.removeEventListener(EVENEMENT_ASSISTANT, actualiser);
    };
  }, []);

  // Support magasins : conversations avec des messages non lus d'administrateurs.
  const [supportNonLus, setSupportNonLus] = useState(0);
  useEffect(() => {
    const actualiser = () => compterSupport().then(setSupportNonLus).catch(() => undefined);
    actualiser();
    const minuteur = setInterval(actualiser, 20_000);
    window.addEventListener(EVENEMENT_SUPPORT, actualiser);
    return () => {
      clearInterval(minuteur);
      window.removeEventListener(EVENEMENT_SUPPORT, actualiser);
    };
  }, []);

  const menuItems = [
    { id: 'home', label: 'Tableau de bord', icon: <LayoutGrid size={19} strokeWidth={2} /> },
    { id: 'magasin', label: 'Magasins', icon: <Store size={19} strokeWidth={2} /> },
    { id: 'recentansevernel', label: 'Utilisateurs', icon: <UsersRound size={19} strokeWidth={2} /> },
    { id: 'messages', label: 'Messages', icon: <Inbox size={19} strokeWidth={2} />, badge: nonLus },
    { id: 'assistant', label: `Chat ${NOM_ASSISTANT}`, icon: <MessagesSquare size={19} strokeWidth={2} />, badge: chatsATraiter },
    { id: 'support', label: 'Support magasins', icon: <LifeBuoy size={19} strokeWidth={2} />, badge: supportNonLus },
    { id: 'image-management', label: 'Gestion d’images', icon: <Images size={19} strokeWidth={2} /> },
    { id: 'settingstaff', label: 'Paramètres', icon: <Settings size={19} strokeWidth={2} /> },
  ];

  return (
    <>
      {isOpen && (
        <button
          type="button"
          aria-label="Fermer le menu"
          className="fixed inset-0 z-40 cursor-default bg-slate-950/45 backdrop-blur-[1px] lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} fixed left-0 top-0 z-50 flex h-dvh w-[min(84vw,18rem)] flex-col border-r border-[#2d1045] bg-[#3b1558] text-white shadow-2xl transition-transform duration-300 ease-out md:w-72 lg:sticky lg:z-30 lg:h-screen lg:w-64 lg:shadow-none`}
      >
        <div className="flex min-h-[76px] items-center border-b border-[#2d1045] px-4 py-4 md:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
              <img src={logo1} alt="Logo Lumistock" className="h-8 w-8" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-extrabold tracking-tight text-white">LUMISTOCK</h1>
              <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-purple-200/80">Administration</p>
            </div>
          </div>
        </div>

        <nav aria-label="Navigation superadmin" className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-5 md:px-4">
          <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-white">Menu principal</p>
          {menuItems.map((item) => (
            <SidebarItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              path={`/superadmin/dashboard/${item.id}`}
              badge={'badge' in item ? item.badge : undefined}
              onClick={() => setIsOpen(false)}
            />
          ))}
        </nav>

        <div className="border-t border-[#2d1045] px-3 py-4 md:px-4">
          <button
            type="button"
            onClick={handleLogout}
            className="flex min-h-11 w-full items-center gap-3 rounded-xl border border-white/10 bg-[#3b1558] px-3 py-2.5 text-left text-sm font-semibold text-white transition-colors hover:bg-[#2d1045] md:px-4"
          >
            <LogOut size={19} />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidesuperadmin;
