"use client";

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function MailIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

const CONTACT = {
  email: "activity@mfu.ac.th",
  emailUrl: "mailto:activity@mfu.ac.th",
  instagram: "@mfu_activities",
  instagramUrl: "https://www.instagram.com/mfu_activities/",
  facebook: "MFU Activities",
  facebookUrl: "https://www.facebook.com/mfuactivities",
};

export function ShopFooter() {
  return (
    <footer className="bg-brand">
      <div className="mx-auto max-w-sm px-6 pt-8 pb-28 flex flex-col items-center gap-5">

        <p className="text-[11px] font-black uppercase tracking-widest text-white/50">ติดต่อเรา</p>

        <div className="flex flex-col gap-3 w-fit mx-auto">

          <a href={`mailto:${CONTACT.email}`} className="flex items-center gap-3 group">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white group-hover:bg-white/20 transition-colors">
              <MailIcon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-white/50 uppercase tracking-wide leading-none mb-0.5">Email</p>
              <p className="text-sm font-bold text-white group-hover:text-white/80 transition-colors">{CONTACT.email}</p>
            </div>
          </a>

          <a href={CONTACT.instagramUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 group">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white group-hover:bg-white/20 transition-colors">
              <InstagramIcon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-white/50 uppercase tracking-wide leading-none mb-0.5">Instagram</p>
              <p className="text-sm font-bold text-white group-hover:text-white/80 transition-colors">{CONTACT.instagram}</p>
            </div>
          </a>

          <a href={CONTACT.facebookUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 group">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white group-hover:bg-white/20 transition-colors">
              <FacebookIcon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-white/50 uppercase tracking-wide leading-none mb-0.5">Facebook</p>
              <p className="text-sm font-bold text-white group-hover:text-white/80 transition-colors">{CONTACT.facebook}</p>
            </div>
          </a>

        </div>

      <div className="bg-amber-950 border-t border-amber-900 px-6 pt-4 pb-24">
        <p className="text-[10px] font-semibold text-amber-900">
          © {new Date().getFullYear()} HLLC Store.
        </p>
      </div>
    </footer>
  );
}
