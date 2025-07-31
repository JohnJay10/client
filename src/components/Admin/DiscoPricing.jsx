import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Snackbar,
  Card,
  TextField,
  InputAdornment,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip
} from '@mui/material';
import { 
  Power as PowerIcon,
  Refresh as RefreshIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  ToggleOn as ToggleOnIcon,
  ToggleOff as ToggleOffIcon
} from '@mui/icons-material';
import API from '../../utils/api';
import { format } from 'date-fns';

const DiscoPriceSetting = () => {
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [newPrice, setNewPrice] = useState({
    discoName: '',
    pricePerUnit: ''
  });
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentPrice, setCurrentPrice] = useState({
    _id: '',
    discoName: '',
    pricePerUnit: '',
    disabled: false
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);

  // Fetch all DISCO prices
  const fetchPrices = async () => {
    try {
      setLoading(true);
      const response = await API.get('/admin/disco-pricing');
      
      if (response.data.success) {
        setPrices(response.data.data || []);
      } else {
        throw new Error(response.data.message || 'Failed to fetch prices');
      }
    } catch (error) {
      console.error('Fetch error:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || error.message,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();
  }, []);

  // Create new DISCO price
  const handleCreatePrice = async () => {
    try {
      if (!newPrice.discoName.trim() || !newPrice.pricePerUnit || isNaN(Number(newPrice.pricePerUnit))) {
        setSnackbar({
          open: true,
          message: 'Please enter a valid DISCO name and price',
          severity: 'error'
        });
        return;
      }

      const response = await API.post('/admin/disco-pricing', {
        discoName: newPrice.discoName.trim(),
        pricePerUnit: Number(newPrice.pricePerUnit),
        disabled: false
      });

      if (response.data.success) {
        setNewPrice({ discoName: '', pricePerUnit: '' });
        setSnackbar({
          open: true,
          message: `${newPrice.discoName} price created successfully`,
          severity: 'success'
        });
        fetchPrices();
      }
    } catch (error) {
      console.error('Create error:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to create price',
        severity: 'error'
      });
    }
  };

  // Update DISCO price
  const handleUpdatePrice = async () => {
    try {
      const priceValue = Number(currentPrice.pricePerUnit);
      
      if (isNaN(priceValue)) {
        setSnackbar({
          open: true,
          message: 'Please enter a valid price',
          severity: 'error'
        });
        return;
      }

      const response = await API.patch(
        `/admin/disco-pricing/${encodeURIComponent(currentPrice.discoName)}`,
        { pricePerUnit: priceValue }
      );

      if (response.data.success) {
        setSnackbar({
          open: true,
          message: `${currentPrice.discoName} price updated successfully`,
          severity: 'success'
        });
        setEditDialogOpen(false);
        fetchPrices();
      }
    } catch (error) {
      console.error('Update error:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to update price',
        severity: 'error'
      });
    }
  };

  // Delete DISCO price
  const handleDeletePrice = async () => {
    try {
      setActionLoading(true);
      const response = await API.delete(
        `/admin/disco-pricing/${encodeURIComponent(currentPrice.discoName)}`
      );
      
      if (response.data.success) {
        setSnackbar({
          open: true,
          message: `${currentPrice.discoName} deleted successfully`,
          severity: 'success'
        });
        setDeleteDialogOpen(false);
        await fetchPrices();
      }
    } catch (error) {
      console.error('Delete error:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to delete DISCO',
        severity: 'error'
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Enable DISCO
const handleEnableDisco = async () => {
  try {
    setActionLoading(true);
    const response = await API.patch(
      `/admin/disco-pricing/${encodeURIComponent(currentPrice.discoName)}/enable`
    );

    if (response.data?.disabled === false) {
      setPrices((prev) =>
        prev.map((item) =>
          item.discoName.toLowerCase() === currentPrice.discoName.toLowerCase()
            ? { ...item, disabled: false }
            : item
        )
      );

      setSnackbar({
        open: true,
        message: response.data.message,
        severity: 'success'
      });
      setStatusDialogOpen(false);
    }
  } catch (error) {
    console.error('Enable error:', error);
    setSnackbar({
      open: true,
      message: error.response?.data?.message || 'Failed to enable DISCO',
      severity: 'error'
    });
  } finally {
    setActionLoading(false);
  }
};





const handleDisableDisco = async () => {
  try {
    setActionLoading(true);
    const response = await API.patch(
      `/admin/disco-pricing/${encodeURIComponent(currentPrice.discoName)}/disable`
    );

    if (response.data?.disabled === true) {
      // Update the one item in the state
      setPrices((prev) =>
        prev.map((item) =>
          item.discoName.toLowerCase() === currentPrice.discoName.toLowerCase()
            ? { ...item, disabled: true }
            : item
        )
      );

      setSnackbar({
        open: true,
        message: response.data.message,
        severity: 'success'
      });
      setStatusDialogOpen(false);
    }
  } catch (error) {
    console.error('Disable error:', error);
    setSnackbar({
      open: true,
      message: error.response?.data?.message || 'Failed to disable DISCO',
      severity: 'error'
    });
  } finally {
    setActionLoading(false);
  }
};





  // Format currency (Naira)
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
  };



  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" component="h1">
          DISCO Pricing Management
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<RefreshIcon />} 
          onClick={fetchPrices}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {/* Add New Price Card */}
      <Card sx={{ mb: 3, p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Set New Electricity Price
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField
            fullWidth
            label="Electricity Provider Name"
            value={newPrice.discoName}
            onChange={(e) => setNewPrice({...newPrice, discoName: e.target.value})}
          />

          <TextField
            fullWidth
            label="Price Per Unit (kWh)"
            value={newPrice.pricePerUnit}
            onChange={(e) => {
              const value = e.target.value;
              if (value === '' || /^\d*\.?\d*$/.test(value)) {
                setNewPrice({...newPrice, pricePerUnit: value});
              }
            }}
            inputMode="decimal"
            InputProps={{
              startAdornment: <InputAdornment position="start">₦</InputAdornment>,
            }}
          />
        </Box>

        <Button 
          variant="contained" 
          startIcon={<SaveIcon />}
          onClick={handleCreatePrice}
          disabled={!newPrice.discoName.trim() || !newPrice.pricePerUnit}
        >
          Save Price
        </Button>
      </Card>

      {/* Current Prices Table */}
      <Card sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Current Electricity Prices
        </Typography>
        
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Provider</TableCell>
                <TableCell align="right">Price/kWh</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Last Updated</TableCell>
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
              ) : prices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No pricing data available
                  </TableCell>
                </TableRow>
              ) : (
                prices.map(price => (
                  <TableRow key={price._id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <PowerIcon color="primary" sx={{ mr: 1 }} />
                        {price.discoName}
                      </Box>
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                      {formatCurrency(price.pricePerUnit)}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={price.disabled ? 'Disabled' : 'Active'}
                        color={price.disabled ? 'error' : 'success'}

                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {formatDate(price.updatedAt)}
                    </TableCell>
                    <TableCell>
                      <IconButton 
                        onClick={() => {
                          setCurrentPrice({
                            _id: price._id,
                            discoName: price.discoName,
                            pricePerUnit: price.pricePerUnit.toString(),
                            disabled: price.disabled
                          });
                          setEditDialogOpen(true);
                        }}
                      >
                        <EditIcon color="primary" />
                      </IconButton>
                      <IconButton
                        onClick={() => {
                          console.log('Toggling status for:', price.discoName);
                          setCurrentPrice({
                            _id: price._id,
                            discoName: price.discoName,
                            disabled: price.disabled
                          });
                          setStatusDialogOpen(true);
                        }}
                      >
                        {price.disabled ? (
                          <ToggleOffIcon color="error" />
                        ) : (
                          <ToggleOnIcon color="primary" />
                        )}
                      </IconButton>
                      <IconButton 
                        onClick={() => {
                          setCurrentPrice(price);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <DeleteIcon color="error" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Edit Price Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
        <DialogTitle>Update Price for {currentPrice.discoName}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, minWidth: 300 }}>
            <Typography variant="subtitle1" sx={{ mb: 2, p: 1, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
              DISCO: {currentPrice.discoName}
            </Typography>
            <TextField
              fullWidth
              label="Price Per Unit (kWh)"
              value={currentPrice.pricePerUnit}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '' || /^\d*\.?\d*$/.test(value)) {
                  setCurrentPrice({
                    ...currentPrice,
                    pricePerUnit: value
                  });
                }
              }}
              inputMode="decimal"
              InputProps={{
                startAdornment: <InputAdornment position="start">₦</InputAdornment>,
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleUpdatePrice}
            disabled={
              !currentPrice.pricePerUnit ||
              isNaN(Number(currentPrice.pricePerUnit))
            }
          >
            Update Price
          </Button>
        </DialogActions>
      </Dialog>

      {/* Status Change Dialog */}
      <Dialog open={statusDialogOpen} onClose={() => setStatusDialogOpen(false)}>
        <DialogTitle>
          {currentPrice.disabled ? 'Enable' : 'Disable'} {currentPrice.discoName}?
        </DialogTitle>
        <DialogContent>
          <Typography>
            {currentPrice.disabled
              ? 'This will make the DISCO available for new customer registrations.'
              : 'This will hide the DISCO from new customer registrations.'}
          </Typography>
          <Typography variant="body2" sx={{ mt: 2, fontStyle: 'italic' }}>
            Note: Existing customers will not be affected.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained"
            color={currentPrice.disabled ? 'success' : 'warning'}
            onClick={currentPrice.disabled ? handleEnableDisco : handleDisableDisco}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <CircularProgress size={24} color="inherit" />
            ) : currentPrice.disabled ? (
              'Enable'
            ) : (
              'Disable'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to permanently delete {currentPrice.discoName}?
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, fontWeight: 'bold' }}>
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            color="error"
            onClick={handleDeletePrice}
            disabled={actionLoading}
          >
            {actionLoading ? <CircularProgress size={24} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({...snackbar, open: false})}
        message={snackbar.message}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      />
    </Box>
  );
};

export default DiscoPriceSetting;