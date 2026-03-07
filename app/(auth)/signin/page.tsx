import classes from '../auth.module.css';

export default function LoginPage() {
  return (
    <div className={classes.switchRow}>
      <span>Don&apos;t have an account?</span>
      <a href="/signup" className={classes.switchLink}>Sign up</a>
    </div>
  );
}

