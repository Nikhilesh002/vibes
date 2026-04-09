import { Button } from '@/components/ui/button';
import { ArrowRight, Play } from 'lucide-react';
import { Link } from 'react-router-dom';

function Home() {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center">
      <div className="mx-auto max-w-2xl text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-4 py-1.5 text-sm text-muted-foreground">
          <Play className="h-3.5 w-3.5" />
          Video streaming platform
        </div>

        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Share your stories
          <br />
          <span className="text-muted-foreground">with the world</span>
        </h1>

        <p className="mx-auto mt-4 max-w-md text-base text-muted-foreground">
          Upload, stream, and discover videos. Built with adaptive HLS streaming
          for the best viewing experience.
        </p>

        <div className="mt-8 flex items-center justify-center gap-3">
          <Link to="/">
            <Button size="lg" className="gap-2 rounded-xl">
              Browse videos
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link to="/video-upload">
            <Button variant="outline" size="lg" className="rounded-xl">
              Upload
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Home;
