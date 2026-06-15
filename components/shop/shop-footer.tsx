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
  email: "hllcstore@email.com",
  emailUrl: "mailto:hllcstore@email.com",
  instagram: "@hllc_store",
  instagramUrl: "https://instagram.com/hllc_store",
  facebook: "HLLC Store",
  facebookUrl: "https://facebook.com/hllcstore",
};

export function ShopFooter() {
  return (
    <footer className="border-t border-amber-950/30 bg-white">
      <div className="bg-amber-950 px-6 py-6">
        <p className="mb-4 text-[10px] font-black uppercase tracking-widest text-amber-800">ติดต่อเรา</p>
        <div className="flex flex-col gap-3">
          <a href={CONTACT.emailUrl} className="flex items-center gap-3 group">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white">
              <MailIcon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-amber-800 leading-none mb-0.5">Email</p>
              <p className="text-sm font-bold text-amber-100 group-hover:text-white transition-colors">{CONTACT.email}</p>
            </div>
          </a>

          <a href={CONTACT.instagramUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 group">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white">
              <InstagramIcon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-amber-800 leading-none mb-0.5">Instagram</p>
              <p className="text-sm font-bold text-amber-100 group-hover:text-white transition-colors">{CONTACT.instagram}</p>
            </div>
          </a>

          <a href={CONTACT.facebookUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 group">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white">
              <FacebookIcon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-amber-800 leading-none mb-0.5">Facebook</p>
              <p className="text-sm font-bold text-amber-100 group-hover:text-white transition-colors">{CONTACT.facebook}</p>
            </div>
          </a>
        </div>
      </div>

      <div className="bg-amber-950 border-t border-amber-900 px-6 pt-4 pb-24">
        <p className="text-[10px] font-semibold text-amber-900">
          © {new Date().getFullYear()} HLLC Store. Make By Dinozexe.
        </p>
      </div>
    </footer>
  );
}
