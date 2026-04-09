import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { axiosWithToken } from "@/lib/axiosWithToken";
import { login, logout } from "@/redux/slices/userSlice";
import { useState } from "react";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";

function Signup() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const res = await axiosWithToken.post(
        `${import.meta.env.VITE_API_URL}/user/signup`,
        { username, email, password }
      );

      if (res.status === 201) {
        toast.success(res.data.msg);
        dispatch(login({ user: { username, email }, error: "" }));
        navigate("/");
      } else {
        toast.error(res.data.msg);
        dispatch(logout());
      }
    } catch (error) {
      toast.error("Signup failed");
      console.error(error);
      dispatch(logout());
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Create an account</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Get started with Vibes today
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              id="username"
              placeholder="Choose a username"
              className="h-10"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              id="email"
              type="email"
              placeholder="Enter your email"
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
              placeholder="Create a password"
              className="h-10"
            />
          </div>

          <Button type="submit" className="h-10 w-full">
            Create account
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            to="/signin"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Signup;
