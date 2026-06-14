interface PromoBadgeProps {
  size?: 'sm' | 'md';
}

export default function PromoBadge({ size = 'sm' }: PromoBadgeProps) {
  const cls = size === 'sm'
    ? 'text-xs md:text-sm px-4 py-1.5'
    : 'text-sm md:text-xl px-7 py-3.5';

  return (
    <span
      className={`inline-flex items-center gap-2 ${cls} rounded-full font-black text-white badge-glow`}
      style={{
        background: 'linear-gradient(135deg, #ff0000, #b8860b)',
        border: '1px solid rgba(250,204,21,0.55)',
      }}
    >
      3 AY ÜCRETSİZ
    </span>
  );
}
