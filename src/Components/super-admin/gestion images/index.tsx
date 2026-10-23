import { X } from 'lucide-react';
import React from 'react';

// Composant Button
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline';
  children: React.ReactNode;
}

export const Button = ({ variant = 'default', children, className = '', ...props }: ButtonProps) => {
  const baseClasses = 'px-4 py-2 rounded-lg transition-colors duration-200';
  const variantClasses = variant === 'outline' 
    ? 'border border-gray-300 text-gray-700 hover:bg-gray-50' 
    : 'bg-[#0F172A] text-white hover:bg-[#1E293B]';
  
  return (
    <button className={`${baseClasses} ${variantClasses} ${className}`} {...props}>
      {children}
    </button>
  );
};

// Composant Input
type InputProps = React.InputHTMLAttributes<HTMLInputElement>

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className = '', ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={`px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-[#0F172A]/20 ${className}`}
      {...props}
    />
  );
});

// Composant Textarea
type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className = '', ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={`px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-[#0F172A]/20 ${className}`}
      {...props}
    />
  );
});

// Composant Modal
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export const Modal = ({ isOpen, onClose, children }: ModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative">
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white hover:text-gray-200"
        >
          <X size={24} />
        </button>
        {children}
      </div>
    </div>
  );
};

// N'oubliez pas d'exporter tous les composants
// export { Button, Input, Textarea, Modal };


