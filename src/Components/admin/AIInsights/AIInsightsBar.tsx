import React, { useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, AlertTriangle, ChevronRight, RefreshCw, MessageSquareCode } from 'lucide-react';
import { getUrlServer } from '../../../configServer';
import ReactMarkdown from 'react-markdown';

const AIInsightsBar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [insights, setInsights] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isVisible, setIsVisible] = useState(true);

  const isAIPage = location.pathname.includes('/ia');

  // Analyse à la demande uniquement : chaque analyse est un appel payant à l'IA
  // (avant : au chargement de la page puis toutes les 5 minutes).
  const fetchInsights = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch(`${getUrlServer()}/ai/insights${insights ? '?forcer=1' : ''}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || "L'analyse n'a pas pu être faite. Réessayez plus tard.");

      setInsights(data.insights);
      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur IA');
    } finally {
      setLoading(false);
    }
  }, [insights]);

  if (!isVisible) return null;

  return (
    <div className="w-full mb-8 animate-in fade-in slide-in-from-top duration-700">
      <div className="relative overflow-hidden rounded-[24px] bg-slate-900 border border-slate-800 p-6 shadow-2xl">
        {/* Background Effects */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 blur-[60px] rounded-full pointer-events-none" />

        <div className="relative z-10">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center border border-indigo-500/30">
                <Sparkles className="text-indigo-400 w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white m-0 tracking-tight flex items-center gap-2">
                  Lumistock AI Business Coach
                  <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 text-[10px] font-black uppercase tracking-widest rounded-full border border-indigo-500/30">
                    Live Analysis
                  </span>
                </h3>
                <p className="text-slate-400 text-xs font-medium m-0">
                  Analyse en temps réel de vos stocks et performances
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 self-end md:self-auto">
              <div className="text-right hidden sm:block">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest m-0">Dernière mise à jour</p>
                <p className="text-xs text-slate-300 font-bold m-0">{lastUpdate.toLocaleTimeString()}</p>
              </div>
              <button
                onClick={fetchInsights}
                disabled={loading}
                className="p-2 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 text-slate-300 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {loading && !insights ? (
            <div className="flex items-center gap-3 py-8">
              <RefreshCw className="text-indigo-400 w-5 h-5 animate-spin" />
              <div className="h-2 bg-slate-800 rounded-full w-full max-w-[300px] overflow-hidden">
                <div className="h-full bg-indigo-500 w-1/3 animate-shimmer" />
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
              <AlertTriangle className="w-5 h-5" />
              {error}
            </div>
          ) : !insights ? (
            <div className="flex flex-col items-start gap-3 py-2">
              <p className="text-slate-400 text-sm m-0">
                Obtenez une analyse de vos ventes, de votre stock et de vos clients, avec les actions prioritaires.
              </p>
              <button
                onClick={fetchInsights}
                className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-black rounded-xl transition-all flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" /> Analyser mon activité
              </button>
            </div>
          ) : (
            <div className="text-slate-200 text-sm leading-relaxed font-medium space-y-4 max-w-none">
              <ReactMarkdown
                components={{
                  p: ({ node: _node, ...props }) => <p className="text-slate-300 mb-4" {...props} />,
                  strong: ({ node: _node, ...props }) => <strong className="text-white font-black" {...props} />,
                  li: ({ node: _node, ...props }) => <li className="text-slate-300 mb-2" {...props} />,
                  ul: ({ node: _node, ...props }) => <ul className="list-disc pl-5 mb-4" {...props} />,
                  h1: ({ node: _node, ...props }) => <h1 className="text-white text-xl font-black mb-4" {...props} />,
                  h2: ({ node: _node, ...props }) => <h2 className="text-white text-lg font-black mb-3" {...props} />,
                }}
              >
                {insights || ""}
              </ReactMarkdown>
            </div>
          )}

          <div className="mt-8 flex flex-wrap items-center gap-3">
            {!isAIPage && (
              <button
                onClick={() => navigate(location.pathname.includes('/admin') ? '/admin/dashboard/ia' : '/dashboard/ia')}
                className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white text-xs font-black rounded-xl transition-all flex items-center gap-2 shadow-xl shadow-indigo-500/25 active:scale-95 group"
              >
                <MessageSquareCode className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                Discuter avec l'IA
              </button>
            )}

            <button className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-xl border border-white/10 transition-all flex items-center gap-2 active:scale-95">
              Appliquer les conseils <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsVisible(false)}
              className="px-5 py-2.5 bg-transparent hover:bg-white/5 text-slate-500 hover:text-slate-300 text-xs font-bold rounded-xl transition-all"
            >
              Ignorer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIInsightsBar;
