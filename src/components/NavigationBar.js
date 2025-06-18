import React from 'react';
import { Calendar, Trophy, BarChart3, History } from 'lucide-react';

const NavigationBar = ({ currentView, onViewChange }) => {
  const navItems = [
    { id: 'availability', label: 'Beschikbaarheid', icon: Calendar },
    { id: 'planning', label: 'Wedstrijden', icon: Trophy },
    { id: 'stats', label: 'Statistieken', icon: BarChart3 },
    { id: 'history', label: 'Geschiedenis', icon: History }
  ];

  return (
    <nav className="bg-white border-b">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between md:justify-start md:space-x-8">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onViewChange(id)}
              className={`flex flex-col md:flex-row items-center py-3 px-2 md:py-4 md:px-1 border-b-2 flex-1 md:flex-auto ${currentView === id
                ? 'border-[rgb(120,151,178)] text-[rgb(120,151,178)]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              <Icon className="w-5 h-5 md:w-4 md:h-4 md:mr-2" />
              <span className="text-xs mt-1 md:mt-0 md:text-sm">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default NavigationBar;