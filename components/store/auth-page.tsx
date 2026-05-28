"use client";

import * as React from "react";
import { LogIn, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type AuthMode = "login" | "register";

async function submitAuth(mode: AuthMode, formData: FormData) {
  const payload =
    mode === "login"
      ? {
          email: formData.get("email"),
          password: formData.get("password"),
        }
      : {
          name: formData.get("name"),
          email: formData.get("email"),
          password: formData.get("password"),
          confirmPassword: formData.get("confirmPassword"),
        };

  const response = await fetch(`/api/backend/auth/${mode}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const result = (await response.json().catch(() => ({}))) as {
    error?: string;
    message?: string;
  };

  if (!response.ok) {
    throw new Error(result.error ?? `${mode} failed`);
  }

  return result.message ?? `${mode} success`;
}

export function AuthPage() {
  const [message, setMessage] = React.useState("");
  const [loading, setLoading] = React.useState<AuthMode | null>(null);

  async function handleSubmit(mode: AuthMode, formData: FormData) {
    setMessage("");
    setLoading(mode);

    try {
      const result = await submitAuth(mode, formData);
      setMessage(result);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Request failed");
    } finally {
      setLoading(null);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-8">
      <section className="grid w-full max-w-5xl gap-8 lg:grid-cols-[1fr_420px] lg:items-center">
        <div className="max-w-xl">
          <p className="text-sm font-medium text-zinc-500">HLLC Store</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-normal text-zinc-950">
            Sign in to manage your orders
          </h1>
          <p className="mt-4 text-base leading-7 text-zinc-600">
            Login or create an account before shopping, sending payment slips,
            and checking order status.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>
              Requests are sent to the backend auth endpoints.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">
                  <LogIn className="mr-2 size-4" />
                  Login
                </TabsTrigger>
                <TabsTrigger value="register">
                  <UserPlus className="mr-2 size-4" />
                  Register
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form
                  action={(formData) => void handleSubmit("login", formData)}
                  className="grid gap-4"
                >
                  <Field label="Email" name="email" type="email" />
                  <Field label="Password" name="password" type="password" />
                  <Button disabled={loading !== null} type="submit">
                    <LogIn className="size-4" />
                    {loading === "login" ? "Signing in..." : "Login"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form
                  action={(formData) => void handleSubmit("register", formData)}
                  className="grid gap-4"
                >
                  <Field label="Name" name="name" />
                  <Field label="Email" name="email" type="email" />
                  <Field label="Password" name="password" type="password" />
                  <Field
                    label="Confirm password"
                    name="confirmPassword"
                    type="password"
                  />
                  <Button disabled={loading !== null} type="submit">
                    <UserPlus className="size-4" />
                    {loading === "register" ? "Creating..." : "Register"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            {message ? (
              <div className="mt-4 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
                {message}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

function Field({
  label,
  name,
  type = "text",
}: {
  label: string;
  name: string;
  type?: string;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} required type={type} />
    </div>
  );
}
