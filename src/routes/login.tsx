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
      toast.error(error);
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
                minLength={6}
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
              />
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
