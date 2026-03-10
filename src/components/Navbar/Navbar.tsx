import { auth } from '@/services/auth'; // Your auth instance
import { headers } from 'next/headers';
import ClientNavbar from './ClientNav';

export async function Navbar() {
  const headersList = headers();
  const session = await auth.api.getSession({
    headers: headersList
  });

  console.log(session)

  return <ClientNavbar initialSession={session} />;
}