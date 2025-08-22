import { ErrorDisplayProps } from '@/types';
import React from 'react';

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error }) => {
  if (!error) return null;

  return (
    <div className="mt-2.5 p-2 bg-[#2d1b1b] border border-[#4a2626] rounded-lg text-[#ff6b6b] text-xs">
      {error}
    </div>
  );
};

export default ErrorDisplay;
