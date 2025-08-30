// src/components/SelectableCard.tsx
import React from 'react';

interface SelectableCardProps {
  label: string;
  selected: boolean;
  onClick: () => void;
  children?: React.ReactNode;
}

const SelectableCard: React.FC<SelectableCardProps> = ({ label, selected, onClick, children }) => (
  <div className={`selectable-card border-2 rounded-lg p-4 cursor-pointer text-center transition-all duration-200 ${selected ? 'border-[#093373] shadow-lg scale-105' : 'border-gray-200 hover:border-blue-400'}`} onClick={onClick}>
    <h4 className="font-bold text-lg text-[#162733]">{label}</h4>
    {children}
  </div>
);

export default SelectableCard;