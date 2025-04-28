import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Pagination,
  Chip,
  MenuItem,
  FormControl,
  InputLabel,
  Select
} from '@mui/material';
import API from '../../utils/api';

const TokenManagement = () => {
  // State for token requests
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [tokenValue, setTokenValue] = useState('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [tokenError, setTokenError] = useState('');
  const [requestsPagination, setRequestsPagination] = useState({
    page: 1,
    limit: 5,
    total: 0,
    totalPages: 1
  });

  // State for tokens history (both requested and issued)
  const [tokens, setTokens] = useState([]);
  const [tokensLoading, setTokensLoading] = useState(false);
  const [tokensPagination, setTokensPagination] = useState({
    page: 1,
    limit: 5,
    total: 0,
    totalPages: 1
  });
  const [searchTerm, setSearchTerm] = useState('');

  // State for approved but not yet issued requests
  const [approvedRequests, setApprovedRequests] = useState([]);

  // State for vendor filtering
  const [vendors, setVendors] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState('');

  // State for rejection
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [requestToReject, setRequestToReject] = useState(null);

  const fetchVendors = useCallback(async () => {
    try {
      const response = await API.get('/admin/vendors');
      setVendors(response.data?.data || response.data || []);
    } catch (error) {
      console.error('Failed to fetch vendors:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to fetch vendors',
        severity: 'error'
      });
    }
  }, []);

  const fetchTokenRequests = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const [requestsResponse, customersResponse] = await Promise.all([
        API.get(`/tokens/admin/requests?page=${page}&limit=5`),
        API.get('/admin/customers')
      ]);

      const allCustomers = customersResponse.data?.data || customersResponse.data || [];
      let allRequests = requestsResponse.data?.data || requestsResponse.data || [];
      const totalRequests = requestsResponse.data?.total || 0;

      // Combine with approved but not yet issued requests
      allRequests = [...allRequests, ...approvedRequests.filter(ar => 
        !allRequests.some(r => r._id === ar._id)
      )];

      const requestsWithVerification = allRequests.map(request => {
        const customer = allCustomers.find(c => c.meterNumber === request.meterNumber);
        return {
          ...request,
          customerVerification: customer?.verification || null
        };
      });

      setRequests(requestsWithVerification);
      setRequestsPagination({
        page,
        limit: 5,
        total: totalRequests,
        totalPages: Math.ceil(totalRequests / 5)
      });
    } catch (error) {
      console.error('Fetch error:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to fetch token requests',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  }, [approvedRequests]);

  const fetchAllTokens = useCallback(async (page = 1, vendorId = '', search = '') => {
    try {
      setTokensLoading(true);
      let url = `/tokens/admin/all-tokens?page=${page}&limit=5`;
      
      if (vendorId) {
        url += `&vendorId=${vendorId}`;
      }
      
      if (search) {
        url += `&meterNumber=${search}`;
      }
      
      const response = await API.get(url);
      
      if (response.data.success) {
        const tokensData = response.data.data || [];
        
        const vendorsResponse = await API.get('/admin/vendors');
        const allVendors = vendorsResponse.data?.data || vendorsResponse.data || [];

        const tokensWithVendors = tokensData.map(token => {
          const vendor = allVendors.find(v => 
            v._id === token.vendorId || 
            v._id === token.vendorId?._id
          );

          return {
            ...token,
            vendorId: {
              _id: vendor?._id,
              username: vendor?.username,
              name: vendor?.name
            }
          };
        });

        setTokens(tokensWithVendors);
        setTokensPagination({
          page,
          limit: 5,
          total: response.data.total || 0,
          totalPages: response.data.totalPages || 1
        });
      }
    } catch (error) {
      console.error('Failed to fetch tokens:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to fetch tokens',
        severity: 'error'
      });
    } finally {
      setTokensLoading(false);
    }
  }, []);

  const handleSearch = (term) => {
    setSearchTerm(term);
    fetchAllTokens(1, selectedVendor, term);
  };

  const handleVendorChange = (event) => {
    const vendorId = event.target.value;
    setSelectedVendor(vendorId);
    fetchAllTokens(1, vendorId, searchTerm);
  };

  useEffect(() => {
    fetchTokenRequests();
    fetchAllTokens();
    fetchVendors();
  }, [fetchTokenRequests, fetchAllTokens, fetchVendors]);

  const handleRequestsPageChange = (event, newPage) => {
    fetchTokenRequests(newPage);
  };

  const handleTokensPageChange = (event, newPage) => {
    fetchAllTokens(newPage, selectedVendor, searchTerm);
  };

  const validateToken = (value) => {
    if (!value) {
      setTokenError('Token value is required');
      return false;
    }
    if (!/^\d{16,45}$/.test(value)) {
      setTokenError('Token must be 16-45 digits');
      return false;
    }
    setTokenError('');
    return true;
  };

  const handleApproveRequest = async (requestId) => {
    try {
      setActionLoading(true);
      const response = await API.patch(`/tokens/admin/approve/${requestId}`);

      if (response.data.success) {
        const approvedRequest = requests.find(req => req._id === requestId);
        const updatedRequest = { ...approvedRequest, status: 'approved' };
        
        setApprovedRequests(prev => [...prev, updatedRequest]);
        setRequests(prev => prev.filter(req => req._id !== requestId));
        
        setSnackbar({
          open: true,
          message: 'Request approved successfully',
          severity: 'success'
        });
      }
    } catch (error) {
      console.error('Approval error:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to approve request',
        severity: 'error'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const openRejectionDialog = (requestId) => {
    setRequestToReject(requestId);
    setRejectionDialogOpen(true);
  };

  const closeRejectionDialog = () => {
    setRejectionDialogOpen(false);
    setRejectionReason('');
    setRequestToReject(null);
  };

  const handleRejectRequest = async () => {
    if (!requestToReject) return;
    
    try {
      setActionLoading(true);
      const response = await API.patch(`/tokens/admin/reject/${requestToReject}`, {
        rejectionReason
      });

      if (response.data.success) {
        setRequests(prev => prev.map(req => 
          req._id === requestToReject ? { 
            ...req, 
            status: 'rejected',
            rejectionReason 
          } : req
        ));
        setSnackbar({
          open: true,
          message: 'Request rejected successfully',
          severity: 'success'
        });
        fetchTokenRequests(requestsPagination.page);
        closeRejectionDialog();
      }
    } catch (error) {
      console.error('Rejection error:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to reject request',
        severity: 'error'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleIssueToken = async () => {
    if (!validateToken(tokenValue)) return;
    if (!selectedRequest) return;

    try {
      setActionLoading(true);
      const response = await API.post('/tokens/admin/issue', {
        tokenValue,
        meterNumber: selectedRequest.meterNumber,
        vendorId: selectedRequest.vendorId._id,
        units: selectedRequest.units,
      });

      if (response.data.success) {
        // Remove from approved requests
        setApprovedRequests(prev => prev.filter(req => req._id !== selectedRequest._id));
        
        // Refresh both tables
        fetchTokenRequests(requestsPagination.page);
        fetchAllTokens(tokensPagination.page, selectedVendor, searchTerm);
        
        setSelectedRequest(null);
        setTokenValue('');
        setSnackbar({
          open: true,
          message: 'Token issued successfully',
          severity: 'success'
        });
      }
    } catch (error) {
      console.error('Token issuance error:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to issue token',
        severity: 'error'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderStatusBadge = (status) => {
    const statusColors = {
      pending: 'warning',
      approved: 'success',
      rejected: 'error',
      completed: 'info'
    };

    return (
      <Chip 
        label={status?.toUpperCase() || 'UNKNOWN'}
        color={statusColors[status] || 'default'}
        size="small"
      />
    );
  };

  const renderActionButtons = (request) => {
    switch (request.status) {
      case 'pending':
        return (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              color="success"
              size="small"
              onClick={() => handleApproveRequest(request._id)}
              disabled={actionLoading}
            >
              Approve
            </Button>
            <Button
              variant="outlined"
              color="error"
              size="small"
              onClick={() => openRejectionDialog(request._id)}
              disabled={actionLoading}
            >
              Reject
            </Button>
          </Box>
        );
      case 'approved':
        return (
          <Button
            variant="contained"
            color="primary"
            size="small"
            onClick={() => setSelectedRequest(request)}
            disabled={actionLoading}
          >
            Issue Token
          </Button>
        );
      case 'completed':
        return (
          <Chip 
            label="ISSUED"
            color="success"
            size="small"
          />
        );
      default:
        return null;
    }
  };

  if (loading && requests.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 9, mb: 4 }}>
      <Typography variant="h6" gutterBottom>
        Token Requests Management
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Vendor/Meter</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {requests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  No token requests found
                </TableCell>
              </TableRow>
            ) : (
              requests.map(request => (
                <TableRow key={request._id}>
                  <TableCell>
                    <Typography fontWeight="500">{request.vendorId.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {request.meterNumber}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(request.createdAt)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    ₦{request.amount?.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {renderStatusBadge(request.status)}
                    {request.status === 'rejected' && request.rejectionReason && (
                      <Typography variant="caption" color="error" display="block">
                        Reason: {request.rejectionReason}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {renderActionButtons(request)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {requestsPagination.totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Pagination
            count={requestsPagination.totalPages}
            page={requestsPagination.page}
            onChange={handleRequestsPageChange}
            color="primary"
          />
        </Box>
      )}

      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Token History (Requests & Issued Tokens)
        </Typography>
        <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
          <TextField
            label="Search by Meter Number"
            variant="outlined"
            size="small"
            fullWidth
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Enter meter number to search"
            sx={{ flex: 2 }}
          />
          
          <FormControl sx={{ flex: 1 }} size="small">
            <InputLabel id="vendor-filter-label">Filter by Vendor</InputLabel>
            <Select
              labelId="vendor-filter-label"
              value={selectedVendor}
              onChange={handleVendorChange}
              label="Filter by Vendor"
            >
              <MenuItem value="">
                <em>All Vendors</em>
              </MenuItem>
              {vendors.map(vendor => (
                <MenuItem key={vendor._id} value={vendor._id}>
                  {vendor.username}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
          
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Token ID</TableCell>
                <TableCell>Meter Number</TableCell>
                <TableCell>Disco</TableCell>
                <TableCell>Units</TableCell>
                <TableCell>Amount (₦)</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Request Date</TableCell>
                <TableCell>Issue Date</TableCell>
                <TableCell>Expiry Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tokensLoading ? (
                <TableRow>
                  <TableCell colSpan={10} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : tokens.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center">
                    {searchTerm || selectedVendor ? 'No matching tokens found' : 'No tokens found'}
                  </TableCell>
                </TableRow>
              ) : (
                tokens.map(token => (
                  <TableRow key={token._id}>
                    <TableCell>{token.tokenId || 'Pending'}</TableCell>
                    <TableCell>{token.meterNumber}</TableCell>
                    <TableCell>{token.disco}</TableCell>
                    <TableCell>{token.units}</TableCell>
                    <TableCell>₦{token.amount?.toLocaleString() || '0'}</TableCell>
                    <TableCell>
                      {renderStatusBadge(token.status)}
                    </TableCell>
                    <TableCell>{formatDate(token.createdAt)}</TableCell>
                    <TableCell>
                      {token.status === 'issued' ? formatDate(token.updatedAt) : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {token.expiryDate ? new Date(token.expiryDate).toLocaleDateString() : 'N/A'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {tokensPagination.totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Pagination
              count={tokensPagination.totalPages}
              page={tokensPagination.page}
              onChange={handleTokensPageChange}
              color="primary"
            />
          </Box>
        )}
      </Box>

      {/* Token Issuance Dialog */}
      <Dialog 
        open={Boolean(selectedRequest)} 
        onClose={() => setSelectedRequest(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Issue Token</DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <Box sx={{ mt: 2 }}>
              <TextField
                label="Meter Number"
                value={selectedRequest.meterNumber}
                fullWidth
                margin="normal"
                disabled
              />
              <TextField
                label="Meter Serial Number (MSN)"
                value={selectedRequest.customerVerification?.MSN || 'Not available'}
                fullWidth
                margin="normal"
                disabled
              />
              <TextField
                label="Units"
                value={selectedRequest.units}
                fullWidth
                margin="normal"
                disabled
              />
              <TextField
                label="Amount (₦)"
                value={selectedRequest.amount}
                fullWidth
                margin="normal"
                disabled
              />
              <TextField
                label="Token Value *"
                value={tokenValue}
                onChange={(e) => setTokenValue(e.target.value)}
                fullWidth
                margin="normal"
                error={!!tokenError}
                helperText={tokenError}
                placeholder="Enter 16-45 digit token"
                inputProps={{ maxLength: 45 }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setSelectedRequest(null);
            setTokenValue('');
            setTokenError('');
          }}>
            Cancel
          </Button>
          <Button 
            variant="contained"
            onClick={handleIssueToken}
            disabled={!tokenValue || !!tokenError || actionLoading}
          >
            {actionLoading ? <CircularProgress size={24} /> : 'Issue Token'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Rejection Reason Dialog */}
      <Dialog
        open={rejectionDialogOpen}
        onClose={closeRejectionDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Reject Token Request</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              label="Reason for Rejection"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              fullWidth
              multiline
              rows={4}
              margin="normal"
              placeholder="Enter the reason for rejecting this request"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeRejectionDialog}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleRejectRequest}
            disabled={!rejectionReason || actionLoading}
          >
            {actionLoading ? <CircularProgress size={24} /> : 'Confirm Rejection'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({...snackbar, open: false})}
        message={snackbar.message}
      />
    </Paper>
  );
};

export default TokenManagement;