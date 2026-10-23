import React, { useState, useEffect } from "react";
import {
  Search,
  UserPlus,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import { getUrlServer } from "../../../../../configServer";
import PageTitle from "../../../../PageTitle";
import UserTable from "./UserTable";
import { Spin } from "antd";
import { useTranslation } from "react-i18next";

interface User {
  _id: string;
  name: string;
  first_name: string;
  email: string;
  role: string;
  is_active?: boolean;
  nom_boutique?: string;
  created_at?: {
    $date: string;
  };
}

const TonTon: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] =
    useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { t } = useTranslation();

  const [editFormData, setEditFormData] = useState({
    name: "",
    first_name: "",
    email: "",
    nom_boutique: "",
  });
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const itemsPerPage = 10;
  const totalPages = Math.ceil((users?.length ?? 0) / itemsPerPage);

  const showSuccessMessage = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const showErrorMessage = (message: string) => {
    setErrorMessage(message);
    setTimeout(() => setErrorMessage(null), 3000);
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem("access_token");
        if (!token) {
          throw new Error(t("admin.users.messages.tokenError"));
        }

        const response = await fetch(`${getUrlServer()}/users/`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error(t("admin.users.messages.fetchError"));
        }

        const data = await response.json();
        setUsers(data.users);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : t("admin.users.messages.unknownError"),
        );
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [t]);

  const handleEditClick = (user: User) => {
    setSelectedUser(user);
    setEditFormData({
      name: user.name,
      first_name: user.first_name,
      email: user.email,
      nom_boutique: user.nom_boutique || "",
    });
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (user: User) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  const handleResetPasswordClick = (user: User) => {
    setSelectedUser(user);
    setIsResetPasswordModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        throw new Error(t("admin.users.messages.tokenError"));
      }

      const response = await fetch(
        `${getUrlServer()}/users/${selectedUser._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(editFormData),
        },
      );

      if (!response.ok) {
        throw new Error(t("admin.users.messages.error"));
      }

      const updatedUsers = users.map((user) =>
        user._id === selectedUser._id ? { ...user, ...editFormData } : user,
      );
      setUsers(updatedUsers);
      setIsEditModalOpen(false);
      showSuccessMessage(t("admin.users.messages.successEdit"));
    } catch (err) {
      showErrorMessage(
        err instanceof Error
          ? err.message
          : t("admin.users.messages.unknownError"),
      );
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        throw new Error(t("admin.users.messages.tokenError"));
      }

      const response = await fetch(
        `${getUrlServer()}/users/reset-password/${selectedUser._id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          // Le serveur génère un mot de passe aléatoire et l'envoie par email.
          body: JSON.stringify({}),
        },
      );

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(
          data?.error || data?.message || t("admin.users.messages.unknownError"),
        );
      }

      setIsResetPasswordModalOpen(false);
      showSuccessMessage(data?.message || t("admin.users.messages.successReset"));
    } catch (err) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : t("admin.users.messages.unknownError");
      showErrorMessage(errorMsg);
    }
  };

  const handleActivateUser = async (user: User) => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        throw new Error(t("admin.users.messages.tokenError"));
      }

      const response = await fetch(
        `${getUrlServer()}/users/activate-user/${user._id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error(t("admin.users.messages.error"));
      }

      const updatedUsers = users.map((u) =>
        u._id === user._id ? { ...u, is_active: true } : u,
      );
      setUsers(updatedUsers);
      showSuccessMessage(t("admin.users.messages.successActivate"));
    } catch (err) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : t("admin.users.messages.unknownError");
      showErrorMessage(errorMsg);
    }
  };

  const handleDeactivateUser = async (user: User) => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        throw new Error(t("admin.users.messages.tokenError"));
      }

      const response = await fetch(
        `${getUrlServer()}/users/deactivate-user/${user._id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error(t("admin.users.messages.error"));
      }

      const updatedUsers = users.map((u) =>
        u._id === user._id ? { ...u, is_active: false } : u,
      );
      setUsers(updatedUsers);
      showSuccessMessage(t("admin.users.messages.successDeactivate"));
    } catch (err) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : t("admin.users.messages.unknownError");
      showErrorMessage(errorMsg);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedUser) return;

    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        throw new Error(t("admin.users.messages.tokenError"));
      }

      const response = await fetch(
        `${getUrlServer()}/users/${selectedUser._id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error(t("admin.users.messages.error"));
      }

      setUsers(users.filter((user) => user._id !== selectedUser._id));
      setIsDeleteModalOpen(false);
      setSelectedUser(null);
      showSuccessMessage(t("admin.users.messages.successDelete"));
    } catch (err) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : t("admin.users.messages.unknownError");
      showErrorMessage(errorMsg);
    }
  };

  const filteredUsers = (users ?? []).filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spin />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen text-red-500">
        {t("admin.users.messages.error")}: {error}
      </div>
    );
  }

  return (
    <>
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-emerald-500 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3">
            <div className="bg-white/20 p-1.5 rounded-lg">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <span className="font-medium">{successMessage}</span>
          </div>
        </div>
      )}
      {errorMessage && (
        <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-rose-500 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3">
            <div className="bg-white/20 p-1.5 rounded-lg">
              <AlertCircle className="w-5 h-5" />
            </div>
            <span className="font-medium">{errorMessage}</span>
          </div>
        </div>
      )}

      <PageTitle>{t("admin.users.title")}</PageTitle>
      <div className="bg-white p-4 md:p-6 w-full">
        <div className="w-full">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-8 gap-4">
            {/* Barre de recherche premium */}
            <div className="relative w-full sm:w-80 group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400 group-focus-within:text-[#0F172A] transition-colors" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 border border-transparent bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F172A]/10 focus:bg-white focus:border-[#0F172A]/20 transition-all duration-300 shadow-sm text-sm"
                placeholder={t("admin.users.search")}
              />
            </div>

            {/* Bouton Ajouter premium */}
            <div className="w-full sm:w-auto flex justify-end">
              <Link
                to="/admin/dashboard/users/addusersadmin"
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#0F172A] to-[#1E293B] text-white rounded-xl font-bold text-sm shadow-lg shadow-gray-200 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 active:scale-95"
              >
                <UserPlus className="h-5 w-5" />
                <span className="hidden sm:inline">
                  {t("admin.users.addBtn")}
                </span>
                <ChevronRight className="w-4 h-4 opacity-50 hidden sm:block" />
              </Link>
            </div>
          </div>

          <UserTable
            users={paginatedUsers}
            loading={loading}
            onEdit={handleEditClick}
            onDelete={handleDeleteClick}
            onResetPassword={handleResetPasswordClick}
            onActivate={handleActivateUser}
            onDeactivate={handleDeactivateUser}
          />

          <div className="flex flex-col md:flex-row items-center justify-between mt-6 gap-4">
            <div className="text-sm text-gray-700">
              {t("admin.customers.table.pagination.info", {
                start: (currentPage - 1) * itemsPerPage + 1,
                end: Math.min(currentPage * itemsPerPage, filteredUsers.length),
                total: filteredUsers.length,
              })}
            </div>

            <div className="flex items-center space-x-2">
              <button
                className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                ← {t("admin.customers.table.pagination.previous")}
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    className={`px-3 py-1 text-sm rounded ${
                      currentPage === page
                        ? "bg-[#0F172A] text-white"
                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                    }`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                ),
              )}

              <button
                className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50"
                onClick={() =>
                  setCurrentPage(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages}
              >
                {t("admin.customers.table.pagination.next")} →
              </button>
            </div>
          </div>
        </div>
      </div>

      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 relative">
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="absolute top-3 right-3 text-gray-600 hover:text-gray-900 text-xl font-bold"
            >
              &times;
            </button>

            <h2 className="text-xl font-semibold mb-4">
              {t("admin.users.modals.edit.title")}
            </h2>
            <form onSubmit={handleEditSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  {t("admin.users.modals.edit.name")}
                </label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0F172A]/20"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  {t("admin.users.modals.edit.firstName")}
                </label>
                <input
                  type="text"
                  value={editFormData.first_name}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      first_name: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0F172A]/20"
                />
              </div>
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  {t("admin.users.modals.edit.email")}
                </label>
                <input
                  type="email"
                  value={editFormData.email}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, email: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0F172A]/20"
                />
              </div>

              {selectedUser.role === "livreur" && (
                <div className="mb-6">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    {t("admin.users.modals.edit.shopName")}
                  </label>
                  <input
                    type="text"
                    value={editFormData.nom_boutique}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        nom_boutique: e.target.value,
                      })
                    }
                    placeholder={t("admin.users.modals.edit.shopPlaceholder")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0F172A]/20"
                  />
                </div>
              )}
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                >
                  {t("admin.users.modals.edit.cancel")}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0F172A] text-white rounded-md hover:bg-[#1E293B]"
                >
                  {t("admin.users.modals.edit.save")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDeleteModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 relative">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="absolute top-3 right-3 text-gray-600 hover:text-gray-900 text-xl font-bold"
            >
              &times;
            </button>

            <h2 className="text-xl font-semibold mb-4">
              {t("admin.users.modals.delete.title")}
            </h2>
            <p className="mb-6">
              {t("admin.users.modals.delete.confirm", {
                name: selectedUser.name,
                firstName: selectedUser.first_name,
              })}
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                {t("admin.users.modals.delete.cancel")}
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                {t("admin.users.modals.delete.delete")}
              </button>
            </div>
          </div>
        </div>
      )}

      {isResetPasswordModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold mb-4">
              {t("admin.users.modals.resetPassword.title", {
                name: selectedUser.name,
                firstName: selectedUser.first_name,
              })}
            </h2>
            <form onSubmit={handleResetPasswordSubmit}>
              <p className="mb-4 text-sm text-gray-600">
                {t("admin.users.modals.resetPassword.description", {
                  email: selectedUser.email,
                })}
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsResetPasswordModalOpen(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                >
                  {t("admin.users.modals.resetPassword.cancel")}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0F172A] text-white rounded-md hover:bg-[#1E293B]"
                >
                  {t("admin.users.modals.resetPassword.validate")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default TonTon;
