"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { MingguangLogo } from "@/components/mingguang-logo";
import { QqIcon, WechatIcon } from "@/components/third-party-icons";

type DocId = "privacy" | "terms" | "sdk";
type ActionId = "login" | "register" | "qq" | "wechat";

const DOCUMENTS: Record<
  DocId,
  { title: string; paragraphs: string[] }
> = {
  privacy: {
    title: "隐私政策",
    paragraphs: [
      "名光智能在你登录、添加设备和远程控制时，会使用账号、手机号和设备标识。",
      "这些信息只用于完成对应功能，不会出售给他人。",
      "你可以稍后在账号里查看或删除自己的数据。",
    ],
  },
  terms: {
    title: "用户协议",
    paragraphs: [
      "使用名光智能，即表示你按本协议使用设备控制、场景和消息服务。",
      "请合法使用设备，不要干扰他人的正常使用。",
      "网络或设备异常时，控制结果可能会延迟。",
    ],
  },
  sdk: {
    title: "第三方信息共享和SDK服务清单",
    paragraphs: [
      "为完成第三方账号登录和消息到达，名光智能会按最小范围向对应服务提供标识信息。",
      "共享内容只限于完成该功能所需要的部分，不会附带与功能无关的资料。",
      "当前封面预留了 QQ 与微信登录入口，接入范围以实际开放的能力为准。",
    ],
  },
};

const ACTION_HINT: Record<ActionId, string> = {
  login: "已同意协议，即将进入登录",
  register: "已同意协议，即将进入注册",
  qq: "已同意协议，即将使用 QQ 登录",
  wechat: "已同意协议，即将使用微信登录",
};

const DOC_LINK =
  "text-[#3A7BFF] hover:text-[#215ed6] focus-visible:outline-none focus-visible:underline";

