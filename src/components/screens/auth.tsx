"use client";

import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { QqIcon, WechatIcon } from "@/components/third-party-icons";
import { Field, PrimaryButton, TextInput } from "@/components/chrome";
import { DigitField, PhoneKeypad } from "@/components/phone-keypad";
import { useApp } from "@/lib/app-state";
import { useNav } from "@/lib/nav";

function phoneOk(value: string) {
  return /^1\d{10}$/.test(value);
}

export function LoginScreen() {
  const { pop, reset, push } = useNav();
  const { login } = useApp();
  const [mode, setMode] = useState<"code" | "password">("code");
  const [phone, setPhone] = useState("");
  const [secret, setSecret] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [pad, setPad] = useState<"phone" | "code" | null>("phone");

  function submit() {
    if (!phoneOk(phone)) {
      setError("请输入 11 位手机号");
      return;
    }
    if (mode === "code" && !/^\d{4,6}$/.test(secret)) {
      setError("验证码为 4 到 6 位数字");
      return;
    }
    if (mode === "password" && secret.length < 6) {
      setError("密码至少 6 位");
      return;
    }
    login({
      method: "phone",
      nickname: `用户${phone.slice(-4)}`,
      phone,
      password: mode === "password" ? secret : undefined,
    });
    reset({ name: "tabs" });
  }

  function typeDigit(digit: string) {
    if (pad === "phone") {
      setPhone((value) => {
        const next = (value + digit).slice(0, 11);
        if (value.length < 11 && next.length === 11 && mode === "code") queueMicrotask(() => setPad("code"));
        return next;
      });
      return;
    }
    if (pad === "code") setSecret((value) => (value + digit).slice(0, 6));
  }

  function deleteDigit() {
    if (pad === "phone") setPhone((value) => value.slice(0, -1));
    if (pad === "code") setSecret((value) => value.slice(0, -1));
  }

  return (
    <div className="flex h-full flex-col bg-white text-[#222]">
      <header className="flex h-12 items-center px-1">
        <button type="button" aria-label="返回" onClick={pop} className="grid size-10 place-items-center">
          <ChevronLeft className="size-6" />
        </button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-8">
        <h1 className="mt-2 text-[26px] font-medium">登录</h1>
        <div className="mt-6 flex gap-6 text-[15px]">
          <button
            type="button"
            className={mode === "code" ? "text-[#FF581C]" : "text-[#888]"}
            onClick={() => {
              setMode("code");
              setSecret("");
              setPad("phone");
            }}
          >
            验证码登录
          </button>
          <button
            type="button"
            className={mode === "password" ? "text-[#FF581C]" : "text-[#888]"}
            onClick={() => {
              setMode("password");
              setSecret("");
              setPad("phone");
            }}
          >
            密码登录
          </button>
        </div>
        <div className="mt-6 flex flex-col gap-3">
          <DigitField
            prefix="+86"
            value={phone}
            placeholder="请输入手机号"
            active={pad === "phone"}
            onClick={() => setPad("phone")}
          />
          {mode === "code" ? (
            <div className="flex items-center gap-2">
              <DigitField
                value={secret}
                placeholder="请输入验证码"
                active={pad === "code"}
                onClick={() => setPad("code")}
              />
              <button
                type="button"
                className="h-12 shrink-0 rounded-xl border border-[#E8E8E8] px-3 text-[13px] text-[#FF581C] disabled:text-[#BBB]"
                disabled={!phoneOk(phone) || sent}
                onClick={() => setSent(true)}
              >
                {sent ? "验证码已发送" : "获取验证码"}
              </button>
            </div>
          ) : (
            <input
              value={secret}
              type="password"
              placeholder="请输入密码"
              autoComplete="current-password"
              onFocus={() => setPad(null)}
              onChange={(event) => setSecret(event.target.value)}
              className="h-12 w-full rounded-xl border border-[#E8E8E8] px-3 text-[15px] outline-none focus:border-[#FF581C]"
            />
          )}
        </div>
        <p className="mt-3 text-[12px] leading-5 text-[#999]">
          这里不会发送真实短信。手机号填 11 位，验证码填任意 4 到 6 位数字即可进入家庭。
        </p>
        {error ? <p className="mt-2 text-[13px] text-[#E23B3B]">{error}</p> : null}
        <div className="mt-6">
          <PrimaryButton onClick={submit}>登录</PrimaryButton>
        </div>
        <div className="mt-10 text-center text-[13px] text-[#999]">其他方式</div>
        <div className="mt-4 flex justify-center gap-10">
          <button type="button" aria-label="QQ 登录" onClick={() => push({ name: "oauth", provider: "qq" })}>
            <QqIcon />
          </button>
          <button type="button" aria-label="微信登录" onClick={() => push({ name: "oauth", provider: "wechat" })}>
            <WechatIcon />
          </button>
        </div>
      </div>
      {pad ? (
        <PhoneKeypad
          title={pad === "phone" ? "手机号" : "验证码"}
          onDigit={typeDigit}
          onDelete={deleteDigit}
          onDone={() => setPad(null)}
        />
      ) : null}
    </div>
  );
}

