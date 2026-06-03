import React from "react";
import { useLanguage } from "@/lib/language-context";

type TimeSelectProps = {
  name: string;
};

export const TimeSelect: React.FC<TimeSelectProps> = ({ name }) => {
  const { lang } = useLanguage();
  const startHour = 8; // 08:00
  const endHour = 18; // 18:00
  const interval = 30; // minutes

  const slots: string[] = [];
  for (let hour = startHour; hour <= endHour; hour++) {
    for (let minute = 0; minute < 60; minute += interval) {
      if (hour === endHour && minute > 0) break; // stop at 18:00 exactly
      const hh = String(hour).padStart(2, "0");
      const mm = String(minute).padStart(2, "0");
      slots.push(`${hh}:${mm}`);
    }
  }

  return (
    <select
      name={name}
      className="mt-3 h-11 rounded-xl bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#85241F]"
    >
      <option value="">{lang === "th" ? "เวลาที่จะมารับ" : "Pickup time"}</option>
      {slots.map((slot) => (
        <option key={slot} value={slot}>
          {slot}
        </option>
      ))}
    </select>
  );
};
