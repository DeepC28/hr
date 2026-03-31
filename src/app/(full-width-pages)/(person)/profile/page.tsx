// src/app/(full-width-pages)/(person)/profile/page.tsx
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import ProfileClient from "./ProfileClient";
import { getAuthSession } from "@/lib/authUser";

export default async function ProfilePage() {
  const session = await getAuthSession();

  if (!session) {
    redirect("/signin");
  }

  const anySession = session as any;
  const user = anySession.user || {};

  const loginEmail = (session?.user as any)?.email ?? null;
  const loginUsername = (session?.user as any)?.name ?? null;

  return <ProfileClient loginEmail={loginEmail} loginUsername={loginUsername} />;
}
