import Cookies from 'js-cookie';

export const setLocalStorage = (key: string, value: any): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Failed to set localStorage for key: ${key}`, error);
  }
};

export const getLocalStorage = (key: string): any => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error(`Failed to get localStorage for key: ${key}`, error);
    return null;
  }
};

export const removeLocalStorage = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Failed to remove localStorage for key: ${key}`, error);
  }
};

export const clearLocalStorage = (): void => {
  try {
    localStorage.clear();
  } catch (error) {
    console.error('Failed to clear localStorage', error);
  }
};

export const setSessionStorage = (key: string, value: any): void => {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Failed to set sessionStorage for key: ${key}`, error);
  }
};

export const getSessionStorage = (key: string): any => {
  try {
    const value = sessionStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error(`Failed to get sessionStorage for key: ${key}`, error);
    return null;
  }
};

export const removeSessionStorage = (key: string): void => {
  try {
    sessionStorage.removeItem(key);
  } catch (error) {
    console.error(`Failed to remove sessionStorage for key: ${key}`, error);
  }
};

export const clearSessionStorage = (): void => {
  try {
    sessionStorage.clear();
  } catch (error) {
    console.error('Failed to clear sessionStorage', error);
  }
};

export const setCookie = (
  key: string,
  value: any,
  options?: Cookies.CookieAttributes
): void => {
  try {
    Cookies.set(key, JSON.stringify(value), {
      expires: 7,
      sameSite: 'strict',
      ...options,
    });
  } catch (error) {
    console.error(`Failed to set cookie for key: ${key}`, error);
  }
};

export const getCookie = (key: string): any => {
  try {
    const value = Cookies.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error(`Failed to get cookie for key: ${key}`, error);
    return null;
  }
};

export const removeCookie = (key: string): void => {
  try {
    Cookies.remove(key);
  } catch (error) {
    console.error(`Failed to remove cookie for key: ${key}`, error);
  }
};

export const setAuthToken = (token: string): void => {
  setCookie('auth_token', token, { expires: 7 });
};

export const getAuthToken = (): string | null => {
  const token = getCookie('auth_token');
  return token || null;
};

export const removeAuthToken = (): void => {
  removeCookie('auth_token');
};

export const getOrCreateSessionId = (): string => {
  let sessionId = getSessionStorage('session_id');

  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    setSessionStorage('session_id', sessionId);
  }

  return sessionId;
};

export const saveChatHistory = (history: any[]): void => {
  setLocalStorage('chat_history', history);
};

export const getChatHistory = (): any[] => {
  return getLocalStorage('chat_history') || [];
};

export const clearChatHistory = (): void => {
  removeLocalStorage('chat_history');
};

export const saveUserInfo = (userInfo: any): void => {
  setLocalStorage('user_info', userInfo);
};

export const getUserInfo = (): any => {
  return getLocalStorage('user_info');
};

export const clearUserInfo = (): void => {
  removeLocalStorage('user_info');
};
