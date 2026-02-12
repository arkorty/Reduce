import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Redirect from './pages/Redirect';
import Login from './pages/Login';
import Register from './pages/Register';
import Links from './pages/Links';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/links" element={<Links />} />
          <Route path="/:code" element={<Redirect />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
