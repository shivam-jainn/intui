import { redirect } from 'next/navigation';

export default async function P0Page() {
  redirect('/?tab=incidents');
}
