// API utility functions for handling different environments

const getApiBaseUrl = () => {
  if (process.env.NODE_ENV === 'production') {
    // In production on Netlify, use Netlify Functions
    return '/.netlify/functions';
  } else {
    // In development, use the local server
    return '/api';
  }
};

export const apiUrls = {
  paste: `${getApiBaseUrl()}/paste`,
  userPastes: `${getApiBaseUrl()}/user-pastes`,
  health: `${getApiBaseUrl()}/health`
};

// Helper function to make authenticated requests
export const makeAuthenticatedRequest = async (
  url: string,
  options: RequestInit = {},
  user?: any
) => {
  const headers: any = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  // Add authentication token if user is provided
  if (user) {
    const token = await user.getIdToken();
    headers.Authorization = `Bearer ${token}`;
  }

  return fetch(url, {
    ...options,
    headers
  });
};