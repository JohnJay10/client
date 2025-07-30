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
  DialogActions
} from '@mui/material';
import { 
  Power as PowerIcon,
  Refresh as RefreshIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import API from '../../utils/api';
import { format } from 'date-fns';

const DiscoPriceSetting = () => {
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);
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
    pricePerUnit: ''
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Fetch all DISCO prices
  const fetchPrices = async () => {
    try {
      setLoading(true);
      const response = await API.get('/admin/disco-pricing');
      
      if (response.data.success) {
        setPrices(response.data.data);
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
        pricePerUnit: Number(newPrice.pricePerUnit)
      });

      if (response.data.success) {
        setPrices(prev => [...prev, response.data.data]);
        setNewPrice({ discoName: '', pricePerUnit: '' });
        setSnackbar({
          open: true,
          message: `${newPrice.discoName} price created successfully`,
          severity: 'success'
        });
        fetchPrices(); // Refresh the list
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

  // Update DISCO price (name cannot be changed)
  const handleUpdatePrice = async () => {
    try {
      const priceValue = Number(currentPrice.pricePerUnit);
      
      if (isNaN(priceValue) || priceValue < 0) {
        setSnackbar({
          open: true,
          message: 'Please enter a valid positive price',
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
        fetchPrices(); // Refresh the list
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
            fetchPrices(); // Refresh the list
        }
    } catch (error) {
        console.error('Delete error:', error);
        setSnackbar({
            open: true,
            message: error.response?.data?.message || 'Failed to delete DISCO',
            severity: 'error'
        });
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
    <Box sx={{ p: 9 }}>
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
                <TableCell>Last Updated</TableCell>
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
              ) : prices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">
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
                      {formatDate(price.updatedAt)}
                    </TableCell>
                    <TableCell>
                      <IconButton 
                        onClick={() => {
                          setCurrentPrice({
                            _id: price._id,
                            discoName: price.discoName,
                            pricePerUnit: price.pricePerUnit.toString()
                          });
                          setEditDialogOpen(true);
                        }}
                      >
                        <EditIcon color="primary" />
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
              isNaN(Number(currentPrice.pricePerUnit)) ||
              Number(currentPrice.pricePerUnit) < 0
            }
          >
            Update Price
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
    <DialogTitle>Confirm Delete</DialogTitle>
    <DialogContent>
        <Typography>
            Are you sure you want to permanently delete {currentPrice.discoName}?
            <br />
            <strong>This action cannot be undone.</strong>
        </Typography>
    </DialogContent>
    <DialogActions>
        <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
        <Button 
            variant="contained" 
            color="error"
            onClick={handleDeletePrice}
        >
            Confirm Delete
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