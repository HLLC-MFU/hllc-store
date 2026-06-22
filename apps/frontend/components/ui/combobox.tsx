"use client"

import * as React from "react"
import { Combobox as ComboboxPrimitive } from "@base-ui-components/react"
import { Check, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

type ComboboxProps<T> = Omit<ComboboxPrimitive.Root.Props<T>, "children"> & {
  items: T[]
  children: React.ReactNode
}

function Combobox<T>({ items, children, ...props }: ComboboxProps<T>) {
  return (
    <ComboboxPrimitive.Root items={items} {...props}>
      {children}
    </ComboboxPrimitive.Root>
  )
}

function ComboboxInput({
  className,
  ...props
}: ComboboxPrimitive.Input.Props) {
  return (
    <div className="relative flex items-center">
      <ComboboxPrimitive.Input
        className={cn(
          "h-12 w-full rounded-2xl border border-gray-300 bg-white px-3.5 pr-10 text-sm font-semibold text-gray-900 outline-none transition-colors placeholder:font-semibold placeholder:text-gray-400 focus:border-brand focus:ring-1 focus:ring-brand/20",
          className
        )}
        {...props}
      />
      <ComboboxPrimitive.Trigger
        render={<button type="button" />}
        className="absolute right-3 flex items-center text-gray-400 cursor-pointer select-none"
      >
        <ChevronDown className="h-4 w-4" />
      </ComboboxPrimitive.Trigger>
    </div>
  )
}

function ComboboxContent({
  className,
  children,
  ...props
}: ComboboxPrimitive.Popup.Props) {
  return (
    <ComboboxPrimitive.Portal>
      <ComboboxPrimitive.Positioner sideOffset={6} align="start" className="z-50">
        <ComboboxPrimitive.Popup
          className={cn(
            "w-(--anchor-width) min-w-48 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl",
            "data-ending-style:animate-out data-ending-style:fade-out-0 data-ending-style:zoom-out-95 data-ending-style:duration-100",
            "data-starting-style:animate-in data-starting-style:fade-in-0 data-starting-style:zoom-in-95 data-starting-style:duration-100",
            className
          )}
          {...props}
        >
          {children}
        </ComboboxPrimitive.Popup>
      </ComboboxPrimitive.Positioner>
    </ComboboxPrimitive.Portal>
  )
}

function ComboboxList<T>({
  className,
  children,
  ...props
}: Omit<ComboboxPrimitive.List.Props, "children"> & {
  children: (item: T) => React.ReactNode
}) {
  return (
    <ComboboxPrimitive.List
      className={cn("max-h-60 overflow-y-auto overscroll-contain p-1", className)}
      {...props}
    >
      <ComboboxPrimitive.Collection>
        {(item: T) => children(item)}
      </ComboboxPrimitive.Collection>
    </ComboboxPrimitive.List>
  )
}

function ComboboxItem({
  className,
  children,
  ...props
}: ComboboxPrimitive.Item.Props) {
  return (
    <ComboboxPrimitive.Item
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-700 outline-none transition-colors",
        "data-highlighted:bg-gray-50 data-selected:font-black data-selected:text-brand",
        "data-disabled:pointer-events-none data-disabled:opacity-50",
        className
      )}
      {...props}
    >
      {children}
      <ComboboxPrimitive.ItemIndicator className="ml-auto shrink-0">
        <Check className="h-3.5 w-3.5 text-brand" />
      </ComboboxPrimitive.ItemIndicator>
    </ComboboxPrimitive.Item>
  )
}

function ComboboxEmpty({ className, ...props }: ComboboxPrimitive.Empty.Props) {
  return (
    <ComboboxPrimitive.Empty
      className={cn("py-6 text-center text-xs font-semibold text-gray-400", className)}
      {...props}
    />
  )
}

export {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
}
