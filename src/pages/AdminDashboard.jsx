import React, { useState, useEffect } from 'react';
import { 
  Box, 
  CssBaseline, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  Paper,
  CircularProgress,
  Divider,
  useTheme
} from '@mui/material';
import {
  People as PeopleIcon,

  Receipt as ReceiptIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import Navbar from '../components/Layout/Navbar';
import Sidebar from '../components/Layout/Sidebar';
import CreateVendor from '../components/Admin/CreateVendor';
import VerifyCustomer from '../components/Admin/VerifyCustomer';
import DiscoPricing from '../components/Admin/DiscoPricing';
import TokenManagement from '../components/Admin/TokenManagement';
import RecentActivities from '../components/Admin/RecentActivities';
import AccountManagement from '../components/Admin/AccountManagement';
import API from '../utils/api';

const AdminDashboard = () => {
  const theme = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeComponent, setActiveComponent] = useState('dashboard');
  const [stats, setStats] = useState({
    totalCustomers: 0,
    pendingCustomers: 0,
    pendingTokens: 0,
    loading: true
  });
  const [recentActivities, setRecentActivities] = useState([]);

  useEffect(() => {
    if (activeComponent === 'dashboard') {
      fetchDashboardData();
    }
  }, [activeComponent]);

  const fetchDashboardData = async () => {
    try {
      setStats(prev => ({ ...prev, loading: true }));
      
      // Fetch only the required stats
      const [
        totalCustomersRes, 
        pendingCustomersRes, 
        pendingTokensRes,
        activitiesRes
      ] = await Promise.all([
        API.get('/admin/customers/count'),
        API.get('/admin/pending-vendor-count'),
        API.get('/admin/tokens/pending-count'),
        API.get('/admin/activities')
      ]);

      setStats({
        totalCustomers: totalCustomersRes.data.count || 0,
        pendingCustomers: pendingCustomersRes.data.count || 0,
        pendingTokens: pendingTokensRes.data.count || 0,
        loading: false
      });

      setRecentActivities(activitiesRes.data || []);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setStats(prev => ({ ...prev, loading: false }));
    }
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const StatCard = ({ icon, title, value, subtext, color, iconBg }) => (
    <Card sx={{ 
      height: '100%', 
      boxShadow: theme.shadows[4],
      transition: 'transform 0.3s, box-shadow 0.3s',
      '&:hover': {
        transform: 'translateY(-5px)',
        boxShadow: theme.shadows[8]
      }
    }}>
      <CardContent sx={{ p: 9 }}>
        <Box display="flex" alignItems="center" mb={2}>
          <Box 
            sx={{
              backgroundColor: iconBg || color,
              color: 'white',
              borderRadius: '12px',
              width: 56,
              height: 56,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: 2
            }}
          >
            {React.cloneElement(icon, { style: { fontSize: 28 } })}
          </Box>
          <Box>
            <Typography 
              variant="subtitle1" 
              color="text.secondary"
              sx={{ fontWeight: 500 }}
            >
              {title}
            </Typography>
            <Typography 
              variant="h4" 
              component="div"
              sx={{ fontWeight: 700 }}
            >
              {stats.loading ? <CircularProgress size={24} /> : value}
            </Typography>
          </Box>
        </Box>
        {subtext && (
          <Typography 
            variant="caption" 
            color="text.secondary"
            sx={{ display: 'block', mt: 1 }}
          >
            {subtext}
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  const renderActiveComponent = () => {
    switch (activeComponent) {
      case 'createVendor':
        return <CreateVendor />;
      case 'verifyCustomer':
        return <VerifyCustomer />;
      case 'discoPricing':
        return <DiscoPricing />;
      case 'tokenManagement':
        return <TokenManagement />;
      case 'accountManagement':
        return <AccountManagement />;
      default:
        return (
          <Box sx={{ p: 9, backgroundColor: theme.palette.background.paper }}>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, mb: 4 }}>
              Admin Dashboard Overview
            </Typography>
            
            {/* Main Stats Cards */}
            <Grid container spacing={4} mb={4}>
              <Grid item xs={12} sm={6} lg={4}>
                <StatCard 
                  icon={<PeopleIcon />} 
                  title="Total Customers" 
                  value={stats.totalCustomers.toLocaleString()} 
                  subtext="All registered customers"
                  color="#3f51b5"
                  iconBg="#5c6bc0"
                />
              </Grid>
              <Grid item xs={12} sm={6} lg={4}>
                <StatCard 
                  icon={<WarningIcon />} 
                  title="Pending Customers" 
                  value={stats.pendingCustomers.toLocaleString()} 
                  subtext="Awaiting verification"
                  color="#ff9800"
                  iconBg="#ffa726"
                />
              </Grid>
              <Grid item xs={12} sm={6} lg={4}>
                <StatCard 
                  icon={<ReceiptIcon />} 
                  title="Pending Tokens" 
                  value={stats.pendingTokens.toLocaleString()} 
                  subtext="Awaiting processing"
                  color="#9c27b0"
                  iconBg="#ab47bc"
                />
              </Grid>
            </Grid>

            {/* Recent Activities Section */}
            <Grid container spacing={4}>
              <Grid item xs={12}>
                <Paper 
                  sx={{ 
                    p: 3, 
                    height: '100%',
                    boxShadow: theme.shadows[2],
                    borderRadius: '12px'
                  }}
                >
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    Recent Activities
                  </Typography>
                  <Divider sx={{ mb: 3 }} />
                  <RecentActivities activities={recentActivities} />
                </Paper>
              </Grid>
            </Grid>
          </Box>
        );
    }
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <Navbar handleDrawerToggle={handleDrawerToggle} />
      <Sidebar 
        mobileOpen={mobileOpen} 
        handleDrawerToggle={handleDrawerToggle}
        setActiveComponent={setActiveComponent}  
      />
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          p: 3,
          backgroundColor: theme.palette.background.default
        }}
      >
        {renderActiveComponent()}
      </Box>
    </Box>
  );
};

export default AdminDashboard;