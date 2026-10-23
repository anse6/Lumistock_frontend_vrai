// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import { getUrlServer } from './../../configServer';
// import { useNavigate } from 'react-router-dom';

// interface Notification {
//   id: string;
//   title: string;
//   message: string;
//   created_at: string;
//   vu: boolean;
//   archivee: boolean;
// }

// const Notifier: React.FC = () => {
//   const [isLoaded, setIsLoaded] = useState(false);
//   const [notifications, setNotifications] = useState<Notification[]>([]);
//   const [archivedNotifications, setArchivedNotifications] = useState<Notification[]>([]);
//   const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
//   const [showArchived, setShowArchived] = useState(false); 
//   const [isValidating, setIsValidating] = useState(false);
//   const [isRejecting, setIsRejecting] = useState(false);
//   const [isArchiving, setIsArchiving] = useState<string | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [successMessage, setSuccessMessage] = useState<string | null>(null);
//   const [errorMessage, setErrorMessage] = useState<string | null>(null);
//   const navigate = useNavigate();

//   useEffect(() => {
//     const timer = setTimeout(() => setIsLoaded(true), 300);
//     return () => clearTimeout(timer);
//   }, []);

//   const showSuccessMessage = (message: string) => {
//     setSuccessMessage(message);
//     setTimeout(() => setSuccessMessage(null), 4000);
//   };

//   const showErrorMessage = (message: string) => {
//     setErrorMessage(message);
//     setTimeout(() => setErrorMessage(null), 4000);
//   };

//   const fetchNotifications = async () => {
//     try {
//       setLoading(true);
//       const token = localStorage.getItem('access_token');
      
//       if (!token) {
//         setError('Token d\'authentification manquant');
//         return;
//       }

//       const response = await axios.get(`${getUrlServer()}/notifications`, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//           'Content-Type': 'application/json',
//         },
//       });

//       const allNotifications = response.data;
//       setNotifications(allNotifications.filter((notif: Notification) => !notif.archivee));
//       setArchivedNotifications(allNotifications.filter((notif: Notification) => notif.archivee));
//       setError(null);
//     } catch (err) {
//       console.error('Erreur lors de la récupération des notifications:', err);
//       setError('Erreur lors du chargement des notifications');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const markNotificationAsViewed = async (notificationId: string) => {
//     try {
//       const token = localStorage.getItem('access_token');
      
//       if (!token) {
//         setError('Token d\'authentification manquant');
//         return;
//       }

//       await axios.patch(
//         `${getUrlServer()}/notifications/${notificationId}/vu`,
//         {},
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//             'Content-Type': 'application/json',
//           },
//         }
//       );
//     } catch (err) {
//       console.error('Erreur lors du marquage comme vu:', err);
//     }
//   };

//   const archiveNotification = async (notificationId: string) => {
//     try {
//       setIsArchiving(notificationId);
//       const token = localStorage.getItem('access_token');
      
//       if (!token) {
//         setError('Token d\'authentification manquant');
//         return;
//       }

//       await axios.patch(
//         `${getUrlServer()}/notifications/archive/${notificationId}`,
//         {},
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//             'Content-Type': 'application/json',
//           },
//         }
//       );
//       showSuccessMessage('Notification archivée avec succès !');
//       setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
//       await fetchNotifications();
//     } catch (err) {
//       console.error('Erreur lors de l\'archivage:', err);
//       showErrorMessage('Erreur lors de l\'archivage de la notification');
//     } finally {
//       setIsArchiving(null);
//     }
//   };

//   const parseNotificationMessage = (message: string) => {
//     const details = {
//       date: '',
//       livreur: '',
//       client: '',
//       montantTotal: '',
//       montantPaye: '',
//       ristourne: '',
//       deliveryId: ''
//     };

//     const dateMatch = message.match(/le ([\d-]+ [\d:.]+)/);
//     if (dateMatch) details.date = new Date(dateMatch[1]).toLocaleString('fr-FR');

//     const livreurMatch = message.match(/par le livreur nommé ([^au]+)/);
//     if (livreurMatch) details.livreur = livreurMatch[1].trim();

