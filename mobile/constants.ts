// API base URL - change for production
import { Platform } from 'react-native';

// For Android emulator, use 10.0.2.2:3000 instead of localhost
const getBaseUrl = () => {
  if (__DEV__) {
    return Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';
  }
  // Production - replace with your deployed backend URL
  return 'https://your-api.rumimind.com';
};

export const API_URL = getBaseUrl();

// Web app URL for WebView game
export const WEB_APP_URL = __DEV__
  ? Platform.OS === 'android'
    ? 'http://10.0.2.2:5173'
    : 'http://localhost:5173'
  : 'https://rumimind.com';
