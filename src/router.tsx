import { createBrowserRouter, Navigate } from 'react-router-dom';
import MainLayout from './layout/main-layout';
import RootLayout from './layout/root-layout';
import CallbackPage from './pages/callback';
import CapStudioPage from './pages/cap-studio';
import CapStudioCreatePage from './pages/cap-studio-create';
import CapStudioEditPage from './pages/cap-studio-edit';
import CapStudioMcpPage from './pages/cap-studio-mcp';
import CapStudioSubmitPage from './pages/cap-studio-submit';
import ChatPage from './pages/chat';
import ErrorPage from './pages/error';
import LoginPage from './pages/login';

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
          { path: 'chat', element: <ChatPage /> },
          { path: 'cap-studio', element: <CapStudioPage /> },
          { path: 'cap-studio/create', element: <CapStudioCreatePage /> },
          { path: 'cap-studio/edit/:id', element: <CapStudioEditPage /> },
          { path: 'cap-studio/submit/:id', element: <CapStudioSubmitPage /> },
          { path: 'cap-studio/mcp/:id', element: <CapStudioMcpPage /> },
        ],
      },
      { path: 'login', element: <LoginPage /> },
      { path: 'callback', element: <CallbackPage /> },
    ],
  },
]);

export default router;
