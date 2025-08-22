import React from 'react';
import { PagesListProps } from '@/types';

const PagesList: React.FC<PagesListProps> = ({
  pageNames,
  onSetActive,
  onDelete,
  isLoading
}) => {
  if (pageNames.length === 0) {
    return (
      <div className="max-h-[200px] overflow-y-auto">
        {isLoading ? (
          <div className="space-y-2 p-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-10 bg-[#242424] rounded-md"></div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[#7b7b7d] text-center my-5">No pages found</p>
        )}
      </div>
    );
  }

  // Sort pages to show active page first
  const sortedPages = [...pageNames]
    .sort((a, b) => (a.isActive === b.isActive ? 0 : a.isActive ? -1 : 1));

  return (
    <div className="max-h-[200px] overflow-y-auto" style={{scrollbarColor: '#161616 #161616', scrollbarWidth: 'thin'}}>
      {sortedPages.map((page) => (
        <div
          key={page.id}
          onClick={() => onSetActive(page.id)}
          className={`flex items-center p-3 mb-1.5 rounded-md transition-all duration-200 cursor-pointer
            ${page.isActive 
              ? ' text-white bg-gradient-to-b from-[#1f4e1c2e] to-[#191919]' 
              : 'bg-[#191919] text-[#7b7b7d] hover:bg-[#242424]'}
            border ${page.isActive ? 'border-[#1f4e1c]' : 'border-[#242424]'}`}
        >
          <span className="flex-1 text-sm">
            {page.name}
          </span>
        </div>
      ))}
    </div>
  );
};

export default PagesList;
