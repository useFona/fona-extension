import { DisabledSite } from '@/types';

export class DisabledSitesService {
  private static STORAGE_KEY = 'disabledSites';

  /**
   * Get all disabled sites from storage
   */
  static async getDisabledSites(): Promise<DisabledSite[]> {
    try {
      const data = await browser.storage.local.get([this.STORAGE_KEY]);
      return data[this.STORAGE_KEY] || [];
    } catch (error) {
      console.error('Error getting disabled sites:', error);
      return [];
    }
  }

  /**
   * Add a site to the disabled list
   */
  static async disableSite(url: string): Promise<DisabledSite> {
    try {
      const disabledSites = await this.getDisabledSites();
      
      // Check if the exact URL is already disabled
      const existingSite = disabledSites.find(site => site.url === url);

      if (existingSite) {
        return existingSite;
      }

      const newSite: DisabledSite = {
        id: this.generateId(),
        url: url, // Store the full URL
        addedAt: new Date().toISOString()
      };

      const updatedSites = [...disabledSites, newSite];
      await browser.storage.local.set({ [this.STORAGE_KEY]: updatedSites });

      return newSite;
    } catch (error) {
      console.error('Error disabling site:', error);
      throw error;
    }
  }

  /**
   * Remove a site from the disabled list
   */
  static async enableSite(siteId: string): Promise<void> {
    try {
      const disabledSites = await this.getDisabledSites();
      const updatedSites = disabledSites.filter(site => site.id !== siteId);
      await browser.storage.local.set({ [this.STORAGE_KEY]: updatedSites });
    } catch (error) {
      console.error('Error enabling site:', error);
      throw error;
    }
  }

  /**
   * Check if a URL is disabled
   */
  static async isUrlDisabled(url: string): Promise<boolean> {
    try {
      const disabledSites = await this.getDisabledSites();
      const pageUrl = new URL(url);
      const pageDomain = pageUrl.hostname;

      return disabledSites.some(site => {
        // Case 1: The stored site IS the exact URL.
        if (site.url === url) {
          return true;
        }
        // Case 2: The stored site IS the domain of the URL.
        if (site.url === pageDomain) {
          return true;
        }
        return false;
      });
    } catch (error) {
      console.error('Error checking if URL is disabled:', error);
      return false;
    }
  }

  /**
   * Get disabled site by URL
   */
  static async getDisabledSiteByUrl(url: string): Promise<DisabledSite | null> {
    try {
      const disabledSites = await this.getDisabledSites();
      const domain = this.extractDomain(url);

      return disabledSites.find(site =>
        this.extractDomain(site.url) === domain
      ) || null;
    } catch (error) {
      console.error('Error getting disabled site by URL:', error);
      return null;
    }
  }

  /**
   * Clear all disabled sites
   */
  static async clearAllDisabledSites(): Promise<void> {
    try {
      await browser.storage.local.set({ [this.STORAGE_KEY]: [] });
    } catch (error) {
      console.error('Error clearing disabled sites:', error);
      throw error;
    }
  }

  /**
   * Extract domain from URL
   */
  private static extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      // If URL parsing fails, return the original string
      return url;
    }
  }

  /**
   * Generate unique ID for disabled sites
   */
  private static generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Check if a URL can be disabled (not extension pages, blank pages, etc.)
   */
  static canDisableUrl(url: string): boolean {
    if (!url) return false;

    try {
      const urlObj = new URL(url);

      // Don't allow disabling extension pages, blank pages, or special URLs
      const disallowedProtocols = ['chrome-extension:', 'moz-extension:', 'edge-extension:', 'chrome:', 'about:', 'moz:', 'edge:'];
      if (disallowedProtocols.some(protocol => urlObj.protocol === protocol)) {
        return false;
      }

      // Don't allow empty hostnames or localhost
      if (!urlObj.hostname || urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1') {
        return false;
      }

      // Don't allow blank pages
      if (urlObj.href.includes('blank') || urlObj.pathname === '/blank') {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Format URL for display
   */
  static formatUrlForDisplay(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      return url;
    }
  }

  /**
   * Get statistics about disabled sites
   */
  static async getStats(): Promise<{
    totalDisabled: number;
    recentlyAdded: number;
    oldestSite?: DisabledSite;
    newestSite?: DisabledSite;
  }> {
    try {
      const sites = await this.getDisabledSites();
      const now = Date.now();
      const oneDayAgo = now - (24 * 60 * 60 * 1000);

      const recentlyAdded = sites.filter(site => {
        try {
          const addedTime = new Date(site.addedAt).getTime();
          return addedTime > oneDayAgo;
        } catch {
          return false;
        }
      }).length;

      let oldestSite: DisabledSite | undefined;
      let newestSite: DisabledSite | undefined;

      if (sites.length > 0) {
        sites.sort((a, b) => new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime());
        oldestSite = sites[0];
        newestSite = sites[sites.length - 1];
      }

      return {
        totalDisabled: sites.length,
        recentlyAdded,
        oldestSite,
        newestSite
      };
    } catch (error) {
      console.error('Error getting disabled sites stats:', error);
      return {
        totalDisabled: 0,
        recentlyAdded: 0
      };
    }
  }
}
