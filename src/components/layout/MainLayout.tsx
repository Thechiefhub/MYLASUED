import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import MobileNav from './MobileNav';

interface LayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: LayoutProps) {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <Sidebar className="hidden md:flex" />

      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-4 md:p-6 max-w-5xl mx-auto w-full pb-24 md:pb-6">
          {children}
        </main>
      </div>

      {/* Mobile Nav */}
      <MobileNav className="md:hidden" />
    </div>
  );
}
