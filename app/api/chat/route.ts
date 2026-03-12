import { NextRequest } from "next/server";
import { POST as aiChatPOST, runtime } from "../ai/chat/route";

export { runtime };

export async function POST(req: NextRequest) {
  return aiChatPOST(req);
}
