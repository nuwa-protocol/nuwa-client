import { createBrowserRouter, Navigate } from 'react-router-dom';
import ChatLayout from './layout/chat-layout';
import MainLayout from './layout/main-layout';
import RootLayout from './layout/root-layout';
import ArtifactsPage from './pages/artifacts';
import CallbackPage from './pages/callback';
import CapStudioPage from './pages/cap-studio';
import CapStudioBatchCreatePage from './pages/cap-studio-batch-create';
import CapStudioCreatePage from './pages/cap-studio-create';
import CapStudioEditPage from './pages/cap-studio-edit';
import CapStudioMcpPage from './pages/cap-studio-mcp';
import CapStudioSubmitPage from './pages/cap-studio-submit';
import ChatPage from './pages/chat';
import ErrorPage from './pages/error';
import ExplorePage from './pages/explore';
import LoginPage from './pages/login';
import SettingsPage from './pages/settings';
import WalletPage from './pages/wallet';

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <ErrorPage />,
    children: [
      {
        element: <MainLayout />,
        errorElement: <ErrorPage />,
        children: [
          { index: true, element: <Navigate to="/chat" replace /> },
          {
            element: <ChatLayout />,
            children: [
              { path: 'chat', element: <ChatPage /> },
              { path: 'artifacts', element: <ArtifactsPage /> },
            ],
          },
          { path: 'wallet', element: <WalletPage /> },
          { path: 'settings', element: <SettingsPage /> },
          { path: 'explore/*', element: <ExplorePage /> },
          { path: 'cap-studio', element: <CapStudioPage /> },
          { path: 'cap-studio/create', element: <CapStudioCreatePage /> },
          {
            path: 'cap-studio/batch-create',
            element: <CapStudioBatchCreatePage />,
          },
          { path: 'cap-studio/edit/:id', element: <CapStudioEditPage /> },
          { path: 'cap-studio/submit/:id', element: <CapStudioSubmitPage /> },
          { path: 'cap-studio/mcp', element: <CapStudioMcpPage /> },
        ],
      },
      { path: 'login', element: <LoginPage /> },
      { path: 'callback', element: <CallbackPage /> },
    ],
  },
]);

export default router;
