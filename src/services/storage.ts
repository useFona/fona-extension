import { Page, PageName, User, DisabledSite } from "@/types";

export class StorageService {
  static async loadInitialData(): Promise<{
    user: User | null;
    pageNames: PageName[];
    pages: Page[];
    userToken: string;
    disabledSites: DisabledSite[];
  }> {
    const data = await browser.storage.local.get(['user', 'pageNames', 'pages', 'userToken', 'disabledSites']);
    return {
      user: data.user || null,
      pageNames: data.pageNames && Array.isArray(data.pageNames) ? data.pageNames : [],
      pages: data.pages && Array.isArray(data.pages) ? data.pages : [],
      userToken: data.userToken || '',
      disabledSites: data.disabledSites && Array.isArray(data.disabledSites) ? data.disabledSites : []
    };
  }

  static async saveUser(user: User, token: string): Promise<void> {
    await browser.storage.local.set({ user, userToken: token });
  }

  static async savePages(pages: Page[]): Promise<void> {
    await browser.storage.local.set({ pages });
  }

  static async savePageNames(pageNames: PageName[]): Promise<void> {
    await browser.storage.local.set({ pageNames });
  }

  static async saveDisabledSites(disabledSites: DisabledSite[]): Promise<void> {
    await browser.storage.local.set({ disabledSites });
  }

  static async loadDisabledSites(): Promise<DisabledSite[]> {
    const data = await browser.storage.local.get(['disabledSites']);
    return data.disabledSites && Array.isArray(data.disabledSites) ? data.disabledSites : [];
  }

  static async addDisabledSite(url: string): Promise<DisabledSite> {
    const disabledSites = await this.loadDisabledSites();
    
    // Check if site is already disabled
    const existingSite = disabledSites.find(site => site.url === url);
    if (existingSite) {
      return existingSite;
    }

    const newSite: DisabledSite = {
      id: Date.now().toString(),
      url,
      addedAt: new Date().toISOString()
    };

    const updatedSites = [...disabledSites, newSite];
    await this.saveDisabledSites(updatedSites);
    
    return newSite;
  }

  static async removeDisabledSite(id: string): Promise<void> {
    const disabledSites = await this.loadDisabledSites();
    const updatedSites = disabledSites.filter(site => site.id !== id);
    await this.saveDisabledSites(updatedSites);
  }

  static async isUrlDisabled(url: string): Promise<boolean> {
    const disabledSites = await this.loadDisabledSites();
    return disabledSites.some(site => {
      try {
        const siteUrl = new URL(site.url);
        const currentUrl = new URL(url);
        return siteUrl.hostname === currentUrl.hostname;
      } catch {
        return site.url === url;
      }
    });
  }

  static async clearAll(): Promise<void> {
    await browser.storage.local.clear();
  }

  static convertPagesToPageNames(pages: Page[]): PageName[] {
    return pages.map((page: Page, index: number) => ({
      id: page.id,
      name: page.title,
      isActive: index === 0 // First page is active by default
    }));
  }

  static async notifyBackgroundScript(pageNames: PageName[], user: User | null): Promise<void> {
    const activePage = pageNames.find(page => page.isActive);
    browser.runtime.sendMessage({
      type: 'updatePageNames',
      pageNames,
      activePage: activePage?.name || '',
      activePageId: activePage?.id || '',
      user
    });
  }

  static extractDomainFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      return url;
    }
  }
}