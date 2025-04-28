import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AppBar, Toolbar, IconButton, Typography, Button } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import API from '../../utils/api'; // Make sure this path is correct

const Navbar = ({ handleDrawerToggle }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {  
      // Call your backend logout endpoint if needed
      await API.post('/admin/logout');
      
      // Clear local storage
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      
      // Redirect to login page
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
      // Still clear storage and redirect even if API fails
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      navigate('/');
    }
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
    >
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={handleDrawerToggle}
          sx={{ mr: 2 }}  // Removed display: { sm: 'none' }
        >
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
          CTKs Admin Panel
        </Typography>
        <Button color="inherit" onClick={handleLogout}>
          Logout
        </Button>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;