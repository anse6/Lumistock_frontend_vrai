import AuthLayout from "./AuthLayout";
import ForgotPasswordForm from "./ForgotPasswordForm";
import { useContenu } from "../Public/contenu";

const ForgotPassword = () => {
  const c = useContenu();
  return (
    <AuthLayout titrePage={c.auth.oubli.titre}>
      <ForgotPasswordForm />
    </AuthLayout>
  );
};

export default ForgotPassword;
