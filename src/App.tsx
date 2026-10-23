import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import AuthentificationPage from "./Modules/Authentification";
import LandingPage from "./Modules/Public/LandingPage";
import RegisterStore from "./Modules/Public/RegisterStore";
import ContactPage from "./Modules/Public/ContactPage";
import ModulePage from "./Modules/Public/ModulePage";
import FonctionnalitesPage from "./Modules/Public/FonctionnalitesPage";
import TarifsPage from "./Modules/Public/TarifsPage";
import SecuritePage from "./Modules/Public/SecuritePage";
import DashboardLayout from "./layouts/DashboardLayout";
import DashboardLayouts from "./layouts/DashboardLayouts";
import Dashboard from "./Modules/Dashboard";
import NewDelivery from "./Modules/Delivery/NewDelivery";
import Delivery from "./Modules/Delivery";
import ClientSelection from "./Modules/Delivery/ClientSelection";
import CompanyProfile from "./Modules/Parametre/CompanyProfile";
import ForgotPassword from "./Modules/Authentification/forgotpassword";
import ResetPassword from "./Modules/Authentification/ResetPassword";
import Adminsdashboard from "./Modules/Dashboard/index1";
import AddProduct from "./Components/admin/proapprov/product/addproduct";
import OrderTableadmin from "./Components/admin/livaision/index/index";
import ProductSelectionadmin from "./Components/admin/livaision/index/NewDeliveryadmin";
import Configurattionadmin from "./Components/admin/livaision/index/ClientSelectionadmin";
import ClientAdmin from "./Components/admin/livaision/Customer/client";
import CompanyProfiles from "./Components/admin/parameters/CompanyProfiles";
import AddClient from "./Components/admin/livaision/Customer/add_clients";
import Parents from "./Components/admin/Parents";
import PageCodesBarres from "./Modules/CodeBarre/PageCodesBarres";
import ConfirmationDeconnexion from "./Modules/Authentification/ConfirmationDeconnexion";
import DashboardLayoutes from "./layouts/DashboardLayoutes";
import Superadmindashboard from "./Modules/Dashboard/index2";
import StaffProfile from "./Components/super-admin/Parametres/staffparameter";
import StoreManagement from "./Components/super-admin/magasin/Magazine";
import NouveauMagasin from "./Components/super-admin/magasin/addmagasin";
import ProductDetailAdmin from "./Components/admin/proapprov/product/produictdetail";
import ProtectedRoute from "./Modules/Authentification/ProtectedRoute";
import ProductSelect from "./Components/admin/approvisonnement/ProductSelect";
import EditApprovisionnement from "./Components/admin/approvisonnement/EditApprovisionnement";
import ViewMagasin from "./Components/super-admin/magasin/ViewMagasin";
import EditMagasin from "./Components/super-admin/magasin/EditMagasin";
import AddUserpep from "./Components/super-admin/users.tsx/adduser";
import AjouterMembre from "./Components/admin/equipe/AjouterMembre";
import RecentStaffpapa from "./Components/super-admin/users.tsx/Userstaff";
import Equipe from "./Components/admin/equipe/Equipe";
import ImageManagement from "./Components/super-admin/gestion images/ImageManagement";
import MessagesContact from "./Components/super-admin/contact/MessagesContact";
import ConversationsAssistant from "./Components/super-admin/assistant/ConversationsAssistant";
import MessagerieSupport from "./Components/support/MessagerieSupport";
import SupportAdmin from "./Components/support/SupportAdmin";
import EditProduct from "./Components/admin/Produits/EditModal";
import ClientLivreur from "./Modules/Delivery/Customer/client";
import AddClientlivreur from "./Modules/Delivery/Customer/add_clients";
import LivraisonDetailsPage from "./Components/admin/livaision/livraisonfinal/Admindetail";
import EditLivraisonFlow from "./Components/admin/livaision/livraisonfinal/EditLivraisonFlow";
import EditLivraisonFlowLivreur from "./Modules/Delivery/EditLivraisonFlow";
import ProductsInventory from "./Modules/Produits/Produit";
import AccueilAdmin from "./Modules/Dashboard/AccueilAdmin";
import ProductDetailLivreur from "./Modules/Produits/produictdetail";
import Secure from "./Modules/Authentification/services/secure";
import AIChat from "./Components/admin/IA/AIChat";
import MaCaisse from "./Modules/Caisse/MaCaisse";
import MesStatistiques from "./Modules/Caisse/MesStatistiques";
import MaSecurite from "./Modules/Caisse/MaSecurite";
import CaissesAdmin from "./Modules/Caisse/admin/CaissesAdmin";
import DeliveryReportPage from "./Modules/Reports/DeliveryReportPage";
import FinanceIndex from "./Modules/Finance/FinanceIndex";
import Charges from "./Modules/Charges";
import Messagerie from "./Modules/Messagerie";

