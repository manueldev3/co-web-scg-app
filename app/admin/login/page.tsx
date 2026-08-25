"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Alert, Card } from "antd";
import { LockOutlined, MailOutlined } from "@ant-design/icons";
import { useAuth } from "@/lib/firebase/auth-context";

export default function AdminLoginPage() {
  const { user, loading, signIn, isAdmin } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // If already logged in as admin, redirect to admin dashboard
  useEffect(() => {
    if (!loading && user && isAdmin) {
      router.replace("/admin");
    }
  }, [user, loading, isAdmin, router]);

  const handleSubmit = async () => {
    setError(null);
    if (!email || !password) {
      setError("Ingresa tu correo y contraseña.");
      return;
    }

    setSubmitting(true);
    try {
      await signIn(email, password);
      // Auth state change will trigger the useEffect redirect
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Error al iniciar sesión.";
      if (message.includes("invalid-credential") || message.includes("wrong-password")) {
        setError("Correo o contraseña incorrectos.");
      } else if (message.includes("user-not-found")) {
        setError("No existe una cuenta con este correo.");
      } else if (message.includes("too-many-requests")) {
        setError("Demasiados intentos. Espera unos minutos.");
      } else {
        setError("Error al iniciar sesión. Intenta de nuevo.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#040d16]" />
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#040d16] px-4">
      <Card
        className="w-full max-w-sm"
        title={
          <div className="text-center">
            <h1 className="text-xl font-bold text-[#9ED0FA]">
              Panel de Administración
            </h1>
            <p className="text-sm text-gray-400 mt-1">SCG - Star Citizen Guide</p>
          </div>
        }
      >
        <div className="space-y-4">
          {error && (
            <Alert type="error" message={error} showIcon closable onClose={() => setError(null)} />
          )}

          <div>
            <label className="block text-sm text-gray-300 mb-1">Correo electrónico</label>
            <Input
              prefix={<MailOutlined className="text-gray-400" />}
              type="email"
              placeholder="admin@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onPressEnter={handleSubmit}
              size="large"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Contraseña</label>
            <Input.Password
              prefix={<LockOutlined className="text-gray-400" />}
              placeholder="Tu contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onPressEnter={handleSubmit}
              size="large"
            />
          </div>

          <Button
            type="primary"
            block
            size="large"
            loading={submitting}
            onClick={handleSubmit}
          >
            Iniciar sesión
          </Button>
        </div>
      </Card>
    </div>
  );
}
