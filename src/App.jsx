import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import Login from "./pages/login";
import Dashboard from "./pages/dashboard";
import Projects from "./pages/projects";
import Tasks from "./pages/tasks";
import Stats from "./pages/stats";
import Users from "./pages/users";
import Profile from "./pages/profile";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Login register />} />
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/projets" element={<Projects />} />
          <Route path="/taches" element={<Tasks />} />
          <Route path="/statistiques" element={<Stats />} />
          <Route path="/utilisateurs" element={<Users />} />
          <Route path="/parametres" element={<Profile />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}