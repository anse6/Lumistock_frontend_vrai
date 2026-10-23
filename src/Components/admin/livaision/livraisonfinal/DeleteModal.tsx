import React from "react";
import { X } from "lucide-react";
import axios from "axios";
import { getUrlServer } from "../../../../configServer";
import { useTranslation } from "react-i18next";

interface DeleteModalProps {
  onCancel: () => void;
  onConfirm: () => void;
  orderId: string;
  onDeleteSuccess: (orderId: string) => void;
  onDeleteError: (error: unknown) => void;
}

const DeleteModal: React.FC<DeleteModalProps> = ({
  onCancel,
  onConfirm,
  orderId,
  onDeleteSuccess,
  onDeleteError,
}) => {
  const { t } = useTranslation();
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const token = localStorage.getItem("access_token");
      await axios.delete(`${getUrlServer()}/livraisons/${orderId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      onDeleteSuccess(orderId);
      onConfirm();
    } catch (error) {
      onDeleteError(error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4">
        <div className="flex justify-end p-2">
          <button
            onClick={onCancel}
            className="text-gray-500"
            disabled={isDeleting}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-6 pb-6 pt-2 text-center">
          <h2 className="text-xl font-bold mb-4">
            {t("admin.deliveries.modals.delete.title")}
          </h2>
          <p className="text-gray-600 mb-6">
            {t("admin.deliveries.modals.delete.message")}
          </p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={onCancel}
              className={`px-6 py-2 border border-gray-300 rounded-md ${isDeleting ? "text-gray-400" : "text-gray-700"}`}
              disabled={isDeleting}
            >
              {t("admin.deliveries.modals.delete.cancel")}
            </button>
            <button
              onClick={handleDelete}
              className={`px-6 py-2 ${isDeleting ? "bg-red-400" : "bg-red-600"} text-white rounded-md flex items-center justify-center min-w-[100px]`}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  {t("admin.deliveries.modals.delete.deleting")}
                </>
              ) : (
                t("admin.deliveries.modals.delete.confirm")
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteModal;
