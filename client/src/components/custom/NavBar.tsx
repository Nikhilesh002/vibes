import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { AppDispatch, RootState } from '@/redux/store';
import { logout } from '@/redux/slices/userSlice';
import toast from 'react-hot-toast';
import { axiosWithToken } from '@/lib/axiosWithToken';
import { ModeToggle } from '@/components/ui/mode-toggle';
import { Separator } from '@radix-ui/react-menubar';
import { Menu, X } from 'lucide-react';

const NavBar: React.FC = () => {
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const userData = useSelector((state: RootState) => state.user);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) =>
    location.pathname === path
      ? 'bg-black text-white dark:bg-gray-100 dark:text-black'
      : '';

  const handleSignout = async () => {
    try {
      const res = await axiosWithToken.get(
        `${import.meta.env.VITE_API_URL}/user/signout`,
      );

      if (res.status === 200) {
        toast.success(res.data.msg);
        dispatch(logout());
      } else {
        toast.error(res.data.msg);
      }
    } catch (error) {
      console.error(error);
      toast.error('Signout failed');
    }
  };

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/videos', label: 'Videos' },
    { to: '/video-upload', label: 'Upload Videos' },
    userData.user
      ? { to: '/signin', label: 'Signout', onClick: handleSignout }
      : { to: '/signin', label: 'SignIn' },
  ];

  return (
    <div className="w-full shadow-md">
      <nav className="flex items-center justify-between p-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Logo" className="h-8 w-8 rounded" />
          <a href="/" className="text-2xl font-bold">
            Vibes
          </a>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-4">
          {navLinks.map(({ to, label, onClick }) => (
            <Link
              key={label}
              to={to}
              onClick={onClick}
              className={`px-3 py-2 rounded transition-colors duration-300 ${isActive(
                to,
              )} hover:bg-gray-200 hover:text-black`}
            >
              {label}
            </Link>
          ))}
          <ModeToggle />
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden flex flex-col px-4 py-2 gap-2">
          {navLinks.map(({ to, label, onClick }) => (
            <Link
              key={label}
              to={to}
              onClick={() => {
                if (onClick) onClick();
                setMobileMenuOpen(false);
              }}
              className={`block px-3 py-2 rounded ${isActive(
                to,
              )} hover:bg-gray-200 hover:text-black`}
            >
              {label}
            </Link>
          ))}
          <div className="pt-2">
            <ModeToggle />
          </div>
        </div>
      )}
      <Separator />
    </div>
  );
};

export default NavBar;
