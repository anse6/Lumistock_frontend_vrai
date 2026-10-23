import React, { useState, useRef } from "react";
import { ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import PageTitle from "../../PageTitle";
import { getUrlServer } from "../../../configServer";

interface NewUserFormProps {
  onCancel: () => void;
}

interface UserFormData {
  name: string;
  first_name: string;
  email: string;
  role: string;
}

const AddUser: React.FC<NewUserFormProps> = ({ onCancel }) => {
  const [formData, setFormData] = useState<UserFormData>({
    name: "",
    first_name: "",
    email: "",
    role: "",
  });

  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mise à jour des inputs textuels
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Sélection du rôle dans le dropdown
  const handleRoleSelect = (role: string) => {
    setFormData((prev) => ({ ...prev, role }));
    setIsRoleDropdownOpen(false);
  };

  // Upload image et affichage preview
  const handleProfileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setProfileFile(file);

      // Preview
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          setProfileImage(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Ouvre la sélection de fichier
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Soumission du formulaire
  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);

    // Validation
    if (!formData.role) {
      setError("Veuillez sélectionner un rôle");
      return;
    }
    if (!formData.name || !formData.first_name || !formData.email) {
      setError("Veuillez remplir tous les champs obligatoires");
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("Non authentifié");

      const endpoint =
        formData.role === "Gérant"
          ? `${getUrlServer()}/users/create_gerant`
          : `${getUrlServer()}/users/create_manager`;

      let response;

      if (profileFile) {
        // Important : NE PAS mettre 'Content-Type' ici, fetch gère ça automatiquement avec FormData
        const formDataToSend = new FormData();
        formDataToSend.append("name", formData.name);
        formDataToSend.append("first_name", formData.first_name);
        formDataToSend.append("email", formData.email);
        formDataToSend.append("profile_picture", profileFile);

        response = await fetch(endpoint, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            // Ne pas ajouter 'Content-Type' ici avec FormData
          },
          body: formDataToSend,
        });
      } else {
        // Envoi JSON si pas d'image
        response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: formData.name,
            first_name: formData.first_name,
            email: formData.email,
          }),
        });
      }

      const responseData = await response.json();

      console.log("Réponse API:", responseData);

      if (!response.ok) {
        // Gérer message d'erreur venant de l'API
        throw new Error(
          responseData.message || "Erreur lors de la création de l'utilisateur",
        );
      }

      setSuccess(`${formData.role} créé avec succès !`);

      // Réinitialiser le formulaire après succès
      setFormData({
        name: "",
        first_name: "",
        email: "",
        role: "",
      });
      setProfileFile(null);
      setProfileImage(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <PageTitle>Livraison</PageTitle>
      <div className="max-w-6xl mx-auto p-6 bg-white rounded-[10px]">
        <div className="text-sm text-[#1E293B] mb-3">
          <Link to="/admin/dashboard/users">Utilisateurs</Link> &gt; Nouveau
          utilisateur
        </div>

        <h1 className="text-2xl font-semibold mb-4">Nouveau utilisateur</h1>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
            {success}
          </div>
        )}

        <div>
          <div className="mb-6">
            <h2 className="text-base font-medium mb-3">
              Profil de l'utilisateur
            </h2>
            <div className="border border-gray-200 rounded p-4 flex items-center justify-center">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleProfileUpload}
                accept="image/*"
                className="hidden"
              />
              {profileImage ? (
                <div className="flex flex-col items-center">
                  <img
                    src={profileImage}
                    alt="Profil utilisateur"
                    className="w-24 h-24 rounded-full object-cover mb-2"
                  />
                  <button
                    type="button"
                    onClick={triggerFileInput}
                    className="text-[#0F172A] text-sm"
                  >
                    Changer la photo
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={triggerFileInput}
                  className="flex items-center text-gray-400"
                >
                  <svg
                    className="w-6 h-6 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Ajouter le profil de l'utilisateur
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1">
                Nom <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                placeholder="Entrer le nom ici"
                className="w-full p-2 border border-gray-300 rounded"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>

            <div>
              <label
                htmlFor="first_name"
                className="block text-sm font-medium mb-1"
              >
                Prénom <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="first_name"
                name="first_name"
                placeholder="Entrer le prénom ici"
                className="w-full p-2 border border-gray-300 rounded"
                value={formData.first_name}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Adresse mail <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="Entrer l'email"
              className="w-full p-2 border border-gray-300 rounded"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="mb-6">
            <label htmlFor="role" className="block text-sm font-medium mb-1">
              Rôle <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <button
                type="button"
                className="w-full flex items-center justify-between p-2 border border-gray-300 rounded text-left"
                onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
              >
                <span
                  className={formData.role ? "text-black" : "text-gray-400"}
                >
                  {formData.role || "Sélectionner un rôle"}
                </span>
                <ChevronDown className="h-5 w-5" />
              </button>

              {isRoleDropdownOpen && (
                <div className="absolute top-full left-0 w-full bg-white border border-gray-300 rounded mt-1 z-10 shadow-lg">
                  <ul>
                    <li
                      className="p-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => handleRoleSelect("Manager")}
                    >
                      Manager
                    </li>
                    <li
                      className="p-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => handleRoleSelect("Gérant")}
                    >
                      Gérant
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
              disabled={isSubmitting}
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-6 py-2 bg-[#0F172A] text-white rounded hover:bg-[#0F172A] disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Création en cours..." : "Enregistrer"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default AddUser;
