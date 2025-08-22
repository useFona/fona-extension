import { User, Page } from '@/types';

const API_BASE_URL = 'https://fona.meet-jain.in/api/extention';

export class ApiService {
  static async fetchUser(token: string): Promise<User> {
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
    const userData = responseData.user;

    if (!userData) {
      throw new Error('No user data found in response');
    }

    return {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      token: token
    };
  }

  static async fetchPages(token: string): Promise<Page[]> {
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
    const pagesArray = responseData.pages || [];

    return pagesArray.map((page: any) => ({
      id: page.id,
      title: page.title,
      createdAt: page.createdAt || new Date().toISOString(),
      updatedAt: page.updatedAt || new Date().toISOString()
    }));
  }

  static async createPage(userToken: string, title: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/pages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userToken,
        title: title.trim()
      })
    });

    if (!response.ok) {
      throw new Error('Failed to create page');
    }
  }
}
