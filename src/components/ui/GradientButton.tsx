import { type ReactNode, type ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'green' | 'red';

const VARIANT_STYLES: Record<Variant, string> = {
  primary: 'linear-gradient(135deg, #e50914, #c5000f)',
  green: 'linear-gradient(135deg, #10b981, #059669)',
  red: '#FF0000',
};

interface GradientButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: ReactNode;
  fullWidth?: boolean;
}

export default function GradientButton({
  variant = 'primary',
  children,
  fullWidth = true,
  className = '',
  disabled,
  ...props
}: GradientButtonProps) {
  return (
    <button
      className={`${fullWidth ? 'w-full' : ''} py-3.5 rounded-xl font-bold text-white text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${className}`}
      style={{ background: disabled ? '#555' : VARIANT_STYLES[variant] }}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
