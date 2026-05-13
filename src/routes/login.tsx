import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Stethoscope, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

const PASSWORD_MIN_LENGTH = 6;

function translateAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("password should be at least")) {
    return `A senha deve ter pelo menos ${PASSWORD_MIN_LENGTH} caracteres.`;
  }
  if (m.includes("password is too weak") || m.includes("weak password")) {
    return "Senha muito fraca. Use uma combinação mais forte de caracteres.";
  }
  if (m.includes("password") && m.includes("pwned")) {
    return "Esta senha foi encontrada em vazamentos de dados. Escolha outra senha.";
  }
  if (m.includes("invalid login credentials")) {
    return "Email ou senha inválidos.";
  }
  if (m.includes("email not confirmed")) {
    return "Email ainda não confirmado. Verifique sua caixa de entrada.";
  }
  if (m.includes("user already registered")) {
    return "Este email já está cadastrado. Faça login.";
  }
  if (m.includes("invalid email")) {
    return "Email inválido.";
  }
  if (m.includes("rate limit") || m.includes("too many requests")) {
    return "Muitas tentativas. Aguarde alguns instantes e tente novamente.";
  }
  if (m.includes("network") || m.includes("failed to fetch")) {
    return "Erro de conexão. Verifique sua internet e tente novamente.";
  }
  return message;
}

function LoginPage() {
  const { signIn, signUp, session, loading } = useAuth();
  const navigate = useNavigate();
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && session) navigate({ to: "/" });
  }, [session, loading, navigate]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = mode === "signin" ? await signIn(email, password) : await signUp(email, password);
    setSubmitting(false);
    if (error) {
      toast.error(translateAuthError(error));
      return;
    }
    if (mode === "signup") {
      toast.success("Conta criada! Verifique seu email se necessário.");
    } else {
      toast.success("Bem-vindo!");
    }
    router.invalidate();
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-6 justify-center">
          <div className="size-11 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
            <Stethoscope className="size-6" />
          </div>
          <div>
            <p className="text-lg font-semibold leading-tight text-foreground">DenteCare</p>
            <p className="text-xs text-muted-foreground leading-tight">Central de Atendimento IA</p>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h1 className="text-xl font-semibold text-foreground">
            {mode === "signin" ? "Entrar" : "Criar conta"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === "signin" ? "Acesse o dashboard de conversas" : "Cadastre-se para acessar o dashboard"}
          </p>
          <form onSubmit={onSubmit} className="space-y-4 mt-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={PASSWORD_MIN_LENGTH}
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
              />
              {mode === "signup" && (
                <p className="text-xs text-muted-foreground leading-relaxed">
                  A senha deve ter no mínimo {PASSWORD_MIN_LENGTH} caracteres. Para mais
                  segurança, use uma combinação de letras maiúsculas e minúsculas, números
                  e símbolos (ex.: <span className="font-mono">! @ # $ %</span>).
                </p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting && <Loader2 className="size-4 animate-spin" />}
              {mode === "signin" ? "Entrar" : "Criar conta"}
            </Button>
          </form>
          <button
            type="button"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="mt-4 text-sm text-muted-foreground hover:text-foreground w-full text-center"
          >
            {mode === "signin" ? "Não tem conta? Criar conta" : "Já tem conta? Entrar"}
          </button>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-4">
          <Link to="/" className="hover:underline">Voltar</Link>
        </p>
      </div>
    </div>
  );
}
