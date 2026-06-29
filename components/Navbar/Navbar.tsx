import { getSession } from '@/lib/auth-utils';
import ClientNavbar from './ClientNav';

export async function Navbar() {
  const session = await getSession();

  return <ClientNavbar initialSession={session} />;
}
