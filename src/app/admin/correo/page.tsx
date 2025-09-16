"use client";

import MainLayout from "@/components/layouts/MainLayout";
import { ManagerHeader } from "@/components/challenge-templates/ManagerHeader";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useEffect, useRef, useState } from "react";
import { mailerApi } from "@/api/mailer";
import { toast } from "sonner";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { apiBaseUrl } from "@/config";
import { useSession } from "next-auth/react";

const schema = z.object({
  to: z.string().email("Invalid email"),
  title: z.string().optional(),
  subject: z.string().min(1, "Subject is required"),
  body: z.string().min(1, "Message is required").max(1000, "Maximum 1000 characters"),
});

type FormValues = z.infer<typeof schema>;

// Helper para headers
const buildHeaders = (token?: string): HeadersInit =>
  token ? { Authorization: `Bearer ${token}` } : {};

const API_BASE = apiBaseUrl.replace(/\/$/, "");

export default function CorreoPage() {
  const [loading, setLoading] = useState(false);

  // Sesión para obtener el access token
  const { data: session } = useSession();
  const accessToken = (session?.accessToken as string | undefined) || undefined;

  // User search state
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [openList, setOpenList] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const message = watch("body") || "";

  // Debounced users search (consulta directa al backend Nest con token)
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      return;
    }
    const id = setTimeout(async () => {
      try {
        const url = `${API_BASE}/users?page=1&limit=5&search=${encodeURIComponent(trimmed)}`;
        const res = await fetch(url, {
          headers: {
            Accept: "application/json",
            ...buildHeaders(accessToken),
          },
          credentials: "include",
        });
        if (!res.ok) {
          setResults([]);
          return;
        }
        const json: any = await res.json();
        let items: any[] = [];
        if (Array.isArray(json)) items = json;
        else if (Array.isArray(json?.data)) items = json.data;
        else if (Array.isArray(json?.data?.data)) items = json.data.data;
        else if (Array.isArray(json?.items)) items = json.items;
        else if (Array.isArray(json?.data?.items)) items = json.data.items;
        setResults(items);
      } catch {
        setResults([]);
      }
    }, 300);
    return () => clearTimeout(id);
  }, [query, accessToken]);

  // Close results when clicking outside
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!searchContainerRef.current) return;
      if (!searchContainerRef.current.contains(e.target as Node)) {
        setOpenList(false);
      }
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  const onSelectUser = (u: any) => {
    setValue("to", u.email ?? "");
    setQuery(`${u.username ?? u.email ?? ""}`);
    setOpenList(false);
  };

  const onSubmit = async (values: FormValues) => {
    try {
      setLoading(true);
      await mailerApi.sendAdmin({ 
        to: values.to, 
        subject: values.subject, 
        title: values.title,
        body: values.body 
      });
      toast.success("Email sent with company styling");
      reset();
      setQuery("");
      setResults([]);
    } catch (e: any) {
      toast.error(e?.message || "Could not send the email");
    } finally {
      setLoading(false);
    }
  };

  const hasResults = openList && results.length > 0;

  return (
    <MainLayout>
      <div className="p-6 space-y-6 pt-4">
  <ManagerHeader title="Email" description="Manual email sending for support or communications" />

        <div className="w-full max-w-7xl mx-auto">
          <Card className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <CardContent className="pt-6 space-y-5">
              {/* Search user */}
              <div className="space-y-2" ref={searchContainerRef}>
                <Label htmlFor="searchUser">Search user by name or email</Label>
                <div className="relative">
                  <Input
                    id="searchUser"
                    placeholder="Type the user's name, email, or username..."
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setOpenList(true);
                    }}
                    onFocus={() => setOpenList(true)}
                    autoComplete="off"
                  />
                  {hasResults && (
                    <div className="absolute z-20 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md max-h-60 overflow-auto">
                      {results.map((u) => (
                        <button
                          type="button"
                          key={String((u as any).userID ?? (u as any).id ?? (u as any).email ?? Math.random())}
                          onClick={() => onSelectUser(u)}
                          className="w-full text-left px-3 py-2 hover:bg-accent hover:text-accent-foreground text-sm"
                        >
                          <div className="font-medium">{(u as any).username || (u as any).email}</div>
                          <div className="text-muted-foreground text-xs">{(u as any).email}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Recipient email */}
              <div className="space-y-2">
                <Label htmlFor="to">Recipient Email Address</Label>
                <Input id="to" placeholder="user@example.com" {...register("to")} />
                {errors.to && <p className="text-sm text-destructive">{errors.to.message}</p>}
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" placeholder="Enter the email title..." {...register("title")} />
              </div>

              {/* Subject */}
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input id="subject" placeholder="Enter the email subject..." {...register("subject")} />
                {errors.subject && <p className="text-sm text-destructive">{errors.subject.message}</p>}
              </div>

              {/* Message */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="body">Message</Label>
                  <span className="text-xs text-muted-foreground">{message.length}/1000 characters</span>
                </div>
                <Textarea id="body" rows={10} maxLength={1000} placeholder="Type your message here..." {...register("body")} />
                {errors.body && <p className="text-sm text-destructive">{errors.body.message}</p>}
              </div>
            </CardContent>
            <CardFooter className="flex gap-3 justify-end">
              <Button type="submit" onClick={handleSubmit(onSubmit)} disabled={loading}>
                {loading ? "Sending..." : "Send Email"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  reset({ to: "", title: "", subject: "", body: "" });
                  setQuery("");
                  setResults([]);
                  setOpenList(false);
                }}
                disabled={loading}
              >
                Clear
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}