import { ReactNode } from 'react';
import classes from './auth.module.css';
import SocialSignIn from '@/components/Auth/SocialSignIn';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className={classes.wrapper}>
      <div className={classes.form}>
        <h1 className={classes.title}>Welcome back</h1>
        <p className={classes.subtitle}>Sign in to continue practicing</p>

        <SocialSignIn />

        <div className={classes.divider}>or</div>

        {children}
      </div>
    </div>
  );
}

