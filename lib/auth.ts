import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { prisma } from '@/prisma/db';

const AUTH_ENABLED = process.env.AUTH_ENABLED !== 'false';

export const auth = AUTH_ENABLED
  ? betterAuth({
      database: prismaAdapter(prisma, {
        provider: 'postgresql',
      }),
      advanced: {
        useSecureCookies: true,
      },
      emailAndPassword: {
        enabled: true,
      },
      socialProviders: {
        github: {
          clientId: process.env.GITHUB_CLIENT_ID as string,
          clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
        },
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID as string,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        },
      },
    })
  : ({
      // minimal stub that satisfies server-side usage when auth is disabled
      api: {
        getSession: async () => null,
      },
    } as any);