import { ConfigProvider, App as AntdApp } from "antd";
import type { Locale } from "antd/es/locale";
import frFR from "antd/locale/fr_FR";
import enUS from "antd/locale/en_US";
import esES from "antd/locale/es_ES";
import deDE from "antd/locale/de_DE";
import zhCN from "antd/locale/zh_CN";
import arEG from "antd/locale/ar_EG";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { langueDe, type CodeLangue } from "./langues";

// Textes des composants antd (calendriers, pagination, fenêtres…) dans la langue choisie.
const LOCALES_ANTD: Record<CodeLangue, Locale> = { fr: frFR, en: enUS, es: esES, de: deDE, zh: zhCN, ar: arEG };

const App = () => {
  const { i18n } = useTranslation();
  const langue = langueDe(i18n.language);
  const [primaryColor, setPrimaryColor] = useState(
    localStorage.getItem("theme_primary_color") || "#0F172A",
  );

  useEffect(() => {
    const handleThemeChange = () => {
      const newColor = localStorage.getItem("theme_primary_color") || "#0F172A";
      setPrimaryColor(newColor);
    };

    window.addEventListener("themeChange", handleThemeChange);
    return () => window.removeEventListener("themeChange", handleThemeChange);
  }, []);

  return (
    <ConfigProvider
      locale={LOCALES_ANTD[langue.code]}
      direction={langue.rtl ? "rtl" : "ltr"}
      theme={{
        token: {
          colorPrimary: primaryColor,
          colorTextBase: "#0F172A",
          borderRadius: 8,
          fontFamily:
            "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
        },
        components: {
          Button: {
            colorPrimary: primaryColor,
            colorPrimaryHover: `${primaryColor}cc`,
            borderRadius: 8,
            controlHeight: 40,
          },
          Input: {
            borderRadius: 8,
            controlHeight: 40,
          },
        },
      }}
    >
      <AntdApp>
        {/* Confirmation « Se déconnecter ? » commune à toute l'application. */}
        <ConfirmationDeconnexion />
        <Router>
          <Routes>
            {/* ---------- Routes publiques ---------- */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<AuthentificationPage />} />
            <Route path="/register-store" element={<RegisterStore />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/modules/:slug" element={<ModulePage />} />
            <Route path="/fonctionnalites" element={<FonctionnalitesPage />} />
            <Route path="/tarifs" element={<TarifsPage />} />
            <Route path="/securite" element={<SecuritePage />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route
              path="/resetpassword/:token"
              element={
                <ProtectedRoute requiresAuth={false}>
                  <ResetPassword />
                </ProtectedRoute>
              }
            />
            {/* Lien d'invitation : un nouveau compte choisit son mot de passe. */}
            <Route
              path="/definir-mot-de-passe/:token"
              element={
                <ProtectedRoute requiresAuth={false}>
                  <ResetPassword />
                </ProtectedRoute>
              }
            />

            {/* ---------- Routes protégées ---------- */}
            <Route
              path="/dashboard"
              element={
                <Secure>
                  <ProtectedRoute allowedRoles={["livreur", "gerant"]}>
                    <DashboardLayout />
                  </ProtectedRoute>
                </Secure>
              }
            >
              <Route index element={<Navigate to="accueil" replace />} />
              <Route path="accueil" element={<AccueilAdmin />} />
              <Route path="home" element={<Dashboard />} />
              <Route path="delivery">
                <Route index element={<Delivery />} />
                <Route path="new-delivery" element={<NewDelivery />} />
                <Route
                  path="new-delivery/client-selection"
                  element={<ClientSelection />}
                />
                <Route
                  path="update/:id"
                  element={<EditLivraisonFlowLivreur />}
                />
              </Route>
              <Route path="products">
                <Route index element={<ProductsInventory />} />
                <Route path="details/:id" element={<ProductDetailLivreur />} />
              </Route>
              <Route path="clients">
                <Route index element={<ClientLivreur />} />
                <Route
                  path="add-clients"
                  element={
                    <AddClientlivreur onCancel={() => window.history.back()} />
                  }
                />
              </Route>
              <Route path="ia">
                <Route index element={<AIChat />} />
              </Route>
              <Route path="reports" element={<DeliveryReportPage />} />
              <Route path="settings" element={<CompanyProfile />} />
            </Route>

            <Route
              path="/admin/dashboard"
              element={
                <Secure>
                  <ProtectedRoute allowedRoles={["admin", "manager"]}>
                    <DashboardLayouts />
                  </ProtectedRoute>
                </Secure>
              }
            >
              <Route index element={<Navigate to="accueil" replace />} />
              <Route path="accueil" element={<AccueilAdmin />} />
              <Route path="home" element={<Adminsdashboard />} />
              <Route path="produits_approvisionnements">
                <Route index element={<Parents />} />
                <Route path="add_product" element={<AddProduct />} />
                <Route path="codes-barres" element={<PageCodesBarres />} />
                <Route path="productselect" element={<ProductSelect />} />
                <Route
                  path="edit_approv/:id"
                  element={<EditApprovisionnement />}
                />
                <Route
                  path="add_product/productdetail/:id"
                  element={<ProductDetailAdmin />}
                />
                <Route path="edit/:id" element={<EditProduct />} />
              </Route>
              <Route path="deliverys">
                <Route index element={<OrderTableadmin />} />
                <Route path="develive" element={<ProductSelectionadmin />} />
                <Route
                  path="develive/clientselection"
                  element={<Configurattionadmin />}
                />
                <Route
                  path="detaillivrason/:id"
                  element={<LivraisonDetailsPage />}
                />
                <Route path="update/:id" element={<EditLivraisonFlow />} />
              </Route>
              <Route path="customers">
                <Route index element={<ClientAdmin />} />
                <Route
                  path="addusers"
                  element={<AddClient onCancel={() => window.history.back()} />}
                />
              </Route>
              <Route path="users">
                <Route index element={<Equipe />} />
                <Route
                  path="addusersadmin"
                  element={
                    <AjouterMembre />
                  }
                />
              </Route>
              <Route path="parameter">
                <Route index element={<CompanyProfiles />} />
              </Route>
              <Route path="ia">
                <Route index element={<AIChat />} />
              </Route>
              <Route path="reports" element={<DeliveryReportPage />} />
              <Route path="finance" element={<FinanceIndex />} />
              <Route path="charges" element={<Charges />} />
              <Route path="caisses" element={<CaissesAdmin />} />
              <Route path="messages" element={<Messagerie />} />
              <Route path="support" element={<SupportAdmin />} />
            </Route>

            {/* Caisse (rôle caissier) */}
            <Route
              path="/caisse"
              element={
                <Secure>
                  <ProtectedRoute allowedRoles={["caissier"]}>
                    <DashboardLayouts />
                  </ProtectedRoute>
                </Secure>
              }
            >
              {/* Mêmes écrans que l'admin : liste, choix des produits, vente finale. */}
              <Route index element={<Navigate to="ventes" replace />} />
              <Route path="vendre" element={<Navigate to="/caisse/ventes/nouvelle" replace />} />
              <Route path="ventes" element={<OrderTableadmin />} />
              <Route path="ventes/nouvelle" element={<ProductSelectionadmin />} />
              <Route path="ventes/nouvelle/clientselection" element={<Configurattionadmin />} />
              <Route path="session" element={<MaCaisse />} />
              <Route path="statistiques" element={<MesStatistiques />} />
              <Route path="securite" element={<MaSecurite />} />
              <Route path="ia" element={<AIChat />} />
            </Route>

            {/* Superadmin Dashboard */}
            <Route
              path="/superadmin/dashboard"
              element={
                <Secure>
                  <ProtectedRoute allowedRoles={["staff"]}>
                    <DashboardLayoutes />
                  </ProtectedRoute>
                </Secure>
              }
            >
              <Route path="home" element={<Superadmindashboard />} />
              <Route path="magasin">
                <Route index element={<StoreManagement />} />
                <Route path="add_magasin" element={<NouveauMagasin />} />
                <Route path="update/:id" element={<EditMagasin />} />
                <Route path="view/:id" element={<ViewMagasin />} />
              </Route>
              <Route path="recentansevernel">
                <Route index element={<RecentStaffpapa />} />
                <Route
                  path="utilisateur"
                  element={
                    <AddUserpep onCancel={() => window.history.back()} />
                  }
                />
              </Route>
              <Route path="settingstaff" element={<StaffProfile />} />
              <Route path="messages" element={<MessagesContact />} />
              <Route path="assistant" element={<ConversationsAssistant />} />
              <Route path="support" element={<MessagerieSupport cote="staff" />} />
              <Route path="image-management">
                <Route index element={<ImageManagement />} />
              </Route>
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AntdApp>
    </ConfigProvider>
  );
};

export default App;
