const getAuthHeaders = () => {
  const user = localStorage.getItem('user');
  if (user) {
    const userData = JSON.parse(user);
    return { 'x-user-id': userData.id };
  }
  return {};
};

export const apiFetch = async (url: string, options: RequestInit = {}) => {
  const headers = {
    ...getAuthHeaders(),
    ...options.headers,
  };
  
  return fetch(url, { ...options, headers });
};

export default apiFetch;
