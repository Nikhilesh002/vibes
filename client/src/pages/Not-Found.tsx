import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center text-center">
      <p className="text-7xl font-bold tracking-tighter text-muted-foreground/20">404</p>
      <h1 className="mt-4 text-xl font-semibold">Page not found</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link to="/" className="mt-6">
        <Button variant="outline" className="gap-2 rounded-xl">
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Button>
      </Link>
    </div>
  );
}

export default NotFound;
