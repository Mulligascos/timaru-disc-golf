import { AuthForm } from "@/components/auth/auth-form";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string; error?: string }>;
}) {
  const { redirectTo, error } = await searchParams;

  return <AuthForm mode="signup" />;
}
