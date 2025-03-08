"use client";
import { Button } from "@mantine/core";
import { authClient } from "@/lib/auth-client";

export default function SocialSignIn() {
  async function onSignInSocial(provider: "github" | "google" | "facebook") {
    try {
      const { data, error } = await authClient.signIn.social({
        provider,
        callbackURL: "/",
      });

      if (error) throw error;
      console.log(data);
    } catch (err: any) {
      alert(err.message);
    }
  }

  return (
    <>
      <Button 
        fullWidth 
        mt="md" 
        size="md" 
        variant="outline" 
        onClick={() => onSignInSocial("github")}
      >
        Sign in with GitHub
      </Button>
      
      <Button 
        fullWidth 
        mt="md" 
        size="md" 
        variant="outline" 
        onClick={() => onSignInSocial("google")}
      >
        Sign in with Google
      </Button>
    </>
  );
}
