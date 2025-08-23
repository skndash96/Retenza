import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import { db } from "../server/db";
import { sessions, businesses, customers } from "../server/db/schema";
import { eq, and } from "drizzle-orm";

const SESSION_COOKIE_NAME = "session_id";
const SESSION_TTL_HOURS = 24;

export async function createSession(userId: number, role: "user" | "business") {
  const sessionId = randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_TTL_HOURS * 60 * 60 * 1000);

  await db.insert(sessions).values({
    id: sessionId,
    userId,
    role,
    expiresAt,
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_HOURS * 60 * 60,
  });

  return sessionId;
}


export async function getUserFromSession() {
  const cookieStore = await cookies();

  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionId) return null;

  const [session] = await db
    .select()
    .from(sessions)
    .where(
      and(
        eq(sessions.id, sessionId),
        eq(sessions.role, "business")
      )
    );

  if (!session || new Date(session.expiresAt) < new Date()) return null;

  const [businessRecord] = await db
    .select()
    .from(businesses)
    .where(eq(businesses.id, session.userId));

  return businessRecord || null;
}

export async function getCustomerFromSession() {
  const cookieStore = await cookies();

  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionId) return null;

  const [session] = await db
    .select()
    .from(sessions)
    .where(
      and(
        eq(sessions.id, sessionId),
        eq(sessions.role, "user")
      )
    );

  if (!session || new Date(session.expiresAt) < new Date()) return null;

  const [customerRecord] = await db
    .select()
    .from(customers)
    .where(eq(customers.id, session.userId));

  return customerRecord || null;
}

export async function destroySession() {
  const cookieStore = await cookies();

  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionId) return;

  await db.delete(sessions).where(eq(sessions.id, sessionId));

  cookieStore.set(SESSION_COOKIE_NAME, "", {
    maxAge: 0,
  });
}

export async function getSession() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionId) return null;

  const [session] = await db
    .select()
    .from(sessions)
    .where(eq(sessions.id, sessionId));

  if (!session || new Date(session.expiresAt) < new Date()) return null;

  return {
    userId: session.userId,
    role: session.role,
    sessionId: session.id
  };
}
