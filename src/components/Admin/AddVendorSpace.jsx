import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
  Chip,
  CircularProgress,
  Snackbar,
  Card,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,

} from '@mui/material';
import { 
  Refresh,
  Payment
} from '@mui/icons-material';
import API from '../../utils/api';
import { format } from 'date-fns';

const VendorUpgradeManagement = () => {
  const [pendingUpgrades, setPendingUpgrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
  });
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [currentUpgrade, setCurrentUpgrade] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
const [rejectingUpgrade, setRejectingUpgrade] = useState(null);

  const fetchPendingUpgrades = async () => {
    try {
      setLoading(true);
      const response = await API.get('/admin/pending-upgrades');
      setPendingUpgrades(response.data.data || []);
    } catch (error) {
      console.error('Error fetching pending upgrades:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to fetch pending upgrades',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingUpgrades();
  }, []);

  const handleCompleteUpgrade = (upgrade) => {
    setCurrentUpgrade(upgrade);
    setCompleteDialogOpen(true);
  };

  const handleRejectUpgrade = (upgrade) => {
  setRejectingUpgrade(upgrade);
  setRejectDialogOpen(true);
};

const confirmRejectUpgrade = async () => {
  try {
    setProcessingId(rejectingUpgrade._id);
    await API.patch(`/admin/reject/${rejectingUpgrade.vendorInfo.id}/${rejectingUpgrade._id}`);

    setSnackbar({
      open: true,
      message: 'Upgrade request rejected successfully',
    });

    // Remove rejected upgrade from list
    setPendingUpgrades(prev => prev.filter(u => u._id !== rejectingUpgrade._id));
    setRejectDialogOpen(false);
  } catch (error) {
    console.error('Rejection error:', error);
    setSnackbar({
      open: true,
      message: error.response?.data?.message || 'Failed to reject upgrade',
    });
  } finally {
    setProcessingId(null);
  }
};

<Dialog 
  open={rejectDialogOpen} 
  onClose={() => setRejectDialogOpen(false)}
  maxWidth="sm"
  fullWidth
>
  <DialogTitle>Confirm Rejection</DialogTitle>
  <DialogContent>
    <Box sx={{ mt: 2 }}>
      <Typography variant="body1" gutterBottom>
        Are you sure you want to reject this upgrade request?
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        <strong>Reference:</strong> {rejectingUpgrade?.reference || 'N/A'}
      </Typography>
    </Box>
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
    <Button 
      onClick={confirmRejectUpgrade}
      variant="contained"
      color="error"
      disabled={processingId === rejectingUpgrade?._id}
    >
      {processingId === rejectingUpgrade?._id ? (
        <CircularProgress size={24} />
      ) : (
        'Reject Upgrade'
      )}
    </Button>
  </DialogActions>
</Dialog>



  const confirmCompleteUpgrade = async () => {
    try {
      setProcessingId(currentUpgrade._id);
      await API.patch(`/admin/complete/${currentUpgrade.vendorInfo.id}/${currentUpgrade._id}`);
      
      setSnackbar({
        open: true,
        message: 'Upgrade marked as completed successfully',
      });
      
      // Update local state
      setPendingUpgrades(prev => prev.filter(u => u._id !== currentUpgrade._id));
      setCompleteDialogOpen(false);
    } catch (error) {
      console.error('Completion error:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to complete upgrade',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount);
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
          Pending Upgrade Requests
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<Refresh />} 
          onClick={fetchPendingUpgrades}
        >
          Refresh
        </Button>
      </Box>

      <Card elevation={3}>
        <TableContainer>
          <Table>
           <TableHead>
            <TableRow>
              <TableCell>Vendor Name</TableCell> {/* NEW */}
              <TableCell>Request Date</TableCell>
              <TableCell>Additional Customers</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : pendingUpgrades.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No pending upgrades found
                  </TableCell>
                </TableRow>
              ) : (
                pendingUpgrades
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((upgrade) => (
                    <TableRow key={upgrade._id}>
                       <TableCell>
                        {upgrade.vendorInfo?.username || upgrade.vendorInfo?.businessName || 'Unknown'}
                      </TableCell>
                                          <TableCell>{formatDate(upgrade.date || upgrade.createdAt)}</TableCell>
                      <TableCell>{upgrade.additionalCustomers}</TableCell>
                      <TableCell>{formatCurrency(upgrade.amount)}</TableCell>
                      <TableCell>
                        <Chip
                          label={upgrade.status === 'pending' ? 'Pending' : upgrade.status}
                          color={
                            upgrade.status === 'pending' ? 'warning' : 
                            upgrade.status === 'approved' ? 'success' : 'error'
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="contained"
                          color="primary"
                          startIcon={<Payment />}
                          onClick={() => handleCompleteUpgrade(upgrade)}
                          disabled={processingId === upgrade._id || upgrade.status !== 'pending'}
                        >
                          {processingId === upgrade._id ? (
                            <CircularProgress size={24} color="inherit" />
                          ) : (
                            'Mark as Paid'
                          )}
                        </Button>


                         <Button
                          variant="outlined"
                          color="error"
                          onClick={() => handleRejectUpgrade(upgrade)}
                          disabled={processingId === upgrade._id || upgrade.status !== 'pending'}
                        >
                          Reject
                        </Button>
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
          count={pendingUpgrades.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Card>

      {/* Complete Upgrade Dialog */}
      <Dialog 
        open={completeDialogOpen} 
        onClose={() => setCompleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirm Upgrade Completion</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body1" gutterBottom>
              Are you sure you want to mark this upgrade as completed?
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              <strong>Reference:</strong> {currentUpgrade?.reference || 'N/A'}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCompleteDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={confirmCompleteUpgrade}
            variant="contained"
            color="primary"
            disabled={processingId === currentUpgrade?._id}
          >
            {processingId === currentUpgrade?._id ? (
              <CircularProgress size={24} />
            ) : (
              'Confirm Completion'
            )}
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

export default VendorUpgradeManagement;