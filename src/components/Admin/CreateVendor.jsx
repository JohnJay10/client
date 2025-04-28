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
  Card
} from '@mui/material';
import { 
  Edit, 
  Delete, 
  Check, 
  Close,
  Add,
  Refresh
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import API from '../../utils/api';
import { format } from 'date-fns';

const VendorManagement = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
  });
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentVendor, setCurrentVendor] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const response = await API.get('/admin/vendors');
      setVendors(response.data.data || []);
    } catch (error) {
      console.error('Error fetching vendors:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to fetch vendors',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const handleApproveVendor = async (vendorId) => {
    try {
      setApprovingId(vendorId);
      await API.patch(`/admin/vendors/${vendorId}/approve`);
      
      setVendors(prev => prev.map(v => 
        v._id === vendorId ? { 
          ...v, 
          approved: true,
          approvedAt: new Date().toISOString() 
        } : v
      ));
      
      setSnackbar({
        open: true,
        message: 'Vendor approved successfully',
      });
    } catch (error) {
      console.error('Approval error:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to approve vendor',
      });
    } finally {
      setApprovingId(null);
    }
  };

  const handleRejectVendor = async (vendorId) => {
    try {
      setApprovingId(vendorId);
      await API.patch(`/admin/vendors/${vendorId}/deactivate`);
      
      setVendors(prev => prev.map(v => 
        v._id === vendorId ? { 
          ...v, 
          approved: false,
          approvedAt: null 
        } : v
      ));
      
      setSnackbar({
        open: true,
        message: 'Vendor rejected successfully',
      });
    } catch (error) {
      console.error('Rejection error:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to reject vendor',
      });
    } finally {
      setApprovingId(null);
    }
  };

  const handleEditVendor = (vendor) => {
    setCurrentVendor(vendor);
    editFormik.setValues({
      email: vendor.email,
      username: vendor.username,
      password: '' // Password is optional for updates
    });
    setEditDialogOpen(true);
  };

  const handleDeleteVendor = (vendor) => {
    setCurrentVendor(vendor);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteVendor = async () => {
    try {
      await API.delete(`/admin/vendors/${currentVendor._id}/delete`);
      setSnackbar({
        open: true,
        message: 'Vendor deleted successfully',
      });
      fetchVendors();
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to delete vendor',
      });
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  // Formik for Add Vendor
  const addFormik = useFormik({
    initialValues: {
      email: '',
      username: '',
      password: '',
    },
    validationSchema: Yup.object({
      email: Yup.string().email('Invalid email').required('Required'),
      username: Yup.string().required('Required'),
      password: Yup.string().min(6, 'Minimum 6 characters').required('Required'),
    }),
    onSubmit: async (values, { resetForm }) => {
      try {
        await API.post('/admin/vendors', values);
        setSnackbar({
          open: true,
          message: 'Vendor created successfully',
        });
        resetForm();
        setAddDialogOpen(false);
        fetchVendors();
      } catch (error) {
        setSnackbar({
          open: true,
          message: error.response?.data?.message || 'Failed to create vendor',
        });
      }
    },
  });

  // Formik for Edit Vendor
  const editFormik = useFormik({
    initialValues: {
      email: '',
      username: '',
      password: '',
    },
    validationSchema: Yup.object({
      email: Yup.string().email('Invalid email').required('Required'),
      username: Yup.string().required('Required'),
      password: Yup.string().min(6, 'Minimum 6 characters'),
    }),
    onSubmit: async (values) => {
      try {
        await API.patch(`/admin/vendors/${currentVendor._id}/edit`, values);
        setSnackbar({
          open: true,
          message: 'Vendor updated successfully',
        });
        setEditDialogOpen(false);
        fetchVendors();
      } catch (error) {
        setSnackbar({
          open: true,
          message: error.response?.data?.message || 'Failed to update vendor',
        });
      }
    },
  });

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box sx={{ p: 9, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" component="h1">
          Vendor Management
        </Typography>
        <Box>
          <Button 
            variant="contained" 
            startIcon={<Refresh />} 
            onClick={fetchVendors}
            sx={{ mr: 2 }}
          >
            Refresh
          </Button>
          <Button 
            variant="contained" 
            startIcon={<Add />}
            onClick={() => setAddDialogOpen(true)}
          >
            Add Vendor
          </Button>
        </Box>
      </Box>

      <Card elevation={3}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Username</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : vendors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    No vendors found
                  </TableCell>
                </TableRow>
              ) : (
                vendors
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((vendor) => (
                    <TableRow key={vendor._id}>
                      <TableCell>{vendor.username}</TableCell>
                      <TableCell>{vendor.email}</TableCell>
                      <TableCell>
                        <Chip
                          label={vendor.approved ? 'Approved' : 'Pending'}
                          color={vendor.approved ? 'success' : 'warning'}
                          icon={vendor.approved ? <Check /> : <Close />}
                          sx={{ minWidth: 100 }}
                        />
                        {vendor.approved && vendor.approvedAt && (
                          <Typography variant="caption" display="block" color="text.secondary">
                            {formatDate(vendor.approvedAt)}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <IconButton 
                          onClick={() => handleApproveVendor(vendor._id)} 
                          disabled={approvingId === vendor._id || vendor.approved}
                        >
                          {approvingId === vendor._id ? (
                            <CircularProgress size={24} />
                          ) : (
                            <Check color={vendor.approved ? 'disabled' : 'success'} />
                          )}
                        </IconButton>
                        <IconButton 
                          onClick={() => handleRejectVendor(vendor._id)} 
                          disabled={approvingId === vendor._id || !vendor.approved}
                        >
                          {approvingId === vendor._id ? (
                            <CircularProgress size={24} />
                          ) : (
                            <Close color={!vendor.approved ? 'disabled' : 'error'} />
                          )}
                        </IconButton>
                        <IconButton onClick={() => handleEditVendor(vendor)}>
                          <Edit color="primary" />
                        </IconButton>
                        <IconButton onClick={() => handleDeleteVendor(vendor)}>
                          <Delete color="error" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={vendors.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Card>

      {/* Add Vendor Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)}>
        <DialogTitle>Create New Vendor</DialogTitle>
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
            />
            <TextField
              margin="normal"
              fullWidth
              id="email"
              name="email"
              label="Email"
              type="email"
              value={addFormik.values.email}
              onChange={addFormik.handleChange}
              error={addFormik.touched.email && Boolean(addFormik.errors.email)}
              helperText={addFormik.touched.email && addFormik.errors.email}
            />
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
            <DialogActions>
              <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={addFormik.isSubmitting}>
                {addFormik.isSubmitting ? <CircularProgress size={24} /> : 'Create'}
              </Button>
            </DialogActions>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Edit Vendor Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
        <DialogTitle>Edit Vendor</DialogTitle>
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
            <TextField
              margin="normal"
              fullWidth
              id="email"
              name="email"
              label="Email"
              type="email"
              value={editFormik.values.email}
              onChange={editFormik.handleChange}
              error={editFormik.touched.email && Boolean(editFormik.errors.email)}
              helperText={editFormik.touched.email && editFormik.errors.email}
            />
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
            <DialogActions>
              <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={editFormik.isSubmitting}>
                {editFormik.isSubmitting ? <CircularProgress size={24} /> : 'Update'}
              </Button>
            </DialogActions>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete vendor "{currentVendor?.username}"?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={confirmDeleteVendor} 
            variant="contained" 
            color="error"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      />
    </Box>
  );
};

export default VendorManagement;