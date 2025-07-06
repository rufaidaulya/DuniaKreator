import React from 'react';
import { HomeIcon, FaceSmileIcon, UserCircleIcon, BriefcaseIcon, CogIcon } from './IconComponents';

interface BottomNavBarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

const NavItem: React.FC<{
  icon: React.ElementType;
  label: string;
  pageName: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon: Icon, label, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-1 w-full pt-2 pb-1 transition-colors duration-200 ${
        isActive ? 'text-brand-blue' : 'text-brand-text-secondary hover:text-brand-text-primary'
      }`}
      aria-current={isActive ? 'page' : undefined}
    >
      <Icon className="w-6 h-6" />
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
};

export const BottomNavBar: React.FC<BottomNavBarProps> = ({ currentPage, onNavigate }) => {
  const navItems = [
    { icon: HomeIcon, label: 'Home', pageName: 'home' },
    { icon: FaceSmileIcon, label: 'Buat Avatar', pageName: 'buat-avatar' },
    { icon: UserCircleIcon, label: 'Iklan Produk', pageName: 'buat-iklan-produk' },
    { icon: BriefcaseIcon, label: 'Iklan Jasa', pageName: 'iklan-jasa-digital' },
    { icon: CogIcon, label: 'Setting', pageName: 'pengaturan' },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-brand-bg-light border-t border-brand-border z-30 shadow-[0_-5px_15px_-5px_rgba(0,0,0,0.2)]">
      <div className="flex justify-around items-center h-full max-w-lg mx-auto px-1">
        {navItems.map((item) => (
          <NavItem
            key={item.pageName}
            icon={item.icon}
            label={item.label}
            pageName={item.pageName}
            isActive={currentPage === item.pageName}
            onClick={() => onNavigate(item.pageName)}
          />
        ))}
      </div>
    </nav>
  );
};