// src/components/SelectableCard.tsx
import React from 'react';

interface SelectableCardProps {
  label: string;
  selected: boolean;
  onClick: () => void;
  children?: React.ReactNode;
}

const SelectableCard: React.FC<SelectableCardProps> = ({ label, selected, onClick, children }) => (
  <div className={`border-2 rounded-xl p-6 cursor-pointer text-center transition-all duration-300 ${selected ? 'border-blue-600 shadow-xl scale-105 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:shadow-md'}`} onClick={onClick}>
    <h4 className="font-bold text-xl text-gray-800">{label}</h4>
    {children}
  </div>
);

export default SelectableCard;