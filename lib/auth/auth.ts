import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { prisma } from '@/prisma/db';

const AUTH_ENABLED = process.env.AUTH_ENABLED !== 'false';

if (!AUTH_ENABLED) {
  // ensure we don't create lots of users on repeated imports; keep one id per
  // process. Allow overriding via DEV_USER_ID for reproducible dev sessions.
}

const auth = AUTH_ENABLED
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
    : ((): any => {
      // Stable dev user id for local development. Hardcoded so no env config
      // is required. Change this value if you want a different dev account.
      const DEV_USER_ID = 'dev-local-user';

      let devInit: Promise<void> | null = null;

      const ensureDevUser = async () => {
        if (devInit) return devInit;
        devInit = (async () => {
          try {
            await prisma.user.upsert({
              where: { id: DEV_USER_ID },
              update: { updatedAt: new Date() },
              create: {
                id: DEV_USER_ID,
                name: 'Dev User',
                email: `dev+${DEV_USER_ID}@example.local`,
                emailVerified: true,
                image: null,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            });
          } catch (e) {
            // ignore DB errors in dev stub
          }
        })();
        return devInit;
      };

      return {
        api: {
          getSession: async () => {
            await ensureDevUser();
            return { user: { id: DEV_USER_ID } };
          },
        },
      };
    })();

export { auth };
