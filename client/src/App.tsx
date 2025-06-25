import { Toaster } from "react-hot-toast";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Signin from "./pages/Signin";
import Signup from "./pages/Signup";
import Providers from "./lib/providers";
import NavBar from "./components/custom/NavBar";
import Home from "./pages/Home";
import NotFound from "./pages/Not-Found";
import VideoUpload from "./pages/VideoUpload";
import Videos from "./pages/Videos";

function App() {
  return (
    <div className="text-black bg-white dark:text-white dark:bg-black">
      <Providers>
      <Toaster position="bottom-right" toastOptions={{ duration: 2000 }} />
      <BrowserRouter>
        <NavBar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/signin" element={<Signin />} />
          <Route path="/signup" element={<Signup />} />

          <Route path="/videos" element={<Videos />} />
          <Route path="/video-upload" element={<VideoUpload />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </Providers>
    </div>
  );
}

export default App;
