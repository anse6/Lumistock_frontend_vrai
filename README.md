
# TK RETAIL – Suivi et gestion des livraisons

**TK DADA** est une application web de gestion et de suivi de livraisons de commandes. Elle offre aux utilisateurs un **tableau de bord** pour visualiser l’état des livraisons, l'etat de generation des revenues/profit avec le **diagrammes des revenues**, les clients ayant passé le plus de commandes **le diagramme de meilleur clients**, les statistique de ventes ainsi que les meilleurs produits vendues. Le suivi détaillé des commandes en cours. Conçue pour être intuitive, l’interface permet aux clients et aux gestionnaires logistiques de voir l’avancement des livraisons (statuts, estimations, historique) et de recevoir des notifications  sur chaque étape du trajet.

## Fonctionnalités principales

- **Tableau de bord centralisé pour chaque utilisateur** : vision globale des livraisons (en attente, en cours, livrées, retardataires, le diagramme des revenues, les produits les plus vendues, la zone de ve,te maximale et les statistique  de payement), avec filtres par date, statut ou zone géographique.  
- **Carte interactive** : visualisation en temps réel des livrasions   des livreurs. (Basée sur [Leaflet](https://leafletjs.com))  
- **Suivi des client** : mise à jour automatique (via WebSockets ou polling) pour refléter l’état actuel des livraisons.  
- **Gestion des livraisons** : historique des commandes, détails de chaque livraison (adresse, produits, destinataire) et modifications possibles en cas de besoin.  
-**la bonne gestion des utilisateurs par le staff** : le profil de staff permet de gerer tous les utilisateur du systeme et la creation des magasins.
-**la gestion des magasins par l'admin ou le manager**: en approvisionnant les livreurs avec le posibilité de livreur les client.
-**les livreurs chargés d'effectuer la livraison au client**.



Ces fonctionnalités clés facilitent la communication entre le centre de commande et les livreurs, améliorant la satisfaction client grâce à une visibilité totale sur le processus de livraison.

## Technologies utilisées

- **Frontend** : React (avec TypeScript) 🚀, créé avec **Vite** pour un développement rapide et modulaire.  
- **Backend** : Flask pour l’API et la logique métier (gestion des itinéraires, mises à jour temps réel).  
- **Base de données** : MongoDB, base de données NoSQL utilisée pour stocker les informations des commandes et des trajets.  

Chaque technologie dispose d’une documentation officielle détaillée : [React](https://react.dev/) ([React](https://react.dev/#:~:text=React)), [TypeScript](https://www.typescriptlang.org/docs/) ([TypeScript: The starting point for learning TypeScript](https://www.typescriptlang.org/docs/#:~:text=TypeScript%20Documentation)), [Vite](https://vite.dev/) ([Getting Started | Vite](https://vite.dev/guide/#:~:text=Vite%20requires%20Node,package%20manager%20warns%20about%20it)), [Flask](https://flask.palletsprojects.com/) ([Welcome to Flask — Flask Documentation (3.1.x)](https://flask.palletsprojects.com/#:~:text=Welcome%20to%20Flask%E2%80%99s%20documentation,scale%20up%20to%20complex%20applications)) et [MongoDB](https://docs.mongodb.com/manual/) ([What is MongoDB? - Database Manual v8.0 - MongoDB Docs](https://www.mongodb.com/docs/manual/#:~:text=MongoDB%20is%20a%20document%20database,of%20application%20development%20and%20scaling)). Ces ressources permettent de comprendre le fonctionnement de chaque outil et de trouver des solutions en cas de besoin.

## Prérequis (outils nécessaires)

Pour installer et lancer le frontend de **TK RETAIL** en local, les outils suivants sont requis :  

- **Node.js** (version **18+ recommandée**). Vite nécessite Node.js 18 ou supérieur ([Getting Started | Vite](https://vite.dev/guide/#:~:text=Vite%20requires%20Node,package%20manager%20warns%20about%20it)). Téléchargez l’installateur LTS depuis le site officiel [nodejs.org](https://nodejs.org/) ([Downloading and installing Node.js and npm | npm Docs](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm#:~:text=OS%20X%20or%20Windows%20Node,installers)) (il inclut également npm).  
- **npm** (inclus avec Node.js). Assurez-vous d’avoir une version récente de npm. En cas de problème d’installation de paquets, il est conseillé de mettre à jour npm vers la dernière version stable ([Common errors | npm Docs](https://docs.npmjs.com/common-errors/#:~:text=No%20compatible%20version%20found)).  
- **Yarn** (optionnel) : gestionnaire de paquets alternatif. Si vous préférez utiliser Yarn, installez-le depuis le site officiel [classic.yarnpkg.com](https://classic.yarnpkg.com/) ou via npm (`npm install -g yarn`).  
- **Git** : pour cloner le dépôt du projet. Téléchargez-le depuis [git-scm.com](https://git-scm.com/).  
- **éditeur de code** (ex. VS Code, WebStorm) recommandé pour modifier le code source.  

Vérifiez que les outils sont bien installés en exécutant :  
```bash
node -v   # Doit afficher la version de Node (>=18)
npm -v    # Version de npm
git --version
```  
En cas d’erreurs (“`command not found`”), installez ou configurez les outils en suivant leur documentation officielle ([Downloading and installing Node.js and npm | npm Docs](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm#:~:text=OS%20X%20or%20Windows%20Node,installers)) ([Getting Started | Vite](https://vite.dev/guide/#:~:text=Vite%20requires%20Node,package%20manager%20warns%20about%20it)).

## Installation du frontend et lancement local

1. **Cloner le dépôt** : récupérez le code du frontend (par exemple) et placez-vous dans le dossier du projet :  
   ```bash
   git clone https://github.com/votre-utilisateur/tkdada-frontend.git
   cd tkdada-frontend
   ```  
2. **Installer les dépendances** : exécutez la commande d’installation (npm ou Yarn selon votre choix) :  
   ```bash
   npm install
   ```  
   ou, si vous utilisez Yarn :  
   ```bash
   yarn install
   ```  
   Cette étape télécharge toutes les bibliothèques nécessaires (React, Vite, etc.).  
3. **Configurer les variables d’environnement** (si nécessaire) : créez un fichier `.env` à la racine (ex. `.env.local`) et spécifiez les variables (URLs d’API, clés, etc.). Exemple :  
   ```
   VITE_API_URL=https://api.tkdada.example.com
   ```  
4. **Lancer le serveur de développement** : démarrez l’application en mode développement :  
   ```bash
   npm run dev
   ```  
   ou avec Yarn :  
   ```bash
   yarn dev
   ```  
   Le serveur Vite se lance et compile automatiquement le code. L’application sera accessible par défaut sur [http://localhost:5173](http://localhost:5173) (ou un autre port indiqué dans le terminal).  
5. **Accéder à l’application** : ouvrez un navigateur et rendez-vous à l’adresse indiquée (par exemple `http://localhost:5173`). Vous devriez voir le tableau la page  de connexion de  TK DADA avec les données. Toute modification du code source déclenche un rechargement automatique du navigateur (Hot Module Replacement).  

Si le lancement échoue, vérifiez que votre fichier `.env` (s’il existe) est correct et que l’URL de l’API backend est valide. La documentation de **Vite** contient des indications sur le [déploiement en local](https://vite.dev/) ([Getting Started | Vite](https://vite.dev/guide/#:~:text=Vite%20requires%20Node,package%20manager%20warns%20about%20it)) et peut aider en cas de problème de démarrage.

## Scripts npm utiles

Le projet front-end dispose de scripts npm prédéfinis dans le `package.json`. Voici les plus courants :  

| Script               | Description                                        |
| -------------------- | -------------------------------------------------- |
| `npm run dev`        | Lance le serveur de développement (mode watch)     |
| `npm run build`      | Compile le frontend pour la production (dossier `dist/`) |
| `npm run preview`    | Démarre un serveur de preview sur le build local   |
| `npm run lint`       | Analyse le code avec **ESLint** (finds bugs/style) |
| `npm run format`     | Formate le code avec **Prettier**                  |

```bash
npm run build   # Ex: création du build de production
npm run lint    # Vérifie les problèmes de style/erreurs de code
npm run format  # Applique le formatage automatique (Prettier)
```  
Ces scripts utilisent Vite, ESLint et Prettier configurés pour ce projet. Vous pouvez les exécuter à tout moment pour vérifier la qualité du code ou préparer un déploiement.

## Dépannage (erreurs fréquentes)

Lors de l’installation ou du lancement, certains problèmes courants peuvent survenir :

- **Node.js non installé ou version trop ancienne** : le message `npm: command not found` ou une version `<18` signale un problème. Installez ou mettez à jour Node.js via le site officiel ([Downloading and installing Node.js and npm | npm Docs](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm#:~:text=OS%20X%20or%20Windows%20Node,installers)). Vite requiert Node 18+ ([Getting Started | Vite](https://vite.dev/guide/#:~:text=Vite%20requires%20Node,package%20manager%20warns%20about%20it)). Après installation, redémarrez votre terminal pour que la commande `node` soit reconnue.  
- **Échec de `npm install` / problèmes de dépendances** : essayez d’abord de vider le cache npm :  
  ```bash
  npm cache clean --force
  npm install
  ```  
  La documentation npm note que cette commande peut résoudre des problèmes aléatoires ([Common errors | npm Docs](https://docs.npmjs.com/common-errors/#:~:text=,option%20to%20see%20more%20details)). Si le problème persiste, mettez à jour npm (`npm install -g npm`) comme recommandé ([Common errors | npm Docs](https://docs.npmjs.com/common-errors/#:~:text=No%20compatible%20version%20found)). Vérifiez aussi vos droits (évitez d’installer globalement en mode admin si possible).  
- **Erreurs TypeScript** : des erreurs de compilation TS (`tsc`) peuvent apparaître si des types manquent. Par exemple, installez les définitions TypeScript pour React :  
  ```bash
  npm install --save-dev @types/react @types/react-dom
  ```  
  Assurez-vous que le fichier `tsconfig.json` est valide. La documentation TypeScript détaille les options de configuration et les solutions aux erreurs courantes ([TypeScript: The starting point for learning TypeScript](https://www.typescriptlang.org/docs/#:~:text=TypeScript%20Documentation)).  
- **Erreurs ESLint** : si l’analyse du code renvoie des erreurs (plugins manquants, problèmes de configuration), vérifiez le fichier `.eslintrc.js` ou `.eslintrc.json`. Installez les plugins recommandés (`eslint-plugin-react`, `@typescript-eslint/parser`, `@typescript-eslint/eslint-plugin`, etc.) selon la documentation du projet. La documentation officielle d’ESLint fournit des guides pour configurer et résoudre les problèmes du linter ([Find and fix problems in your JavaScript code - ESLint - Pluggable JavaScript Linter](https://eslint.org/#:~:text=ESLint%20is%20an%20open%20source,code%20live%20its%20best%20life)).  
- **Problèmes spécifiques Windows** : sur Windows, il arrive que `npm install` plante à cause de chemins trop longs ou d’espaces. La doc npm suggère de vérifier que le dossier `%APPDATA%\npm` existe et que vous avez les droits nécessaires ([Common errors | npm Docs](https://docs.npmjs.com/common-errors/#:~:text=,see%20%20191)). En dernier recours, réinstallez Node.js avec l’installateur officiel (méthode recommandée sur Windows) ([Common errors | npm Docs](https://docs.npmjs.com/common-errors/#:~:text=,see%20%20191)).  

En cas de doutes, consultez les pages de documentation officielles (voir ci-dessous) ou recherchez le message d’erreur exact sur des forums comme StackOverflow(👉 https://stackoverflow.com). Les liens suivants sont très utiles pour résoudre les erreurs courantes.

## Documentation officielle et liens utiles

- **Node.js / npm** : [nodejs.org](https://nodejs.org/) ([Downloading and installing Node.js and npm | npm Docs](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm#:~:text=OS%20X%20or%20Windows%20Node,installers)) (téléchargement, installation). Doc npm (erreurs courantes) : [docs.npmjs.com/common-errors](https://docs.npmjs.com/common-errors/) ([Common errors | npm Docs](https://docs.npmjs.com/common-errors/#:~:text=,option%20to%20see%20more%20details)).  
- **React** : [react.dev](https://react.dev/) ([React](https://react.dev/#:~:text=React)) (guide officiel).  
- **TypeScript** : [typescriptlang.org/docs](https://www.typescriptlang.org/docs/) ([TypeScript: The starting point for learning TypeScript](https://www.typescriptlang.org/docs/#:~:text=TypeScript%20Documentation)).  
- **Vite** : [vite.dev](https://vite.dev/) ([Getting Started | Vite](https://vite.dev/guide/#:~:text=Vite%20requires%20Node,package%20manager%20warns%20about%20it)) (guide d’installation et d’utilisation).  
- **Flask (backend)** : [flask.palletsprojects.com](https://flask.palletsprojects.com/) ([Welcome to Flask — Flask Documentation (3.1.x)](https://flask.palletsprojects.com/#:~:text=Welcome%20to%20Flask%E2%80%99s%20documentation,scale%20up%20to%20complex%20applications)) (doc Python de Flask).  
- **MongoDB** : [docs.mongodb.com/manual](https://docs.mongodb.com/manual/) ([What is MongoDB? - Database Manual v8.0 - MongoDB Docs](https://www.mongodb.com/docs/manual/#:~:text=MongoDB%20is%20a%20document%20database,of%20application%20development%20and%20scaling)) (documentation serveur MongoDB, concepts de base de données).  
- **ESLint** : [eslint.org](https://eslint.org/) ([Find and fix problems in your JavaScript code - ESLint - Pluggable JavaScript Linter](https://eslint.org/#:~:text=ESLint%20is%20an%20open%20source,code%20live%20its%20best%20life)) (configuration et utilisation du linter).  
- **Prettier** : [prettier.io](https://prettier.io/) (outil de formatage).  

Ces ressources officielles offrent des guides d’installation et des FAQ pour résoudre la plupart des problèmes. Par exemple, la section “Getting started” de Vite et la doc TypeScript couvrent l’installation initiale et les erreurs courantes.

