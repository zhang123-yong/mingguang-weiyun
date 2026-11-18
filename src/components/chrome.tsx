"use client";

import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Lock, PawPrint, Sparkles } from "lucide-react";
import type { DeviceKind } from "@/lib/model";

export function NavBar({
  title,
  onBack,
  right,
}: {
  title: string;
  onBack?: () => void;
  right?: ReactNode;
}) {
  return (
    <header className="relative flex h-12 shrink-0 items-center justify-center bg-white px-12">
      {onBack ? (
        <button
          type="button"
          aria-label="返回"
          onClick={onBack}
          className="absolute left-1 grid size-10 place-items-center rounded-full text-[#222] hover:bg-[#F6F6F6]"
        >
          <ChevronLeft className="size-6" />
        </button>
      ) : null}
      <h1 className="truncate text-[17px] font-medium text-[#222]">{title}</h1>
      {right ? <div className="absolute right-3">{right}</div> : null}
    </header>
  );
}

export function Page({
  title,
  onBack,
  right,
  children,
  bleed,
}: {
  title: string;
  onBack?: () => void;
  right?: ReactNode;
  children: ReactNode;
  bleed?: boolean;
}) {
  return (
    <div className="relative flex h-full flex-col bg-[#F5F6F8] text-[#222]">
      <NavBar title={title} onBack={onBack} right={right} />
      <div className={`min-h-0 flex-1 overflow-y-auto ${bleed ? "" : "px-4 py-4"}`}>
        {children}
      </div>
    </div>
  );
}

export function Cell({
  label,
  value,
  onClick,
  icon,
  danger,
  extra,
}: {
  label: string;
  value?: string;
  onClick?: () => void;
  icon?: ReactNode;
  danger?: boolean;
  extra?: ReactNode;
}) {
  const Comp = onClick ? "button" : "div";
  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`flex w-full items-center gap-3 bg-white px-4 py-3.5 text-left ${
        danger ? "text-[#E23B3B]" : "text-[#222]"
      }`}
    >
      {icon}
      <span className="min-w-0 flex-1 truncate text-[15px]">{label}</span>
      {value ? <span className="max-w-[46%] truncate text-[13px] text-[#999]">{value}</span> : null}
      {extra}
      {onClick ? <ChevronRight className="size-4 shrink-0 text-[#D0D0D0]" /> : null}
    </Comp>
  );
}

export function Group({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-[0_1px_0_rgba(0,0,0,0.02)] [&>*+*]:border-t [&>*+*]:border-[#F2F2F2]">
      {children}
    </div>
  );
}

export function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={(event) => {
        event.stopPropagation();
        onChange(!checked);
      }}
      className={`relative h-[26px] w-11 shrink-0 rounded-full transition-colors ${
        checked ? "bg-[#FF581C]" : "bg-[#E3E3E3]"
      }`}
    >
      <span
        className={`absolute top-[3px] size-5 rounded-full bg-white shadow transition-all ${
          checked ? "left-[21px]" : "left-[3px]"
        }`}
      />
    </button>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] text-[#888]">{label}</span>
      {children}
    </label>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`h-11 w-full rounded-xl border border-[#E8E8E8] bg-white px-3 text-[15px] outline-none focus:border-[#FF581C] ${props.className ?? ""}`}
    />
  );
}

export function PrimaryButton({
  children,
  onClick,
  disabled,
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className="h-11 w-full rounded-[10px] bg-[#FF581C] text-[16px] text-white disabled:opacity-40"
    >
      {children}
    </button>
  );
}

export function DeviceGlyph({
  kind,
  className = "size-11",
}: {
  kind: DeviceKind;
  className?: string;
}) {
  const Icon = kind === "companion" ? Sparkles : kind === "pet" ? PawPrint : Lock;
  return (
    <span
      className={`grid place-items-center rounded-2xl bg-[#FFF1EA] text-[#FF581C] ${className}`}
    >
      <Icon className="size-[22px]" />
    </span>
  );
}

export function ConfirmDialog({
  title,
  body,
  confirmText,
  danger,
  onConfirm,
  onClose,
}: {
  title: string;
  body: string;
  confirmText: string;
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <div
      className="absolute inset-0 z-30 flex items-center justify-center bg-black/45 px-8"
      onClick={onClose}
    >
      <div
        role="dialog"
        className="w-full rounded-2xl bg-white px-5 pb-5 pt-6"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="text-center text-[17px] font-medium">{title}</h2>
        <p className="mt-3 text-center text-[14px] leading-6 text-[#666]">{body}</p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-[10px] border border-[#E6E6E6] text-[15px]"
          >
            取消
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`h-11 rounded-[10px] text-[15px] text-white ${
              danger ? "bg-[#E23B3B]" : "bg-[#FF581C]"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export function EmptyState({
  title,
  body,
  action,
  onAction,
}: {
  title: string;
  body: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center px-8 py-16 text-center">
      <div className="grid size-20 place-items-center rounded-full bg-white text-3xl shadow-sm">
        <span aria-hidden>⌂</span>
      </div>
      <p className="mt-4 text-[16px] font-medium">{title}</p>
      <p className="mt-1 text-[13px] leading-6 text-[#888]">{body}</p>
      {action && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 h-10 rounded-full bg-[#FF581C] px-6 text-[14px] text-white"
        >
          {action}
        </button>
      ) : null}
    </div>
  );
}
