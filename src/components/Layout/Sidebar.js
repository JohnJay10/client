import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Toolbar,
  Box,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  VerifiedUser as VerifiedUserIcon,
  AttachMoney as AttachMoneyIcon,
  Send as SendIcon,
  AccountBalance as AccountBalanceIcon,
} from '@mui/icons-material';

const drawerWidth = 240;

const Sidebar = ({ mobileOpen, handleDrawerToggle, setActiveComponent }) => {
  const handleMenuItemClick = (componentName) => {
    setActiveComponent(componentName);
    handleDrawerToggle(); // Close the drawer on mobile after selection
  };

  const drawer = (
    <div>
      <Toolbar />
      <Divider />
      <List>
        <ListItem button onClick={() => handleMenuItemClick('dashboard')}>
          <ListItemIcon>
            <DashboardIcon />
          </ListItemIcon>
          <ListItemText primary="Dashboard" />
        </ListItem>
        <ListItem button onClick={() => handleMenuItemClick('createVendor')}>
          <ListItemIcon>
            <PeopleIcon />
          </ListItemIcon>
          <ListItemText primary="Vendors" />
        </ListItem>
        <ListItem button onClick={() => handleMenuItemClick('verifyCustomer')}>
          <ListItemIcon>
            <VerifiedUserIcon />
          </ListItemIcon>
          <ListItemText primary="Verify Customers" />
        </ListItem>
        <ListItem button onClick={() => handleMenuItemClick('discoPricing')}>
          <ListItemIcon>
            <AttachMoneyIcon />
          </ListItemIcon>
          <ListItemText primary="Disco Pricing" />
        </ListItem>
        <ListItem button onClick={() => handleMenuItemClick('tokenManagement')}>
          <ListItemIcon>
            <SendIcon />
          </ListItemIcon>
          <ListItemText primary="Token Management" />
        </ListItem>
        <ListItem button onClick={() => handleMenuItemClick('accountManagement')}>
          <ListItemIcon>
            <AccountBalanceIcon />
          </ListItemIcon>
          <ListItemText primary="Account Management" />
        </ListItem>
        <ListItem button onClick={() => handleMenuItemClick('addVendorSpace')}>
          <ListItemIcon>
            <AccountBalanceIcon />
          </ListItemIcon>
          <ListItemText primary="Vendor Space" />
        </ListItem>
      </List>
    </div>
  );

  return (
    <Box
    component="nav"
    sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
    aria-label="mailbox folders"
  >
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
      >
        {drawer}
      </Drawer>
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
        open
      >
        {drawer}
      </Drawer>
    </Box>
  );
};

export default Sidebar;