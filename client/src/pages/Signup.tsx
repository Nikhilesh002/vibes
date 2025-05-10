import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
    <div className="h-screen pb-20 flex justify-center items-center">
      <Card className="w-[450px] shadow-xs shadow-gray-400">
        <CardHeader>
          <CardTitle>Signup</CardTitle>
          <CardDescription>Welcome back!!</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="username">Username</Label>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  id="username"
                  placeholder="Enter your username"
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="username">Email</Label>
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  id="Email"
                  placeholder="Enter your Email"
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  id="password"
                  placeholder="Enter your password"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between mt-5">
            <Link
              to={"/signin"}
              className="text-sm underline text-blue-400 hover:text-blue-500"
            >
              Already have an account?
            </Link>

            <Button type="submit">Signup</Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default Signup;
