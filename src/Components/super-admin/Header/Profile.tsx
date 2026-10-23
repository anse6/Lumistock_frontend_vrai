import { useState } from 'react';
import { LogOut } from 'lucide-react';
import { demanderDeconnexion } from '../../../Modules/Authentification/ConfirmationDeconnexion';

const Profile = () => {
  const [showMenu, setShowMenu] = useState(false);
  const userEmail = localStorage.getItem('email') || '';
  const userRole = localStorage.getItem('role') || '';
  const companyName = localStorage.getItem('denomination_magasin') || '';

  const formatRole = (role: string) => {
    const roles: Record<string, string> = {
      admin: 'Administrateur',
      deliverer: 'Livreur',
      client: 'Client',
      manager: 'Manager'
    };
    return roles[role.toLowerCase()] || role;
  };

  // Demande confirmation, puis révoque la session côté serveur (voir ConfirmationDeconnexion).
  const handleLogout = () => {
    demanderDeconnexion('/login');
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center space-x-2 focus:outline-none"
      >
        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[#0F172A]">
          {userEmail.charAt(0).toUpperCase()}
        </div>
        <span className="hidden md:inline text-sm font-medium">{userEmail}</span>
      </button>

      {showMenu && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 z-50">
          <div className="px-4 py-2 border-b">
            <p className="text-sm font-medium">{userEmail}</p>
            {userRole && (
              <p className="text-xs text-gray-500">
                {formatRole(userRole)}{companyName ? ` : ${companyName}` : ''}
              </p>
            )}
          </div>

          <button
            onClick={handleLogout}
            className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Déconnexion
          </button>
        </div>
      )}
    </div>
  );
};

export default Profile;



