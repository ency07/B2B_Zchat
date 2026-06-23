"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowRight, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { getTenantConfig } from "@/utils/tenant";

const loginSchema = z.object({
  email: z.string().email("Correo electrónico no válido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

type LoginFields = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tenantParam = searchParams.get("tenant");
  const config = getTenantConfig(tenantParam);

  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFields>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (data: LoginFields) => {
    setIsLoading(true);
    // Simulate API sign-in and session redirection
    setTimeout(() => {
      setIsLoading(false);
      router.push(`/dashboard${tenantParam ? `?tenant=${tenantParam}` : ""}`);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Email Field */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
            Correo Electrónico
          </label>
          <div className="relative flex items-center">
            <Mail className="absolute left-3 w-4 h-4 text-muted-foreground shrink-0" />
            <input
              type="email"
              {...register("email")}
              placeholder="nombre@empresa.com"
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary focus:border-primary transition-all"
            />
          </div>
          {errors.email && (
            <p className="text-xs text-destructive mt-0.5">{errors.email.message}</p>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Contraseña
            </label>
            <Link
              href={`/recovery${tenantParam ? `?tenant=${tenantParam}` : ""}`}
              className="text-xs text-primary hover:underline font-medium"
            >
              ¿La olvidaste?
            </Link>
          </div>
          <div className="relative flex items-center">
            <Lock className="absolute left-3 w-4 h-4 text-muted-foreground shrink-0" />
            <input
              type={showPassword ? "text" : "password"}
              {...register("password")}
              placeholder="••••••••"
              className="w-full pl-10 pr-10 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary focus:border-primary transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-destructive mt-0.5">{errors.password.message}</p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 active:scale-98 transition-all cursor-pointer disabled:opacity-50"
        >
          {isLoading ? (
            <span className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              Iniciar Sesión <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Tenant Switcher Section for Walkthrough & Verification */}
      <div className="pt-4 border-t border-border space-y-2">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block text-center">
          Demostración White Label (Temas Dinámicos)
        </span>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => router.push("/login?tenant=acme")}
            className="px-2 py-1.5 rounded-md text-[10px] font-semibold border border-sky-500/20 bg-sky-500/5 hover:bg-sky-500/10 text-sky-400 text-center cursor-pointer transition-all"
          >
            VentiTech (Celeste)
          </button>
          <button
            onClick={() => router.push("/login?tenant=apex")}
            className="px-2 py-1.5 rounded-md text-[10px] font-semibold border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-500 text-center cursor-pointer transition-all"
          >
            Apex Log. (Verde)
          </button>
          <button
            onClick={() => router.push("/login")}
            className="px-2 py-1.5 rounded-md text-[10px] font-semibold border border-border bg-secondary hover:bg-accent text-foreground text-center cursor-pointer transition-all"
          >
            Default ERP
          </button>
        </div>
      </div>
    </div>
  );
}
