"use client";

import * as React from "react";
import { CheckCircle2, ChevronLeft, ChevronRight, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { OrderStatus } from "@/components/admin/types";
import { useLanguage } from "@/lib/client/language-context";

type ConfirmationModalProps = {
  confirm: { orderId: string; approved: boolean; note?: string } | null;
  setConfirm: (val: null) => void;
  confirmApprove: () => Promise<void>;

  statusConfirm: { orderId: string; status: OrderStatus } | null;
  setStatusConfirm: (val: null) => void;
  confirmStatusChange: () => void;

  lightbox: { images: string[]; index: number } | null;
  setLightbox: (val: null) => void;
};

function SlipLightbox({ images, index, onClose }: { images: string[]; index: number; onClose: () => void }) {
  const [i, setI] = React.useState(index);
  const count = images.length;
  const current = Math.min(Math.max(i, 0), count - 1);
  const step = (delta: number) => (e: React.MouseEvent) => {
    e.stopPropagation();
    setI((v) => (v + delta + count) % count);
  };

  return (
    <div
      className="fixed inset-0 bg-black/90 backdrop-blur-md z-70 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <button onClick={onClose} className="absolute top-4 right-4 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white cursor-pointer transition-colors">
        <XCircle className="w-5 h-5" />
      </button>

      {count > 1 && (
        <>
          <button onClick={step(-1)} className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white cursor-pointer transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button onClick={step(1)} className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white cursor-pointer transition-colors">
            <ChevronRight className="w-6 h-6" />
          </button>
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 bg-white/15 text-white text-xs font-bold px-3 py-1.5 rounded-full">
            {current + 1} / {count} · {current === 0 ? "ล่าสุด" : "สลิปเก่า"}
          </div>
        </>
      )}

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={images[current]}
        alt="slip"
        onClick={(e) => e.stopPropagation()}
        className="max-w-full max-h-[90vh] rounded-2xl object-contain shadow-2xl border border-white/10"
      />
    </div>
  );
}

export function ConfirmationModal({
  confirm,
  setConfirm,
  confirmApprove,
  statusConfirm,
  setStatusConfirm,
  confirmStatusChange,
  lightbox,
  setLightbox,
}: ConfirmationModalProps) {
  const { t } = useLanguage();

  return (
    <>
      {/* Confirm slip approval/rejection modal */}
      {confirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 flex flex-col gap-4 shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-300">
            <div className="text-center">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 ${confirm.approved ? "bg-emerald-50" : "bg-red-50"}`}>
                {confirm.approved
                  ? <CheckCircle2 className="w-7 h-7 text-emerald-500" />
                  : <XCircle className="w-7 h-7 text-red-500" />}
              </div>
              <h3 className="font-bold text-lg text-gray-900">
                {confirm.approved ? t("admin.modal.approve_title") : t("admin.modal.reject_title")}
              </h3>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                {confirm.approved ? t("admin.modal.approve_desc") : t("admin.modal.reject_desc")}
              </p>
            </div>
            <div className="flex gap-3 mt-2">
              <Button
                variant="outline"
                onClick={() => setConfirm(null)}
                className="flex-1 py-3 rounded-2xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                {t("admin.modal.cancel")}
              </Button>
              <Button
                onClick={confirmApprove}
                className={`flex-1 py-3 rounded-2xl text-xs font-bold text-white cursor-pointer transition-all shadow-md active:scale-98 ${confirm.approved ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20" : "bg-red-500 hover:bg-red-600 shadow-red-500/20"}`}
              >
                {confirm.approved ? t("admin.slip.approve") : t("admin.slip.reject")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Status Change Confirmation Modal */}
      {statusConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 flex flex-col gap-4 shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-300">
            <div className="text-center flex flex-col items-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${statusConfirm.status === "cancelled" ? "bg-red-50 text-red-500 border border-red-100" : "bg-emerald-50 text-emerald-500 border border-emerald-100"}`}>
                {statusConfirm.status === "cancelled" ? <XCircle className="w-6 h-6 animate-pulse" /> : <CheckCircle2 className="w-6 h-6" />}
              </div>
              <h3 className="font-extrabold text-gray-900 text-sm">
                {statusConfirm.status === "cancelled"
                  ? t("admin.modal.cancel_title")
                  : t("admin.modal.status_title")}
              </h3>
              <p className="text-[11px] text-gray-500 mt-2 leading-relaxed">
                {statusConfirm.status === "cancelled"
                  ? t("admin.modal.cancel_desc")
                  : t("admin.modal.status_desc", { status: t(`admin.status.${statusConfirm.status}`) })}
              </p>
            </div>
            <div className="flex gap-3 mt-2.5">
              <Button
                variant="outline"
                onClick={() => setStatusConfirm(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                {t("admin.modal.cancel")}
              </Button>
              <Button
                onClick={confirmStatusChange}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold text-white cursor-pointer transition-all shadow-md active:scale-98 ${statusConfirm.status === "cancelled"
                    ? "bg-red-500 hover:bg-red-600 shadow-red-500/20"
                    : "bg-[#85241F] hover:bg-[#B72D2A] shadow-[#85241F]/20"
                  }`}
              >
                {t("admin.modal.confirm")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <SlipLightbox
          key={`${lightbox.images[0] ?? ""}-${lightbox.index}`}
          images={lightbox.images}
          index={lightbox.index}
          onClose={() => setLightbox(null)}
        />
      )}
    </>
  );
}
