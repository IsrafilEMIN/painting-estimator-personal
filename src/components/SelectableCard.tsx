// src/components/SelectableCard.tsx
import React from 'react';

interface SelectableCardProps {
  label: string;
  selected: boolean;
  onClick: () => void;
  children?: React.ReactNode;
}

const SelectableCard: React.FC<SelectableCardProps> = ({ label, selected, onClick, children }) => (
  <div className={`border-2 rounded-xl p-6 cursor-pointer text-center transition-all duration-300 ${selected ? 'border-blue-600 dark:border-blue-400 shadow-xl scale-105 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md dark:hover:shadow-lg'}`} onClick={onClick}>
    <h4 className="font-bold text-xl text-gray-800 dark:text-gray-200">{label}</h4>
    {children}
  </div>
);

export default SelectableCard;