//     const clientMatch = message.match(/au client ([^.]+)/);
//     if (clientMatch) details.client = clientMatch[1].trim();

//     const montantTotalMatch = message.match(/Montant total : ([\d.]+)/);
//     if (montantTotalMatch) details.montantTotal = montantTotalMatch[1];

//     const montantPayeMatch = message.match(/montant payé : ([\d.]+)/);
//     if (montantPayeMatch) details.montantPaye = montantPayeMatch[1];

//     const ristourneMatch = message.match(/ristourne : ([\d.]+)/);
//     if (ristourneMatch) details.ristourne = ristourneMatch[1];

//     const idMatch = message.match(/ID : ([a-f\d]{24})/i);
//     if (idMatch) details.deliveryId = idMatch[1];

//     return details;
//   };

//   const handleValidate = async () => {
//     if (!selectedNotification) return;

//     const notificationDetails = parseNotificationMessage(selectedNotification.message);
//     const deliveryId = notificationDetails.deliveryId;

//     if (!deliveryId) {
//       showErrorMessage('ID de livraison introuvable dans le message');
//       return;
//     }

//     try {
//       setIsValidating(true);
//       const token = localStorage.getItem('access_token');
      
//       if (!token) {
//         setError('Token d\'authentification manquant');
//         return;
//       }

//       const response = await axios.post(
//         `${getUrlServer()}/livraisons/valider-ristourne/${deliveryId}`,
//         {},
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//             'Content-Type': 'application/json',
//           },
//         }
//       );

//       if (response.status === 200) {
//         await markNotificationAsViewed(selectedNotification.id);
//         showSuccessMessage('Ristourne validée avec succès !');
//         navigate('/admin/dashboard/deliverys');
//         setNotifications(prev => prev.filter(notif => notif.id !== selectedNotification.id));
//         setArchivedNotifications(prev => prev.filter(notif => notif.id !== selectedNotification.id));
//         setSelectedNotification(null);
//       }
//     } catch (err) {
//       console.error('Erreur lors de la validation:', err);
//       showErrorMessage('Erreur lors de la validation de la ristourne');
//     } finally {
//       setIsValidating(false);
//     }
//   };

//   const handleReject = async () => {
//     if (!selectedNotification) return;

//     const notificationDetails = parseNotificationMessage(selectedNotification.message);
//     const deliveryId = notificationDetails.deliveryId;

//     if (!deliveryId) {
//       showErrorMessage('ID de livraison introuvable dans le message');
//       return;
//     }

//     try {
//       setIsRejecting(true);
//       const token = localStorage.getItem('access_token');
      
//       if (!token) {
//         setError('Token d\'authentification manquant');
//         return;
//       }

//       const response = await axios.post(
//         `${getUrlServer()}/livraisons/rejeter-ristourne/${deliveryId}`,
//         {},
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//             'Content-Type': 'application/json',
//           },
//         }
//       );

//       if (response.status === 200) {
//         await markNotificationAsViewed(selectedNotification.id);
//         showSuccessMessage('Ristourne rejetée avec succès !');
//         setNotifications(prev => prev.filter(notif => notif.id !== selectedNotification.id));
//         setArchivedNotifications(prev => prev.filter(notif => notif.id !== selectedNotification.id));
//         setSelectedNotification(null);
//       }
//     } catch (err) {
//       console.error('Erreur lors du rejet:', err);
//       showErrorMessage('Erreur lors du rejet de la ristourne');
//     } finally {
//       setIsRejecting(false);
//     }
//   };

// useEffect(() => {
//   fetchNotifications(); // récupération initiale
//   const interval = setInterval(() => {
//     fetchNotifications(); // refaire le GET toutes les 5 secondes
//   }, 10000); // 5000 ms = 10 secondes

//   return () => clearInterval(interval); // nettoyage à la destruction du composant
// }, []);


