/* eslint-env node */
import { notarize } from "@electron/notarize";

export default async function notarizeHook(context) {
  const { electronPlatformName, appOutDir, packager } = context;
  if (electronPlatformName !== "darwin") return;

  // Skip if env not configured (unsigned/local builds)
  if (
    !process.env.APPLE_ID ||
    !process.env.APPLE_APP_SPECIFIC_PASSWORD ||
    !process.env.APPLE_TEAM_ID
  ) {
    console.log("Notarize: missing APPLE_* envs, skipping.");
    return;
  }

  const appName = packager.appInfo.productFilename;
  await notarize({
    appBundleId: packager.appInfo.appId,
    appPath: `${appOutDir}/${appName}.app`,
    appleId: process.env.APPLE_ID,
    appleIdPassword: process.env.APPLE_APP_SPECIFIC_PASSWORD,
    teamId: process.env.APPLE_TEAM_ID,
  });
  console.log("Notarize: success.");
}
