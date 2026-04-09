import { Search } from 'lucide-react';
import { useLocation } from 'react-router-dom';

function Results() {
  const location = useLocation();
  const query = new URLSearchParams(location.search).get('query');

  return (
    <div className="py-12">
      <div className="flex items-center gap-3">
        <Search className="h-5 w-5 text-muted-foreground" />
        <h1 className="text-xl font-semibold">
          Results for <span className="text-muted-foreground">"{query}"</span>
        </h1>
      </div>

      <div className="mt-12 flex flex-col items-center gap-3 text-center">
        <Search className="h-10 w-10 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">
          Search functionality coming soon. Stay tuned!
        </p>
      </div>
    </div>
  );
}

export default Results;
