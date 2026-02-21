import { headers } from 'next/headers';
import { auth } from '@/lib/auth'; // Your auth instance
import ClientNavbar from './ClientNav';

export async function Navbar() {
  const headersList = headers();
  const session = await auth.api.getSession({
    headers: headersList,
  });

  console.log(session);

  return <ClientNavbar initialSession={session} />;
}
