import { ReactNode } from "react";
import { Paper, Title, Text } from "@mantine/core";
import classes from "./auth.module.css";
import SocialSignIn from "@/components/Auth/SocialSignIn";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className={classes.wrapper}>
      <Paper className={classes.form} radius={0} p={30}>
        <Title order={2} className={classes.title} ta="center" mt="md" mb={50}>
          Welcome to Intui !
        </Title>
        
        {children} {/* Login or Signup Form will be injected here */}
        
        <SocialSignIn /> 
        
       
      </Paper>
    </div>
  );
}
