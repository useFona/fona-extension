import React from 'react';
import { ExternalLink, Shield } from 'lucide-react';
import { DashboardLinkProps } from '@/types';

const DashboardLink: React.FC<DashboardLinkProps> = ({ onManageDisabledSites }) => {
  const openDashboard = () => {
    browser.tabs.create({
      url: 'https://fona.meet-jain.in'
    });
  };

  return (
    <div className="mt-6 space-y-3">
      <button
        onClick={openDashboard}
        className="w-full flex items-center justify-center gap-3 p-4 bg-gradient-to-b from-[#242424] to-[#292929] hover:from-[#292929] hover:to-[#242424] text-white rounded-lg transition-all duration-200 transform hover:scale-101 border border-[#333] hover:border-[#a54656a8] hover:border hover:shadow-lg group hover:text-[#eaa3af]"
      >
        <ExternalLink 
          size={18} 
          className="group-hover:rotate-12 transition-transform duration-200" 
        />
        <span className="font-semibold ">Visit Dashboard</span>
      </button>

      <button
        onClick={onManageDisabledSites}
        className="w-full flex items-center justify-center gap-3 p-3 bg-[#242424] hover:bg-[#292929] text-[#e0e0e0] rounded-lg transition-all duration-200 border border-[#333] hover:border-[#4e46a5a8] group hover:scale-101 hover:shadow-lg hover:text-[#b1aafa]"
      >
        <Shield 
          size={16} 
          className="group-hover:scale-110 transition-transform duration-200" 
        />
        <span className="text-sm font-medium">Manage Disabled Sites</span>
      </button>
    </div>
  );
};

export default DashboardLink;