//   if (loading) {
//     return (
//       <div className="w-full p-3 sm:p-6 bg-white min-h-screen">
//         <div className="flex items-center justify-center h-32 sm:h-64">
//           <div className="animate-spin rounded-full h-6 w-6 sm:h-12 sm:w-12 border-b-2 border-[#0F172A]"></div>
//           <span className="ml-2 text-xs sm:text-lg text-gray-600">Chargement...</span>
//         </div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="w-full p-3 sm:p-6 bg-white min-h-screen">
//         <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
//           <div className="flex items-center">
//             <i className="fas fa-exclamation-triangle text-red-600 mr-2 text-sm"></i>
//             <span className="text-red-800 text-xs sm:text-sm">{error}</span>
//           </div>
//           <button 
//             onClick={fetchNotifications}
//             className="mt-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-xs sm:text-sm"
//           >
//             Réessayer
//           </button>
//         </div>
//       </div>
//     );
//   }

//   if (notifications.length === 0 && archivedNotifications.length === 0) {
//     return (
//       <div className="w-full p-3 sm:p-6 bg-white min-h-screen">
//         <div className="text-center py-6 sm:py-12">
//           <i className="fas fa-bell-slash text-gray-400 text-xl sm:text-4xl mb-3"></i>
//           <h3 className="text-sm sm:text-lg font-medium text-gray-900 mb-2">Aucune notification</h3>
//           <p className="text-gray-500 text-xs sm:text-base px-4">Il n'y a actuellement aucune notification à traiter.</p>
//           <button 
//             onClick={fetchNotifications}
//             className="mt-3 px-3 py-1.5 sm:px-4 sm:py-2 bg-[#0F172A] text-white rounded-lg hover:bg-[#1E293B] text-xs sm:text-sm"
//           >
//             Actualiser
//           </button>
//         </div>
//       </div>
//     );
//   }

//   const notificationDetails = selectedNotification ? parseNotificationMessage(selectedNotification.message) : null;

//   return (
//     <div className={`w-full min-h-screen bg-white overflow-hidden transform transition-all duration-700 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
      
//       {/* Messages de succès/erreur - Mobile optimized */}
//       {successMessage && (
//         <div className="fixed top-2 left-2 right-2 sm:top-4 sm:right-4 sm:left-auto z-50 animate-fade-in">
//           <div className="bg-green-500 text-white px-3 py-2 sm:px-4 sm:py-3 rounded-lg shadow-lg flex items-center space-x-2">
//             <i className="fas fa-check-circle text-sm"></i>
//             <span className="text-xs sm:text-sm font-medium">{successMessage}</span>
//           </div>
//         </div>
//       )}
//       {errorMessage && (
//         <div className="fixed top-2 left-2 right-2 sm:top-4 sm:right-4 sm:left-auto z-50 animate-fade-in">
//           <div className="bg-red-500 text-white px-3 py-2 sm:px-4 sm:py-3 rounded-lg shadow-lg flex items-center space-x-2">
//             <i className="fas fa-exclamation-circle text-sm"></i>
//             <span className="text-xs sm:text-sm font-medium">{errorMessage}</span>
//           </div>
//         </div>
//       )}