export function RegisterScreen() {
  const { pop, reset } = useNav();
  const { login } = useApp();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pad, setPad] = useState<"phone" | "code" | null>("phone");

  function submit() {
    if (!phoneOk(phone)) {
      setError("请输入 11 位手机号");
      return;
    }
    if (!/^\d{4,6}$/.test(code)) {
      setError("验证码为 4 到 6 位数字");
      return;
    }
    if (password.length < 6) {
      setError("密码至少 6 位");
      return;
    }
    login({
      method: "phone",
      nickname: `用户${phone.slice(-4)}`,
      phone,
      password,
    });
    reset({ name: "tabs" });
  }

  function typeDigit(digit: string) {
    if (pad === "phone") {
      setPhone((value) => {
        const next = (value + digit).slice(0, 11);
        if (value.length < 11 && next.length === 11) queueMicrotask(() => setPad("code"));
        return next;
      });
      return;
    }
    if (pad === "code") setCode((value) => (value + digit).slice(0, 6));
  }

  function deleteDigit() {
    if (pad === "phone") setPhone((value) => value.slice(0, -1));
    if (pad === "code") setCode((value) => value.slice(0, -1));
  }

  return (
    <div className="flex h-full flex-col bg-white text-[#222]">
      <header className="flex h-12 items-center px-1">
        <button type="button" aria-label="返回" onClick={pop} className="grid size-10 place-items-center">
          <ChevronLeft className="size-6" />
        </button>
      </header>
      <form
        className="min-h-0 flex-1 overflow-y-auto px-6 pb-8"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <h1 className="mt-2 text-[26px] font-medium">注册</h1>
        <div className="mt-6 flex flex-col gap-4">
          <div>
            <span className="mb-1.5 block text-[13px] text-[#888]">手机号</span>
            <DigitField
              prefix="+86"
              value={phone}
              placeholder="请输入手机号"
              active={pad === "phone"}
              onClick={() => setPad("phone")}
            />
          </div>
          <div>
            <span className="mb-1.5 block text-[13px] text-[#888]">验证码</span>
            <DigitField
              value={code}
              placeholder="任意 4 到 6 位数字"
              active={pad === "code"}
              onClick={() => setPad("code")}
            />
          </div>
          <Field label="密码">
            <TextInput
              type="password"
              value={password}
              placeholder="至少 6 位"
              onFocus={() => setPad(null)}
              onChange={(event) => setPassword(event.target.value)}
            />
          </Field>
        </div>
        {error ? <p className="mt-3 text-[13px] text-[#E23B3B]">{error}</p> : null}
        <div className="mt-6">
          <PrimaryButton type="submit">注册并进入</PrimaryButton>
        </div>
      </form>
      {pad ? (
        <PhoneKeypad
          title={pad === "phone" ? "手机号" : "验证码"}
          onDigit={typeDigit}
          onDelete={deleteDigit}
          onDone={() => setPad(null)}
        />
      ) : null}
    </div>
  );
}

export function OauthScreen({ provider }: { provider: "qq" | "wechat" }) {
  const { pop, reset } = useNav();
  const { login } = useApp();
  const isQq = provider === "qq";
  const title = isQq ? "QQ" : "微信";

  function agree() {
    login({
      method: provider,
      nickname: isQq ? "QQ 用户" : "微信用户",
    });
    reset({ name: "tabs" });
  }

  return (
    <div className="flex h-full flex-col bg-white text-[#222]">
      <header className={`flex h-14 items-center px-4 text-white ${isQq ? "bg-[#12B7F5]" : "bg-[#28C445]"}`}>
        <button type="button" aria-label="返回" onClick={pop} className="grid size-10 place-items-center">
          <ChevronLeft className="size-6" />
        </button>
        <span className="text-[16px]">{title}授权</span>
      </header>
      <div className="flex flex-1 flex-col px-6 py-8">
        <div className="flex items-center gap-3">
          {isQq ? <QqIcon /> : <WechatIcon />}
          <div>
            <p className="text-[16px] font-medium">名光智能</p>
            <p className="text-[13px] text-[#888]">申请使用你的{title}头像和昵称</p>
          </div>
        </div>
        <div className="mt-8 rounded-2xl bg-[#F7F7F7] px-4 py-4 text-[14px] leading-6 text-[#555]">
          同意后进入家庭。名光智能只使用昵称显示在「我的」里，不会向{title}写入设备数据。
        </div>
        <div className="mt-auto flex flex-col gap-3">
          <PrimaryButton onClick={agree}>同意并进入</PrimaryButton>
          <button type="button" onClick={pop} className="h-11 text-[15px] text-[#888]">
            拒绝
          </button>
        </div>
      </div>
    </div>
  );
}
