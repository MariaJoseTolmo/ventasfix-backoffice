import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider } from 'antd';
import { AuthProvider } from './context/AuthContext';
import App from './App';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Design tokens for the "Ejecutivo" theme (see ADR-013): a light page
// background reads better than a dark theme once compressed for the demo
// video, so only the sidebar keeps the dark teal surface.
const theme = {
  token: {
    colorPrimary: '#0d6e66',
    colorBgLayout: '#f3f5f4',
    colorBgContainer: '#ffffff',
    colorText: '#152220',
    colorTextSecondary: '#69766f',
    // antd derives colorTextDescription (used by Typography type="secondary"
    // and Statistic titles) from colorText when not set explicitly, which
    // ignores our ink-soft token. Set it directly so every muted string in
    // the app (subtitles, VAT delta, footers) actually renders at #69766f.
    colorTextDescription: '#69766f',
    colorBorder: '#e3e7e5',
    colorBorderSecondary: '#e3e7e5',
    borderRadius: 8,
    fontFamily: "'IBM Plex Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontFamilyCode: "'IBM Plex Mono', 'SF Mono', Consolas, 'Liberation Mono', monospace",
  },
  components: {
    Layout: {
      siderBg: '#0c3b3f',
      headerBg: '#ffffff',
      bodyBg: '#f3f5f4',
    },
    Menu: {
      darkItemBg: '#0c3b3f',
      darkSubMenuItemBg: '#0c3b3f',
      darkItemColor: '#a9c9c7',
      darkItemHoverColor: '#ffffff',
      darkItemSelectedBg: 'rgba(255, 255, 255, 0.12)',
      darkItemSelectedColor: '#ffffff',
      darkGroupTitleColor: 'rgba(169, 201, 199, 0.65)',
    },
    Table: {
      headerBg: '#f3f5f4',
      headerColor: '#152220',
      borderColor: '#e3e7e5',
    },
    Card: {
      colorBorderSecondary: '#e3e7e5',
    },
  },
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ConfigProvider theme={theme}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ConfigProvider>
    </QueryClientProvider>
  </StrictMode>
);
