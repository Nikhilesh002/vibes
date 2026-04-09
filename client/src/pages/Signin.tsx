import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { axiosWithToken } from "@/lib/axiosWithToken";
import { login } from "@/redux/slices/userSlice";
import { useState } from "react";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";

function Signin() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const res = await axiosWithToken.post(
        `${import.meta.env.VITE_API_URL}/user/signin`,
        { identifier, password }
      );

      if (res.status === 200) {
        toast.success(res.data.msg);
        dispatch(
          login({
            user: {
              username: res.data.user.username,
              email: res.data.user.email,
            },
            error: "",
          })
        );
        navigate("/");
      } else {
        toast.error(res.data.msg);
      }
    } catch (error) {
      console.error(error);
      toast.error("Signin failed");
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Sign in to your account to continue
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="identifier">Username or Email</Label>
            <Input
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              id="identifier"
              placeholder="Enter your username or email"
              className="h-10"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              id="password"
              placeholder="Enter your password"
              className="h-10"
            />
          </div>

          <Button type="submit" className="h-10 w-full">
            Sign in
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link
            to="/signup"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Signin;
