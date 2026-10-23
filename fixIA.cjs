const fs = require('fs');

const frPath = 'src/locales/fr/translation.json';
const fr = JSON.parse(fs.readFileSync(frPath, 'utf8'));

fr.admin.ia = {
  title: "Assistant IA Lumistock",
  sidebar: {
    newChat: "Nouvelle discussion",
    loading: "Chargement...",
    noChat: "Aucune conversation",
    startChat: "Commencer une nouvelle conversation",
    messageCount: "{{count}} message",
    messageCount_plural: "{{count}} messages",
    rename: "Renommer",
    delete: "Supprimer"
  },
  welcome: {
    badge: "Propulsé par une IA avancée",
    title: "Bonjour, comment puis-je vous aider ?",
    subtitle: "Posez vos questions sur vos stocks, vos livraisons ou demandez une analyse de performance en temps réel.",
    analysisSuggested: "Analyse Suggérée",
    suggested: {
      stock: "État critique des stocks",
      sales: "Meilleures ventes du mois"
    }
  },
  chat: {
    you: "Vous",
    aiName: "ANSEDEV & STOCK IA",
    typing: "L'IA prépare votre réponse...",
    placeholder: "Votre message ici...",
    hint: "Entrée pour envoyer"
  },
  modals: {
    deleteTitle: "Supprimer cette conversation ?",
    deleteContent: "Cette action est irréversible.",
    cancel: "Annuler",
    delete: "Supprimer"
  },
  messages: {
    loadError: "Impossible de charger les conversations",
    loadConvError: "Impossible de charger la conversation",
    createError: "Impossible de créer une nouvelle conversation",
    createSuccess: "Nouvelle conversation créée",
    renameSuccess: "Conversation renommée",
    renameError: "Impossible de renommer la conversation",
    deleteSuccess: "Conversation supprimée",
    deleteError: "Impossible de supprimer la conversation",
    commError: "Erreur de communication",
    aiNoResponse: "Je n'ai pas pu obtenir de réponse."
  },
  dates: {
    today: "Aujourd'hui",
    yesterday: "Hier",
    daysAgo: "Il y a {{count}} jours"
  }
};

fs.writeFileSync(frPath, JSON.stringify(fr, null, 4));
console.log('French translation fixed for ia');
