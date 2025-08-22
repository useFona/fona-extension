export interface PageName {
  id: string;
  name: string;
  isActive: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  token: string;
}

export interface Page {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface DisabledSite {
  id: string;
  url: string;
  addedAt: string;
}

export interface LoginProps {
  userToken: string;
  setUserToken: (token: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  error: string;
}

export interface UserProfileHeaderProps {
  user: User;
  onRefresh: () => void;
  onLogout: () => void;
  isLoading: boolean;
}

export interface AddPageInputProps {
  newPageName: string;
  setNewPageName: (name: string) => void;
  onAdd: () => void;
  isLoading: boolean;
}

export interface ActivePageDisplayProps {
  activePage: PageName | undefined;
}

export interface PagesListProps {
  pageNames: PageName[];
  onSetActive: (id: string) => void;
  onDelete: (id: string) => void;
  isLoading: boolean;
}

export interface ErrorDisplayProps {
  error: string;
}

export interface DashboardLinkProps {
  onManageDisabledSites: () => void;
}

export interface DisabledSitesPageProps {
  onClose: () => void;
  disabledSites: DisabledSite[];
  onRemoveSite: (id: string) => void;
  onAddCurrentSite: (type: 'page' | 'domain') => void;
  currentUrl: string;
  isCurrentSiteDisabled: boolean;
  user: User;
  onRefresh: () => void;
  onLogout: () => void;
  isLoading: boolean;
}