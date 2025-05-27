// In your API.js (make sure this is properly configured)
import axios from 'axios';

const API = axios.create({
  baseURL: 'https://ctks.onrender.com/api',  
  headers: {
    'Content-Type': 'application/json',
  },     
  withCredentials: true, // important for cookies
});

// Add this interceptor to attach token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default API;