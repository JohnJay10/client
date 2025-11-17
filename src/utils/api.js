// utils/api.js
import axios from 'axios';

const API = axios.create({
  // baseURL: 'http://localhost:3000/api',  
   baseURL: 'https://ctks.onrender.com/api', 
  
  headers: {
    'Content-Type': 'application/json',
  },     
  withCredentials: true,
});

// Enhanced request interceptor with detailed logging
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
  
  console.log('🚀 API REQUEST ==============================');
  console.log('  - URL:', config.url);
  console.log('  - Method:', config.method?.toUpperCase());
  console.log('  - Token in localStorage:', !!token);
  console.log('  - Token value:', token ? `${token.substring(0, 20)}...` : 'None');
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log('  ✅ Token added to Authorization header');
  } else {
    console.log('  ❌ No token found in localStorage');
  }
  
  console.log('  - Headers:', config.headers);
  console.log('==========================================');
  
  return config;
}, (error) => {
  console.error('❌ Request interceptor error:', error);
  return Promise.reject(error);
});

// Enhanced response interceptor
API.interceptors.response.use(
  (response) => {
    console.log('✅ API SUCCESS ==============================');
    console.log('  - URL:', response.config.url);
    console.log('  - Status:', response.status);
    console.log('  - Data:', response.data);
    console.log('==========================================');
    return response;
  },
  (error) => {
    console.error('❌ API ERROR ==============================');
    console.log('  - URL:', error.config?.url);
    console.log('  - Status:', error.response?.status);
    console.log('  - Error message:', error.response?.data?.message);
    console.log('  - Full error:', error.response?.data);
    console.log('==========================================');
    
    if (error.response?.status === 401) {
      console.log('🔄 401 Unauthorized - clearing storage');
      localStorage.clear();
      window.location.href = '/';
    }
    
    return Promise.reject(error);
  }
);

export default API;