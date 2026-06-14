import { type InputHTMLAttributes, type ReactNode } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface FormInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  icon?: ReactNode;
  error?: string;
  showPasswordToggle?: boolean;
  showPassword?: boolean;
  onTogglePassword?: () => void;
}

export const INPUT_BASE_CLASS =
  'w-full bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600/30 text-sm transition';

export const LABEL_CLASS = 'block text-xs font-medium text-gray-400 mb-1.5';

export default function FormInput({
  label,
  icon,
  error,
  showPasswordToggle,
  showPassword,
  onTogglePassword,
  className = '',
  type,
  ...props
}: FormInputProps) {
  const resolvedType = showPasswordToggle ? (showPassword ? 'text' : 'password') : type;
  const hasIcon = !!icon;
  const hasToggle = !!showPasswordToggle;

  return (
    <div>
      {label && <label className={LABEL_CLASS}>{label}</label>}
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 flex items-center">
            {icon}
          </span>
        )}
        <input
          type={resolvedType}
          className={`${INPUT_BASE_CLASS} ${hasIcon ? 'pl-9' : 'px-4'} ${hasToggle ? 'pr-10' : hasIcon ? 'pr-3' : 'pr-4'} py-3 ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30' : ''} ${className}`}
          {...props}
        />
        {showPasswordToggle && onTogglePassword && (
          <button
            type="button"
            onClick={onTogglePassword}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
      {error && <p className="text-red-400 text-xs mt-1.5">{error}</p>}
    </div>
  );
}
