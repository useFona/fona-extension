import Login from '@/components/Login';
import UserProfileHeader from '@/components/UserProfileHeader';
import AddPageInput from '@/components/AddPageInput';
import ActivePageDisplay from '@/components/ActivePageDisplay';
import ErrorDisplay from '@/components/ErrorDisplay';
import DashboardLink from '@/components/DashboardLink';
import { ApiService } from '@/services/api';
import { StorageService } from '@/services/storage';
import { PageName, Page, User, DisabledSite } from '@/types';

import React, { useState, useEffect } from 'react';
import PagesList from '@/components/PageList';
import DisabledSitesPage from '@/components/DisabledSitesPage';
import Footer from '@/components/Footer';

const API_BASE_URL = 'https://fona.meet-jain.in/api/extention';

const App: React.FC = () => {
  const [pageNames, setPageNames] = useState<PageName[]>([]);
  const [newPageName, setNewPageName] = useState<string>('');
  const [user, setUser] = useState<User | null>(null);
  const [userToken, setUserToken] = useState<string>('');
  const [pages, setPages] = useState<Page[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showTokenInput, setShowTokenInput] = useState<boolean>(false);
  const [showDisabledSites, setShowDisabledSites] = useState<boolean>(false);
  const [disabledSites, setDisabledSites] = useState<DisabledSite[]>([]);
  const [currentUrl, setCurrentUrl] = useState<string>('');
  const [isCurrentSiteDisabled, setIsCurrentSiteDisabled] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Load saved data from storage on mount
  useEffect(() => {
    loadInitialData();
    getCurrentUrl();
  }, []);

  // Check if current site is disabled whenever disabledSites or currentUrl changes
  useEffect(() => {
    if (currentUrl) {
      checkIfCurrentSiteDisabled();
    }
  }, [disabledSites, currentUrl]);

  const getCurrentUrl = async () => {
    try {
      const tabs = await browser.tabs.query({ active: true, currentWindow: true });
      if (tabs[0]?.url) {
        setCurrentUrl(tabs[0].url);
      }
    } catch (error) {
      console.error('Error getting current URL:', error);
    }
  };

  const checkIfCurrentSiteDisabled = async () => {
    if (!currentUrl) return;
    
    try {
      const isDisabled = await StorageService.isUrlDisabled(currentUrl);
      setIsCurrentSiteDisabled(isDisabled);
    } catch (error) {
      console.error('Error checking if site is disabled:', error);
    }
  };

  const loadInitialData = async () => {
    try {
      const data = await StorageService.loadInitialData();

      // Load data from storage
      if (data.user) setUser(data.user);
      if (data.userToken) setUserToken(data.userToken);
      if (data.pages) setPages(data.pages);
      if (data.pageNames) setPageNames(data.pageNames);
      if (data.disabledSites) setDisabledSites(data.disabledSites);

      // If user token exists but no user data, fetch user
      if (data.userToken && !data.user) {
        await fetchUser(data.userToken);
      }

      // If user exists but no pages, fetch pages
      if (data.userToken && (!data.pages || data.pages.length === 0)) {
        await fetchPages(data.userToken);
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  const fetchUser = async (token: string) => {
    setIsLoading(true);
    setError('');

    try {
      const userObj = await ApiService.fetchUser(token);

      console.log('User data received:', userObj);

      setUser(userObj);
      setUserToken(token);

      await StorageService.saveUser(userObj, token);
      console.log('User data saved to storage');

      // Fetch pages after user is loaded
      await fetchPages(token);

    } catch (error) {
      console.error('Error fetching user:', error);
      setError('Failed to fetch user. Please check your token.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPages = async (token: string, newPageId: string | null = null) => {
    try {
      const formattedPages = await ApiService.fetchPages(token);

      setPages(formattedPages);
      await StorageService.savePages(formattedPages);

      // Convert pages to pageNames format for backward compatibility
      let convertedPageNames = StorageService.convertPagesToPageNames(formattedPages);

      // If we have a new page ID, make sure it's set as active
      // Otherwise, if no pages are active, set the first page as active
      if (newPageId) {
        convertedPageNames = convertedPageNames.map(page => ({
          ...page,
          isActive: page.id === newPageId
        }));
      } else if (convertedPageNames.length > 0 && !convertedPageNames.some(page => page.isActive)) {
        convertedPageNames[0].isActive = true;
        // Set newPageId to the first page's ID to trigger the notification
        newPageId = convertedPageNames[0].id;
      }

      setPageNames(convertedPageNames);
      await StorageService.savePageNames(convertedPageNames);

      // Notify background script about the active page change
      const activePage = convertedPageNames.find(page => page.isActive);
      if (activePage && user) {
        // Update the active page in the background script
        browser.runtime.sendMessage({
          type: 'updatePageNames',
          pageNames: convertedPageNames,
          activePage: activePage.name,
          activePageId: activePage.id,
          user: user
        }).catch(error => {
          console.error('Error notifying background script:', error);
        });
      }
    } catch (error) {
      console.error('Error fetching pages:', error);
      setError('Failed to fetch pages.');
    }
  };

  const handleTokenSubmit = async () => {
    if (!userToken.trim()) {
      setError('Please enter a valid token');
      return;
    }

    await fetchUser(userToken.trim());
    setShowTokenInput(false);
  };

  const createPage = async (title: string) => {
    if (!user || !title.trim()) return;

    setIsLoading(true);
    try {
      // First, create the new page and get its ID
      const response = await fetch(`${API_BASE_URL}/pages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userToken: user.token,
          title: title.trim()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create page');
      }

      const responseData = await response.json();
      const newPageId = responseData.page?.id;

      if (!newPageId) {
        throw new Error('No page ID returned from server');
      }

      // Fetch the complete pages list and set the new page as active
      await fetchPages(user.token, newPageId);

    } catch (error) {
      console.error('Error creating page:', error);
      setError('Failed to create page.');
    } finally {
      setIsLoading(false);
    }
  };

  const addPageName = () => {
    if (newPageName.trim() === '') return;
    createPage(newPageName.trim());
    setNewPageName('');
  };

  const setActivePage = async (id: string) => {
    const updatedNames = pageNames.map(page => ({
      ...page,
      isActive: page.id === id
    }));

    setPageNames(updatedNames);
    await savePageNames(updatedNames);
  };

  const deletePage = async (id: string) => {
    const updatedNames = pageNames.filter(page => page.id !== id);
    const updatedPages = pages.filter(page => page.id !== id);

    // If we deleted the active one, make the first one active
    if (updatedNames.length > 0) {
      const hasActive = updatedNames.some(page => page.isActive);
      if (!hasActive) {
        updatedNames[0].isActive = true;
      }
    }

    setPageNames(updatedNames);
    setPages(updatedPages);
    await savePageNames(updatedNames);
    await StorageService.savePages(updatedPages);
  };

  const savePageNames = async (names: PageName[]) => {
    await StorageService.savePageNames(names);
    await StorageService.notifyBackgroundScript(names, user);
  };

  const refreshData = async () => {
    if (!user) return;

    setIsLoading(true);
    setError('');

    try {
      await fetchUser(user.token);
      // Also refresh disabled sites
      const sites = await StorageService.loadDisabledSites();
      setDisabledSites(sites);
    } catch (error) {
      console.error('Error refreshing data:', error);
      setError('Failed to refresh data.');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    // Close the extension popup immediately
    window.close();

    // Clear data in the background
    (async () => {
      // Clear state
      setUser(null);
      setUserToken('');
      setPages([]);
      setPageNames([]);
      setDisabledSites([]);
      setShowDisabledSites(false);

      // Clear storage
      await StorageService.clearAll();
      console.log('User logged out successfully');
    })();
  };

  const handleAddCurrentSite = async () => {
    if (!currentUrl || isCurrentSiteDisabled) return;

    try {
      setIsLoading(true);
      const newSite = await StorageService.addDisabledSite(currentUrl);
      const updatedSites = await StorageService.loadDisabledSites();
      setDisabledSites(updatedSites);
      setIsCurrentSiteDisabled(true);
      
      // Notify content script about the change
      try {
        const tabs = await browser.tabs.query({ active: true, currentWindow: true });
        if (tabs[0]?.id) {
          await browser.tabs.sendMessage(tabs[0].id, {
            type: 'siteDisabled',
            url: currentUrl
          });
        }
      } catch (error) {
        console.error('Error notifying content script:', error);
      }
    } catch (error) {
      console.error('Error adding current site to disabled list:', error);
      setError('Failed to disable current site.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveSite = async (id: string) => {
    try {
      setIsLoading(true);
      await StorageService.removeDisabledSite(id);
      const updatedSites = await StorageService.loadDisabledSites();
      setDisabledSites(updatedSites);
      
      // Check if the removed site was the current site
      if (currentUrl) {
        const isStillDisabled = await StorageService.isUrlDisabled(currentUrl);
        setIsCurrentSiteDisabled(isStillDisabled);
      }
      
      // Notify content script about the change
      try {
        const tabs = await browser.tabs.query({ active: true, currentWindow: true });
        if (tabs[0]?.id) {
          await browser.tabs.sendMessage(tabs[0].id, {
            type: 'siteEnabled',
            siteId: id
          });
        }
      } catch (error) {
        console.error('Error notifying content script:', error);
      }
    } catch (error) {
      console.error('Error removing site from disabled list:', error);
      setError('Failed to enable site.');
    } finally {
      setIsLoading(false);
    }
  };

  const activePage = pageNames.find(page => page.isActive);

  // Show login component if no user
  if (!user) {
    return (
      <Login
        userToken={userToken}
        setUserToken={setUserToken}
        onSubmit={handleTokenSubmit}
        isLoading={isLoading}
        error={error}
      />
    );
  }

  if (showDisabledSites) {
    return (
      <DisabledSitesPage
        onClose={() => setShowDisabledSites(false)}
        disabledSites={disabledSites}
        onRemoveSite={handleRemoveSite}
        onAddCurrentSite={handleAddCurrentSite}
        currentUrl={currentUrl}
        isCurrentSiteDisabled={isCurrentSiteDisabled}
        user={user}
        onRefresh={refreshData}
        onLogout={logout}
        isLoading={isLoading}
      />
    );
  }

  return (
    <div className="w-[420px] h-max-[675px]  p-4 bg-[#161616] border border-[#292929]">
      <UserProfileHeader
        user={user}
        onRefresh={refreshData}
        onLogout={logout}
        isLoading={isLoading}
      />

      <h2 className="m-0 mb-4 text-2xl font-extrabold text-[#7b7b7d]">Pages</h2>

      <AddPageInput
        newPageName={newPageName}
        setNewPageName={setNewPageName}
        onAdd={addPageName}
        isLoading={isLoading}
      />

      <ActivePageDisplay activePage={activePage} />

      <PagesList
        pageNames={pageNames}
        onSetActive={setActivePage}
        onDelete={deletePage}
        isLoading={isLoading}
      />

      <ErrorDisplay error={error} />

      <DashboardLink onManageDisabledSites={() => setShowDisabledSites(true)} />
      <Footer />
    </div>
  );
};

export default App;