//       {/* En-tête - Mobile optimized */}
//       <div className="bg-gradient-to-r from-[#0F172A] to-slate-800 px-3 sm:px-8 py-3 sm:py-6 text-white relative overflow-hidden">
//         <div className="absolute inset-0 bg-[#0F172A] opacity-20 animate-pulse"></div>
//         <div className="relative z-10 space-y-2 sm:space-y-0 sm:flex sm:items-center sm:justify-between">
//           <div>
//             <h1 className="text-base sm:text-2xl font-bold tracking-wide">Notifications</h1>
//             <p className="text-slate-200 text-xs sm:text-sm mt-0.5">
//               {showArchived ? archivedNotifications.length : notifications.length} notification{showArchived ? archivedNotifications.length > 1 ? 's' : '' : notifications.length > 1 ? 's' : ''} {showArchived ? 'archivée(s)' : 'en attente'}
//             </p>
//           </div>
//           <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
//             <button
//               onClick={fetchNotifications}
//               className="bg-yellow-400 text-white border-2 border-transparent px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg transition-colors text-xs sm:text-sm flex items-center justify-center"
//             >
//               <i className="fas fa-sync-alt mr-1.5 text-xs"></i>
//               <span className="hidden sm:inline">Actualiser</span>
//               <span className="sm:hidden">Actualiser</span>
//             </button>
//             <button
//               onClick={() => setShowArchived(!showArchived)}
//               className="bg-yellow-400 text-white border-2 border-transparent px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg transition-colors text-xs sm:text-sm flex items-center justify-center"
//             >
//               <i className="fas fa-archive mr-1.5 text-xs"></i>
//               <span className="hidden sm:inline">{showArchived ? 'Notifications en attente' : 'Notifications archivées'}</span>
//               <span className="sm:hidden">{showArchived ? 'En attente' : 'Archivées'}</span>
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* Liste des notifications - Mobile optimized */}
//       <div className="p-2 sm:p-4 bg-gray-50 border-b">
//         <h3 className="text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3">
//           {showArchived ? 'Notifications archivées' : 'Notifications en attente'}
//         </h3>
//         <div className="space-y-1.5 sm:space-y-2">
//           {(showArchived ? archivedNotifications : notifications).map((notification) => (
//             <div key={notification.id} className="flex items-start space-x-2">
//               <button
//                 onClick={() => setSelectedNotification(notification)}
//                 className={`flex-1 text-left p-2.5 sm:p-3 rounded-lg border transition-colors ${
//                   selectedNotification?.id === notification.id
//                     ? 'bg-slate-50 border-slate-300 text-slate-800'
//                     : 'bg-white border-gray-200 hover:bg-gray-50'
//                 }`}
//               >
//                 <div className="flex flex-col space-y-1 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
//                   <span className="font-medium text-xs sm:text-sm line-clamp-1">{notification.title}</span>
//                   <span className="text-xs text-gray-500 self-start sm:self-auto">
//                     {new Date(notification.created_at).toLocaleString('fr-FR', {
//                       day: '2-digit',
//                       month: '2-digit',
//                       hour: '2-digit',
//                       minute: '2-digit'
//                     })}
//                   </span>
//                 </div>
//                 <p className="text-xs text-gray-600 mt-1 line-clamp-2">
//                   {notification.message.substring(0, 60)}...
//                 </p>
//               </button>
//               {!showArchived && (
//                 <button
//                   onClick={() => archiveNotification(notification.id)}
//                   disabled={isArchiving === notification.id || isValidating || isRejecting}
//                   className={`p-2 sm:p-2.5 rounded-lg transition-colors shrink-0 ${
//                     isArchiving === notification.id || isValidating || isRejecting
//                       ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
//                       : 'bg-blue-600 text-white hover:bg-blue-700'
//                   }`}
//                 >
//                   {isArchiving === notification.id ? (
//                     <i className="fas fa-spinner animate-spin text-xs"></i>
//                   ) : (
//                     <i className="fas fa-archive text-xs"></i>
//                   )}
//                   <span>archiver</span>
//                 </button>
//               )}
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* Modal des détails de notification - Mobile optimized */}
//       {selectedNotification && notificationDetails && (
//         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-2 sm:p-4">
//           <div className="bg-white rounded-lg w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
//             <div className="p-3 sm:p-6 space-y-3 sm:space-y-6">
//               {/* Modal Header - Mobile optimized */}
//               <div className="flex justify-between items-start border-b pb-2 sm:pb-3">
//                 <h3 className="text-sm sm:text-xl font-semibold text-gray-900 pr-2 leading-tight">{selectedNotification.title}</h3>
//                 <button
//                   onClick={() => setSelectedNotification(null)}
//                   className="text-gray-500 hover:text-gray-700 text-xl sm:text-2xl font-bold shrink-0"
//                   aria-label="Fermer"
//                 >
//                   &times;
//                 </button>
//               </div>

//               {/* Statut de Livraison - Mobile optimized */}
//               <div className="flex items-center space-x-2 sm:space-x-4 p-2.5 sm:p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border border-orange-100">
//                 <div className="w-8 h-8 sm:w-12 sm:h-12 bg-orange-500 rounded-full flex items-center justify-center animate-pulse shrink-0">
//                   <i className="fas fa-exclamation-triangle text-white text-sm sm:text-xl"></i>
//                 </div>
//                 <div className="min-w-0">
//                   <h3 className="text-sm sm:text-lg font-semibold text-slate-800">Ristourne en Attente</h3>
//                   <p className="text-orange-600 text-xs sm:text-sm font-medium">Validation requise</p>
//                 </div>
//               </div>

