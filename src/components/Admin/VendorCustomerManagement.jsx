import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  IconButton,
  Grid,
  Paper,
  Alert,
  CircularProgress,
  Snackbar
} from '@mui/material';
import {
  Add,
  Remove,
  Edit,
  Refresh,
  People,
  TrendingUp,
  TrendingDown
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import API from '../../utils/api';

const VendorCustomerManagement = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [actionDialog, setActionDialog] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const response = await API.get('/admin/vendors');
      setVendors(response.data.data || []);
    } catch (error) {
      console.error('Error fetching vendors:', error);
      setSnackbar({
        open: true,
        message: 'Failed to fetch vendors',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  // Formik for Add Customer Space
  const addFormik = useFormik({
    initialValues: {
      additionalCustomers: '',
      reason: ''
    },
    validationSchema: Yup.object({
      additionalCustomers: Yup.number()
        .min(1, 'Must be at least 1')
        .required('Required'),
      reason: Yup.string().required('Reason is required')
    }),
    onSubmit: async (values, { resetForm }) => {
      try {
        const response = await API.patch(
          `/admin/vendors/${selectedVendor._id}/add-customer-space`,
          values
        );
        
        setSnackbar({
          open: true,
          message: response.data.message,
          severity: 'success'
        });
        
        resetForm();
        setActionDialog(null);
        setSelectedVendor(null);
        fetchVendors();
      } catch (error) {
        setSnackbar({
          open: true,
          message: error.response?.data?.message || 'Failed to add customer space',
          severity: 'error'
        });
      }
    },
  });

  // Formik for Reduce Customer Space
  const reduceFormik = useFormik({
    initialValues: {
      reduceCustomers: '',
      reason: ''
    },
    validationSchema: Yup.object({
      reduceCustomers: Yup.number()
        .min(1, 'Must be at least 1')
        .required('Required'),
      reason: Yup.string().required('Reason is required')
    }),
    onSubmit: async (values, { resetForm }) => {
      try {
        const response = await API.patch(
          `/admin/vendors/${selectedVendor._id}/reduce-customer-space`,
          values
        );
        
        setSnackbar({
          open: true,
          message: response.data.message,
          severity: 'success'
        });
        
        resetForm();
        setActionDialog(null);
        setSelectedVendor(null);
        fetchVendors();
      } catch (error) {
        setSnackbar({
          open: true,
          message: error.response?.data?.message || 'Failed to reduce customer space',
          severity: 'error'
        });
      }
    },
  });

  // Formik for Set Customer Limit
  const setFormik = useFormik({
    initialValues: {
      newCustomerLimit: '',
      reason: ''
    },
    validationSchema: Yup.object({
      newCustomerLimit: Yup.number()
        .min(0, 'Cannot be negative')
        .required('Required'),
      reason: Yup.string().required('Reason is required')
    }),
    onSubmit: async (values, { resetForm }) => {
      try {
        const response = await API.patch(
          `/admin/vendors/${selectedVendor._id}/set-customer-limit`,
          values
        );
        
        setSnackbar({
          open: true,
          message: response.data.message,
          severity: 'success'
        });
        
        resetForm();
        setActionDialog(null);
        setSelectedVendor(null);
        fetchVendors();
      } catch (error) {
        setSnackbar({
          open: true,
          message: error.response?.data?.message || 'Failed to set customer limit',
          severity: 'error'
        });
      }
    },
  });

  const handleActionClick = (vendor, action) => {
    setSelectedVendor(vendor);
    setActionDialog(action);
    
    // Pre-fill the set form with current limit
    if (action === 'set') {
      setFormik.setValues({
        newCustomerLimit: vendor.customerLimit || 0,
        reason: ''
      });
    }
  };

  const handleDialogClose = () => {
    setActionDialog(null);
    setSelectedVendor(null);
    addFormik.resetForm();
    reduceFormik.resetForm();
    setFormik.resetForm();
  };

  const getUtilizationPercentage = (vendor) => {
    if (!vendor.customerCount || !vendor.customerLimit) return 0;
    return Math.round((vendor.customerCount / vendor.customerLimit) * 100);
  };

  const getUtilizationColor = (percentage) => {
    if (percentage >= 90) return 'error';
    if (percentage >= 70) return 'warning';
    return 'success';
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 9 }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Vendor Customer Management
        </Typography>
        <Button 
          variant="outlined" 
          startIcon={<Refresh />} 
          onClick={fetchVendors}
        >
          Refresh
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 3, textAlign: 'center' }}>
            <People color="primary" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4" fontWeight="bold">
              {vendors.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Vendors
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 3, textAlign: 'center' }}>
            <TrendingUp color="success" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4" fontWeight="bold" color="success.main">
              {vendors.filter(v => v.canAddCustomers !== false).length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Active Vendors
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 3, textAlign: 'center' }}>
            <TrendingDown color="warning" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4" fontWeight="bold" color="warning.main">
              {vendors.filter(v => v.canAddCustomers === false).length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Restricted Vendors
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Card elevation={3}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Vendor</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Customer Count</TableCell>
                <TableCell>Customer Limit</TableCell>
                <TableCell>Utilization</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <CircularProgress />
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Loading vendors...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : vendors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography variant="h6" color="text.secondary">
                      No vendors found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                vendors
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((vendor) => {
                    const utilization = getUtilizationPercentage(vendor);
                    return (
                      <TableRow key={vendor._id} hover>
                        <TableCell>
                          <Typography variant="body1" fontWeight="medium">
                            {vendor.username}
                          </Typography>
                          {vendor.businessName && (
                            <Typography variant="body2" color="text.secondary">
                              {vendor.businessName}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>{vendor.email}</TableCell>
                        <TableCell>
                          <Typography variant="body1" fontWeight="medium">
                            {vendor.customerCount || 0}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body1" fontWeight="medium">
                            {vendor.customerLimit || 0}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ flexGrow: 1 }}>
                              <Box sx={{ 
                                width: '100%', 
                                height: 8, 
                                bgcolor: 'grey.200', 
                                borderRadius: 4,
                                overflow: 'hidden'
                              }}>
                                <Box 
                                  sx={{ 
                                    height: '100%', 
                                    bgcolor: `${getUtilizationColor(utilization)}.main`,
                                    width: `${Math.min(utilization, 100)}%`
                                  }} 
                                />
                              </Box>
                            </Box>
                            <Typography variant="body2" minWidth={35}>
                              {utilization}%
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={vendor.canAddCustomers !== false ? 'Active' : 'Restricted'}
                            color={vendor.canAddCustomers !== false ? 'success' : 'error'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                            <IconButton 
                              color="success" 
                              onClick={() => handleActionClick(vendor, 'add')}
                              title="Add Customer Space"
                            >
                              <Add />
                            </IconButton>
                            <IconButton 
                              color="warning" 
                              onClick={() => handleActionClick(vendor, 'reduce')}
                              title="Reduce Customer Space"
                            >
                              <Remove />
                            </IconButton>
                            <IconButton 
                              color="primary" 
                              onClick={() => handleActionClick(vendor, 'set')}
                              title="Set Customer Limit"
                            >
                              <Edit />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })
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

      {/* Add Customer Space Dialog */}
      <Dialog open={actionDialog === 'add'} onClose={handleDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>Add Customer Space</DialogTitle>
        <DialogContent>
          {selectedVendor && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Vendor: <strong>{selectedVendor.username}</strong><br />
              Current Limit: <strong>{selectedVendor.customerLimit || 0}</strong> customers
            </Alert>
          )}
          <Box component="form" onSubmit={addFormik.handleSubmit} sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              fullWidth
              id="additionalCustomers"
              name="additionalCustomers"
              label="Additional Customers"
              type="number"
              value={addFormik.values.additionalCustomers}
              onChange={addFormik.handleChange}
              error={addFormik.touched.additionalCustomers && Boolean(addFormik.errors.additionalCustomers)}
              helperText={addFormik.touched.additionalCustomers && addFormik.errors.additionalCustomers}
            />
            <TextField
              margin="normal"
              fullWidth
              id="reason"
              name="reason"
              label="Reason"
              multiline
              rows={3}
              value={addFormik.values.reason}
              onChange={addFormik.handleChange}
              error={addFormik.touched.reason && Boolean(addFormik.errors.reason)}
              helperText={addFormik.touched.reason && addFormik.errors.reason}
            />
            <DialogActions>
              <Button onClick={handleDialogClose}>Cancel</Button>
              <Button 
                type="submit" 
                variant="contained" 
                disabled={addFormik.isSubmitting}
              >
                {addFormik.isSubmitting ? <CircularProgress size={24} /> : 'Add Space'}
              </Button>
            </DialogActions>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Reduce Customer Space Dialog */}
      <Dialog open={actionDialog === 'reduce'} onClose={handleDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>Reduce Customer Space</DialogTitle>
        <DialogContent>
          {selectedVendor && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Vendor: <strong>{selectedVendor.username}</strong><br />
              Current Limit: <strong>{selectedVendor.customerLimit || 0}</strong> customers<br />
              Current Customers: <strong>{selectedVendor.customerCount || 0}</strong>
            </Alert>
          )}
          <Box component="form" onSubmit={reduceFormik.handleSubmit} sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              fullWidth
              id="reduceCustomers"
              name="reduceCustomers"
              label="Reduce By (Number of Customers)"
              type="number"
              value={reduceFormik.values.reduceCustomers}
              onChange={reduceFormik.handleChange}
              error={reduceFormik.touched.reduceCustomers && Boolean(reduceFormik.errors.reduceCustomers)}
              helperText={reduceFormik.touched.reduceCustomers && reduceFormik.errors.reduceCustomers}
            />
            <TextField
              margin="normal"
              fullWidth
              id="reason"
              name="reason"
              label="Reason"
              multiline
              rows={3}
              value={reduceFormik.values.reason}
              onChange={reduceFormik.handleChange}
              error={reduceFormik.touched.reason && Boolean(reduceFormik.errors.reason)}
              helperText={reduceFormik.touched.reason && reduceFormik.errors.reason}
            />
            <DialogActions>
              <Button onClick={handleDialogClose}>Cancel</Button>
              <Button 
                type="submit" 
                variant="contained" 
                color="warning"
                disabled={reduceFormik.isSubmitting}
              >
                {reduceFormik.isSubmitting ? <CircularProgress size={24} /> : 'Reduce Space'}
              </Button>
            </DialogActions>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Set Customer Limit Dialog */}
      <Dialog open={actionDialog === 'set'} onClose={handleDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>Set Customer Limit</DialogTitle>
        <DialogContent>
          {selectedVendor && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Vendor: <strong>{selectedVendor.username}</strong><br />
              Current Limit: <strong>{selectedVendor.customerLimit || 0}</strong><br />
              Current Customers: <strong>{selectedVendor.customerCount || 0}</strong>
            </Alert>
          )}
          <Box component="form" onSubmit={setFormik.handleSubmit} sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              fullWidth
              id="newCustomerLimit"
              name="newCustomerLimit"
              label="New Customer Limit"
              type="number"
              value={setFormik.values.newCustomerLimit}
              onChange={setFormik.handleChange}
              error={setFormik.touched.newCustomerLimit && Boolean(setFormik.errors.newCustomerLimit)}
              helperText={setFormik.touched.newCustomerLimit && setFormik.errors.newCustomerLimit}
            />
            <TextField
              margin="normal"
              fullWidth
              id="reason"
              name="reason"
              label="Reason"
              multiline
              rows={3}
              value={setFormik.values.reason}
              onChange={setFormik.handleChange}
              error={setFormik.touched.reason && Boolean(setFormik.errors.reason)}
              helperText={setFormik.touched.reason && setFormik.errors.reason}
            />
            <DialogActions>
              <Button onClick={handleDialogClose}>Cancel</Button>
              <Button 
                type="submit" 
                variant="contained" 
                color="primary"
                disabled={setFormik.isSubmitting}
              >
                {setFormik.isSubmitting ? <CircularProgress size={24} /> : 'Set Limit'}
              </Button>
            </DialogActions>
          </Box>
        </DialogContent>
      </Dialog>

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

export default VendorCustomerManagement;