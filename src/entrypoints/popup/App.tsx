import React, { useState, useEffect } from 'react';
import { Plus, X, Check, RefreshCw, User } from 'lucide-react';
import './style.css';

interface PageName {
  id: string;
  name: string;
  isActive: boolean;
}

interface User {
  id: string;
  name: string;
  email: string;
  token: string;
}

interface Page {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

const API_BASE_URL = 'https://fona.meet-jain.in/api/extention';

const App: React.FC = () => {
  const [pageNames, setPageNames] = useState<PageName[]>([]);
  const [newPageName, setNewPageName] = useState<string>('');
  const [user, setUser] = useState<User | null>(null);
  const [userToken, setUserToken] = useState<string>('');
  const [pages, setPages] = useState<Page[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showTokenInput, setShowTokenInput] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Load saved data from storage on mount
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const data = await browser.storage.local.get(['user', 'pageNames', 'pages', 'userToken']);

      // Load user from storage first
      if (data.user) {
        setUser(data.user);
      }

      // Load user token
      if (data.userToken) {
        setUserToken(data.userToken);
      }

      // Load pages from storage
      if (data.pages && Array.isArray(data.pages)) {
        setPages(data.pages);
      }

      // Load page names from storage
      if (data.pageNames && Array.isArray(data.pageNames)) {
        setPageNames(data.pageNames);
      }

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
      const response = await fetch(`${API_BASE_URL}/user?userToken=${token}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        throw new Error(`Failed to fetch user: ${response.status} ${response.statusText}`);
      }

      const responseData = await response.json();
      const userData = responseData.user; // Access the nested user object

      if (!userData) {
        throw new Error('No user data found in response');
      }

      const userObj: User = {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        token: token
      };

      console.log('User data received:', userObj); // Debug log

      setUser(userObj);
      setUserToken(token);

      // Save to storage
      await browser.storage.local.set({ user: userObj, userToken: token });
      console.log('User data saved to storage'); // Debug log

      // Fetch pages after user is loaded
      await fetchPages(token);

    } catch (error) {
      console.error('Error fetching user:', error);
      setError('Failed to fetch user. Please check your token.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPages = async (token: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/pages?userToken=${token}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch pages');
      }

      const responseData = await response.json();

      // Extract the pages array from the response object
      const pagesArray = responseData.pages || [];

      // Transform the API response to match our Page interface
      const formattedPages: Page[] = pagesArray.map((page: any) => ({
        id: page.id,
        title: page.title,
        createdAt: page.createdAt || new Date().toISOString(),
        updatedAt: page.updatedAt || new Date().toISOString()
      }));

      setPages(formattedPages);

      // Save to storage
      await browser.storage.local.set({ pages: formattedPages });

      // Convert pages to pageNames format for backward compatibility
      const convertedPageNames: PageName[] = formattedPages.map((page: Page, index: number) => ({
        id: page.id,
        name: page.title,
        isActive: index === 0 // First page is active by default
      }));

      setPageNames(convertedPageNames);
      await browser.storage.local.set({ pageNames: convertedPageNames });

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

      // Instead of just adding the new page to the local state,
      // fetch the complete pages list from the server to ensure consistency
      await fetchPages(user.token);

    } catch (error) {
      console.error('Error creating page:', error);
      setError('Failed to create page.');
    } finally {
      setIsLoading(false);
    }
  };

  // Add new page name
  const addPageName = () => {
    if (newPageName.trim() === '') return;

    createPage(newPageName.trim());
    setNewPageName('');
  };

  // Set active page name
  const setActivePage = (id: string) => {
    const updatedNames = pageNames.map(page => ({
      ...page,
      isActive: page.id === id
    }));

    setPageNames(updatedNames);
    savePageNames(updatedNames);
  };

  // Delete page name
  const deletePage = (id: string) => {
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
    savePageNames(updatedNames);

    // Save updated pages to storage
    browser.storage.local.set({ pages: updatedPages });
  };

  // Save page names to storage
  const savePageNames = async (names: PageName[]) => {
    await browser.storage.local.set({ pageNames: names });

    // Get active page name
    const activePage = names.find(page => page.isActive);

    // Notify background script
    browser.runtime.sendMessage({
      type: 'updatePageNames',
      pageNames: names,
      activePage: activePage?.name || '',
      activePageId: activePage?.id || '',
      user: user
    });
  };

  // Refresh data
  const refreshData = async () => {
    if (!user) return;

    setIsLoading(true);
    setError('');

    try {
      await fetchUser(user.token);
    } catch (error) {
      console.error('Error refreshing data:', error);
      setError('Failed to refresh data.');
    } finally {
      setIsLoading(false);
    }
  };

  // Logout user and close extension
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

      // Clear storage
      await browser.storage.local.clear();
      console.log('User logged out successfully');
    })();
  };

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (showTokenInput) {
        handleTokenSubmit();
      } else {
        addPageName();
      }
    }
  };

  const activePage = pageNames.find(page => page.isActive);

  // Show token input if no user
  if (!user || showTokenInput) {
    return (
      <div style={{ padding: '30px 15px', width: '300px', backgroundColor: '#161616', border: '1px solid #292929' }}>
        <div style={{ textAlign: 'center', margin: '20px 0' }}>
          <User size={48} style={{ color: '#7b7b7d', marginBottom: '10px' }} />
          <h2 style={{ margin: '0 0 10px 0', fontSize: '18px', color: '#7b7b7d' }}>Login</h2>
          <p style={{ color: '#7b7b7d', fontSize: '14px', margin: '0 0 20px 0' }}>
            Please enter your user token copied from Fona's dashboard
          </p>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <input
            type="text"
            value={userToken}
            onChange={(e) => setUserToken(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter your user token"
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #292929',
              borderRadius: '8px',
              fontSize: '14px',
              boxSizing: 'border-box',
              backgroundColor: '#191919',
              color: '#7b7b7d',
              outline: 'none'
            }}
          />
        </div>

        <button
          onClick={handleTokenSubmit}
          disabled={isLoading}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: '#242424',
            color: '#7b7b7d',
            border: '1px solid #292929',
            borderRadius: '8px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            opacity: isLoading ? 0.6 : 1,
            transition: 'all 0.2s ease'
          }}
        >
          {isLoading ? 'Logging in...' : 'Login'}
        </button>

        {error && (
          <div style={{
            marginTop: '10px',
            padding: '8px',
            backgroundColor: '#2d1b1b',
            border: '1px solid #4a2626',
            borderRadius: '8px',
            color: '#ff6b6b',
            fontSize: '12px'
          }}>
            {error}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ padding: '15px', width: '300px', minHeight: '350px', backgroundColor: '#161616', border: '1px solid #292929' }}>
      {/* User Profile Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '15px',
        padding: '10px',
        backgroundColor: '#191919',
        borderRadius: '8px',
        border: '1px solid #242424'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img
            src={browser.runtime.getURL('/wxt.svg')}
            alt="Fona Logo"
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '4px'
            }}
          />
          <div>
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#7b7b7d' }}>
              {user.name}'s fona
            </div>
            <div style={{ fontSize: '9px', color: '#7b7b7d' }}>{user.email}</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '5px' }}>
          <button
            onClick={refreshData}
            disabled={isLoading}
            style={{
              padding: '6px',
              backgroundColor: '#242424',
              color: '#7b7b7d',
              border: '1px solid #292929',
              borderRadius: '6px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.6 : 1,
              transition: 'all 0.2s ease'
            }}
          >
            <RefreshCw size={14} />
          </button>

          <button
            onClick={logout}
            style={{
              padding: '6px',
              backgroundColor: '#2d1b1b',
              color: '#ff6b6b',
              border: '1px solid #4a2626',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '12px'
            }}
          >
            <span>Logout</span>
          </button>
        </div>
      </div>

      <h2 style={{ margin: '0 0 15px 0', fontSize: '18px', color: '#7b7b7d' }}>Pages</h2>

      {/* Add new page */}
      <div style={{ marginBottom: '15px' }}>
        <div style={{ display: 'flex', gap: '5px' }}>
          <input
            type="text"
            value={newPageName}
            onChange={(e) => setNewPageName(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter page name"
            disabled={isLoading}
            style={{
              flex: 1,
              padding: '8px',
              border: '1px solid #292929',
              borderRadius: '6px',
              fontSize: '14px',
              backgroundColor: '#191919',
              color: '#7b7b7d',
              outline: 'none'
            }}
          />
          <button
            onClick={addPageName}
            disabled={isLoading}
            style={{
              padding: '8px 12px',
              backgroundColor: '#242424',
              color: '#7b7b7d',
              border: '1px solid #292929',
              borderRadius: '6px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              opacity: isLoading ? 0.6 : 1,
              transition: 'all 0.2s ease'
            }}
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* Current active page */}
      {activePage && (
        <div style={{
          marginBottom: '15px',
          padding: '10px',
          backgroundColor: '#242424',
          borderRadius: '8px',
          border: '1px solid #292929',
          color: '#7b7b7d'
        }}>
          <strong>Active: {activePage.name}</strong>
        </div>
      )}

      {/* Pages list */}
      <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
        {pageNames.length === 0 ? (
          <p style={{ color: '#7b7b7d', textAlign: 'center', margin: '20px 0' }}>
            {isLoading ? 'Loading pages...' : 'No pages found'}
          </p>
        ) : (
          // Sort pages to show active page first
          [...pageNames]
            .sort((a, b) => (a.isActive === b.isActive ? 0 : a.isActive ? -1 : 1))
            .map((page) => (
              <div
                key={page.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px',
                  marginBottom: '5px',
                  backgroundColor: page.isActive ? '#242424' : '#191919',
                  borderRadius: '6px',
                  color: '#7b7b7d',
                  border: page.isActive ? '1px solid #292929' : '1px solid #242424',
                  transition: 'all 0.2s ease'
                }}
              >
                <button
                  onClick={() => setActivePage(page.id)}
                  style={{
                    padding: '4px',
                    backgroundColor: page.isActive ? '#292929' : '#242424',
                    color: '#1f4e1c',
                    border: '1px solid #1f4e1c',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Check size={14} />
                </button>

                <span style={{ flex: 1, fontSize: '14px', color: '#7b7b7d' }}>
                  {page.name}
                </span>

                {page.isActive && (
                  <div style={{ position: 'relative' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deletePage(page.id);
                      }}
                      style={{
                        padding: '4px',
                        backgroundColor: '#2d1b1b',
                        color: '#ff6b6b',
                        border: '1px solid #4a2626',
                        borderRadius: '50%',
                        cursor: 'pointer',
                        width: '24px',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = '#3d2b2b';
                        e.currentTarget.style.transform = 'scale(1.1)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = '#2d1b1b';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                      title="Remove from active pages"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>
            ))
        )}
      </div>

      {error && (
        <div style={{
          marginTop: '10px',
          padding: '8px',
          backgroundColor: '#2d1b1b',
          border: '1px solid #4a2626',
          borderRadius: '8px',
          color: '#ff6b6b',
          fontSize: '12px'
        }}>
          {error}
        </div>
      )}

      {/* Dashboard Link */}
      <div style={{
        marginTop: '20px',
        padding: '12px 0',
        borderTop: '1px solid #2a2a2a',
        textAlign: 'center'
      }}>
        <a
          href="https://fona.meet-jain.in/dashboard"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: '#4a90e2',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontSize: '14px',
            padding: '6px 12px',
            borderRadius: '4px',
            transition: 'background-color 0.2s',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#2a2a2a';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <User size={16} />
          Dashboard
        </a>
      </div>
    </div>
  );
};

export default App;
