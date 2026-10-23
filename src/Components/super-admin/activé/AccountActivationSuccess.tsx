import React from 'react';
import { CheckCircle, Sparkles } from 'lucide-react';

const AccountActivationSuccess: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-50 flex items-center justify-center p-4">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-slate-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
      </div>

      {/* Main content card */}
      <div className="relative bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-8 md:p-12 max-w-md w-full text-center transform hover:scale-105 transition-all duration-500">
        {/* Decorative sparkles */}
        <div className="absolute -top-2 -right-2 text-purple-400 animate-bounce">
          <Sparkles size={24} />
        </div>
        <div className="absolute -bottom-2 -left-2 text-indigo-400 animate-bounce" style={{ animationDelay: '0.5s' }}>
          <Sparkles size={20} />
        </div>

        {/* Success circle with icon */}
        <div className="relative mb-8">
          <div className="mx-auto w-32 h-32 rounded-full border-4 border-[#0F172A] bg-gradient-to-br from-slate-50 to-purple-100 flex items-center justify-center shadow-lg transform hover:rotate-6 transition-transform duration-500">
            <CheckCircle className="text-[#0F172A] w-16 h-16 animate-pulse" />
          </div>
          
          {/* Animated ring */}
          <div className="absolute inset-0 w-32 h-32 mx-auto rounded-full border-2 border-slate-300 animate-ping opacity-30"></div>
        </div>

        {/* Success message */}
        <div className="space-y-4">
          <h1 className="text-3xl md:text-4xl font-bold text-[#0F172A] mb-4 animate-fadeIn">
            Compte Activé
          </h1>
          <p className="text-2xl md:text-3xl font-semibold text-[#0F172A] mb-6 animate-fadeIn" style={{ animationDelay: '0.2s' }}>
            avec Succès
          </p>
          
          <div className="w-24 h-1 bg-gradient-to-r from-[#0F172A] to-slate-700 mx-auto rounded-full mb-6"></div>
          
          <p className="text-gray-600 text-lg leading-relaxed animate-fadeIn" style={{ animationDelay: '0.4s' }}>
            Félicitations ! Votre compte a été activé avec succès. Vous pouvez maintenant profiter de tous nos services.
          </p>
        </div>

        {/* Action button */}
        <div className="mt-8">
          <button className="bg-gradient-to-r from-[#0F172A] to-slate-700 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold py-3 px-8 rounded-full shadow-lg transform hover:scale-105 transition-all duration-300 animate-fadeIn" style={{ animationDelay: '0.6s' }}>
            Continuer
          </button>
        </div>
      </div>

      {/* Floating elements */}
      <div className="absolute top-20 left-20 w-4 h-4 bg-slate-400 rounded-full animate-bounce opacity-60"></div>
      <div className="absolute bottom-20 right-20 w-3 h-3 bg-indigo-400 rounded-full animate-bounce opacity-60" style={{ animationDelay: '1s' }}></div>
      <div className="absolute top-1/3 right-1/4 w-2 h-2 bg-pink-400 rounded-full animate-bounce opacity-60" style={{ animationDelay: '1.5s' }}></div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.8s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default AccountActivationSuccess;


