const GRADIENT_STYLE = {
  background: 'linear-gradient(135deg, #e50914, #ff6b35)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
} as const;

const SIZE_CLASSES = {
  sm: 'text-xl',
  md: 'text-2xl',
  lg: 'text-3xl',
  xl: 'text-5xl',
} as const;

interface PapixLogoProps {
  size?: keyof typeof SIZE_CLASSES;
  className?: string;
}

export default function PapixLogo({ size = 'lg', className = '' }: PapixLogoProps) {
  return (
    <span
      className={`${SIZE_CLASSES[size]} font-black tracking-widest ${className}`}
      style={GRADIENT_STYLE}
    >
      PAPIX
    </span>
  );
}
