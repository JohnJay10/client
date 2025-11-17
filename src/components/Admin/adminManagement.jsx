import React, { useState, useEffect } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  CircularProgress,
  Snackbar,
  Card,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Switch,
  FormControlLabel,
  Grid,
  Alert,
  // Paper
} from '@mui/material';
import { 
  Edit, 
  Delete, 
  CheckCircle,
  Cancel,
  Add,
  Refresh,
  MoreVert,
  AdminPanelSettings,
  // Visibility,
  Settings,
  Group,
  Analytics,
  AccountCircle
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import API from '../../utils/api';
import { format } from 'date-fns';

const AdminManagement = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false);
  const [currentAdmin, setCurrentAdmin] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  // Fetch current user profile on component mount
  useEffect(() => {
    fetchCurrentUser();
    fetchAdmins();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const response = await API.get('/admin/profile');
      setCurrentUser(response.data.data);
    } catch (error) {
      console.error('Error fetching current user:', error);
      setSnackbar({
        open: true,
        message: 'Failed to fetch user profile',
        severity: 'error'
      });
    }
  };

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const response = await API.get('/admin/admins');
      setAdmins(response.data.data || []);
    } catch (error) {
      console.error('Error fetching admins:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to fetch admins',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event, admin) => {
    setMenuAnchor(event.currentTarget);
    setSelectedAdmin(admin);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedAdmin(null);
  };

  const handleEditAdmin = (admin) => {
    setCurrentAdmin(admin);
    editFormik.setValues({
      username: admin.username,
      role: admin.role,
      password: '' // Password is optional for updates
    });
    setEditDialogOpen(true);
    handleMenuClose();
  };

  const handlePermissions = (admin) => {
    setCurrentAdmin(admin);
    permissionsFormik.setValues({
      // Existing permissions
      createVendors: admin.permissions?.createVendors || false,
      verifyCustomers: admin.permissions?.verifyCustomers || false,
      discoPricing: admin.permissions?.discoPricing || false,
      tokenManagement: admin.permissions?.tokenManagement || false,
      // New permissions
      accountManagement: admin.permissions?.accountManagement || false,
      vendorSpace: admin.permissions?.vendorSpace || false,
      vendorCustomer: admin.permissions?.vendorCustomer || false,
      viewAnalytics: admin.permissions?.viewAnalytics || false,
      systemSettings: admin.permissions?.systemSettings || false
    });
    setPermissionsDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteAdmin = (admin) => {
    setCurrentAdmin(admin);
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleToggleStatus = async (admin) => {
    try {
      setProcessingId(admin._id);
      const newStatus = !admin.active;
      
      await API.patch(`/admin/admins/${admin._id}/status`, {
        active: newStatus
      });
      
      setAdmins(prev => prev.map(a => 
        a._id === admin._id ? { 
          ...a, 
          active: newStatus,
          updatedAt: new Date().toISOString()
        } : a
      ));
      
      setSnackbar({
        open: true,
        message: `Admin ${newStatus ? 'activated' : 'deactivated'} successfully`,
        severity: 'success'
      });
    } catch (error) {
      console.error('Toggle status error:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to update admin status',
        severity: 'error'
      });
    } finally {
      setProcessingId(null);
    }
  };

  const confirmDeleteAdmin = async () => {
    try {
      await API.delete(`/admin/admins/${currentAdmin._id}`);
      setSnackbar({
        open: true,
        message: 'Admin deleted successfully',
        severity: 'success'
      });
      fetchAdmins();
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to delete admin',
        severity: 'error'
      });
    } finally {
      setDeleteDialogOpen(false);
      setCurrentAdmin(null);
    }
  };

  // Formik for Add Admin
  const addFormik = useFormik({
    initialValues: {
      username: '',
      password: '',
      confirmPassword: '',
      role: 'admin'
    },
    validationSchema: Yup.object({
      username: Yup.string()
        .min(3, 'Username must be at least 3 characters')
        .required('Username is required'),
      password: Yup.string()
        .min(6, 'Password must be at least 6 characters')
        .required('Password is required'),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref('password'), null], 'Passwords must match')
        .required('Please confirm your password'),
      role: Yup.string()
        .oneOf(['super_admin', 'admin'], 'Invalid role')
        .required('Role is required')
    }),
    onSubmit: async (values, { resetForm }) => {
      try {
        const { confirmPassword, ...adminData } = values;
        
        // For admin role, set default permissions
        if (adminData.role === 'admin') {
          adminData.permissions = {
            createVendors: false,
            verifyCustomers: false,
            discoPricing: false,
            tokenManagement: false,
            accountManagement: false,
            vendorSpace: false,
            vendorCustomer: false,
            viewAnalytics: false,
            systemSettings: false
          };
        }
        
        const response = await API.post('/admin/admins/register', adminData);
        
        setSnackbar({
          open: true,
          message: response.data.message || 'Admin created successfully',
          severity: 'success'
        });
        
        resetForm();
        setAddDialogOpen(false);
        fetchAdmins();
        
      } catch (error) {
        setSnackbar({
          open: true,
          message: error.response?.data?.message || 'Failed to create admin',
          severity: 'error'
        });
      }
    },
  });

  // Formik for Edit Admin
  const editFormik = useFormik({
    initialValues: {
      username: '',
      role: 'admin',
      password: '',
    },
    validationSchema: Yup.object({
      username: Yup.string()
        .min(3, 'Username must be at least 3 characters')
        .required('Username is required'),
      role: Yup.string()
        .oneOf(['super_admin', 'admin'], 'Invalid role')
        .required('Role is required'),
      password: Yup.string()
        .min(6, 'Password must be at least 6 characters'),
    }),
    onSubmit: async (values) => {
      try {
        // Only include password if it's provided
        const updateData = values.password 
          ? values 
          : { username: values.username, role: values.role };
        
        await API.patch(`/admin/admins/${currentAdmin._id}`, updateData);
        setSnackbar({
          open: true,
          message: 'Admin updated successfully',
          severity: 'success'
        });
        setEditDialogOpen(false);
        setCurrentAdmin(null);
        fetchAdmins();
      } catch (error) {
        setSnackbar({
          open: true,
          message: error.response?.data?.message || 'Failed to update admin',
          severity: 'error'
        });
      }
    },
  });

  // Formik for Permissions
  const permissionsFormik = useFormik({
    initialValues: {
      // Existing permissions
      createVendors: false,
      verifyCustomers: false,
      discoPricing: false,
      tokenManagement: false,
      // New permissions
      accountManagement: false,
      vendorSpace: false,
      vendorCustomer: false,
      viewAnalytics: false,
      systemSettings: false
    },
    onSubmit: async (values) => {
      try {
        await API.patch(`/admin/admins/${currentAdmin._id}/permissions`, values);
        setSnackbar({
          open: true,
          message: 'Permissions updated successfully',
          severity: 'success'
        });
        setPermissionsDialogOpen(false);
        setCurrentAdmin(null);
        fetchAdmins();
      } catch (error) {
        setSnackbar({
          open: true,
          message: error.response?.data?.message || 'Failed to update permissions',
          severity: 'error'
        });
      }
    },
  });

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'super_admin': return 'error';
      case 'admin': return 'primary';
      default: return 'default';
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'super_admin': return 'Super Admin';
      case 'admin': return 'Admin';
      default: return role;
    }
  };

  const getPermissionIcon = (permission) => {
    switch (permission) {
      case 'createVendors': return <Group fontSize="small" />;
      case 'verifyCustomers': return <CheckCircle fontSize="small" />;
      case 'discoPricing': return <Settings fontSize="small" />;
      case 'tokenManagement': return <AdminPanelSettings fontSize="small" />;
      case 'accountManagement': return <AccountCircle fontSize="small" />;
      case 'vendorSpace': return <Group fontSize="small" />;
      case 'vendorCustomer': return <Group fontSize="small" />;
      case 'viewAnalytics': return <Analytics fontSize="small" />;
      case 'systemSettings': return <Settings fontSize="small" />;
      default: return <AdminPanelSettings fontSize="small" />;
    }
  };

  const getPermissionLabel = (permission) => {
    const labels = {
      createVendors: 'Vendors',
      verifyCustomers: 'Customers',
      discoPricing: 'Pricing',
      tokenManagement: 'Tokens',
      accountManagement: 'Accounts',
      vendorSpace: 'Vendor Space',
      vendorCustomer: 'Vendor Customers',
      viewAnalytics: 'Analytics',
      systemSettings: 'Settings'
    };
    return labels[permission] || permission;
  };

  // Check if current user is super admin
  const isSuperAdmin = currentUser?.role === 'super_admin';

  // Check if current user has account management permission
  const hasAccountManagement = currentUser?.permissions?.accountManagement || isSuperAdmin;

  // Render permissions chips for an admin
  const renderPermissions = (admin) => {
    if (admin.role === 'super_admin') {
      return (
        <Typography variant="caption" color="success.main" fontWeight="bold">
          All Permissions
        </Typography>
      );
    }

    const activePermissions = Object.entries(admin.permissions || {})
      .filter(([key, value]) => value === true)
      .map(([key]) => key);

    if (activePermissions.length === 0) {
      return (
        <Typography variant="caption" color="text.secondary">
          No Permissions
        </Typography>
      );
    }

    return (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
        {activePermissions.slice(0, 3).map(permission => (
          <Chip
            key={permission}
            label={getPermissionLabel(permission)}
            size="small"
            variant="outlined"
            color="primary"
            icon={getPermissionIcon(permission)}
          />
        ))}
        {activePermissions.length > 3 && (
          <Chip
            label={`+${activePermissions.length - 3} more`}
            size="small"
            variant="outlined"
            color="default"
          />
        )}
      </Box>
    );
  };

  return (
    <Box sx={{ p: 9, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 9 }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Admin Management
        </Typography>
        <Box>
          <Button 
            variant="outlined" 
            startIcon={<Refresh />} 
            onClick={fetchAdmins}
            sx={{ mr: 2 }}
          >
            Refresh
          </Button>
          {hasAccountManagement && (
            <Button 
              variant="contained" 
              startIcon={<Add />}
              onClick={() => setAddDialogOpen(true)}
            >
              Create Admin
            </Button>
          )}
        </Box>
      </Box>

      {!hasAccountManagement && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          You need account management permissions to manage other admins.
        </Alert>
      )}

      <Card elevation={3}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Username</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Permissions</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created At</TableCell>
                <TableCell>Last Updated</TableCell>
                {hasAccountManagement && <TableCell align="center">Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={hasAccountManagement ? 7 : 6} align="center" sx={{ py: 4 }}>
                    <CircularProgress />
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Loading admins...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : admins.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={hasAccountManagement ? 7 : 6} align="center" sx={{ py: 4 }}>
                    <AdminPanelSettings sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                    <Typography variant="h6" color="text.secondary">
                      No admins found
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {hasAccountManagement ? 'Create your first admin to get started' : 'No admins available'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                admins
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((admin) => (
                    <TableRow key={admin._id} hover>
                      <TableCell>
                        <Typography variant="body1" fontWeight="medium">
                          {admin.username}
                          {admin._id === currentUser?._id && (
                            <Chip label="You" size="small" color="primary" sx={{ ml: 1 }} />
                          )}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getRoleLabel(admin.role)}
                          color={getRoleColor(admin.role)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {renderPermissions(admin)}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={admin.active ? 'Active' : 'Inactive'}
                          color={admin.active ? 'success' : 'default'}
                          icon={admin.active ? <CheckCircle /> : <Cancel />}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(admin.createdAt)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(admin.updatedAt)}
                        </Typography>
                      </TableCell>
                      {hasAccountManagement && (
                        <TableCell align="center">
                          <IconButton 
                            size="small"
                            onClick={(e) => handleMenuOpen(e, admin)}
                            disabled={processingId === admin._id || admin._id === currentUser?._id}
                          >
                            {processingId === admin._id ? (
                              <CircularProgress size={20} />
                            ) : (
                              <MoreVert />
                            )}
                          </IconButton>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={admins.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Card>

      {/* Action Menu */}
      {hasAccountManagement && (
        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={() => handleEditAdmin(selectedAdmin)}>
            <Edit sx={{ mr: 1 }} fontSize="small" />
            Edit Admin
          </MenuItem>
          <MenuItem onClick={() => handlePermissions(selectedAdmin)}>
            <AdminPanelSettings sx={{ mr: 1 }} fontSize="small" />
            Manage Permissions
          </MenuItem>
          <MenuItem onClick={() => handleToggleStatus(selectedAdmin)}>
            {selectedAdmin?.active ? (
              <>
                <Cancel sx={{ mr: 1 }} fontSize="small" />
                Deactivate
              </>
            ) : (
              <>
                <CheckCircle sx={{ mr: 1 }} fontSize="small" />
                Activate
              </>
            )}
          </MenuItem>
          <MenuItem 
            onClick={() => handleDeleteAdmin(selectedAdmin)}
            sx={{ color: 'error.main' }}
            disabled={selectedAdmin?.role === 'super_admin' || selectedAdmin?._id === currentUser?._id}
          >
            <Delete sx={{ mr: 1 }} fontSize="small" />
            Delete
          </MenuItem>
        </Menu>
      )}

      {/* Create Admin Dialog */}
      {hasAccountManagement && (
        <Dialog 
          open={addDialogOpen} 
          onClose={() => setAddDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Typography variant="h6" fontWeight="bold">
              Create New Admin
            </Typography>
          </DialogTitle>
          <DialogContent>
            <Box component="form" onSubmit={addFormik.handleSubmit} sx={{ mt: 1 }}>
              <TextField
                margin="normal"
                fullWidth
                id="username"
                name="username"
                label="Username"
                value={addFormik.values.username}
                onChange={addFormik.handleChange}
                error={addFormik.touched.username && Boolean(addFormik.errors.username)}
                helperText={addFormik.touched.username && addFormik.errors.username}
                autoFocus
              />
              <FormControl fullWidth margin="normal">
                <InputLabel id="role-label">Role</InputLabel>
                <Select
                  labelId="role-label"
                  id="role"
                  name="role"
                  value={addFormik.values.role}
                  onChange={addFormik.handleChange}
                  label="Role"
                >
                  <MenuItem value="admin">Admin</MenuItem>
                  <MenuItem value="super_admin">Super Admin</MenuItem>
                </Select>
              </FormControl>
              <TextField
                margin="normal"
                fullWidth
                id="password"
                name="password"
                label="Password"
                type="password"
                value={addFormik.values.password}
                onChange={addFormik.handleChange}
                error={addFormik.touched.password && Boolean(addFormik.errors.password)}
                helperText={addFormik.touched.password && addFormik.errors.password}
              />
              <TextField
                margin="normal"
                fullWidth
                id="confirmPassword"
                name="confirmPassword"
                label="Confirm Password"
                type="password"
                value={addFormik.values.confirmPassword}
                onChange={addFormik.handleChange}
                error={addFormik.touched.confirmPassword && Boolean(addFormik.errors.confirmPassword)}
                helperText={addFormik.touched.confirmPassword && addFormik.errors.confirmPassword}
              />
              <DialogActions sx={{ px: 0, pb: 0, mt: 2 }}>
                <Button onClick={() => setAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="contained" 
                  disabled={addFormik.isSubmitting}
                >
                  {addFormik.isSubmitting ? <CircularProgress size={24} /> : 'Create Admin'}
                </Button>
              </DialogActions>
            </Box>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Admin Dialog */}
      {hasAccountManagement && (
        <Dialog 
          open={editDialogOpen} 
          onClose={() => setEditDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Typography variant="h6" fontWeight="bold">
              Edit Admin
            </Typography>
          </DialogTitle>
          <DialogContent>
            <Box component="form" onSubmit={editFormik.handleSubmit} sx={{ mt: 1 }}>
              <TextField
                margin="normal"
                fullWidth
                id="username"
                name="username"
                label="Username"
                value={editFormik.values.username}
                onChange={editFormik.handleChange}
                error={editFormik.touched.username && Boolean(editFormik.errors.username)}
                helperText={editFormik.touched.username && editFormik.errors.username}
              />
              <FormControl fullWidth margin="normal">
                <InputLabel id="edit-role-label">Role</InputLabel>
                <Select
                  labelId="edit-role-label"
                  id="role"
                  name="role"
                  value={editFormik.values.role}
                  onChange={editFormik.handleChange}
                  label="Role"
                  disabled={currentAdmin?.role === 'super_admin'}
                >
                  <MenuItem value="admin">Admin</MenuItem>
                  <MenuItem value="super_admin">Super Admin</MenuItem>
                </Select>
              </FormControl>
              <TextField
                margin="normal"
                fullWidth
                id="password"
                name="password"
                label="New Password (leave blank to keep current)"
                type="password"
                value={editFormik.values.password}
                onChange={editFormik.handleChange}
                error={editFormik.touched.password && Boolean(editFormik.errors.password)}
                helperText={editFormik.touched.password && editFormik.errors.password}
              />
              <DialogActions sx={{ px: 0, pb: 0, mt: 2 }}>
                <Button onClick={() => setEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="contained" 
                  disabled={editFormik.isSubmitting}
                >
                  {editFormik.isSubmitting ? <CircularProgress size={24} /> : 'Update Admin'}
                </Button>
              </DialogActions>
            </Box>
          </DialogContent>
        </Dialog>
      )}

      {/* Permissions Dialog */}
      {hasAccountManagement && (
        <Dialog 
          open={permissionsDialogOpen} 
          onClose={() => setPermissionsDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Typography variant="h6" fontWeight="bold">
              Manage Permissions - {currentAdmin?.username}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Select the permissions you want to grant to this admin
            </Typography>
          </DialogTitle>
          <DialogContent>
            <Box component="form" onSubmit={permissionsFormik.handleSubmit}>
              <Grid container spacing={3} sx={{ mt: 1 }}>
                {/* Existing Permissions */}
                <Grid item xs={12}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Core Permissions
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={permissionsFormik.values.createVendors}
                        onChange={permissionsFormik.handleChange}
                        name="createVendors"
                        color="primary"
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Group sx={{ mr: 1 }} fontSize="small" />
                        Create and Manage Vendors
                      </Box>
                    }
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={permissionsFormik.values.verifyCustomers}
                        onChange={permissionsFormik.handleChange}
                        name="verifyCustomers"
                        color="primary"
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <CheckCircle sx={{ mr: 1 }} fontSize="small" />
                        Verify Customers
                      </Box>
                    }
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={permissionsFormik.values.discoPricing}
                        onChange={permissionsFormik.handleChange}
                        name="discoPricing"
                        color="primary"
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Settings sx={{ mr: 1 }} fontSize="small" />
                        Manage Disco Pricing
                      </Box>
                    }
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={permissionsFormik.values.tokenManagement}
                        onChange={permissionsFormik.handleChange}
                        name="tokenManagement"
                        color="primary"
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <AdminPanelSettings sx={{ mr: 1 }} fontSize="small" />
                        Manage Tokens
                      </Box>
                    }
                  />
                </Grid>

                {/* New Permissions */}
                <Grid item xs={12}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ mt: 2 }}>
                    Advanced Permissions
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={permissionsFormik.values.accountManagement}
                        onChange={permissionsFormik.handleChange}
                        name="accountManagement"
                        color="primary"
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <AccountCircle sx={{ mr: 1 }} fontSize="small" />
                        Manage Admin Accounts
                      </Box>
                    }
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={permissionsFormik.values.vendorSpace}
                        onChange={permissionsFormik.handleChange}
                        name="vendorSpace"
                        color="primary"
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Group sx={{ mr: 1 }} fontSize="small" />
                        Manage Vendor Space
                      </Box>
                    }
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={permissionsFormik.values.vendorCustomer}
                        onChange={permissionsFormik.handleChange}
                        name="vendorCustomer"
                        color="primary"
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Group sx={{ mr: 1 }} fontSize="small" />
                        Manage Vendor Customers
                      </Box>
                    }
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={permissionsFormik.values.viewAnalytics}
                        onChange={permissionsFormik.handleChange}
                        name="viewAnalytics"
                        color="primary"
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Analytics sx={{ mr: 1 }} fontSize="small" />
                        View Analytics & Reports
                      </Box>
                    }
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={permissionsFormik.values.systemSettings}
                        onChange={permissionsFormik.handleChange}
                        name="systemSettings"
                        color="primary"
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Settings sx={{ mr: 1 }} fontSize="small" />
                        System Settings
                      </Box>
                    }
                  />
                </Grid>
              </Grid>

              <DialogActions sx={{ px: 0, pb: 0, mt: 3 }}>
                <Button onClick={() => setPermissionsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="contained" 
                  disabled={permissionsFormik.isSubmitting}
                >
                  {permissionsFormik.isSubmitting ? <CircularProgress size={24} /> : 'Update Permissions'}
                </Button>
              </DialogActions>
            </Box>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      {hasAccountManagement && (
        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete admin "{currentAdmin?.username}"? This action cannot be undone.
            </Typography>
            {currentAdmin?.role === 'super_admin' && (
              <Alert severity="error" sx={{ mt: 2 }}>
                Cannot delete super admin accounts.
              </Alert>
            )}
            {currentAdmin?._id === currentUser?._id && (
              <Alert severity="error" sx={{ mt: 2 }}>
                You cannot delete your own account.
              </Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={confirmDeleteAdmin} 
              variant="contained" 
              color="error"
              disabled={currentAdmin?.role === 'super_admin' || currentAdmin?._id === currentUser?._id}
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminManagement;