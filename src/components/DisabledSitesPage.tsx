import React from 'react';
import { X, ArrowLeft, Plus, Shield, ShieldX } from 'lucide-react';
import UserProfileHeader from './UserProfileHeader';
import { DisabledSitesPageProps } from '@/types';

const DisabledSitesPage: React.FC<DisabledSitesPageProps> = ({
  onClose,
  disabledSites,
  onRemoveSite,
  onAddCurrentSite,
  currentUrl,
  isCurrentSiteDisabled,
  user,
  onRefresh,
  onLogout,
  isLoading
}) => {
  const formatUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      return url;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'Unknown';
    }
  };

  const canAddCurrentSite = () => {
    if (!currentUrl) return false;
    
    try {
      const url = new URL(currentUrl);
      // Don't allow adding extension pages, blank pages, or special URLs
      return !url.protocol.startsWith('chrome') && 
             !url.protocol.startsWith('moz') && 
             !url.protocol.startsWith('edge') &&
             url.hostname !== '' &&
             url.hostname !== 'localhost' &&
             !url.href.includes('blank');
    } catch {
      return false;
    }
  };

  return (
    <div className="w-[420px] h-[675px] bg-[#161616] p-4 flex flex-col overflow-hidden">
      {/* User Profile Header */}
      <UserProfileHeader
        user={user}
        onRefresh={onRefresh}
        onLogout={onLogout}
        isLoading={isLoading}
      />

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={onClose}
          className="text-[#7b7b7d] hover:text-white p-2 rounded-full hover:bg-[#2a2a2a] transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-semibold text-white">Manage Disabled Sites</h1>
        <div className="w-10"></div> {/* For spacing */}
      </div>

      {/* Current Site Section */}
      {canAddCurrentSite() && (
        <div className="mb-6">
          <div className="bg-[#242424] rounded-lg p-4 border border-[#333]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {isCurrentSiteDisabled ? (
                  <ShieldX className="text-red-400" size={16} />
                ) : (
                  <Shield className="text-green-400" size={16} />
                )}
                <span className="text-sm font-medium text-white">Current Site</span>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${
                isCurrentSiteDisabled 
                  ? 'bg-red-400/20 text-red-400' 
                  : 'bg-green-400/20 text-green-400'
              }`}>
                {isCurrentSiteDisabled ? 'Disabled' : 'Active'}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#e0e0e0] truncate max-w-[70%]">
                {formatUrl(currentUrl)}
              </span>
              
              {!isCurrentSiteDisabled && (
                <button
                  onClick={() => onAddCurrentSite('page')}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-3 py-2  bg-[#2d1b1b] text-[#ff6b6b] hover:bg-[#3a2222] border border-[#4a2626] rounded-lg transition-colors text-sm font-medium"
                >
                  <Plus size={14} />
                  Disable
                </button>
              )}
              
              {isCurrentSiteDisabled && (
                <span className="text-xs text-[#7b7b7d]">
                  Extension disabled here
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Disabled Sites List */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-white">Disabled Sites</h2>
          <span className="text-sm text-[#7b7b7d]">
            {disabledSites.length} site{disabledSites.length !== 1 ? 's' : ''}
          </span>
        </div>

        {disabledSites.length === 0 ? (
          <div className="text-center py-12">
            <ShieldX className="mx-auto mb-4 text-[#7b7b7d]" size={48} />
            <p className="text-[#7b7b7d] mb-2">No disabled sites</p>
            <p className="text-sm text-[#555]">
              Sites you disable will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-2 pr-1">
            {disabledSites.map((site) => (
              <div
                key={site.id}
                className="flex items-center justify-between p-4 bg-[#242424] rounded-lg hover:bg-[#2a2a2a] transition-colors border border-[#333]"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <ShieldX className="text-red-400 flex-shrink-0" size={14} />
                    <span className="text-sm text-[#e0e0e0] truncate">
                      {formatUrl(site.url)}
                    </span>
                  </div>
                  <p className="text-xs text-[#7b7b7d]">
                    Disabled on {formatDate(site.addedAt)}
                  </p>
                </div>
                
                <button
                  onClick={() => onRemoveSite(site.id)}
                  disabled={isLoading}
                  className="text-[#7b7b7d] hover:text-red-400 disabled:opacity-50 p-1.5 rounded-full hover:bg-[#2a2a2a] transition-colors ml-3 flex-shrink-0"
                  aria-label="Enable site"
                  title="Enable extension on this site"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Footer */}
      <div className="mt-4 p-3 bg-[#1a1a1a] rounded-lg border border-[#333]">
        <p className="text-xs text-[#7b7b7d] text-center">
          💡 The extension's selection menu won't appear on disabled sites
        </p>
      </div>
    </div>
  );
};

export default DisabledSitesPage;