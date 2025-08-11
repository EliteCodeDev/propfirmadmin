"use client";

import { useState } from "react";
import Link from "next/link";
import { toast, Toaster } from "sonner";
import { forgotPassword } from "@/api/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await forgotPassword(email);
      toast.success("Se ha enviado un correo para restablecer tu contraseña");
      setEmail("");
    } catch (error) {
      console.error("Forgot password error:", error);
      toast.error("No se pudo enviar el correo. ¿El email es correcto?");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Toaster position="top-right" richColors />
      <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">
              Restablecer contraseña
            </CardTitle>
            <CardDescription>
              Ingresa tu email y te enviaremos un enlace para que puedas
              recuperar tu cuenta.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="tu@email.com"
                />
              </div>
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? "Enviando enlace…" : "Enviar enlace"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="text-sm text-center block">
            <p>
              ¿Recordaste tu contraseña?{" "}
              <Link href="/login" className="text-blue-600 hover:underline">
                Inicia sesión
              </Link>
            </p>
          </CardFooter>
        </Card>
      </main>
    </>
  );
}
