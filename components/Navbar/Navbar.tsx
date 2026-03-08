'use client';

// Navbar is now a client component that simply forwards to ClientNav.  removing
// the server-side session fetch stops the navigation-related reloads.

import ClientNavbar from './ClientNav';

export default function Navbar() {
  return <ClientNavbar />;
}