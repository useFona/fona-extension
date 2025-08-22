import React from 'react';
import { Plus } from 'lucide-react';
import { AddPageInputProps } from '@/types';

const AddPageInput: React.FC<AddPageInputProps> = ({
  newPageName,
  setNewPageName,
  onAdd,
  isLoading
}) => {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onAdd();
    }
  };

  return (
    <div className="mb-4">
      <div className="flex gap-1.5">
        <input
          type="text"
          value={newPageName}
          onChange={(e) => setNewPageName(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Enter page name"
          disabled={isLoading}
          className="flex-1 p-2 border border-[#292929] rounded-md text-sm bg-[#191919] text-[#7b7b7d] outline-none"
        />
        <button
          onClick={onAdd}
          disabled={isLoading}
          className={`px-3 py-2 hover:bg-[#2a2a2a] bg-[#242424] text-[#7b7b7d] border border-[#292929] rounded-md flex items-center transition-all duration-200 ${isLoading ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
            }`}
        >
          {/* <Plus size={16} /> */}
          create page
        </button>
      </div>
    </div>
  );
};

export default AddPageInput;
