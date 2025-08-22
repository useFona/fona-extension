import { ActivePageDisplayProps } from '@/types';
import React from 'react';

const ActivePageDisplay: React.FC<ActivePageDisplayProps> = ({ activePage }) => {
  if (!activePage) return null;

  return (
    <div className="mb-4 p-2.5 bg-[#242424] rounded-lg border border-[#292929] text-[#7b7b7d]">
      <strong>Active: {activePage.name}</strong>
    </div>
  );
};

export default ActivePageDisplay;
