import { Stethoscope, Moon, Sun, LogOut, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";

export function DashboardHeader() {
  const { theme, toggle } = useTheme();
  const { signOut, user } = useAuth();
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur-xl">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
            <Stethoscope className="size-5" />
          </div>
          <div>
            <p className="text-base font-semibold leading-tight text-foreground">DenteCare</p>
            <p className="text-xs text-muted-foreground leading-tight">Central de Atendimento IA</p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <div
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${
              online
                ? "bg-[color:var(--success)]/15 text-[color:var(--success)]"
                : "bg-destructive/15 text-destructive"
            }`}
          >
            {online ? <Wifi className="size-3.5" /> : <WifiOff className="size-3.5" />}
            <span className="hidden sm:inline">{online ? "Online" : "Offline"}</span>
          </div>
          <Button variant="ghost" size="icon" onClick={toggle} aria-label="Alternar tema">
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </Button>
          <span className="hidden md:inline text-sm text-muted-foreground truncate max-w-[180px]">
            {user?.email}
          </span>
          <Button variant="ghost" size="icon" onClick={signOut} aria-label="Sair">
            <LogOut className="size-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}