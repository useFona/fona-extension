import { defineContentScript } from "#imports";

export default defineContentScript({
  matches: ['https://*/*', 'http://*/*'],
  main() {
    // Store current active page name and ID
    let activePageName: string = '';
    let activePageId: string = '';
    let isCurrentSiteDisabled: boolean = false;

    const checkSiteStatus = async () => {
      try {
        const data = await browser.storage.local.get(['disabledSites']);
        const disabledSites = data.disabledSites || [];
        const currentUrl = window.location.href;

        isCurrentSiteDisabled = disabledSites.some((site: any) => {
          // First check for exact URL match
          if (site.url === currentUrl) {
            return true;
          }

          // Then check for domain-level blocking
          try {
            const siteUrl = new URL(site.url);
            const pageUrl = new URL(currentUrl);

            // If the disabled site is a domain (no path), check hostname match
            if (siteUrl.pathname === '/' && siteUrl.hostname === pageUrl.hostname) {
              return true;
            }

            // If the disabled site is a full URL, check for exact match
            return site.url === currentUrl;
          } catch {
            // If URL parsing fails, do simple string comparison
            return site.url === currentUrl;
          }
        });

        console.log('Site disabled status for', currentUrl, ':', isCurrentSiteDisabled);
      } catch (error) {
        console.error('Error checking site status:', error);
      }
    };

    // Initialize site status check
    checkSiteStatus();

    // Load initial active page from storage
    browser.storage.local.get(['pageNames']).then((data) => {
      if (data.pageNames && Array.isArray(data.pageNames)) {
        const activePage = data.pageNames.find((page: any) => page.isActive);
        if (activePage) {
          activePageName = activePage.name;
          activePageId = activePage.id;
        }
      }
    });

    // Listen for page name updates from background
    browser.runtime.onMessage.addListener((message) => {
      if (message.type === 'pageNamesUpdated') {
        activePageName = message.activePage;
        activePageId = message.activePageId;
      }

      if (message.type === 'syncSuccess') {
        showNotification(`Successfully synced ${message.count} notes!`, 'success');
      }

      if (message.type === 'syncError') {
        showNotification(`Sync failed: ${message.error}`, 'error');
      }
      if (message.type === 'siteDisabled') {
        isCurrentSiteDisabled = true;
        showNotification('Extension disabled on this site', 'error');
        // Remove any existing menu
        const existingMenu = document.getElementById('custom-selection-menu');
        if (existingMenu) {
          existingMenu.remove();
        }
      }

      if (message.type === 'siteEnabled') {
        isCurrentSiteDisabled = false;
        // showNotification('Extension enabled on this site', 'success');
      }
    });

    // Listen for storage changes
    browser.storage.onChanged.addListener((changes) => {
      if (changes.disabledSites) {
        checkSiteStatus();
      }
    });

    // Debounce function to prevent rapid event triggering
    const debounce = (func: Function, wait: number) => {
      let timeout: NodeJS.Timeout;
      return (...args: any[]) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
      };
    };

    // Create enhanced menu with options
    const createMenu = (x: number, y: number, selectedText: string) => {
      console.debug(`Creating menu at x:${x}, y:${y}, text: "${selectedText}"`);

      // Remove any existing menu first
      const existingMenu = document.getElementById('custom-selection-menu');
      if (existingMenu) {
        existingMenu.remove();
      }

      // Get current selection
      const selection = window.getSelection();
      const currentSelectedText = selection && selection.toString().trim() !== ''
        ? selection.toString().trim()
        : selectedText;

      // Don't show menu if no text selected
      if (!currentSelectedText) {
        console.debug('No selected text, skipping menu creation');
        return;
      }

      // Create menu element
      const menu = document.createElement('div');
      menu.id = 'custom-selection-menu';
      const menuWidth = 200;
      const menuHeight = 100;
      let adjustedX = x;
      let adjustedY = y;

      // Ensure menu stays within viewport
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      if (adjustedX + menuWidth > viewportWidth) {
        adjustedX = viewportWidth - menuWidth - 10;
      }
      if (adjustedY + menuHeight > viewportHeight) {
        adjustedY = viewportHeight - menuHeight - 10;
      }
      if (adjustedX < 0) adjustedX = 10;
      if (adjustedY < 0) adjustedY = 10;

      menu.style.left = `${adjustedX}px`;
      menu.style.top = `${adjustedY}px`;
      menu.style.position = 'fixed';
      menu.style.transform = 'none';
      menu.style.backgroundColor = '#1a1a1a';
      menu.style.padding = '8px';
      menu.style.borderRadius = '8px';
      menu.style.boxShadow = '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)';
      menu.style.zIndex = '999999';
      menu.style.fontFamily = 'Arial, sans-serif';
      menu.style.opacity = '0';
      menu.style.transition = 'opacity 0.2s ease, transform 0.2s ease';

      // Helper function to remove menu with animation
      const removeMenuWithAnimation = (isManualClose: boolean = false) => {
        if (isManualClose) {
          wasMenuManuallyClosed = true;
        }
        menu.style.opacity = '0';
        menu.style.transform = 'scale(0.8) translateY(-10px)';
        setTimeout(() => {
          if (menu.parentNode) {
            menu.remove();
            document.removeEventListener('click', removeMenu);
          }
        }, 200);
      };

      // Create close button
      const closeButton = document.createElement('button');
      closeButton.innerHTML = '×';
      closeButton.style.position = 'absolute';
      closeButton.style.top = '-8px';
      closeButton.style.right = '-8px';
      closeButton.style.width = '20px';
      closeButton.style.height = '20px';
      closeButton.style.borderRadius = '50%';
      closeButton.style.border = '2px solid #333';
      closeButton.style.backgroundColor = '#1a1a1a';
      closeButton.style.color = '#E0E0E0';
      closeButton.style.fontSize = '14px';
      closeButton.style.fontWeight = 'bold';
      closeButton.style.cursor = 'pointer';
      closeButton.style.display = 'flex';
      closeButton.style.alignItems = 'center';
      closeButton.style.justifyContent = 'center';
      closeButton.style.lineHeight = '1';
      closeButton.style.transition = 'all 0.2s ease';
      closeButton.style.zIndex = '1000000';

      // Close button hover effects
      closeButton.addEventListener('mouseenter', () => {
        closeButton.style.backgroundColor = '#dc2626';
        closeButton.style.borderColor = '#dc2626';
        closeButton.style.transform = 'scale(1.1)';
      });
      closeButton.addEventListener('mouseleave', () => {
        closeButton.style.backgroundColor = '#1a1a1a';
        closeButton.style.borderColor = '#333';
        closeButton.style.transform = 'scale(1)';
      });

      // Close button click handler
      closeButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        removeMenuWithAnimation(true); // Pass true to indicate manual close
      });

      menu.appendChild(closeButton);

      // Add active page name display
      if (activePageName) {
        const pageNameDiv = document.createElement('div');
        pageNameDiv.style.padding = '4px 8px';
        pageNameDiv.style.backgroundColor = '#121212';
        pageNameDiv.style.borderRadius = '4px';
        pageNameDiv.style.marginBottom = '4px';
        pageNameDiv.style.fontSize = '11px';
        pageNameDiv.style.fontWeight = 'bold';
        pageNameDiv.style.color = '#FFBB94';
        pageNameDiv.style.textAlign = 'center';
        pageNameDiv.textContent = `Active: ${activePageName}`;
        menu.appendChild(pageNameDiv);
      }

      // Create buttons container for horizontal layout
      const buttonsContainer = document.createElement('div');
      buttonsContainer.style.display = 'flex';
      buttonsContainer.style.gap = '4px';
      buttonsContainer.style.justifyContent = 'space-between';

      // Create menu options
      const options = [
        {
          id: 'copy',
          label: 'Copy',
          icon: 'C',
          action: async () => {
            await copyToClipboard(currentSelectedText);
            removeMenuWithAnimation();
          }
        },
        {
          id: 'h1',
          label: 'Heading',
          icon: 'H',
          action: () => {
            addNoteToQueue(currentSelectedText, 'h1');
            removeMenuWithAnimation();
          }
        },
        {
          id: 'subheading',
          label: 'Subheading',
          icon: 'Sh',
          action: () => {
            addNoteToQueue(currentSelectedText, 'subheading');
            removeMenuWithAnimation();
          }
        },
        {
          id: 'para',
          label: 'Paragraph',
          icon: 'P',
          action: () => {
            addNoteToQueue(currentSelectedText, 'paragraph');
            removeMenuWithAnimation();
          }
        }
      ];

      // Create option buttons
      options.forEach((option, index) => {
        const button = document.createElement('button');
        button.style.display = 'flex';
        button.style.flexDirection = 'column';
        button.style.alignItems = 'center';
        button.style.gap = '2px';
        button.style.padding = '8px 10px';
        button.style.border = 'none';
        button.style.backgroundColor = 'transparent';
        button.style.borderRadius = '6px';
        button.style.cursor = 'pointer';
        button.style.fontSize = '10px';
        button.style.textAlign = 'center';
        button.style.transition = 'all 0.2s ease';
        button.style.minWidth = '50px';
        button.style.fontWeight = 'bold';

        // Set colors based on button type
        let iconColor = '#E0E0E0'; // Default grayish white for copy
        if (option.id === 'h1') iconColor = '#FFBB94';
        else if (option.id === 'subheading') iconColor = '#DC586D';
        else if (option.id === 'para') iconColor = '#FFBB94';

        // Add hover effect
        button.addEventListener('mouseenter', () => {
          button.style.backgroundColor = '#2d2d2d';
          button.style.transform = 'translateY(-2px)';
        });
        button.addEventListener('mouseleave', () => {
          button.style.backgroundColor = 'transparent';
          button.style.transform = 'translateY(0)';
        });

        // Add icon and text
        const icon = document.createElement('span');
        icon.textContent = option.icon;
        icon.style.fontSize = '16px';
        icon.style.fontWeight = 'bold';
        icon.style.color = iconColor;

        const label = document.createElement('span');
        label.textContent = option.label;
        label.style.fontSize = '10px';
        label.style.fontWeight = '600';
        label.style.color = '#E0E0E0'; // Grayish white for all labels

        button.appendChild(icon);
        button.appendChild(label);

        // Add click handler
        button.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();

          // Clear selection
          const selection = window.getSelection();
          if (selection) {
            selection.removeAllRanges();
          }

          // Execute action
          option.action();
        });

        buttonsContainer.appendChild(button);
      });

      menu.appendChild(buttonsContainer);
      document.body.appendChild(menu);

      // Trigger animation after adding to DOM
      requestAnimationFrame(() => {
        menu.style.opacity = '1';
        menu.style.transform = 'scale(1) translateY(0)';
      });

      // Remove menu when clicking outside (but not on the close button)
      const removeMenu = (e: MouseEvent) => {
        if (!menu.contains(e.target as Node)) {
          removeMenuWithAnimation(false); // Not a manual close
          document.removeEventListener('click', removeMenu);
        }
      };

      setTimeout(() => {
        document.addEventListener('click', removeMenu);
      }, 100);

      // Auto-remove after 10 seconds
      setTimeout(() => {
        if (menu.parentNode) {
          removeMenuWithAnimation(false);
        }
      }, 10000);
    };

    // Add note to queue via background script
    const addNoteToQueue = async (text: string, type: string) => {
      if (!text || !activePageId) {
        showNotification('No active page selected', 'error');
        return;
      }

      // Highlight the selected text first
      highlightSelection();

      try {
        const response = await browser.runtime.sendMessage({
          type: 'addNote',
          text: text,
          noteType: type
        });

        if (response && response.success) {
          showNotification(`Added ${type.toUpperCase()} to queue`, 'success');
        } else {
          showNotification('Failed to add note', 'error');
        }
      } catch (error) {
        console.error('Error adding note:', error);
        showNotification('Failed to add note', 'error');
      }
    };

    // Copy to clipboard function
    const copyToClipboard = async (text: string) => {
      if (!text) {
        showNotification('No text to copy', 'error');
        return;
      }

      try {
        await navigator.clipboard.writeText(text);
        showNotification('Copied to clipboard!', 'success');
      } catch (err) {
        console.error('Failed to copy: ', err);
        // Fallback method for older browsers
        try {
          const textArea = document.createElement('textarea');
          textArea.value = text;
          textArea.style.position = 'fixed';
          textArea.style.opacity = '0';
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
          showNotification('Copied to clipboard!', 'success');
        } catch (fallbackErr) {
          console.error('Fallback copy failed: ', fallbackErr);
          showNotification('Failed to copy', 'error');
        }
      }
    };

    // Highlight selected text with purple color
    const highlightSelection = (color: string = '#8b5cf6') => {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);

        // Create a span element for highlighting
        const highlightSpan = document.createElement('span');
        highlightSpan.style.backgroundColor = color;
        highlightSpan.style.color = '#fff';
        highlightSpan.style.padding = '2px 4px';
        highlightSpan.style.borderRadius = '2px';
        highlightSpan.style.transition = 'all 0.2s ease';

        try {
          // Surround the selected content with the highlight span
          range.surroundContents(highlightSpan);

          // Clear the selection
          selection.removeAllRanges();

          // Auto-remove highlight after 3 seconds
          setTimeout(() => {
            if (highlightSpan.parentNode) {
              const parent = highlightSpan.parentNode;
              parent.insertBefore(document.createTextNode(highlightSpan.textContent || ''), highlightSpan);
              parent.removeChild(highlightSpan);
            }
          }, 3000);
        } catch (error) {
          console.error('Error highlighting text:', error);
        }
      }
    };

    // Show notification
    const showNotification = (message: string, type: 'success' | 'error') => {
      const notification = document.createElement('div');
      notification.style.position = 'fixed';
      notification.style.bottom = '20px';
      notification.style.right = '20px';
      notification.style.padding = '12px 24px';
      notification.style.borderRadius = '8px';
      notification.style.color = 'white';
      notification.style.fontWeight = 'bold';
      notification.style.zIndex = '10001';
      notification.style.fontSize = '14px';
      notification.style.backgroundColor = type === 'success' ? '#1f4e1c' : '#2d2d2d';
      notification.style.boxShadow = '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)';
      notification.style.opacity = '0';
      notification.style.transform = 'translateY(-10px)';
      notification.style.transition = 'all 0.3s ease';
      notification.textContent = message;

      document.body.appendChild(notification);

      // Animate in
      requestAnimationFrame(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateY(0)';
      });

      // Animate out and remove
      setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(-10px)';
        setTimeout(() => {
          if (notification.parentNode) {
            notification.remove();
          }
        }, 300);
      }, 3000);
    };

    // Get queue status for debugging
    const getQueueStatus = async () => {
      try {
        const response = await browser.runtime.sendMessage({
          type: 'getQueueStatus'
        });

        if (response && response.success) {
          console.log('Queue status:', response);
          showNotification(`Queue: ${response.queueLength} notes`, 'success');
        }
      } catch (error) {
        console.error('Error getting queue status:', error);
      }
    };

    // Listen for text selection
    let isProcessing = false;
    let wasMenuManuallyClosed = false;

    document.addEventListener(
      'mouseup',
      debounce((event: MouseEvent) => {
        if (isCurrentSiteDisabled) return;

        if (isProcessing) return;
        isProcessing = true;
        try {
          const selection = window.getSelection();
          const selectedText = selection && selection.toString().trim();

          // Check if menu was manually closed and we're still on the same selection
          if (selectedText && wasMenuManuallyClosed) {
            console.debug('Menu was manually closed, not reopening for same selection');
            wasMenuManuallyClosed = false; // Reset flag for next selection
            return;
          }

          if (selectedText) {
            event.stopPropagation();
            createMenu(event.clientX, event.clientY, selectedText);
          } else {
            console.debug('No valid text selection detected');
            // Reset flag when no selection
            wasMenuManuallyClosed = false;
          }
        } finally {
          setTimeout(() => {
            isProcessing = false;
          }, 300);
        }
      }, 100),
      { capture: true }
    );

    // Listen for double-click
    document.addEventListener(
      'dblclick',
      (event) => {
        if (isCurrentSiteDisabled) return;

        if (isProcessing) return;

        isProcessing = true;
        try {
          const selection = window.getSelection();
          const selectedText = selection && selection.toString().trim() !== ''
            ? selection.toString().trim()
            : 'Double-clicked element';
          event.stopPropagation();
          createMenu(event.clientX, event.clientY, selectedText);
        } finally {
          setTimeout(() => {
            isProcessing = false;
          }, 300);
        }
      },
      { capture: true }
    );

    // Keyboard shortcuts for debugging
    document.addEventListener('keydown', (event) => {
      if (isCurrentSiteDisabled) {
        return;
      }
      // Ctrl+Shift+Q - Show queue status
      if (event.ctrlKey && event.shiftKey && event.key === 'Q') {
        event.preventDefault();
        getQueueStatus();
      }

      // Ctrl+Shift+S - Force sync
      if (event.ctrlKey && event.shiftKey && event.key === 'S') {
        event.preventDefault();
        browser.runtime.sendMessage({ type: 'forceSync' }).then((response) => {
          if (response && response.success) {
            showNotification('Manual sync completed', 'success');
          } else {
            showNotification('Manual sync failed', 'error');
          }
        });
      }

      // ESC key to close menu
      if (event.key === 'Escape') {
        const existingMenu = document.getElementById('custom-selection-menu');
        if (existingMenu) {
          wasMenuManuallyClosed = true; // Set flag for ESC key close
          const menu = existingMenu;
          menu.style.opacity = '0';
          menu.style.transform = 'scale(0.8) translateY(-10px)';
          setTimeout(() => {
            if (menu.parentNode) {
              menu.remove();
            }
          }, 200);
        }
      }
    });

    // Initialize content script
    console.log('Content script initialized for:', window.location.href);
  },
});
