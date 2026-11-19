"use client";

import { Delete } from "lucide-react";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"] as const;

export function DigitField({
  value,
  placeholder,
  active,
  onClick,
  prefix,
}: {
  value: string;
  placeholder: string;
  active: boolean;
  onClick: () => void;
  prefix?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-12 w-full items-center rounded-xl border bg-white px-3 text-left text-[15px] ${
        active ? "border-[#FF581C]" : "border-[#E8E8E8]"
      }`}
    >
      {prefix ? <span className="mr-3 text-[#666]">{prefix}</span> : null}
      {value ? <span className="tracking-wide">{value}</span> : <span className="text-[#C0C0C0]">{placeholder}</span>}
    </button>
  );
}

export function PhoneKeypad({
  title,
  onDigit,
  onDelete,
  onDone,
}: {
  title: string;
  onDigit: (digit: string) => void;
  onDelete: () => void;
  onDone: () => void;
}) {
  return (
    <div className="shrink-0 bg-[#D5D8DE] pb-[max(10px,env(safe-area-inset-bottom))]">
      <div className="flex h-10 items-center justify-between px-4">
        <span className="text-[13px] text-[#666]">{title}</span>
        <button type="button" onClick={onDone} className="text-[15px] font-medium text-[#FF581C]">
          完成
        </button>
      </div>
      <div className="grid grid-cols-3 gap-1.5 px-1.5">
        {KEYS.map((key, index) => {
          if (!key) return <span key={`gap-${index}`} />;
          if (key === "del") {
            return (
              <button
                key="delete"
                type="button"
                aria-label="删除"
                onClick={onDelete}
                className="grid h-[46px] place-items-center rounded-lg bg-[#FCFCFC] text-[#222] active:bg-[#E4E4E6]"
              >
                <Delete className="size-5" />
              </button>
            );
          }
          return (
            <button
              key={key}
              type="button"
              onClick={() => onDigit(key)}
              className="h-[46px] rounded-lg bg-white text-[22px] font-medium text-[#222] active:bg-[#E8E8EA]"
            >
              {key}
            </button>
          );
        })}
      </div>
    </div>
  );
}