export function CoverScreen() {
  const [agreed, setAgreed] = useState(false);
  const [pending, setPending] = useState<ActionId | null>(null);
  const [docId, setDocId] = useState<DocId | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const timer = useRef<number | null>(null);
  const agreeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  useEffect(() => {
    if (!pending || docId) return;
    agreeButtonRef.current?.focus();
  }, [pending, docId]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (docId) {
        setDocId(null);
        return;
      }
      setPending(null);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [docId]);

  function showToast(message: string) {
    setToast(message);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setToast(null), 2200);
  }

  function requestAction(action: ActionId) {
    if (!agreed) {
      setPending(action);
      return;
    }
    showToast(ACTION_HINT[action]);
  }

  function agreeAndContinue() {
    const action = pending;
    setAgreed(true);
    setPending(null);
    if (action) showToast(ACTION_HINT[action]);
  }

  const document = docId ? DOCUMENTS[docId] : null;

  return (
    <div className="min-h-dvh bg-white text-[#222] sm:flex sm:items-center sm:justify-center sm:bg-[#E7E9EE] sm:p-6">
      <div className="relative mx-auto flex h-dvh w-full max-w-[420px] flex-col overflow-hidden bg-white sm:h-[min(844px,calc(100dvh-48px))] sm:rounded-[32px] sm:shadow-[0_24px_70px_rgba(20,24,40,0.16)]">
        <h1 className="sr-only">名光智能</h1>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <div className="flex flex-1 items-center justify-center px-6 pb-10 pt-16">
            <MingguangLogo />
          </div>

          <div className="px-6 pb-[max(1.75rem,env(safe-area-inset-bottom))]">
            <div className="flex flex-col gap-3">
              <Button
                type="button"
                className="h-12 w-full rounded-[10px] bg-[#FF581C] text-[17px] font-normal text-white hover:bg-[#F04810] active:bg-[#E03E0C]"
                onClick={() => requestAction("login")}
              >
                登录
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-12 w-full rounded-[10px] border-[#E6E6E6] bg-white text-[17px] font-normal text-[#222] hover:bg-[#FAFAFA] active:bg-[#F3F3F3]"
                onClick={() => requestAction("register")}
              >
                注册
              </Button>
            </div>

            <div className="mt-4 flex items-start gap-2">
              <Checkbox
                id="agree"
                checked={agreed}
                onCheckedChange={setAgreed}
                aria-label="同意隐私政策、用户协议和第三方信息共享清单"
                className="mt-[3px] size-[16px] rounded-[3px] border-[#C8C8C8] bg-white data-checked:border-[#FF581C] data-checked:bg-[#FF581C]"
              />
              <p className="text-[13px] leading-[22px] text-[#333]">
                <label htmlFor="agree" className="cursor-pointer">我同意</label><DocButton onClick={() => setDocId("privacy")}>《隐私政策》</DocButton><DocButton onClick={() => setDocId("terms")}>《用户协议》</DocButton><DocButton onClick={() => setDocId("sdk")}>《第三方信息共享</DocButton><br /><DocButton onClick={() => setDocId("sdk")}>和SDK服务清单》</DocButton>
              </p>
            </div>

            <div className="mt-8 mb-2 flex items-center justify-center gap-14">
              <button
                type="button"
                aria-label="QQ 登录"
                className="rounded-full transition-transform active:scale-95"
                onClick={() => requestAction("qq")}
              >
                <QqIcon />
              </button>
              <button
                type="button"
                aria-label="微信登录"
                className="rounded-full transition-transform active:scale-95"
                onClick={() => requestAction("wechat")}
              >
                <WechatIcon />
              </button>
            </div>
          </div>
        </div>

        {toast ? (
          <div className="pointer-events-none absolute inset-x-0 top-5 z-40 flex justify-center px-6">
            <p
              role="status"
              className="rounded-full bg-black/75 px-4 py-2 text-center text-[13px] text-white shadow-lg"
            >
              {toast}
            </p>
          </div>
        ) : null}

        {pending && !document ? (
          <div
            className="absolute inset-0 z-20 flex items-center justify-center bg-black/45 px-8"
            onClick={() => setPending(null)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="consent-title"
              className="w-full rounded-2xl bg-white px-5 pb-5 pt-6 shadow-xl"
              onClick={(event) => event.stopPropagation()}
            >
              <h2
                id="consent-title"
                className="text-center text-[17px] font-medium text-[#222]"
              >
                请先阅读并同意
              </h2>
              <p className="mt-3 text-center text-[14px] leading-6 text-[#666]">
                登录或注册前，请先同意<DocButton onClick={() => setDocId("privacy")}>《隐私政策》</DocButton><DocButton onClick={() => setDocId("terms")}>《用户协议》</DocButton><DocButton onClick={() => setDocId("sdk")}>《第三方信息共享和SDK服务清单》</DocButton>。
              </p>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 rounded-[10px] border-[#E6E6E6] bg-white text-[15px] font-normal text-[#222] hover:bg-[#FAFAFA]"
                  onClick={() => setPending(null)}
                >
                  再看看
                </Button>
                <Button
                  ref={agreeButtonRef}
                  type="button"
                  className="h-11 rounded-[10px] bg-[#FF581C] text-[15px] font-normal text-white hover:bg-[#F04810]"
                  onClick={agreeAndContinue}
                >
                  同意并继续
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        {document ? (
          <div className="absolute inset-0 z-30 flex flex-col bg-white">
            <header className="relative flex h-12 shrink-0 items-center justify-center border-b border-[#F2F2F2] px-12">
              <button
                type="button"
                aria-label="返回"
                className="absolute left-2 flex size-10 items-center justify-center rounded-full text-[#222] hover:bg-[#F6F6F6]"
                onClick={() => setDocId(null)}
              >
                <ChevronLeft className="size-6" />
              </button>
              <h2 className="truncate text-[16px] font-medium">{document.title}</h2>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
              <div className="flex flex-col gap-4 text-[15px] leading-7 text-[#333]">
                {document.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function DocButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={`${DOC_LINK} inline border-0 bg-transparent p-0 align-baseline`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
