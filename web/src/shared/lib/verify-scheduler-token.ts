import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client();

/**
 * Cloud Scheduler から届いた OIDC トークンを確かめる
 *
 * - 署名と有効期限(verifyIdToken)
 * - 宛先(audience)が SCHEDULER_OIDC_AUDIENCE と一致すること
 *   (同じサービスアカウントが別の宛先向けに発行したトークンを使い回されないようにする)
 * - 発行元が Cloud Scheduler 用のサービスアカウントであること
 */
export async function verifySchedulerToken(
  authHeader: string | null,
): Promise<boolean> {
  if (!authHeader?.startsWith("Bearer ")) {
    return false;
  }

  const projectId = process.env.GCP_PROJECT_ID;
  const audience = process.env.SCHEDULER_OIDC_AUDIENCE;
  if (!projectId || !audience) {
    return false;
  }

  const schedulerEmail = `api-scheduler@${projectId}.iam.gserviceaccount.com`;
  const token = authHeader.slice(7);

  try {
    const ticket = await client.verifyIdToken({ idToken: token, audience });
    const payload = ticket.getPayload();
    return payload?.email === schedulerEmail && payload?.email_verified === true;
  } catch {
    return false;
  }
}
