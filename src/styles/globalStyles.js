import { GlobalStyles as MuiGlobalStyles } from '@mui/material';

const GlobalStyles = () => (
  <MuiGlobalStyles
    styles={{
      '*': {
        margin: 0,
        padding: 0,
        boxSizing: 'border-box',
      },
      body: {
        backgroundColor: '#f5f5f5', // Fallback if theme fails
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
        lineHeight: 1.5,
      },
      a: {
        textDecoration: 'none',
        color: 'inherit',
      },
      'ul, ol': {
        listStyle: 'none',
      },
    }}
  />
);

export default GlobalStyles;