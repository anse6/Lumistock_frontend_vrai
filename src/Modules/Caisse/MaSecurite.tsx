// Caissier : sécurité de son compte (double authentification facultative).
import PageTitle from "../../Components/PageTitle";
import DeuxFacteurs from "../../Components/Securite/DeuxFacteurs";

const MaSecurite = () => (
  <>
    <PageTitle>Sécurité</PageTitle>
    <div className="mx-auto w-full max-w-2xl">
      <DeuxFacteurs />
    </div>
  </>
);

export default MaSecurite;
