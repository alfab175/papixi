import { type ReactNode } from 'react';
import PapixLogo from './PapixLogo';

interface AuthPageLayoutProps {
  children: ReactNode;
}

export default function AuthPageLayout({ children }: AuthPageLayoutProps) {
  return (
    <div
      className="min-h-screen bg-black flex flex-col"
      style={{ backgroundImage: 'radial-gradient(ellipse at 50% -10%, #3d0000 0%, #000 55%)' }}
    >
      <div className="px-8 py-6">
        <PapixLogo />
      </div>
      {children}
    </div>
  );
}
