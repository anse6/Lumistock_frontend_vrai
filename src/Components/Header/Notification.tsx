import { Bell, Play, Loader2 } from "lucide-react";
import { useState } from "react";
import { getUrlServer } from "../../../configServer"; 

const Notification = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const jouerResumeeIA = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const token = localStorage.getItem('access_token');
      
      const response = await fetch(`${getUrlServer()}/notifications/audio-summary`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error("Erreur serveur");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const audio = new Audio(url);
      
      audio.onplay = () => setIsPlaying(true);
      audio.onended = () => setIsPlaying(false);
      audio.onerror = () => {
        setError("Erreur de lecture");
        setIsPlaying(false);
      };
      
      await audio.play();
    } catch (err: any) {
      setError(err.message || "Erreur de chargement");
      setIsPlaying(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative">
      <div 
        className="p-1 rounded-full hover:bg-gray-100 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="text-gray-600 w-6 h-6 cursor-pointer" />
        <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
      </div>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-72 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden transform opacity-100 scale-100 transition-all">
          <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
            <h3 className="font-semibold text-sm">Assistant Vocal</h3>
          </div>
          
          <div className="p-4">
            <button
              onClick={jouerResumeeIA}
              disabled={isLoading || isPlaying}
              className={`w-full flex items-center justify-center gap-3 p-3 rounded-lg text-sm font-medium transition-all ${
                isPlaying 
                  ? 'bg-green-100 text-green-700 shadow-inner'
                  : 'bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 text-indigo-700 shadow-sm'
              }`}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
              ) : isPlaying ? (
                <>
                  <div className="flex gap-1 items-center h-4">
                    <span className="w-1 h-3 bg-green-500 animate-[pulse_1s_infinite] rounded-full"></span>
                    <span className="w-1 h-4 bg-green-500 animate-[pulse_1.5s_infinite] rounded-full"></span>
                    <span className="w-1 h-2 bg-green-500 animate-[pulse_0.5s_infinite] rounded-full"></span>
                  </div>
                  Lecture en cours...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current text-indigo-600" />
                  Écouter mon IA
                </>
              )}
            </button>
            {error && <p className="text-xs text-red-500 text-center mt-2">{error}</p>}
            
            <p className="text-xs text-gray-400 text-center mt-4">
              L'Assistant collecte en temps réel vos dettes clients et ruptures de stock.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notification;
