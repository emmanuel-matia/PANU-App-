import React from 'react';
import { Search, Menu } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="w-full bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
      {/* CÔTÉ GAUCHE : LOGO PANU SEUL ET NET */}
      <div className="flex items-center">
        <span className="text-2xl font-black tracking-wider text-black font-sans uppercase">
          PANU
        </span>
      </div>

      {/* CÔTÉ DROIT : STRICTEMENT 2 ICÔNES */}
      <div className="flex items-center gap-4 text-gray-700">
        <button className="p-1.5 hover:bg-gray-100 rounded-full transition-colors" aria-label="Recherche">
          <Search className="w-6 h-6"/>
        </button>
        <button className="p-1.5 hover:bg-gray-100 rounded-full transition-colors" aria-label="Menu">
          <Menu className="w-6 h-6"/>
        </button>
      </div>
    </header>
  );
};

export default Header;
