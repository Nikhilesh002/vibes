import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { AppDispatch, RootState } from '@/redux/store';
import { logout } from '@/redux/slices/userSlice';
import toast from 'react-hot-toast';
import { axiosWithToken } from '@/lib/axiosWithToken';
import { ModeToggle } from '@/components/ui/mode-toggle';
import { Menu, Search, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const NavBar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const userData = useSelector((state: RootState) => state.user);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const isActive = (path: string) => location.pathname === path;

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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    navigate(`/results?query=${encodeURIComponent(searchTerm)}`);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-4 px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link to="/" className="flex shrink-0 items-center gap-2.5">
          <img src="/logo.png" alt="Logo" className="h-7 w-7 rounded-md" />
          <span className="text-lg font-semibold tracking-tight">Vibes</span>
        </Link>

        {/* Search — centered, desktop */}
        <form
          onSubmit={handleSearch}
          className="mx-auto hidden w-full max-w-md md:flex"
        >
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              type="search"
              placeholder="Search videos..."
              className="h-9 w-full rounded-lg border border-input bg-muted/50 pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:bg-background focus:ring-1 focus:ring-ring"
            />
          </div>
        </form>

        {/* Right side actions */}
        <div className="ml-auto flex items-center gap-2">
          <Link to="/video-upload">
            <Button
              variant="ghost"
              size="sm"
              className={`hidden gap-1.5 sm:inline-flex ${isActive('/video-upload') ? 'bg-accent' : ''}`}
            >
              <Upload className="h-4 w-4" />
              Upload
            </Button>
          </Link>

          {userData.user ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignout}
              className="text-muted-foreground hover:text-foreground"
            >
              Sign out
            </Button>
          ) : (
            <Link to="/signin">
              <Button size="sm" className="rounded-lg">
                Sign in
              </Button>
            </Link>
          )}

          <ModeToggle />

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground md:hidden"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <div className="border-t border-border md:hidden">
          <div className="space-y-1 px-4 py-3">
            {/* Mobile search */}
            <form onSubmit={handleSearch} className="mb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  type="search"
                  placeholder="Search videos..."
                  className="h-9 w-full rounded-lg border border-input bg-muted/50 pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring"
                />
              </div>
            </form>

            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`block rounded-lg px-3 py-2 text-sm transition-colors ${isActive('/') ? 'bg-accent font-medium' : 'text-muted-foreground hover:bg-accent hover:text-foreground'}`}
            >
              Home
            </Link>
            <Link
              to="/video-upload"
              onClick={() => setMobileMenuOpen(false)}
              className={`block rounded-lg px-3 py-2 text-sm transition-colors ${isActive('/video-upload') ? 'bg-accent font-medium' : 'text-muted-foreground hover:bg-accent hover:text-foreground'}`}
            >
              Upload Videos
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default NavBar;
