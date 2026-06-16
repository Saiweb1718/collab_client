import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './index.css';

import { AuthProvider } from './context/AuthContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { RequireAuth, RedirectIfAuth } from './components/RouteGuards.jsx';
import AppLayout from './components/layout/AppLayout.jsx';

import Login from './pages/Login.jsx';
import SignUp from './pages/SignUp.jsx';
import Dashboard from './pages/Dashboard.jsx';
import ClusterPage from './pages/ClusterPage.jsx';
import ProjectPage from './pages/ProjectPage.jsx';
import MessagesPage from './pages/MessagesPage.jsx';
import MyTasks from './pages/MyTasks.jsx';
import ProfilePage from './pages/ProfilePage.jsx';

const router = createBrowserRouter([
  {
    element: <RedirectIfAuth />,
    children: [
      { path: '/login', element: <Login /> },
      { path: '/signup', element: <SignUp /> },
    ],
  },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/', element: <Dashboard /> },
          { path: '/clusters/:clusterId', element: <ClusterPage /> },
          { path: '/projects/:projectId', element: <ProjectPage /> },
          { path: '/messages', element: <MessagesPage /> },
          { path: '/tasks', element: <MyTasks /> },
          { path: '/profile', element: <ProfilePage /> },
          { path: '/profile/:userId', element: <ProfilePage /> },
        ],
      },
    ],
  },
  { path: '*', element: <Login /> },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);
