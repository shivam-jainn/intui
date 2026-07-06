import { handleLoginActivity } from './lib/badges';
import { prisma } from './prisma/db';

async function test() {
  try {
    const user = await prisma.user.findFirst();
    if (!user) {
      console.log("No user found in DB");
      return;
    }
    console.log(`Running login activity for user ${user.id} (${user.name})...`);
    await handleLoginActivity(user.id);
    console.log("Success!");

    const badges = await prisma.userBadge.findMany({ where: { userId: user.id } });
    console.log("Badges:", badges);
  } catch (error) {
    console.error("Error:", error);
  }
}

test().catch(console.error).finally(() => process.exit(0));
