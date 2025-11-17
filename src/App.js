import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import theme from './styles/theme';
import GlobalStyles from './styles/globalStyles';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline /> {/* Resets Material-UI styles */}
      <GlobalStyles /> {/* Applies global CSS */}
      <Router>
        <Routes>
          {/* Public route */}
          <Route path="/" element={<Login />} />
          
          {/* Protected admin routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/admin" element={<AdminDashboard />} />
            {/* Add other protected admin routes here as they're created */}
            {/* <Route path="/admin/vendors" element={<VendorManagement />} /> */}
            {/* <Route path="/admin/customers" element={<CustomerManagement />} /> */}
            {/* <Route path="/admin/admins" element={<AdminManagement />} /> */}
          </Route>
          
          {/* 404 page */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;