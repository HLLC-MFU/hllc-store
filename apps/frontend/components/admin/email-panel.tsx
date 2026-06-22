"use client";

import Image from "next/image";
import { Mail, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { EmailInput } from "@/components/shared/email-input";

type EmailFormState = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

type Props = {
  lang: "th" | "en";
  emailForm: EmailFormState;
  setEmailForm: React.Dispatch<React.SetStateAction<EmailFormState>>;
  emailSending: boolean;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
};

export function EmailPanel({ lang, emailForm, setEmailForm, emailSending, onSubmit }: Props) {
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(360px,0.7fr)]">
      <Card className="rounded-2xl border-gray-100 shadow-xs">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-black text-gray-900">Email Mockup</h2>
              <p className="mt-1 text-xs font-semibold text-gray-400">Send a Gmail test message from the admin panel.</p>
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
              <Mail className="h-5 w-5" />
            </div>
          </div>

          <form className="mt-5 flex flex-col gap-3" onSubmit={onSubmit}>
            <label className="grid gap-1.5">
              <span className="text-xs font-black text-gray-700">To</span>
              <EmailInput
                value={emailForm.to}
                onChange={(val) => setEmailForm((f) => ({ ...f, to: val }))}
                lang={lang}
                placeholder="customer@example.com"
                className="h-11 rounded-xl text-xs"
              />
            </label>
            <label className="grid gap-1.5">
              <span className="text-xs font-black text-gray-700">Subject</span>
              <Input
                required
                value={emailForm.subject}
                onChange={(e) => setEmailForm((f) => ({ ...f, subject: e.target.value }))}
                placeholder="Subject"
                className="h-11 rounded-xl text-xs"
              />
            </label>
            <label className="grid gap-1.5">
              <span className="text-xs font-black text-gray-700">Plain Text</span>
              <textarea
                value={emailForm.text}
                onChange={(e) => setEmailForm((f) => ({ ...f, text: e.target.value }))}
                placeholder="Email text"
                rows={5}
                className="min-h-28 rounded-xl border border-gray-200 bg-white px-3 py-3 text-xs font-semibold text-gray-700 outline-none transition-colors placeholder:text-gray-300 focus:border-brand"
              />
            </label>
            <label className="grid gap-1.5">
              <span className="text-xs font-black text-gray-700">HTML Optional</span>
              <textarea
                value={emailForm.html}
                onChange={(e) => setEmailForm((f) => ({ ...f, html: e.target.value }))}
                placeholder="<p>Email html</p>"
                rows={5}
                className="min-h-28 rounded-xl border border-gray-200 bg-white px-3 py-3 font-mono text-xs text-gray-700 outline-none transition-colors placeholder:text-gray-300 focus:border-brand"
              />
            </label>
            <Button disabled={emailSending} className="mt-2 h-11 rounded-xl bg-brand font-black hover:bg-brand-hover">
              <Send className="h-4 w-4" />
              {emailSending ? "Sending..." : "Send Test Email"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-gray-100 shadow-xs">
        <CardContent className="p-4">
          <h2 className="text-sm font-black text-gray-900">Preview</h2>
          <div className="mt-4 overflow-hidden rounded-2xl border border-gray-100 bg-white">
            <div className="border-b border-gray-100 bg-gray-50 px-4 py-3">
              <p className="truncate text-xs font-black text-gray-900">{emailForm.subject || "No subject"}</p>
              <p className="mt-1 truncate text-[10px] font-bold text-gray-400">To: {emailForm.to || "customer@example.com"}</p>
            </div>
            <div className="min-h-72 px-4 py-5">
              <div className="mx-auto max-w-sm rounded-2xl border border-gray-100">
                <div className="border-b border-gray-100 px-4 py-4">
                  <Image src="/images/HLLCLOGO.png" alt="HLLC" width={180} height={48} className="h-12 w-auto object-contain" priority />
                </div>
                <div className="px-4 py-5">
                  {emailForm.html.trim() ? (
                    <iframe
                      srcDoc={emailForm.html}
                      sandbox=""
                      className="w-full min-h-48 border-0"
                      title="Email preview"
                    />
                  ) : (
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
                      {emailForm.text || "Email body preview"}
                    </p>
                  )}
                </div>
                <div className="border-t border-gray-100 bg-gray-50 px-4 py-3">
                  <p className="text-[10px] font-bold text-gray-400">HLLC Store automated email mockup</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
