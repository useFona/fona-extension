import React from 'react';
import { RefreshCw } from 'lucide-react';
import { UserProfileHeaderProps } from '@/types';

const UserProfileHeader: React.FC<UserProfileHeaderProps> = ({
  user,
  onRefresh,
  onLogout,
  isLoading
}) => {
  return (
    <div className="flex items-center justify-between mb-6 p-4 bg-[#191919] rounded-xl border border-[#242424]">
      <div className="flex items-center gap-4">
        <img
          src={browser.runtime.getURL('/wxt.svg')}
          alt="Fona Logo"
          className="w-10 h-10 rounded-lg"
        />
        <div>
          <div className="text-lg font-semibold text-[#e0e0e0]">
            {user.name}'s fona
          </div>
          <div className="text-xs text-[#9e9e9e] mt-1">{user.email}</div>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className={`p-2.5 bg-[#242424] text-[#9e9e9e] hover:text-white border border-[#333333] rounded-lg transition-all duration-200 ${
            isLoading ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:bg-[#2a2a2a]'
          }`}
        >
          <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
        </button>

        <button
          onClick={onLogout}
          className="px-2 py-2 bg-[#2d1b1b] text-[#ff6b6b] hover:bg-[#3a2222] border border-[#4a2626] rounded-lg cursor-pointer transition-all duration-200 flex items-center gap-2 text-sm font-medium"
        >
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default UserProfileHeader;
