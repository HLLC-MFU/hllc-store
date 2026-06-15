import { charmSettingsRouter } from "@/lib/backend/settings/settings-router";

export const dynamic = "force-dynamic";

export async function GET() {
  return charmSettingsRouter.GET();
}
