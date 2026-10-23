import AuthLayout from "./AuthLayout";
import ResetPasswordForm from "./ResetPasswordForm";
import { useContenu } from "../Public/contenu";

const ResetPassword = () => {
  const c = useContenu();
  return (
    <AuthLayout titrePage={c.auth.reinit.titre}>
      <ResetPasswordForm />
    </AuthLayout>
  );
};

export default ResetPassword;
