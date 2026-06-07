import {useSignIn} from "@clerk/clerk-react";
import { Button } from "./ui/button";
const SignInOAuthButtons = () => {
    const {signIn,isLoaded}= useSignIn()
    if(!isLoaded){
        return null
    }
    const signInWithGoogle = () => {
        signIn.authenticateWithRedirect({
            strategy: "oauth_google",
            redirectUrl: "/sso-callback",
            redirectUrlComplete: "/auth-callback"
        });
    }
    return <Button onClick={signInWithGoogle} variant={"secondary"} className="w-auto text-white border-zinc-200 h-9 sm:h-10 px-4 text-sm font-medium">
        Continue with Google
    </Button>
}
export default SignInOAuthButtons;