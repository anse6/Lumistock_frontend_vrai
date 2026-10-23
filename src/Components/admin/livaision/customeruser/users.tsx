import React, { useState } from "react";
import Header from "./Header";
import Pagination from "./Pagination";
import PageTitle from "../../../PageTitle";
import UserTable from "../../../../Modules/utilisateur/UserTable";

interface User {
  id: string;
  initials: string;
  name: string;
  registeredBy: string;
  registeredByName: string;
  number: string;
  location: string;
  order: string;
  amount: string;
  date: string;
}

const UsersAdmin: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);

  const userData: User[] = [
    // Ajoute ici tes utilisateurs
  ];

  return (
    <>
      <PageTitle>Utilisateurs</PageTitle>
      <div className="p-6 bg-white h-screen w-full  font-['Laura']">
        <div className="bg-white rounded-lg relative  w-full h-screen -ml-3">
          <Header />

          {userData.length === 0 ? (
            <div className="text-center py-10 text-gray-500 font-semibold">
              Aucune donnée disponible dans ce tableau.
            </div>
          ) : (
            <UserTable />
          )}

          <Pagination
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
          />
        </div>
      </div>
    </>
  );
};

export default UsersAdmin;
