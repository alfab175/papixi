const SIZE_CLASSES = {
  sm: 'w-4 h-4 border-2',
  md: 'w-5 h-5 border-2',
} as const;

interface LoadingSpinnerProps {
  size?: keyof typeof SIZE_CLASSES;
}

export default function LoadingSpinner({ size = 'sm' }: LoadingSpinnerProps) {
  return (
    <span className={`${SIZE_CLASSES[size]} border-white border-t-transparent rounded-full animate-spin`} />
  );
}
