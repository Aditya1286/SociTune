import { Button } from "./ui/button";
import toast from "react-hot-toast";

const SignInOAuthButtons = () => {
  const signInWithGoogle = () => {
    toast.error("Google OAuth is disabled in this custom auth system. Please register/login using email and password.", {
      duration: 5000,
    });
  };

  return (
    <Button onClick={signInWithGoogle} variant="secondary" className="w-auto text-white border-zinc-200 h-9 sm:h-10 px-4 text-sm font-medium">
      Continue with Google
    </Button>
  );
};

export default SignInOAuthButtons;