//               {/* Détails de la Livraison - Mobile optimized */}
//               <div className="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-1 lg:grid-cols-2 sm:gap-6">
//                 <div className="bg-blue-50 rounded-lg p-2.5 sm:p-4">
//                   <h5 className="font-semibold text-slate-800 mb-1.5 sm:mb-2 flex items-center text-xs sm:text-base">
//                     <i className="fas fa-user text-blue-600 mr-1.5 text-xs sm:text-sm"></i>
//                     Informations Livreur
//                   </h5>
//                   <p className="text-slate-700 font-medium text-xs sm:text-base break-words">{notificationDetails.livreur}</p>
//                   <p className="text-slate-600 text-xs sm:text-sm mt-0.5 sm:mt-1 break-words">Client: {notificationDetails.client}</p>
//                   <p className="text-slate-600 text-xs sm:text-sm break-words">Date: {notificationDetails.date}</p>
//                 </div>

//                 <div className="bg-green-50 rounded-lg p-2.5 sm:p-4">
//                   <h5 className="font-semibold text-slate-800 mb-1.5 sm:mb-2 flex items-center text-xs sm:text-base">
//                     <i className="fas fa-money-bill-wave text-green-600 mr-1.5 text-xs sm:text-sm"></i>
//                     Détails Financiers
//                   </h5>
//                   <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
//                     <div className="flex justify-between">
//                       <span className="text-slate-600">Montant total:</span>
//                       <span className="font-medium">{notificationDetails.montantTotal} CFA</span>
//                     </div>
//                     <div className="flex justify-between">
//                       <span className="text-slate-600">Montant payé:</span>
//                       <span className="font-medium">{notificationDetails.montantPaye} CFA</span>
//                     </div>
//                     <div className="flex justify-between border-t pt-1.5 sm:pt-2">
//                       <span className="text-slate-600">Ristourne:</span>
//                       <span className="font-bold text-red-600">{notificationDetails.ristourne} CFA</span>
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               {/* ID de Livraison - Mobile optimized */}
//               <div className="bg-gray-50 rounded-lg p-2.5 sm:p-4">
//                 <h5 className="font-semibold text-slate-800 mb-1.5 sm:mb-2 flex items-center text-xs sm:text-base">
//                   <i className="fas fa-hashtag text-gray-600 mr-1.5 text-xs sm:text-sm"></i>
//                   ID de Livraison
//                 </h5>
//                 <p className="text-slate-700 font-mono text-xs sm:text-sm bg-white px-2 py-1.5 sm:px-3 sm:py-2 rounded border break-all">
//                   {notificationDetails.deliveryId}
//                 </p>
//                 {!notificationDetails.deliveryId && (
//                   <p className="text-red-500 text-xs mt-1">⚠️ ID de livraison non détecté dans le message</p>
//                 )}
//               </div>

//               {/* Message complet - Mobile optimized */}
//               <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2.5 sm:p-4">
//                 <h5 className="font-semibold text-slate-800 mb-1.5 sm:mb-2 flex items-center text-xs sm:text-base">
//                   <i className="fas fa-info-circle text-yellow-600 mr-1.5 text-xs sm:text-sm"></i>
//                   Message de Notification
//                 </h5>
//                 <p className="text-slate-700 text-xs sm:text-sm leading-relaxed break-words">{selectedNotification.message}</p>
//               </div>

