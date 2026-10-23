import AuthLayout from "./AuthLayout";
import LoginForm from "./LoginForm";
import { useContenu } from "../Public/contenu";

const AuthentificationPage = () => {
  const c = useContenu();
  return (
    <AuthLayout titrePage={c.nav.connexion}>
      <LoginForm />
    </AuthLayout>
  );
};

export default AuthentificationPage;
