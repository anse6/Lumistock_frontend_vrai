import { LogOut } from "lucide-react";
import { demanderDeconnexion } from '../../../Modules/Authentification/ConfirmationDeconnexion';

const Dropdown = () => {
  // Demande confirmation, puis révoque la session côté serveur (voir ConfirmationDeconnexion).
  const handleLogout = () => {
    demanderDeconnexion('/login');
  };

  return (
    <div className="relative">
      <button
        onClick={handleLogout}
        className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-full transition-colors"
      >
        <LogOut className="h-5 w-5" />
        <span className="text-sm font-medium">Se déconnecter</span>
      </button>
    </div>
  );
};

export default Dropdown;



