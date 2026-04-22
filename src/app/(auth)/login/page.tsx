import { AuthForm } from "@/components/auth/auth-form";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { redirectTo?: string; error?: string };
}) {
  return (
    <AuthForm
      mode="login"
      redirectTo={searchParams.redirectTo}
      error={searchParams.error}
    />
  );
}
