import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

function Home() {
  return (
    <div className="w-full h-screen flex flex-col justify-center items-center space-y-2">
      <h1 className="text-xl font-medium">
        Welcome to Vidmux.
      </h1>
      <Button>
        <Link to={"/video-upload"}>
          Upload <ArrowRight className="inline ms-1" />
        </Link>
      </Button>
    </div>
  );
}

export default Home;