//               {/* Boutons d'action - Mobile optimized */}
//               <div className="space-y-2 sm:space-y-3">
//                 <button
//                   onClick={handleValidate}
//                   disabled={isValidating || isRejecting || !notificationDetails.deliveryId}
//                   className={`w-full rounded-lg py-2.5 sm:py-3 px-3 sm:px-4 text-white font-semibold text-sm sm:text-lg transition-all duration-300 transform ${
//                     isValidating || isRejecting || !notificationDetails.deliveryId
//                       ? 'bg-gray-400 scale-95' 
//                       : 'bg-green-600 hover:bg-green-700 hover:scale-105 active:scale-95'
//                   } shadow-lg hover:shadow-xl disabled:cursor-not-allowed`}
//                 >
//                   <div className="flex items-center justify-center space-x-1.5 sm:space-x-3">
//                     {isValidating ? (
//                       <>
//                         <i className="fas fa-spinner animate-spin text-sm"></i>
//                         <span>Validation...</span>
//                       </>
//                     ) : (
//                       <>
//                         <i className="fas fa-check-circle text-sm"></i>
//                         <span>Valider la Ristourne</span>
//                       </>
//                     )}
//                   </div>
//                 </button>

//                 <button
//                   onClick={handleReject}
//                   disabled={isValidating || isRejecting || !notificationDetails.deliveryId}
//                   className={`w-full rounded-lg py-2.5 sm:py-3 px-3 sm:px-4 text-white font-semibold text-sm sm:text-lg transition-all duration-300 transform ${
//                     isValidating || isRejecting || !notificationDetails.deliveryId
//                       ? 'bg-gray-400 scale-95' 
//                       : 'bg-red-600 hover:bg-red-700 hover:scale-105 active:scale-95'
//                   } shadow-lg hover:shadow-xl disabled:cursor-not-allowed`}
//                 >
//                   <div className="flex items-center justify-center space-x-1.5 sm:space-x-3">
//                     {isRejecting ? (
//                       <>
//                         <i className="fas fa-spinner animate-spin text-sm"></i>
//                         <span>Rejet...</span>
//                       </>
//                     ) : (
//                       <>
//                         <i className="fas fa-times-circle text-sm"></i>
//                         <span>Rejeter la Ristourne</span>
//                       </>
//                     )}
//                   </div>
//                 </button>

//                 <button
//                   onClick={async () => {
//                     if (selectedNotification) {
//                       try {
//                         await markNotificationAsViewed(selectedNotification.id);
//                         setNotifications(prev => prev.filter(notif => notif.id !== selectedNotification.id));
//                         setArchivedNotifications(prev => prev.filter(notif => notif.id !== selectedNotification.id));
//                         setSelectedNotification(null);
//                         showSuccessMessage('Notification marquée comme vue');
//                       // eslint-disable-next-line @typescript-eslint/no-unused-vars
//                       } catch (error) {
//                         showErrorMessage('Erreur lors du marquage comme vu');
//                       }
//                     }
//                   }}
//                   disabled={isValidating || isRejecting}
//                   className={`w-full py-2 sm:py-2.5 px-3 sm:px-4 font-medium text-sm sm:text-base rounded-lg transition-colors border ${
//                     isValidating || isRejecting 
//                       ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' 
//                       : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
//                   }`}
//                 >
//                   <div className="flex items-center justify-center space-x-1.5 sm:space-x-2">
//                     <i className="fas fa-eye text-sm"></i>
//                     <span>Marquer comme vu</span>
//                   </div>
//                 </button>

//                 <button
//                   onClick={() => setSelectedNotification(null)}
//                   className="w-full py-2 sm:py-2.5 px-3 sm:px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm sm:text-base"
//                 >
//                   Fermer
//                 </button>

//                 <p className="text-center text-slate-500 text-xs mt-2 sm:mt-3 px-2">
//                   Validez pour approuver, rejetez pour refuser, ou marquez comme vu
//                 </p>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Pied de page - Mobile optimized */}
//       <div className="bg-gray-50 px-3 sm:px-8 py-2.5 sm:py-4 border-t border-gray-200">
//         <div className="flex flex-col space-y-1.5 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between text-xs sm:text-sm text-slate-600">
//           <div className="flex items-center space-x-1.5 sm:space-x-2">
//             <i className="fas fa-headset text-[#0F172A] text-xs sm:text-sm"></i>
//             <span>Support : 01 23 45 67 89</span>
//           </div>
//           <div className="flex items-center space-x-1.5 sm:space-x-2">
//             <i className="fas fa-envelope text-[#0F172A] text-xs sm:text-sm"></i>
//             <span>support@boutique.fr</span>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Notifier;


