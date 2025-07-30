import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  CssBaseline, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  Paper,
  CircularProgress,
  Divider,
  useTheme,
  Tabs,
  Tab,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Button,
  ButtonGroup,
  TablePagination
} from '@mui/material';
import {
  People as PeopleIcon,
  VerifiedUser as VerifiedUserIcon,
  Receipt as ReceiptIcon,
  Warning as WarningIcon,
  MonetizationOn as MonetizationIcon,
  BarChart as BarChartIcon,
  Timeline as TimelineIcon,
  PictureAsPdf as PdfIcon,
  GridOn as ExcelIcon
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import * as XLSX from 'xlsx';  
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import Navbar from '../components/Layout/Navbar';
import Sidebar from '../components/Layout/Sidebar';
import CreateVendor from '../components/Admin/CreateVendor';
import VerifyCustomer from '../components/Admin/VerifyCustomer';
import DiscoPricing from '../components/Admin/DiscoPricing';
import TokenManagement from '../components/Admin/TokenManagement';
import RecentActivities from '../components/Admin/RecentActivities';
import AccountManagement from '../components/Admin/AccountManagement';
import AddVendorSpace from '../components/Admin/AddVendorSpace'
import API from '../utils/api';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const AdminDashboard = () => {
  const theme = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeComponent, setActiveComponent] = useState('dashboard');
  const [stats, setStats] = useState({
    totalCustomers: 0,
    verifiedCustomers: 0,
    pendingCustomers: 0,
    totalTokens: 0,
    pendingTokens: 0,
    dailyRevenue: 0,
    monthlyRevenue: 0,
    AllRevenue: 0,
    loading: true
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [timeRange, setTimeRange] = useState('month');
  const [chartTab, setChartTab] = useState(0);
  const [revenueData, setRevenueData] = useState([]);
  const [customerData, setCustomerData] = useState([]);
  const [tokenData, setTokenData] = useState([]);
  const [salesReportData, setSalesReportData] = useState([]);
  const [reportType, setReportType] = useState('daily');
  const [reportLoading, setReportLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const fetchDashboardData = useCallback(async () => {
    try {
      setStats(prev => ({ ...prev, loading: true }));

      const fetchData = async (endpoint) => {
        try {
          const response = await API.get(endpoint);
          return response.data?.data || response.data || {};
        } catch (error) {
          console.error(`Error fetching ${endpoint}:`, error);
          return {};
        }
      };

      const [
        customersData,
        verifiedCustomersData,
        pendingCustomersData,
        tokensData,
        pendingTokensData,
        revenueData,
        dailyrevenueData,
        monthlyrevenueData,
        activitiesData,
        revenueTrendData,
        customerTrendData,
        tokenTrendData
      ] = await Promise.all([
        fetchData('/admin/customers/stats'),
        fetchData('/admin/verified-customers-count'),
        fetchData('/admin/pending-customers-verification'),
        fetchData('/admin/issued-token-count'),
        fetchData('/admin/token-request-count'),
        fetchData('/admin/total-tokens-amount'),
        fetchData('/admin/daily-token-count'),
        fetchData('/admin/monthly-token-count'),
        fetchData('/admin/activities/recent'),
        fetchData(`/admin/revenue-trends?range=${timeRange}`),
        fetchData(`/admin/customer-trends?range=${timeRange}`),
        fetchData(`/admin/token-trends?range=${timeRange}`),
        fetchData(`/admin/customer-distribution?range=${timeRange}`)
      ]);

      setStats({
        totalCustomers: customersData.total || customersData.count || 0,
        verifiedCustomers: verifiedCustomersData.count || 0,
        pendingCustomers: pendingCustomersData.count || 0,
        totalTokens: tokensData.count || tokensData.count || 0,
        pendingTokens: pendingTokensData.count || 0,
        dailyRevenue: dailyrevenueData.formattedAmount || 0,
        monthlyRevenue: monthlyrevenueData.formattedAmount || 0,
        AllRevenue: revenueData.formattedAmount || 0,
        loading: false
      });

      setRecentActivities(Array.isArray(activitiesData) ? activitiesData : []);
      setRevenueData(Array.isArray(revenueTrendData) ? revenueTrendData : []);
      setCustomerData(Array.isArray(customerTrendData) ? customerTrendData : []);
      setTokenData(Array.isArray(tokenTrendData) ? tokenTrendData : []);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setStats(prev => ({ ...prev, loading: false }));
    }
  }, [timeRange]);

  const fetchSalesReportData = async (type) => {
    try {
      setReportLoading(true);
      const response = await API.get(`/admin/sales-report?type=${type}`);
      setSalesReportData(Array.isArray(response.data?.data) ? response.data.data : []);
      setPage(0); // Reset to first page when report type changes
    } catch (error) {
      console.error('Failed to fetch sales report data:', error);
    } finally {
      setReportLoading(false);
    }
  };

  useEffect(() => {
    if (activeComponent === 'dashboard') {
      fetchDashboardData();
      fetchSalesReportData(reportType);
    }
  }, [activeComponent, fetchDashboardData, timeRange, reportType]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleTimeRangeChange = (event) => {
    setTimeRange(event.target.value);
  };

  const handleChartTabChange = (event, newValue) => {
    setChartTab(newValue);
  };

  const handleReportTypeChange = (event) => {
    setReportType(event.target.value);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(salesReportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sales Report");
    XLSX.writeFile(workbook, `Sales_Report_${reportType}.xlsx`);
  };

  const exportToPDF = async () => {
    const input = document.getElementById('sales-report-table');
    if (!input) return;

    const canvas = await html2canvas(input, {
      scale: 2,
      logging: true,
      useCORS: true
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210;
    const pageHeight = 295;
    const imgHeight = canvas.height * imgWidth / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(`Sales_Report_${reportType}.pdf`);
  };

  const StatCard = ({ icon, title, value, subtext, color, iconBg }) => (
    <Card sx={{ 
      height: '100%', 
      boxShadow: theme.shadows[4],
      transition: 'transform 0.3s, box-shadow 0.3s',
      '&:hover': {
        transform: 'translateY(-5px)',
        boxShadow: theme.shadows[4]
      }
    }}>
      <CardContent sx={{ p: 3 }}>
        <Box display="flex" alignItems="center" mb={1}>
          <Box 
            sx={{
              backgroundColor: iconBg || color,
              color: 'white',
              borderRadius: '12px',
              width: 48,
              height: 48,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: 2
            }}
          >
            {React.cloneElement(icon, { style: { fontSize: 24 } })}
          </Box>
          <Box>
            <Typography 
              variant="subtitle2" 
              color="text.secondary"
              sx={{ fontWeight: 500 }}
            >
              {title}
            </Typography>
            <Typography 
              variant="h5" 
              component="div"
              sx={{ fontWeight: 700 }}
            >
              {stats.loading ? <CircularProgress size={20} /> : value}
            </Typography>
          </Box>
        </Box>
        {subtext && (
          <Typography 
            variant="caption" 
            color="text.secondary"
            sx={{ display: 'block', mt: 1 }}
          >
            {subtext}
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  const renderRevenueChart = () => {
    if (revenueData.length === 0) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
          <Typography>No revenue data available</Typography>
        </Box>
      );
    }
  
    return (
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={revenueData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="period" 
            tick={{ fontSize: 12 }}
            angle={timeRange === 'day' ? -45 : 0}
            height={timeRange === 'day' ? 60 : undefined}
          />
          <YAxis 
            tickFormatter={(value) => `₦${value.toLocaleString()}`}
          />
          <Tooltip 
            formatter={(value) => [`₦${Number(value).toLocaleString()}`, 'Revenue']}
            labelFormatter={(label) => `Period: ${label}`}
          />
          <Legend />
          <Bar 
            dataKey="amount" 
            name="Revenue" 
            fill="#4caf50" 
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const renderCustomerChart = () => {
    if (customerData.length === 0) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
          <Typography>No customer data available</Typography>
        </Box>
      );
    }
  
    return (
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={customerData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="period" 
            tick={{ fontSize: 12 }}
            angle={timeRange === 'day' ? -45 : 0}
            height={timeRange === 'day' ? 60 : undefined}
          />
          <YAxis />
          <Tooltip 
            formatter={(value) => [value.toLocaleString(), 'Customers']}
            labelFormatter={(label) => `Period: ${label}`}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="total" 
            name="Total Customers" 
            stroke="#3f51b5" 
            strokeWidth={2}
            activeDot={{ r: 8 }}
          />
          <Line 
            type="monotone" 
            dataKey="verified" 
            name="Verified Customers" 
            stroke="#4caf50" 
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  const renderTokenChart = () => {
    if (tokenData.length === 0) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
          <Typography>No token data available</Typography>
        </Box>
      );
    }
  
    return (
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={tokenData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="period" 
            tick={{ fontSize: 12 }}
            angle={timeRange === 'day' ? -45 : 0}
            height={timeRange === 'day' ? 60 : undefined}
          />
          <YAxis />
          <Tooltip 
            formatter={(value) => [value.toLocaleString(), 'Tokens']}
            labelFormatter={(label) => `Period: ${label}`}
          />
          <Legend />
          <Bar dataKey="issued" name="Issued Tokens" fill="#2196f3" />
          <Bar dataKey="pending" name="Pending Tokens" fill="#ff9800" />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const renderCustomerPieChart = () => {
    const pieData = [
      { name: 'Verified Customers', value: stats.verifiedCustomers || 0 },
      { name: 'Pending Customers', value: stats.pendingCustomers || 0 },
    ];
  
    if (pieData[0].value === 0 && pieData[1].value === 0) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
          <Typography>No customer distribution data available</Typography>
        </Box>
      );
    }
  
    return (
      <ResponsiveContainer width="100%" height={400}>
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={120}
            fill="#8884d8"
            dataKey="value"
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          >
            {pieData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value) => [value.toLocaleString(), 'Customers']}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  const renderSalesReportSection = () => {
    return (
      <Paper sx={{ p: 3, mb: 4, boxShadow: theme.shadows[1] }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            Sales Report
          </Typography>
          <Box display="flex" alignItems="center" gap={2}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Report Type</InputLabel>
              <Select
                value={reportType}
                label="Report Type"
                onChange={handleReportTypeChange}
              >
                <MenuItem value="daily">Daily</MenuItem>
                <MenuItem value="weekly">Weekly</MenuItem>
                <MenuItem value="monthly">Monthly</MenuItem>
              </Select>
            </FormControl>
            <ButtonGroup variant="contained">
              <Button 
                startIcon={<ExcelIcon />} 
                onClick={exportToExcel}
                disabled={reportLoading || salesReportData.length === 0}
              >
                Export Excel
              </Button>
              <Button 
                startIcon={<PdfIcon />} 
                onClick={exportToPDF}
                disabled={reportLoading || salesReportData.length === 0}
                sx={{ ml: 1 }}
              >
                Export PDF
              </Button>
            </ButtonGroup>
          </Box>
        </Box>
        <Divider sx={{ mb: 3 }} />

        {reportLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
            <CircularProgress />
          </Box>
        ) : salesReportData.length === 0 ? (
          <Typography variant="body1" align="center" sx={{ p: 3 }}>
            No sales report data available
          </Typography>
        ) : (
          <>
            <Box id="sales-report-table">
              <Box sx={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: theme.palette.primary.main, color: 'white' }}>
                      <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Date</th>
                      <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Tokens Issued</th>
                      <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Total Amount (₦)</th>
                      <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Successful Transactions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesReportData
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((row, index) => (
                        <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#f9f9f9' : 'white' }}>
                          <td style={{ padding: '12px', border: '1px solid #ddd' }}>{row.date}</td>
                          <td style={{ padding: '12px', border: '1px solid #ddd' }}>{row.tokensIssued}</td>
                          <td style={{ padding: '12px', border: '1px solid #ddd' }}>{row.totalAmount.toLocaleString()}</td>
                          <td style={{ padding: '12px', border: '1px solid #ddd' }}>{row.successfulTransactions}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </Box>
            </Box>
            <TablePagination
              rowsPerPageOptions={[10, 25, 50]}
              component="div"
              count={salesReportData.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              sx={{ borderTop: '1px solid rgba(224, 224, 224, 1)' }}
            />
          </>
        )}
      </Paper>
    );
  };

  const renderActiveComponent = () => {
    switch (activeComponent) {
      case 'createVendor':
        return <CreateVendor />;
      case 'verifyCustomer':
        return <VerifyCustomer />;
      case 'discoPricing':
        return <DiscoPricing />;
      case 'tokenManagement':
        return <TokenManagement />;
      case 'accountManagement':
        return <AccountManagement />;
      case 'addVendorSpace':
        return <AddVendorSpace />;
      default:
        return (
          <Box sx={{ p: 3, backgroundColor: theme.palette.background.paper }}>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, mt: 4, mb: 3 }}>
              Admin Dashboard Overview
            </Typography>
                      
            {/* Time Range Selector */}
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Time Range</InputLabel>
                <Select
                  value={timeRange}
                  label="Time Range"
                  onChange={handleTimeRangeChange}
                >
                  <MenuItem value="day">All</MenuItem>
                  {/* <MenuItem value="week">Weekly</MenuItem>
                  <MenuItem value="month">Monthly</MenuItem>
                  <MenuItem value="year">Yearly</MenuItem> */}
                </Select>
              </FormControl>
            </Box>

            {/* Main Stats Cards */}
            <Grid container spacing={3} mb={4}>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard 
                  icon={<PeopleIcon />} 
                  title="Total Customers" 
                  value={stats.totalCustomers.toLocaleString()} 
                  subtext="All registered customers"
                  color="#3f51b5"
                  iconBg="#5c6bc0"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard 
                  icon={<VerifiedUserIcon />} 
                  title="Verified Customers" 
                  value={stats.verifiedCustomers.toLocaleString()} 
                  subtext="Completed verification"
                  color="#4caf50"
                  iconBg="#66bb6a"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard 
                  icon={<WarningIcon />} 
                  title="Pending Customers" 
                  value={stats.pendingCustomers.toLocaleString()} 
                  subtext="Awaiting verification"
                  color="#ff9800"
                  iconBg="#ffa726"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard 
                  icon={<ReceiptIcon />} 
                  title="Total Tokens" 
                  value={stats.totalTokens.toLocaleString()} 
                  subtext="All issued tokens"
                  color="#9c27b0"
                  iconBg="#ab47bc"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard 
                  icon={<WarningIcon />} 
                  title="Pending Tokens" 
                  value={stats.pendingTokens.toLocaleString()} 
                  subtext="Awaiting processing"
                  color="#f44336"
                  iconBg="#ef5350"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard 
                  icon={<MonetizationIcon />} 
                  title="Daily Revenue" 
                  value={`₦${stats.dailyRevenue.toLocaleString()}`} 
                  subtext="Today's total revenue"
                  color="#009688"
                  iconBg="#26a69a"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard 
                  icon={<MonetizationIcon />} 
                  title="Monthly Revenue" 
                  value={`₦${stats.monthlyRevenue.toLocaleString()}`} 
                  subtext="This month's total"
                  color="#673ab7"
                  iconBg="#7e57c2"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard 
                  icon={<MonetizationIcon />} 
                  title="All Revenue" 
                  value={`${stats.AllRevenue.toLocaleString()}`} 
                  subtext="All total"
                  color="#ff5722"
                  iconBg="#ff7043"
                />
              </Grid>
            </Grid>

            {/* Charts Section */}
            <Paper sx={{ p: 3, mb: 4, boxShadow: theme.shadows[1] }}>
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={chartTab} onChange={handleChartTabChange} aria-label="chart tabs">
                  <Tab label="Revenue Trend" icon={<TimelineIcon />} iconPosition="start" />
                  <Tab label="Customer Growth" icon={<PeopleIcon />} iconPosition="start" />
                  <Tab label="Token Statistics" icon={<ReceiptIcon />} iconPosition="start" />
                  <Tab label="Customer Distribution" icon={<BarChartIcon />} iconPosition="start" />
                </Tabs>
              </Box>
              <Box sx={{ pt: 3 }}>
                {chartTab === 0 && renderRevenueChart()}
                {chartTab === 1 && renderCustomerChart()}
                {chartTab === 2 && renderTokenChart()}
                {chartTab === 3 && renderCustomerPieChart()}
              </Box>
            </Paper>

            {/* Sales Report Section */}
            {renderSalesReportSection()}

            {/* Recent Activities Section */}
            <Paper sx={{ p: 3, boxShadow: theme.shadows[1] }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Recent Activities
              </Typography>
              <Divider sx={{ mb: 3 }} />
              <RecentActivities activities={recentActivities} />
            </Paper>
          </Box>
        );
    }
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <Navbar handleDrawerToggle={handleDrawerToggle} />
      <Sidebar 
        mobileOpen={mobileOpen} 
        handleDrawerToggle={handleDrawerToggle}
        setActiveComponent={setActiveComponent}  
      />
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          p: 3,
          backgroundColor: theme.palette.background.default
        }}
      >
        {renderActiveComponent()}
      </Box>
    </Box>
  );
};

export default AdminDashboard;