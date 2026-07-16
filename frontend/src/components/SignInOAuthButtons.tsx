import { Button } from "./ui/button";

const SignInOAuthButtons = () => {
  return (
    <Button 
      variant="secondary" 
      className="w-auto text-white border-zinc-200 h-9 sm:h-10 px-4 text-sm font-medium"
      disabled
    >
      Sign In
    </Button>
  );
};

export default SignInOAuthButtons;