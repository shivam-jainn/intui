import classes from '../auth.module.css';

export default function Page() {
  return (
    <div className={classes.switchRow}>
      <span>Already have an account?</span>
      <a href="/signin" className={classes.switchLink}>Log in</a>
    </div>
  );
}

