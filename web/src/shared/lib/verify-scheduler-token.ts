import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client();

export async function verifySchedulerToken(
  authHeader: string | null,
): Promise<boolean> {
  if (!authHeader?.startsWith("Bearer ")) {
    return false;
  }

  const projectId = process.env.GCP_PROJECT_ID;
  if (!projectId) {
    return false;
  }

  const schedulerEmail = `api-scheduler@${projectId}.iam.gserviceaccount.com`;
  const token = authHeader.slice(7);

  try {
    const ticket = await client.verifyIdToken({ idToken: token });
    const payload = ticket.getPayload();
    return payload?.email === schedulerEmail && payload?.email_verified === true;
  } catch {
    return false;
  }
}
