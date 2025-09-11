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

function App() {
  return (
    <div className="text-black bg-white dark:text-white dark:bg-black">
      <Suspense fallback={<div>Loading...</div>}>
        <Providers>
          <Toaster position="bottom-right" toastOptions={{ duration: 2000 }} />
          <BrowserRouter>
            <NavBar />
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
          </BrowserRouter>
        </Providers>
      </Suspense>
    </div>
  );
}

export default App;
