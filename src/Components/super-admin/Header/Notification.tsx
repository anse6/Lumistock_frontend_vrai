import { Bell, Play, Loader2, Mic } from "lucide-react";
import { useState } from "react";
import { getUrlServer } from "../../../configServer";

const Notification = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedText, setRecordedText] = useState("");
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

  const poserQuestionIA = async (question: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const token = localStorage.getItem("access_token");
      
      const response = await fetch(`${getUrlServer()}/notifications/ask-voice`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ question })
      });
      
      if (!response.ok) throw new Error("Erreur serveur lors de l'interaction vocale");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const audio = new Audio(url);
      
      audio.onplay = () => setIsPlaying(true);
      audio.onended = () => setIsPlaying(false);
      audio.onerror = () => {
        setError("Erreur de lecture de la réponse");
        setIsPlaying(false);
      };
      
      await audio.play();
    } catch (err: any) {
      setError(err.message || "Erreur de communication avec l'assistant");
      setIsPlaying(false);
    } finally {
      setIsLoading(false);
    }
  };

  const startRecording = () => {
    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Votre navigateur ne supporte pas la reconnaissance vocale.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "fr-FR";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsRecording(true);
      setError(null);
      setRecordedText("");
    };

    recognition.onresult = (event: any) => {
      const speechToText = event.results[0][0].transcript;
      setRecordedText(speechToText);
      poserQuestionIA(speechToText);
    };

    recognition.onerror = (event: any) => {
      setError("Erreur de microphone : " + event.error);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
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
              disabled={isLoading || isPlaying || isRecording}
              className={`w-full flex items-center justify-center gap-3 p-3 rounded-lg text-sm font-medium transition-all ${isPlaying
                ? 'bg-green-100 text-green-700 shadow-inner'
                : 'bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 text-indigo-700 shadow-sm'
                }`}
            >
              {isLoading && !recordedText ? (
                <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
              ) : isPlaying && !recordedText ? (
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
                  Résumé Journalier
                </>
              )}
            </button>

            <button
              onClick={startRecording}
              disabled={isLoading || isPlaying || isRecording}
              className={`w-full flex items-center justify-center gap-3 p-3 mt-3 rounded-lg text-sm font-medium transition-all ${
                isRecording
                  ? 'bg-red-50 border border-red-200 text-red-700 shadow-sm'
                  : 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 shadow-sm'
              }`}
            >
               {isLoading && recordedText ? (
                 <>
                   <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                   Réflexion...
                 </>
               ) : isPlaying && recordedText ? (
                 <>
                   <div className="flex gap-1 items-center h-4">
                     <span className="w-1 h-3 bg-green-500 animate-[pulse_1s_infinite] rounded-full"></span>
                     <span className="w-1 h-4 bg-green-500 animate-[pulse_1.5s_infinite] rounded-full"></span>
                     <span className="w-1 h-2 bg-green-500 animate-[pulse_0.5s_infinite] rounded-full"></span>
                   </div>
                   Réponse en cours...
                 </>
               ) : isRecording ? (
                 <>
                   <Mic className="w-4 h-4 fill-current text-red-600 animate-pulse" />
                   Écoute en cours...
                 </>
               ) : (
                 <>
                   <Mic className="w-4 h-4 text-gray-500" />
                   Poser une question
                 </>
               )}
            </button>

            {recordedText && <p className="text-xs text-indigo-600 text-center mt-3 font-medium italic">"{recordedText}"</p>}
            {error && <p className="text-xs text-red-500 text-center mt-2">{error}</p>}

            <p className="text-xs text-gray-400 text-center mt-4">
              Posez une question sur l'historique ou demandez un résumé vocal !
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notification;
