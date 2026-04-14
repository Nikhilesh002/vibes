import { Toaster } from 'react-hot-toast';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import React, { Suspense } from 'react';
const Signin = React.lazy(() => import('./pages/Signin'));
const Signup = React.lazy(() => import('./pages/Signup'));
const Providers = React.lazy(() => import('./lib/providers'));
const NavBar = React.lazy(() => import('./components/custom/NavBar'));
const Home = React.lazy(() => import('./pages/Home'));
const NotFound = React.lazy(() => import('./pages/Not-Found'));
const VideoUpload = React.lazy(() => import('./pages/VideoUpload'));
const Videos = React.lazy(() => import('./pages/videos/Videos'));
const Video = React.lazy(() => import('./pages/video/Video'));
const Results = React.lazy(() => import('./pages/results/Results'));

function LoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground border-t-foreground" />
    </div>
  );
}

function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Suspense fallback={<LoadingFallback />}>
        <Providers>
          <Toaster
            position="bottom-right"
            toastOptions={{
              duration: 2500,
              style: {
                borderRadius: '12px',
                background: 'var(--popover)',
                color: 'var(--popover-foreground)',
                border: '1px solid var(--border)',
                fontSize: '14px',
              },
            }}
          />
          <BrowserRouter>
            <NavBar />
            <main className="mx-auto w-full max-w-350 px-4 sm:px-6 lg:px-8">
              <Routes>
                <Route path="/home" element={<Home />} />

                <Route path="/signin" element={<Signin />} />
                <Route path="/signup" element={<Signup />} />

                <Route path="/" element={<Videos />} />
                <Route path="/video/:videoId" element={<Video />} />
                <Route path="/results" element={<Results />} />

                <Route path="/video-upload" element={<VideoUpload />} />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
          </BrowserRouter>
        </Providers>
      </Suspense>
    </div>
  );
}

export default App;
