import { ReactNode } from 'react';
import SocialSignIn from '@/components/Auth/SocialSignIn';
import classes from './auth.module.css';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className={classes.wrapper}>
      <div className={classes.form}>
        <h1 className={classes.title}>AUTHENTICATE</h1>
        <p className={classes.subtitle}>&gt; ESTABLISH CONNECTION</p>

        <SocialSignIn />

        <div className={classes.divider}>OR</div>

        {children}
      </div>
    </div>
  );
}
