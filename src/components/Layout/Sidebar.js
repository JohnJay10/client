import React, { useState, useEffect } from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Toolbar,
  Box,
  IconButton,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  VerifiedUser as VerifiedUserIcon,
  AttachMoney as AttachMoneyIcon,
  Send as SendIcon,
  Settings as SettingsIcon,
  Add as AddIcon,
  ChevronLeft as ChevronLeftIcon,
  Menu as MenuIcon,
  Close as CloseIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const drawerWidth = 240;
const collapsedWidth = 72;

const StyledDrawer = styled(Drawer)(({ theme }) => ({
  '& .MuiDrawer-paper': {
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
    overflowX: 'hidden',
    boxSizing: 'border-box',
  },
}));

const Sidebar = ({ activeComponent, setActiveComponent }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const menuItems = [
    { name: 'dashboard', icon: <DashboardIcon />, label: 'Dashboard' },
    { name: 'createVendor', icon: <PeopleIcon />, label: 'Vendors' },
    { name: 'verifyCustomer', icon: <VerifiedUserIcon />, label: 'Verify Customers' },
    { name: 'discoPricing', icon: <AttachMoneyIcon />, label: 'Disco Pricing' },
    { name: 'tokenManagement', icon: <SendIcon />, label: 'Token Management' },
    { name: 'accountManagement', icon: <SettingsIcon />, label: 'Account Management' },
    { name: 'addVendorSpace', icon: <AddIcon />, label: 'Vendor Space' },
  ];

  const handleMenuItemClick = (componentName) => {
    setActiveComponent(componentName);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const handleDrawerToggle = () => {
    if (isMobile) {
      setMobileOpen(!mobileOpen);
    } else {
      setCollapsed(!collapsed);
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    // You would typically implement your theme switching logic here
  };

  const MobileToggleButton = () => (
    <IconButton
      color="inherit"
      aria-label="open drawer"
      edge="start"
      onClick={handleDrawerToggle}
      sx={{
        position: 'fixed',
        top: 16,
        left: 16,
        zIndex: theme.zIndex.drawer + 1,
        display: { xs: 'block', md: 'none' },
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.primary.contrastText,
        '&:hover': {
          backgroundColor: theme.palette.primary.dark,
        },
      }}
    >
      {mobileOpen ? <CloseIcon /> : <MenuIcon />}
    </IconButton>
  );

  const CollapseButton = () => (
    <IconButton
      onClick={handleDrawerToggle}
      sx={{
        position: 'absolute',
        right: -12,
        top: 60,
        backgroundColor: theme.palette.background.paper,
        border: `1px solid ${theme.palette.divider}`,
        '&:hover': {
          backgroundColor: theme.palette.action.hover,
        },
        display: { xs: 'none', md: 'flex' },
      }}
    >
      <ChevronLeftIcon
        sx={{
          transform: collapsed ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: theme.transitions.create('transform', {
            duration: theme.transitions.duration.shortest,
          }),
        }}
      />
    </IconButton>
  );

  return (
    <>
      <MobileToggleButton />

      <Box
        component="nav"
        sx={{
          width: { md: collapsed ? collapsedWidth : drawerWidth },
          flexShrink: { md: 0 },
        }}
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
        >
          <Toolbar />
          <Divider />
          <List>
            {menuItems.map((item) => (
              <ListItem
                button
                key={item.name}
                onClick={() => handleMenuItemClick(item.name)}
                selected={activeComponent === item.name}
                sx={{
                  '&.Mui-selected': {
                    backgroundColor: theme.palette.action.selected,
                  },
                  '&.Mui-selected:hover': {
                    backgroundColor: theme.palette.action.selected,
                  },
                }}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItem>
            ))}
          </List>
          <Divider />
          <ListItem button onClick={toggleDarkMode}>
            <ListItemIcon>
              {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
            </ListItemIcon>
            <ListItemText primary={darkMode ? 'Light Mode' : 'Dark Mode'} />
          </ListItem>
        </Drawer>

        {/* Desktop drawer */}
        <StyledDrawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              width: collapsed ? collapsedWidth : drawerWidth,
            },
          }}
          open
        >
          <Toolbar
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'space-between',
              px: collapsed ? 0 : 2,
            }}
          >
            {!collapsed && (
              <>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <DashboardIcon sx={{ mr: 1 }} />
                  <span>Admin Panel</span>
                </Box>
              </>
            )}
            {collapsed && <DashboardIcon />}
            <CollapseButton />
          </Toolbar>
          <Divider />
          <List>
            {menuItems.map((item) => (
              <ListItem
                button
                key={item.name}
                onClick={() => handleMenuItemClick(item.name)}
                selected={activeComponent === item.name}
                sx={{
                  justifyContent: collapsed ? 'center' : 'initial',
                  px: collapsed ? 0 : 2,
                  '&.Mui-selected': {
                    backgroundColor: theme.palette.action.selected,
                  },
                  '&.Mui-selected:hover': {
                    backgroundColor: theme.palette.action.selected,
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: collapsed ? 'auto' : 56,
                    justifyContent: 'center',
                    color: activeComponent === item.name ? theme.palette.primary.main : 'inherit',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                {!collapsed && <ListItemText primary={item.label} />}
              </ListItem>
            ))}
          </List>
          <Divider />
          <ListItem 
            button 
            onClick={toggleDarkMode}
            sx={{
              justifyContent: collapsed ? 'center' : 'initial',
              px: collapsed ? 0 : 2,
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: collapsed ? 'auto' : 56,
                justifyContent: 'center',
              }}
            >
              {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
            </ListItemIcon>
            {!collapsed && <ListItemText primary={darkMode ? 'Light Mode' : 'Dark Mode'} />}
          </ListItem>
        </StyledDrawer>
      </Box>
    </>
  );
};

export default Sidebar;