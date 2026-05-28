"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type TabsContextValue = {
  value: string;
  setValue: (value: string) => void;
};

const TabsContext = React.createContext<TabsContextValue | null>(null);

export function Tabs({
  defaultValue,
  className,
  children,
}: {
  defaultValue: string;
  className?: string;
  children: React.ReactNode;
}) {
  const [value, setValue] = React.useState(defaultValue);

  return (
    <TabsContext.Provider value={{ value, setValue }}>
      <div className={cn("w-full", className)}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-md bg-zinc-100 p-1 text-zinc-500",
        className,
      )}
      {...props}
    />
  );
}

export function TabsTrigger({
  value,
  className,
  ...props
}: React.ComponentProps<"button"> & { value: string }) {
  const context = React.useContext(TabsContext);
  const active = context?.value === value;

  return (
    <button
      className={cn(
        "inline-flex h-8 items-center justify-center whitespace-nowrap rounded px-3 text-sm font-medium transition-colors",
        active ? "bg-white text-zinc-950 shadow-sm" : "hover:text-zinc-900",
        className,
      )}
      onClick={() => context?.setValue(value)}
      type="button"
      {...props}
    />
  );
}

export function TabsContent({
  value,
  className,
  children,
}: {
  value: string;
  className?: string;
  children: React.ReactNode;
}) {
  const context = React.useContext(TabsContext);

  if (context?.value !== value) {
    return null;
  }

  return <div className={cn("mt-4", className)}>{children}</div>;
}
