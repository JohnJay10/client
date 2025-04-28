// components/AccountManagement.js
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  CircularProgress,
  IconButton
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import API from '../../utils/api';

const AccountManagement = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentAccount, setCurrentAccount] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const [formData, setFormData] = useState({
    accountNumber: '',
    bankName: '',
    accountName: ''
  });

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const response = await API.get('/bank-accounts/fetch');
      setAccounts(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch accounts:', error);
      setSnackbar({
        open: true,
        message: 'Failed to fetch accounts',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async () => {
    try {
      if (currentAccount) {
        // Update existing account
        await API.put(`/bank-accounts/update/${currentAccount._id}`, formData);
        setSnackbar({
          open: true,
          message: 'Account updated successfully',
          severity: 'success'
        });
      } else {
        // Create new account
        await API.post('/bank-accounts/create', formData);
        setSnackbar({
          open: true,
          message: 'Account created successfully',
          severity: 'success'
        });
      }
      fetchAccounts();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving account:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to save account',
        severity: 'error'
      });
    }
  };

  const handleDelete = async (id) => {
    try {
      await API.delete(`/bank-accounts/delete/${id}`);
      setSnackbar({
        open: true,
        message: 'Account deleted successfully',
        severity: 'success'
      });
      fetchAccounts();
    } catch (error) {
      console.error('Error deleting account:', error);
      setSnackbar({
        open: true,
        message: 'Failed to delete account',
        severity: 'error'
      });
    }
  };

  const handleOpenDialog = (account = null) => {
    setCurrentAccount(account);
    if (account) {
      setFormData({
        accountNumber: account.accountNumber,
        bankName: account.bankName,
        accountName: account.accountName
      });
    } else {
      setFormData({
        accountNumber: '',
        bankName: '',
        accountName: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentAccount(null);
  };

  return (
    <Paper sx={{ p: 9, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Bank Account Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Account
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Account Number</TableCell>
                <TableCell>Bank Name</TableCell>
                <TableCell>Account Name</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {accounts.map((account) => (
                <TableRow key={account._id}>
                  <TableCell>{account.accountNumber}</TableCell>
                  <TableCell>{account.bankName}</TableCell>
                  <TableCell>{account.accountName}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleOpenDialog(account)}>
                      <EditIcon color="primary" />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(account._id)}>
                      <DeleteIcon color="error" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="sm">
        <DialogTitle>{currentAccount ? 'Edit Account' : 'Add New Account'}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              margin="normal"
              label="Account Number"
              name="accountNumber"
              value={formData.accountNumber}
              onChange={handleInputChange}
            />
            <TextField
              fullWidth
              margin="normal"
              label="Bank Name"   
              name="bankName"
              value={formData.bankName}
              onChange={handleInputChange}
            />
            <TextField
              fullWidth
              margin="normal"
              label="Account Name"
              name="accountName"
              value={formData.accountName}
              onChange={handleInputChange}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>
            {currentAccount ? 'Update' : 'Create'}
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

export default AccountManagement;