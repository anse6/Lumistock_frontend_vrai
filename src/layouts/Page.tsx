import axios from "axios";
import {  useState } from "react";

function Connexion () {

    const[email, setEmail] = useState ('');
    const[motdepasse, setMotdepasse] = useState ('');
    const[erreur, setErreur] = useState <string | null> (null);
    const[succes, setSucces] = useState <string | null> (null);
    
    const handlesubmit = (event : React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const donness = {
            email: email,
            motdepasse: motdepasse,
        };

        axios.post('/api/connexion', donness)
        .then((response) => {
            console.log(response.data)
            setSucces('connexion reussite');
            setErreur(null)
        })
        .catch((error) =>{
            if(error.response){
            setErreur(error.response.data.erreur);
            }
            setSucces(null);
        })
    }
    return (
        <form onSubmit={handlesubmit}>
            <label> email :</label>
            <input type="email" value={email}  onChange={(event) => setEmail(event.target.value)}/>
            <label> mot de passe :</label>
            <input type="motdepasse" value={motdepasse}  onChange={(event) => setMotdepasse(event.target.value)}/>
            <button type="submit"> se connecter</button>
            {erreur && <p style={{color: 'red'}}>{erreur}</p>}
            {succes && <p style={{color: 'red'}}>{succes}</p>}
        </form>

    )
}
export default Connexion;


