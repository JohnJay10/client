import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Container,
  CssBaseline,
  Avatar
} from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import API from '../utils/api';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';

const Login = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const formik = useFormik({
    initialValues: {
      username: '',
      password: '',
    },
    validationSchema: Yup.object({
      username: Yup.string().required('Username is required'),
      password: Yup.string().required('Password is required'),
    }),
    onSubmit: async (values, { setSubmitting }) => {
      try {
        setError('');
        
        // Clear any existing storage first
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminRole');
        localStorage.removeItem('adminUser');
        
        console.log('🧹 Cleared localStorage');
        
        const response = await API.post('/admin/login', values);
        
        console.log('🔑 Login response:', response.data);
        
        if (response.data.token && response.data.role) {
          // STORE BOTH SETS OF KEYS TO BE SAFE
          localStorage.setItem('token', response.data.token);
          localStorage.setItem('role', response.data.role);
          localStorage.setItem('adminToken', response.data.token); // Duplicate for safety
          localStorage.setItem('adminRole', response.data.role);   // Duplicate for safety
          localStorage.setItem('adminUser', JSON.stringify({
            _id: response.data._id,
            username: response.data.username,
            role: response.data.role,
            permissions: response.data.permissions
          }));
          
          console.log('💾 STORED IN localStorage:');
          console.log('  - token:', localStorage.getItem('token'));
          console.log('  - role:', localStorage.getItem('role'));
          console.log('  - adminToken:', localStorage.getItem('adminToken'));
          console.log('  - adminRole:', localStorage.getItem('adminRole'));
          
          // Allow both admin and super_admin
          if (response.data.role === 'admin' || response.data.role === 'super_admin') {
            console.log('✅ Navigation allowed for role:', response.data.role);
            navigate('/admin');
          } else {
            console.log('❌ Invalid role:', response.data.role);
            setError('You do not have admin privileges');
          }
        } else {
          setError('Invalid response from server');
        }
      } catch (err) {
        console.error('Login error:', err);
        const errorMessage = err.response?.data?.message || 
                           err.response?.data?.error || 
                           err.message || 
                           'Login failed';
        setError(errorMessage);
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <Container component="main" maxWidth="sm">
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Paper 
          elevation={6} 
          sx={{ 
            p: 6, 
            width: '100%',
            maxWidth: '600px',
            borderRadius: 3,
            boxShadow: '0px 15px 35px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}
        >
          <Avatar sx={{ m: 2, bgcolor: 'primary.main', width: 60, height: 60 }}>
            <LockOutlinedIcon fontSize="large" />
          </Avatar>
          <Typography component="h1" variant="h3" sx={{ mb: 4, fontWeight: 'bold' }}>
            CTKs Admin Login
          </Typography>
          <Box 
            component="form" 
            onSubmit={formik.handleSubmit} 
            noValidate 
            sx={{ 
              width: '100%',
              mt: 1 
            }}
          >
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="Username"
              name="username"
              autoComplete="username"
              autoFocus
              value={formik.values.username}
              onChange={formik.handleChange}
              error={formik.touched.username && Boolean(formik.errors.username)}
              helperText={formik.touched.username && formik.errors.username}
              sx={{
                my: 2,
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderRadius: 2,
                  },
                },
              }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={formik.values.password}
              onChange={formik.handleChange}
              error={formik.touched.password && Boolean(formik.errors.password)}
              helperText={formik.touched.password && formik.errors.password}
              sx={{
                my: 2,
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderRadius: 2,
                  },
                },
              }}
            />
            {error && (
              <Typography color="error" align="center" sx={{ mt: 2 }}>
                {error}
              </Typography>
            )}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{
                mt: 4,
                mb: 2,
                p: 1.5,
                borderRadius: 2,
                fontSize: '1.1rem',
                fontWeight: 'bold',
                textTransform: 'none',
                boxShadow: 'none',
                '&:hover': {
                  boxShadow: 'none',
                }
              }}
              disabled={formik.isSubmitting}
            >
              {formik.isSubmitting ? 'Signing In...' : 'Sign In'}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;