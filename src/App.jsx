import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

import Layout from "./layout/Layout";
import Home from "./page/home";
import Page2 from "./page/Page2";
import Chat from "./components/Chat";
import Login from "./page/Login";

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" />;
  }
  return children;
}

function App() {
  return (
    <AuthProvider>
      <RouterProvider
        router={createBrowserRouter([
          {
            path: "/",
            element: <Layout />,
            children: [
              { index: true, element: <Home /> },
              {
                path: "page2",
                element: (
                  <ProtectedRoute>
                    <Page2 />
                  </ProtectedRoute>
                ),
              },
              {
                path: "chat",
                element: (
                  <ProtectedRoute>
                    <Chat />
                  </ProtectedRoute>
                ),
              },
            ],
          },
          {
            path: "/login",
            element: <Login />,
          },
          {
            path: "*",
            element: <Navigate to="/" />,
          },
        ])}
      />
    </AuthProvider>
  );
}

export default App;
