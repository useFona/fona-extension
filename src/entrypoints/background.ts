import { defineBackground } from "#imports";

interface QueuedNote {
  id: string;
  data: { text: string };
  type: string;
  timestamp: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  token: string;
}

const API_BASE_URL = 'https://fona.meet-jain.in/api/extention';

export default defineBackground(() => {
  let noteQueue: QueuedNote[] = [];
  let currentUser: User | null = null;
  let activePageId: string = '';
  let syncInterval: NodeJS.Timeout | null = null;

  // Initialize background script
  const initialize = async () => {
    // Load user and active page from storage
    const data = await browser.storage.local.get(['user', 'pageNames', 'noteQueue']);

    if (data.user) {
      currentUser = data.user;
    }

    if (data.pageNames && Array.isArray(data.pageNames)) {
      const activePage = data.pageNames.find((page: any) => page.isActive);
      if (activePage) {
        activePageId = activePage.id;
      }
    }

    // Load existing note queue
    if (data.noteQueue && Array.isArray(data.noteQueue)) {
      noteQueue = data.noteQueue;
    }

    // Start sync interval
    startSyncInterval();
  };

  // Start the sync interval (every 10 seconds)
  const startSyncInterval = () => {
    if (syncInterval) {
      clearInterval(syncInterval);
    }

    syncInterval = setInterval(async () => {
      await syncNotesToAPI();
    }, 10000); // 10 seconds
  };

  // Stop sync interval
  const stopSyncInterval = () => {
    if (syncInterval) {
      clearInterval(syncInterval);
      syncInterval = null;
    }
  };

  // Generate unique ID for notes
  const generateNoteId = () => {
    return Math.random().toString(36).substr(2, 10);
  };

  // Add note to queue
  const addNoteToQueue = async (text: string, type: string) => {
    const note: QueuedNote = {
      id: generateNoteId(),
      data: { text },
      type,
      timestamp: new Date().toISOString()
    };

    noteQueue.push(note);

    // Save queue to storage
    await browser.storage.local.set({ noteQueue });

    console.log(`Added note to queue: ${type} - ${text.substring(0, 50)}...`);

    // If queue reaches 5 items, sync immediately
    if (noteQueue.length >= 5) {
      await syncNotesToAPI();
    }
  };

  // Sync notes to API
  const syncNotesToAPI = async () => {
    if (!currentUser || !activePageId || noteQueue.length === 0) {
      console.log('Sync skipped - missing user, page, or empty queue');
      return;
    }

    console.log(`Syncing ${noteQueue.length} notes to API...`);
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    console.log(timeString)
    try {
      const response = await fetch(`${API_BASE_URL}/note`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userToken: currentUser.token,
          pageId: activePageId,
          noteData: noteQueue
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Notes synced successfully:', result);

      // Clear the queue after successful sync
      noteQueue = [];
      await browser.storage.local.set({ noteQueue });

      // Broadcast success to content scripts
      broadcastToContentScripts({
        type: 'syncSuccess',
        count: noteQueue.length
      });

    } catch (error) {
      console.error('Error syncing notes:', error);

      // Broadcast error to content scripts
      broadcastToContentScripts({
        type: 'syncError',
        error: error
      });
    }
  };

  // Broadcast message to all content scripts
  const broadcastToContentScripts = async (message: any) => {
    try {
      const tabs = await browser.tabs.query({});
      for (const tab of tabs) {
        if (tab.id) {
          browser.tabs.sendMessage(tab.id, message).catch(() => {
            // Ignore errors for tabs that can't receive messages
          });
        }
      }
    } catch (error) {
      console.error('Error broadcasting to content scripts:', error);
    }
  };

  // Listen for messages from popup and content script
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // Handle page names update from popup
    if (message.type === 'updatePageNames') {
      browser.storage.local.set({
        pageNames: message.pageNames
      }).then(() => {
        // Update current user and active page
        currentUser = message.user;
        activePageId = message.activePageId;

        // Broadcast the update to all content scripts
        broadcastToContentScripts({
          type: 'pageNamesUpdated',
          pageNames: message.pageNames,
          activePage: message.activePage,
          activePageId: message.activePageId
        });
      });
      sendResponse({ success: true });
      return true;
    }

    // Handle note addition from content script
    if (message.type === 'addNote') {
      addNoteToQueue(message.text, message.noteType).then(() => {
        sendResponse({ success: true });
      }).catch((error) => {
        console.error('Error adding note:', error);
        sendResponse({ success: false, error: error.message });
      });
      return true;
    }

    // Handle manual sync request
    if (message.type === 'syncNotes') {
      syncNotesToAPI().then(() => {
        sendResponse({ success: true });
      }).catch((error) => {
        console.error('Error syncing notes:', error);
        sendResponse({ success: false, error: error.message });
      });
      return true;
    }

    // Handle get queue status
    if (message.type === 'getQueueStatus') {
      sendResponse({
        success: true,
        queueLength: noteQueue.length,
        user: currentUser,
        activePageId
      });
      return true;
    }

    // Handle force sync (for testing)
    if (message.type === 'forceSync') {
      syncNotesToAPI().then(() => {
        sendResponse({ success: true });
      }).catch((error) => {
        sendResponse({ success: false, error: error.message });
      });
      return true;
    }

    return false;
  });

  // Handle extension startup
  browser.runtime.onStartup.addListener(() => {
    console.log('Extension started');
    initialize();
  });

  // Handle extension installation
  browser.runtime.onInstalled.addListener(() => {
    console.log('Extension installed');
    initialize();
  });

  // Handle tab updates (when user navigates)
  browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
      // Broadcast current state to the newly loaded tab
      browser.tabs.sendMessage(tabId, {
        type: 'pageNamesUpdated',
        pageNames: [],
        activePage: '',
        activePageId: activePageId
      }).catch(() => {
        // Ignore errors for tabs that can't receive messages
      });
    }
  });

  // Handle when extension is suspended/shut down
  browser.runtime.onSuspend.addListener(() => {
    console.log('Extension suspending, syncing remaining notes...');
    if (noteQueue.length > 0) {
      syncNotesToAPI();
    }
    stopSyncInterval();
  });

  // Initialize on script load
  initialize();
});
