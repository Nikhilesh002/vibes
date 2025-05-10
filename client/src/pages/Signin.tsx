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
    <div className="h-screen pb-20 flex justify-center items-center">
      <Card className="w-[450px] shadow-xs shadow-gray-400">
        <CardHeader>
          <CardTitle>Signin</CardTitle>
          <CardDescription>Welcome back!!</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="identifier">Enter Username or Email</Label>
                <Input
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  id="identifier"
                  placeholder="Enter your Username or Email"
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
              to={"/signup"}
              className="text-sm underline text-blue-400 hover:text-blue-500"
            >
              Dont have an account?
            </Link>
            <Button type="submit">Signin</Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default Signin;
