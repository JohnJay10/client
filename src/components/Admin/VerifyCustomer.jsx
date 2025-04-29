import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
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
  Card,
  CircularProgress,
  Snackbar,
  TextField,
  Tabs,
  Tab,
  Divider,
  Grid,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Edit,
  Delete,
  Check,
  Refresh,
  VerifiedUser,
  HourglassEmpty,
  Search,
  Block
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import API from '../../utils/api';

const CustomerVerification = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [tabValue, setTabValue] = useState(0);
  const [sortField, setSortField] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [forceRefresh, setForceRefresh] = useState(0);

  const fetchCustomers = async () => {
    const abortController = new AbortController();
    
    try {
      setLoading(true);
      const response = await API.get('/admin/customers', {
        signal: abortController.signal,
        params: {
          _: Date.now() // Cache busting
        }
      });
      setCustomers(response.data.data || []);
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error fetching customers:', error);
        setSnackbar({
          open: true,
          message: error.response?.data?.message || 'Failed to fetch customers',
          severity: 'error'
        });
      }
    } finally {
      if (!abortController.signal.aborted) {
        setLoading(false);
      }
    }

    return () => abortController.abort();
  };

  useEffect(() => {
    fetchCustomers();
  }, [forceRefresh]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setPage(0);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const handleVerifyClick = (customer) => {
    setCurrentCustomer(customer);
    verifyFormik.setValues({
      KRN: customer.verification?.KRN || '',
      SGC: customer.verification?.SGC || '',
      TI: customer.verification?.TI || '',
      MSN: customer.verification?.MSN || '',
      MTK1: customer.verification?.MTK1 || '',
      MTK2: customer.verification?.MTK2 || '',
      RTK1: customer.verification?.RTK1 || '',
      RTK2: customer.verification?.RTK2 || ''
    });
    setVerifyDialogOpen(true);
  };

  const handleRejectClick = (customer) => {
    setCurrentCustomer(customer);
    rejectFormik.resetForm();
    setRejectDialogOpen(true);
  };

  const handleEditClick = (customer) => {
    setCurrentCustomer(customer);
    editFormik.setValues({
      meterNumber: customer.meterNumber,
      disco: customer.disco,
      lastToken: customer.lastToken || '',
      KRN: customer.verification?.KRN || '',
      SGC: customer.verification?.SGC || '',
      TI: customer.verification?.TI || '',
      MSN: customer.verification?.MSN || '',
      MTK1: customer.verification?.MTK1 || '',
      MTK2: customer.verification?.MTK2 || '',
      RTK1: customer.verification?.RTK1 || '',
      RTK2: customer.verification?.RTK2 || '',
      isVerified: customer.verification?.isVerified || false
    });
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (customer) => {
    setCurrentCustomer(customer);
    setDeleteDialogOpen(true);
  };

  const verifyCustomer = async () => {
    try {
      setLoading(true);
      
      const requiredFields = ['KRN', 'SGC', 'TI', 'MSN', 'MTK1', 'MTK2', 'RTK1', 'RTK2'];
      const missingFields = requiredFields.filter(field => !verifyFormik.values[field]?.trim());
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      const response = await API.put(
        `/admin/customers/${currentCustomer?._id}/verify`,
        verifyFormik.values
      );
      
      if (response.data.success) {
        setSnackbar({
          open: true,
          message: 'Customer verified successfully',
          severity: 'success'
        });
        setForceRefresh(prev => prev + 1);
        setVerifyDialogOpen(false);
      } else {
        throw new Error(response.data.message || 'Verification failed');
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message || error.response?.data?.message || 'Failed to verify customer',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const rejectCustomer = async (values) => {
    try {
      setLoading(true);
      
      const response = await API.put(
        `/admin/customers/${currentCustomer._id}/reject`,
        { rejectionReason: values.reason }
      );
      
      // More robust success check
      if (response.status >= 200 && response.status < 300) {
        setSnackbar({
          open: true,
          message: response.data.message || 'Customer rejected successfully',
          severity: 'success'
        });
        
        // Update local state immediately
        setCustomers(prevCustomers => 
          prevCustomers.map(customer => 
            customer._id === currentCustomer._id 
              ? { 
                  ...customer, 
                  verification: {
                    ...customer.verification,
                    rejected: true,
                    rejectionReason: values.reason,
                    rejectedAt: new Date().toISOString()
                  }
                } 
              : customer
          )
        );
        
        setRejectDialogOpen(false);
        setTabValue(2); // Switch to Rejected tab
      } else {
        throw new Error(response.data.message || 'Rejection failed');
      }
    } catch (error) {
      console.error('Rejection error:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 
                 error.message || 
                 'Failed to reject customer',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  const updateCustomer = async (values) => {
    try {
      setLoading(true);
      
      const payload = {
        meterNumber: values.meterNumber,
        disco: values.disco,
        lastToken: values.lastToken,
        verification: {
          isVerified: values.isVerified,
          ...(values.isVerified && {
            KRN: values.KRN,
            SGC: values.SGC,
            TI: values.TI,
            MSN: values.MSN,
            MTK1: values.MTK1,
            MTK2: values.MTK2,
            RTK1: values.RTK1,
            RTK2: values.RTK2
          })
        }
      };

      const response = await API.put(
        `/admin/customers/${currentCustomer._id}/update`,
        payload
      );

      if (response.data.success) {
        setCustomers(prevCustomers => 
          prevCustomers.map(customer => 
            customer._id === currentCustomer._id ? 
            { 
              ...customer, 
              ...response.data.data,
              verification: {
                ...customer.verification,
                ...response.data.data.verification
              }
            } : customer
          )
        );
        
        setSnackbar({
          open: true,
          message: 'Customer updated successfully',
          severity: 'success'
        });
        setEditDialogOpen(false);
      } else {
        throw new Error(response.data.message || 'Update failed');
      }
    } catch (error) {
      console.error('Update error:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to update customer',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteCustomer = async () => {
    try {
      setLoading(true);
      const response = await API.delete(`/admin/customers/${currentCustomer?._id}/delete`);
      
      if (response.data.success) {
        setSnackbar({
          open: true,
          message: 'Customer deleted successfully',
          severity: 'success'
        });
        setCustomers(prevCustomers => 
          prevCustomers.filter(customer => customer._id !== currentCustomer._id)
        );
        setDeleteDialogOpen(false);
      } else {
        throw new Error(response.data.message || 'Deletion failed');
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to delete customer',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Formik for Verify Customer
  const verifyFormik = useFormik({
    initialValues: {
      KRN: '',
      SGC: '',
      TI: '',
      MSN: '',
      MTK1: '',
      MTK2: '',
      RTK1: '',
      RTK2: ''
    },
    validationSchema: Yup.object({
      KRN: Yup.string().required('Required'),
      SGC: Yup.string().required('Required'),
      TI: Yup.string().required('Required'),
      MSN: Yup.string().required('Required'),
      MTK1: Yup.string().required('Required'),
      MTK2: Yup.string().required('Required'),
      RTK1: Yup.string().required('Required'),
      RTK2: Yup.string().required('Required')
    }),
    onSubmit: verifyCustomer
  });

  // Formik for Reject Customer
  const rejectFormik = useFormik({
    initialValues: {
      reason: ''
    },
    validationSchema: Yup.object({
      reason: Yup.string().required('Rejection reason is required')
    }),
    onSubmit: rejectCustomer
  });

  // Formik for Edit Customer
  const editFormik = useFormik({
    initialValues: {
      meterNumber: '',
      disco: '',
      lastToken: '',
      KRN: '',
      SGC: '',
      TI: '',
      MSN: '',
      MTK1: '',
      MTK2: '',
      RTK1: '',
      RTK2: '',
      isVerified: false
    },
    validationSchema: Yup.object().shape({
      meterNumber: Yup.string().required('Meter number is required'),
      disco: Yup.string().required('Disco is required'),
      lastToken: Yup.string(),
      isVerified: Yup.boolean(),
      KRN: Yup.string().when('isVerified', {
        is: true,
        then: Yup.string().required('KRN is required for verified customers'),
        otherwise: Yup.string().notRequired()
      }),
      SGC: Yup.string().when('isVerified', {
        is: true,
        then: Yup.string().required('SGC is required for verified customers'),
        otherwise: Yup.string().notRequired()
      }),
      TI: Yup.string().when('isVerified', {
        is: true,
        then: Yup.string().required('TI is required for verified customers'),
        otherwise: Yup.string().notRequired()
      }),
      MSN: Yup.string().when('isVerified', {
        is: true,
        then: Yup.string().required('MSN is required for verified customers'),
        otherwise: Yup.string().notRequired()
      }),
      MTK1: Yup.string().when('isVerified', {
        is: true,
        then: Yup.string().required('MTK1 is required for verified customers'),
        otherwise: Yup.string().notRequired()
      }),
      MTK2: Yup.string().when('isVerified', {
        is: true,
        then: Yup.string().required('MTK2 is required for verified customers'),
        otherwise: Yup.string().notRequired()
      }),
      RTK1: Yup.string().when('isVerified', {
        is: true,
        then: Yup.string().required('RTK1 is required for verified customers'),
        otherwise: Yup.string().notRequired()
      }),
      RTK2: Yup.string().when('isVerified', {
        is: true,
        then: Yup.string().required('RTK2 is required for verified customers'),
        otherwise: Yup.string().notRequired()
      })
    }),
    onSubmit: updateCustomer
  });

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const filteredCustomers = useMemo(() => {
    let filtered = customers;

    // Apply tab filter
    if (tabValue === 0) {
      filtered = filtered.filter(c => !c.verification?.isVerified && !c.verification?.rejected);
    } else if (tabValue === 1) {
      filtered = filtered.filter(c => c.verification?.isVerified);
    } else if (tabValue === 2) {
      filtered = filtered.filter(c => c.verification?.rejected);
    }

    // Apply search filter
    if (searchTerm) {
      const searchTermLower = searchTerm.toLowerCase();
      filtered = filtered.filter(customer => 
        customer.meterNumber.toLowerCase().includes(searchTermLower) ||
        customer.disco.toLowerCase().includes(searchTermLower) ||
        (customer.lastToken && customer.lastToken.toLowerCase().includes(searchTermLower))
      );
    }

    // Apply sorting
    const sortFields = {
      'createdAt': (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
      'verifiedAt': (a, b) => (a.verification?.verifiedAt ? new Date(a.verification.verifiedAt) : new Date(0)) - 
                             (b.verification?.verifiedAt ? new Date(b.verification.verifiedAt) : new Date(0)),
      'meterNumber': (a, b) => a.meterNumber.localeCompare(b.meterNumber),
      'rejectedAt': (a, b) => (a.verification?.rejectedAt ? new Date(a.verification.rejectedAt) : new Date(0)) - 
                             (b.verification?.rejectedAt ? new Date(b.verification.rejectedAt) : new Date(0)),
    };

    return filtered.sort((a, b) => {
      const sortValue = sortFields[sortField](a, b);
      return sortDirection === 'asc' ? sortValue : -sortValue;
    });
  }, [customers, tabValue, sortField, sortDirection, searchTerm]);

  const paginatedCustomers = useMemo(() => {
    return filteredCustomers.slice(
      page * rowsPerPage,
      page * rowsPerPage + rowsPerPage
    );
  }, [filteredCustomers, page, rowsPerPage]);

  return (
    <Box sx={{ p: 9, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Customer Verification
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <TextField
            variant="outlined"
            size="small"
            placeholder="Search..."
            value={searchTerm}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: <Search sx={{ color: 'action.active', mr: 1 }} />,
            }}
            sx={{ width: 300 }}
          />
          <Button 
            variant="contained" 
            startIcon={<Refresh />} 
            onClick={() => setForceRefresh(prev => prev + 1)}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      <Paper elevation={3} sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} variant="fullWidth">
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <HourglassEmpty sx={{ mr: 1 }} />
                Pending Verification ({customers.filter(c => !c.verification?.isVerified && !c.verification?.rejected).length})
              </Box>
            } 
          />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <VerifiedUser sx={{ mr: 1 }} />
                Verified Customers ({customers.filter(c => c.verification?.isVerified).length})
              </Box>
            } 
          />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Block sx={{ mr: 1 }} />
                Rejected Customers ({customers.filter(c => c.verification?.rejected).length})
              </Box>
            } 
          />
        </Tabs>
        <Divider />
      </Paper>

      <Card elevation={3}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell 
                  sx={{ cursor: 'pointer', fontWeight: 'bold' }}
                  onClick={() => handleSort('meterNumber')}
                >
                  Meter Number {sortField === 'meterNumber' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Disco</TableCell>
                <TableCell 
                  sx={{ cursor: 'pointer', fontWeight: 'bold' }}
                  onClick={() => handleSort('createdAt')}
                >
                  Date Created {sortField === 'createdAt' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Last Token</TableCell>
                <TableCell 
                  sx={{ cursor: 'pointer', fontWeight: 'bold' }}
                  onClick={() => tabValue === 1 ? handleSort('verifiedAt') : tabValue === 2 ? handleSort('rejectedAt') : null}
                >
                  {tabValue === 0 ? 'Status' : 
                   tabValue === 1 ? 'Verified Date' : 
                   'Rejected Date'} 
                  {sortField === 'verifiedAt' || sortField === 'rejectedAt' ? 
                   (sortDirection === 'asc' ? '↑' : '↓') : ''}
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : paginatedCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No customers found
                  </TableCell>
                </TableRow>
              ) : (
                paginatedCustomers.map((customer) => (
                  <TableRow key={customer._id} hover>
                    <TableCell>{customer.meterNumber}</TableCell>
                    <TableCell>{customer.disco}</TableCell>
                    <TableCell>
                      {formatDate(customer.createdAt)}
                    </TableCell>
                    <TableCell>{customer.lastToken || 'N/A'}</TableCell>
                    <TableCell>
                      <Chip
                        label={customer.verification?.isVerified ? 'Verified' : 
                              customer.verification?.rejected ? 'Rejected' : 'Pending'}
                        color={customer.verification?.isVerified ? 'success' : 
                              customer.verification?.rejected ? 'error' : 'warning'}
                        icon={customer.verification?.isVerified ? <Check /> : 
                              customer.verification?.rejected ? <Block /> : <HourglassEmpty />}
                        sx={{ fontWeight: 'bold' }}
                      />
                      {customer.verification?.rejected && customer.verification?.rejectionReason && (
                        <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                          <strong>Reason:</strong> {customer.verification.rejectionReason}
                        </Typography>
                      )}
                      {customer.verification?.isVerified && customer.verification?.verifiedAt && (
                        <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                          <strong>Verified:</strong> {formatDate(customer.verification.verifiedAt)}
                        </Typography>
                      )}
                      {customer.verification?.rejected && customer.verification?.rejectedAt && (
                        <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                          <strong>Rejected:</strong> {formatDate(customer.verification.rejectedAt)}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {/* Show Verify and Reject buttons only for pending verifications */}
                        {!customer.verification?.isVerified && !customer.verification?.rejected && (
                          <>
                            <IconButton 
                              color="success" 
                              onClick={() => handleVerifyClick(customer)}
                              disabled={loading}
                              title="Verify"
                            >
                              <Check />
                            </IconButton>
                            <IconButton 
                              color="error" 
                              onClick={() => handleRejectClick(customer)}
                              disabled={loading}
                              title="Reject"
                            >
                              <Block />
                            </IconButton>
                          </>
                        )}
                        <IconButton 
                          color="primary" 
                          onClick={() => handleEditClick(customer)}
                          disabled={loading}
                          title="Edit"
                        >
                          <Edit />
                        </IconButton>
                        <IconButton 
                          color="error" 
                          onClick={() => handleDeleteClick(customer)}
                          disabled={loading}
                          title="Delete"
                        >
                          <Delete />
                        </IconButton>
                      </Box>
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
          count={filteredCustomers.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{ borderTop: '1px solid rgba(224, 224, 224, 1)' }}
        />
      </Card>

      {/* Verify Customer Dialog */}
      <Dialog open={verifyDialogOpen} onClose={() => setVerifyDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Verify Customer</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={verifyFormik.handleSubmit} sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Meter: {currentCustomer?.meterNumber}
            </Typography>
            
            <Grid container spacing={2}>
              {Object.entries({
                KRN: 'Key Revision Number (KRN)',
                SGC: 'Supply Group Code (SGC)',
                TI: 'Tariff Index (TI)',
                MSN: 'Meter Serial Number (MSN)',
                MTK1: 'Master Token Key 1 (MTK1)',
                MTK2: 'Master Token Key 2 (MTK2)',
                RTK1: 'Restricted Token Key 1 (RTK1)',
                RTK2: 'Restricted Token Key 2 (RTK2)'
              }).map(([field, label]) => (
                <Grid item xs={12} sm={6} key={field}>
                  <TextField
                    fullWidth
                    margin="normal"
                    id={field}
                    name={field}
                    label={label}
                    value={verifyFormik.values[field]}
                    onChange={verifyFormik.handleChange}
                    error={verifyFormik.touched[field] && Boolean(verifyFormik.errors[field])}
                    helperText={verifyFormik.touched[field] && verifyFormik.errors[field]}
                    required
                  />
                </Grid>
              ))}
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVerifyDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={() => verifyFormik.handleSubmit()} 
            variant="contained" 
            color="success"
            disabled={!verifyFormik.isValid || loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            Verify Customer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject Customer Dialog */}
      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reject Customer Verification</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={rejectFormik.handleSubmit} sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Meter: {currentCustomer?.meterNumber}
            </Typography>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Please provide a reason for rejecting this customer verification:
            </Typography>
            
            <TextField
              fullWidth
              margin="normal"
              id="reason"
              name="reason"
              label="Rejection Reason"
              value={rejectFormik.values.reason}
              onChange={rejectFormik.handleChange}
              error={rejectFormik.touched.reason && Boolean(rejectFormik.errors.reason)}
              helperText={rejectFormik.touched.reason && rejectFormik.errors.reason}
              required
              multiline
              rows={4}
              variant="outlined"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={() => rejectFormik.handleSubmit()} 
            variant="contained" 
            color="error"
            disabled={!rejectFormik.isValid || loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            Reject Customer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Customer Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Customer</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={editFormik.handleSubmit} sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Basic Information</Typography>
                <TextField
                  fullWidth
                  margin="normal"
                  id="meterNumber"
                  name="meterNumber"
                  label="Meter Number"
                  value={editFormik.values.meterNumber}
                  onChange={editFormik.handleChange}
                  required
                  error={editFormik.touched.meterNumber && Boolean(editFormik.errors.meterNumber)}
                  helperText={editFormik.touched.meterNumber && editFormik.errors.meterNumber}
                />
                <TextField
                  fullWidth
                  margin="normal"
                  id="disco"
                  name="disco"
                  label="Disco"
                  value={editFormik.values.disco}
                  onChange={editFormik.handleChange}
                  required
                  error={editFormik.touched.disco && Boolean(editFormik.errors.disco)}
                  helperText={editFormik.touched.disco && editFormik.errors.disco}
                />
                <TextField
                  fullWidth
                  margin="normal"
                  id="lastToken"
                  name="lastToken"
                  label="Last Token"
                  value={editFormik.values.lastToken}
                  onChange={editFormik.handleChange}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Verification Details</Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={editFormik.values.isVerified}
                      onChange={(e) => editFormik.setFieldValue('isVerified', e.target.checked)}
                      color="primary"
                    />
                  }
                  label={editFormik.values.isVerified ? 'Verified' : 'Pending'}
                  sx={{ mb: 2 }}
                />

                {Object.entries({
                  KRN: 'Key Revision Number (KRN)',
                  SGC: 'Supply Group Code (SGC)',
                  TI: 'Tariff Index (TI)',
                  MSN: 'Meter Serial Number (MSN)',
                  MTK1: 'Master Token Key 1 (MTK1)',
                  MTK2: 'Master Token Key 2 (MTK2)',
                  RTK1: 'Restricted Token Key 1 (RTK1)',
                  RTK2: 'Restricted Token Key 2 (RTK2)'
                }).map(([field, label]) => (
                  <TextField
                    key={field}
                    fullWidth
                    margin="normal"
                    id={field}
                    name={field}
                    label={label}
                    value={editFormik.values[field]}
                    onChange={editFormik.handleChange}
                    error={editFormik.touched[field] && Boolean(editFormik.errors[field])}
                    helperText={editFormik.touched[field] && editFormik.errors[field]}
                    disabled={!editFormik.values.isVerified}
                    required={editFormik.values.isVerified}
                  />
                ))}
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={() => editFormik.handleSubmit()} 
            variant="contained" 
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            Update Customer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete customer with meter number: <strong>{currentCustomer?.meterNumber}</strong>?
          </Typography>
          <Typography variant="body2" color="error" sx={{ mt: 2 }}>
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={deleteCustomer} 
            variant="contained" 
            color="error"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
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
        sx={{
          '& .MuiSnackbarContent-root': {
            backgroundColor: snackbar.severity === 'error' ? '#d32f2f' : '#43a047'
          }
        }}
      />
    </Box>
  );
};

export default CustomerVerification;