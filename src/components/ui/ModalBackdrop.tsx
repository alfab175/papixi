import { type ReactNode } from 'react';

interface ModalBackdropProps {
  onClose: () => void;
  children: ReactNode;
  className?: string;
  blur?: boolean;
}

export default function ModalBackdrop({ onClose, children, className = '', blur = true }: ModalBackdropProps) {
  return (
    <div
      className={`fixed inset-0 z-50 bg-black/80 ${blur ? 'backdrop-blur-sm' : ''} flex items-center justify-center p-4 ${className}`}
      onClick={onClose}
    >
      <div onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}
