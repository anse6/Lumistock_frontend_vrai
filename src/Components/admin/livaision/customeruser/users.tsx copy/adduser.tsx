import React from "react";
import {
  Form,
  Input,
  Button,
  Card,
  Typography,
  notification,
  Row,
  Col,
  Alert,
  Divider,
} from "antd";
import {
  UserOutlined,
  MailOutlined,
  UserAddOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import { Truck, ShieldCheck, ScanBarcode } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { getUrlServer } from "../../../../../configServer";
import PageTitle from "../../../../PageTitle";

const { Title, Text } = Typography;

interface NewUserFormProps {
  onCancel?: () => void;
}

// 👉 Fonction d'erreur personnalisée
function getErreurUtilisateur(
  response: Response,
  data: any,
  _role: string | null | undefined,
  t: any,
): string {
  // On essaye d'extraire un message du backend sous différentes formes possibles
  let backendMessage = "";

  if (data) {
    if (typeof data === "string") backendMessage = data;
    else if (data.message) backendMessage = data.message;
    else if (data.detail) backendMessage = data.detail;
    else if (data.error) backendMessage = data.error;
  }

  // Si le backend renvoie un message spécifique, on l'utilise directement
  if (backendMessage) return backendMessage;

  // Fallback basé sur le code HTTP
  if (response.status === 400) {
    return t("admin.users.add.form.errorCreation");
  }

  if (response.status === 401) return t("admin.users.add.form.sessionExpired");
  if (response.status === 403) return t("admin.users.add.form.errorAuth");
  if (response.status === 404) return t("admin.users.add.form.errorNetwork");
  if (response.status >= 500) return t("admin.users.add.form.errorNetwork");

  return `${t("admin.users.messages.error")} (Code ${response.status})`;
}

const AddUserpepanse: React.FC<NewUserFormProps> = ({ onCancel }) => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [step, setStep] = React.useState<"select" | "form">("select");
  const [userType, setUserType] = React.useState<"Livreur" | "manager" | "caissier" | null>(
    null,
  );
  const libelleRole = (type: typeof userType) =>
    type === "Livreur"
      ? t("admin.users.add.form.roleLivreur")
      : type === "caissier"
        ? t("admin.users.add.form.roleCaissier")
        : t("admin.users.add.form.roleManager");
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const onFinish = async (values: any) => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        const authError = t("admin.users.add.form.sessionExpired");
        setErrorMessage(authError);
        notification.error({
          message: t("admin.users.add.form.errorAuth"),
          description: authError,
        });
        return;
      }

      console.log("Envoi des données:", { ...values, role: userType });

      const endpoint =
        userType === "Livreur"
          ? "/users/create_livreur"
          : userType === "caissier"
            ? "/users/create_caissier"
            : "/users/create_manager";

      const response = await fetch(`${getUrlServer()}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...values,
          role: userType === "Livreur" ? "livreur" : userType === "caissier" ? "caissier" : "manager",
        }),
      });

      let responseData: any = {};
      const responseText = await response.text();

      try {
        if (responseText) {
          responseData = JSON.parse(responseText);
        }
      } catch (e) {
        console.error("Erreur de lecture de la réponse:", e);
        responseData = { message: t("admin.users.add.form.readError") };
      }

      if (!response.ok) {
        const errorDesc = getErreurUtilisateur(
          response,
          responseData,
          userType,
          t,
        );
        console.error("Erreur Backend détectée:", {
          status: response.status,
          data: responseData,
          parsedError: errorDesc,
        });
        setErrorMessage(errorDesc);

        notification.error({
          message: t("admin.users.add.form.errorCreation"),
          description: errorDesc,
          placement: "topRight",
          duration: 6,
        });
        return;
      }

      if (responseData?.invitation_envoyee === false) {
        notification.warning({ message: responseData.message, placement: "topRight", duration: 8 });
      } else notification.success({
        message: t("login.messages.success"),
        description: t("admin.users.add.form.success", { role: libelleRole(userType) }),
        placement: "topRight",
      });

      setTimeout(() => {
        navigate(userType === "caissier" ? "/admin/dashboard/caisses" : "/admin/dashboard/users");
      }, 1500);
    } catch (err) {
      const networkError =
        err instanceof Error
          ? err.message
          : t("admin.users.add.form.errorNetwork");
      setErrorMessage(networkError);
      notification.error({
        message: t("admin.users.add.form.errorNetwork"),
        description: networkError,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectType = (type: "Livreur" | "manager" | "caissier") => {
    setUserType(type);
    setStep("form");
  };

  return (
    <>
      <PageTitle>{t("admin.users.add.title")}</PageTitle>

      <div className="w-full bg-white border border-gray-100 p-4">
        {/* Breadcrumb / Navigation */}
        <div className="mb-6 flex items-center gap-2 text-sm font-medium animate-in fade-in slide-in-from-top-2 duration-300">
          <Link
            to="/admin/dashboard/users"
            className="text-blue-600 hover:text-blue-800 transition-all duration-200 flex items-center gap-2 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 rounded-lg shadow-sm border border-blue-100/50"
          >
            <ArrowLeftOutlined className="text-xs" />
            {t("admin.users.add.breadcrumb")}
          </Link>
          <span className="text-blue-300 font-bold px-1">{">"}</span>
          <span className="text-gray-600 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg shadow-sm">
            {t("admin.users.add.title")}
          </span>
        </div>

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <Title level={2} className="!mb-0 flex items-center gap-3">
              <UserAddOutlined className="text-blue-600" />
              {step === "select"
                ? t("admin.users.add.typeSelection.title")
                : userType === "Livreur"
                  ? t("admin.users.add.form.titleShop")
                  : userType === "caissier"
                    ? t("admin.users.add.form.titleCaissier")
                    : t("admin.users.add.form.titleManager")}
            </Title>
            <Text type="secondary">
              {step === "select"
                ? t("admin.users.add.typeSelection.subtitle")
                : userType === "Livreur"
                  ? t("admin.users.add.form.subtitleShop")
                  : userType === "caissier"
                    ? t("admin.users.add.form.subtitleCaissier")
                    : t("admin.users.add.form.subtitleManager")}
            </Text>
          </div>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={step === "form" ? () => setStep("select") : onCancel}
          >
            {step === "form"
              ? t("admin.users.add.form.changeType")
              : t("admin.users.add.typeSelection.back")}
          </Button>
        </div>

        <div className="max-w-4xl mx-auto">
          {step === "select" ? (
            <Row gutter={[24, 24]}>
              <Col xs={24} md={8}>
                <Card
                  hoverable
                  className="h-full border-2 border-transparent hover:border-blue-500 transition-all group overflow-hidden"
                  onClick={() => handleSelectType("Livreur")}
                >
                  <div className="flex flex-col items-center text-center space-y-4 py-4">
                    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Truck className="w-10 h-10 text-blue-600" />
                    </div>
                    <div>
                      <Title level={3}>
                        {t("admin.users.add.typeSelection.shop.title")}
                      </Title>
                      <Text className="text-gray-500">
                        {t("admin.users.add.typeSelection.shop.description")}
                      </Text>
                    </div>
                  </div>
                </Card>
              </Col>
              <Col xs={24} md={8}>
                <Card
                  hoverable
                  className="h-full border-2 border-transparent hover:border-emerald-500 transition-all group overflow-hidden"
                  onClick={() => handleSelectType("manager")}
                >
                  <div className="flex flex-col items-center text-center space-y-4 py-4">
                    <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                      <ShieldCheck className="w-10 h-10 text-emerald-600" />
                    </div>
                    <div>
                      <Title level={3}>
                        {t("admin.users.add.typeSelection.manager.title")}
                      </Title>
                      <Text className="text-gray-500">
                        {t("admin.users.add.typeSelection.manager.description")}
                      </Text>
                    </div>
                  </div>
                </Card>
              </Col>
              <Col xs={24} md={8}>
                <Card
                  hoverable
                  className="h-full border-2 border-transparent hover:border-fuchsia-500 transition-all group overflow-hidden"
                  onClick={() => handleSelectType("caissier")}
                >
                  <div className="flex flex-col items-center text-center space-y-4 py-4">
                    <div className="w-20 h-20 bg-fuchsia-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                      <ScanBarcode className="w-10 h-10 text-fuchsia-700" />
                    </div>
                    <div>
                      <Title level={3}>
                        {t("admin.users.add.typeSelection.caissier.title")}
                      </Title>
                      <Text className="text-gray-500">
                        {t("admin.users.add.typeSelection.caissier.description")}
                      </Text>
                    </div>
                  </div>
                </Card>
              </Col>
            </Row>
          ) : (
            <Card bordered={true} className="shadow-sm rounded-xl">
              {errorMessage && (
                <Alert
                  message={t("admin.users.messages.error")}
                  description={errorMessage}
                  type="error"
                  showIcon
                  closable
                  className="mb-6"
                  onClose={() => setErrorMessage(null)}
                />
              )}

              <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                requiredMark="optional"
                size="large"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                  <Form.Item
                    name="name"
                    label={t("admin.users.add.form.name")}
                    rules={[
                      {
                        required: true,
                        message: t("admin.users.add.form.nameRequired"),
                      },
                    ]}
                  >
                    <Input
                      prefix={<UserOutlined className="text-gray-400" />}
                      placeholder={t("admin.users.add.form.namePlaceholder")}
                    />
                  </Form.Item>

                  <Form.Item
                    name="first_name"
                    label={t("admin.users.add.form.firstName")}
                    rules={[
                      {
                        required: true,
                        message: t("admin.users.add.form.firstNameRequired"),
                      },
                    ]}
                  >
                    <Input
                      prefix={<UserOutlined className="text-gray-400" />}
                      placeholder={t(
                        "admin.users.add.form.firstNamePlaceholder",
                      )}
                    />
                  </Form.Item>
                </div>

                <Form.Item
                  name="email"
                  label={t("admin.users.add.form.email")}
                  rules={[
                    {
                      required: true,
                      message: t("admin.users.add.form.emailRequired"),
                    },
                    {
                      type: "email",
                      message: t("admin.users.add.form.emailInvalid"),
                    },
                  ]}
                >
                  <Input
                    prefix={<MailOutlined className="text-gray-400" />}
                    placeholder="exemple@email.com"
                  />
                </Form.Item>

                {/* Pas de mot de passe : l'utilisateur reçoit un lien d'invitation. */}
                <p className="text-xs text-gray-500 mb-4">
                  {t("admin.users.add.form.invitationHint")}
                </p>

                {userType === "Livreur" && (
                  <Form.Item
                    name="nom_boutique"
                    label={t("admin.users.add.form.shopName")}
                    rules={[
                      {
                        required: true,
                        message: t("admin.users.add.form.shopNameRequired"),
                      },
                    ]}
                  >
                    <Input
                      prefix={<UserOutlined className="text-gray-400" />}
                      placeholder={t(
                        "admin.users.add.form.shopNamePlaceholder",
                      )}
                    />
                  </Form.Item>
                )}

                <Divider className="my-8" />

                <div className="flex justify-end gap-3 mt-8">
                  <Button
                    onClick={() => setStep("select")}
                    disabled={isSubmitting}
                  >
                    {t("admin.users.add.form.prev")}
                  </Button>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={isSubmitting}
                    icon={<UserAddOutlined />}
                    className="bg-[#0F172A]"
                  >
                    {t("admin.users.add.form.save", { role: libelleRole(userType) })}
                  </Button>
                </div>
              </Form>
            </Card>
          )}
        </div>
      </div>
    </>
  );
};

export default AddUserpepanse;
