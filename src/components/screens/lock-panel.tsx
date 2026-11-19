"use client";

import { useEffect, useLayoutEffect, useRef, useState, type MouseEvent, type PointerEvent, type ReactNode } from "react";
import {
  Bell,
  Check,
  ChevronLeft,
  ChevronRight,
  Grid3x3,
  Images,
  Info,
  List,
  Lock,
  Pencil,
  Settings,
  ToggleRight,
  UserRound,
  Video,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useApp } from "@/lib/app-state";
import { nowLabel, lockPanelOf, productOf, rid, type Device, type LockPanelState } from "@/lib/model";
import { useNav } from "@/lib/nav";
import { LockAlbum, lockPreviewText } from "@/components/screens/lock-album";

const FAQS: [string, string][] = [
  ["门锁屏不亮了，怎么办？", "先换一组新的干电池，并确认锂电池有电。长按后面板复位键 5 秒后重新上电。演示环境不会连接真实门锁。"],
  ["什么是 AI 安全守护？", "有人在门前停留、逗留或移动时，门锁可以把事件记到消息中心。这里只演示开关和文案，不会上传视频。"],
  ["什么是门锁逗留（斗牛）报警？", "有人在门前停留超过设定时间，会记一条逗留告警。可以在通知设置里选择消息中心或电话提醒。"],
  ["门锁能否与智能音箱、灯光、空调联动？", "可以在智能联动里打开家人回家、门锁告警、有人按门铃。联动只改本机演示状态，不会控制真实设备。"],
  ["什么是 AI 视觉？", "人脸识别和包裹识别会出现在门锁 AI 的视觉页。当前是即将上线的演示卡片，不会分析真实画面。"],
];

const MENU: { label: string; id: "live" | "ai" | "members" | "temp" | "link" | "settings"; icon: ReactNode }[] = [
  { label: "视频监控", id: "live", icon: <Video className="size-5" /> },
  { label: "AI", id: "ai", icon: <span className="text-[13px] font-semibold">AI</span> },
  { label: "成员管理", id: "members", icon: <UserRound className="size-5" /> },
  { label: "临时密码", id: "temp", icon: <Grid3x3 className="size-5" /> },
  { label: "智能联动", id: "link", icon: <ToggleRight className="size-5" /> },
  { label: "设置", id: "settings", icon: <Settings className="size-5" /> },
];

type Page =
  | { id: "home" }
  | { id: "inbox" }
  | { id: "live" }
  | { id: "ai" }
  | { id: "members" }
  | { id: "enroll"; type: string }
  | { id: "temp" }
  | { id: "link" }
  | { id: "settings" }
  | { id: "services" }
  | { id: "redeem" }
  | { id: "voice" }
  | { id: "camera" }
  | { id: "editor" }
  | { id: "remind" }
  | { id: "bind" }
  | { id: "notify" }
  | { id: "dnd" }
  | { id: "help"; faq?: number }
  | { id: "album" }
  | { id: "gear" }
  | { id: "info" }
  | { id: "automation" }
  | { id: "upgrade" };

type Dialog = { kind: "phone-use" | "delete-member" | "clear-unread"; key?: "sms" | "call" } | null;

function Toggle({ on, label, onClick }: { on: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`relative h-7 w-12 shrink-0 rounded-full ${on ? "bg-[#12c4a0]" : "bg-[#E5E5EA]"}`}
    >
      <span className={`absolute top-0.5 size-6 rounded-full bg-white shadow ${on ? "left-[22px]" : "left-0.5"}`} />
    </button>
  );
}

function Bar({ title, onBack, extra }: { title: string; onBack: () => void; extra?: ReactNode }) {
  return (
    <div className="flex h-12 items-center px-1">
      <button type="button" aria-label="返回" onClick={onBack} className="grid size-10 place-items-center text-[28px] leading-none">
        ‹
      </button>
      <h2 className="flex-1 text-center text-[17px] font-semibold">{title}</h2>
      <div className="flex min-w-10 justify-end pr-2">{extra}</div>
    </div>
  );
}

export function LockPanel({ device }: { device: Device }) {
  const { data, patchDevice, pushLog, addLockUser, removeDevice } = useApp();
  const { pop, notify } = useNav();
  const panel = lockPanelOf(device.lock);
  const [stack, setStack] = useState<Page[]>([{ id: "home" }]);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [query, setQuery] = useState("");
  const [aiTab, setAiTab] = useState<"voice" | "vision" | "more">("voice");
  const [beta, setBeta] = useState(true);
  const [redeem, setRedeem] = useState("");
  const [voice, setVoice] = useState("");
  const [voice2, setVoice2] = useState("");
  const [linkIf, setLinkIf] = useState("");
  const [linkThen, setLinkThen] = useState("");
  const [linkName, setLinkName] = useState("");
  const [phone, setPhone] = useState(panel.boundPhone);
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [cardIndex, setCardIndex] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [frameWidth, setFrameWidth] = useState(0);
  const [removeAsk, setRemoveAsk] = useState(false);
  const [noticeSheet, setNoticeSheet] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const frame = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; moved: boolean; key: string; axis: "x" | "y" | null } | null>(null);
  const offset = useRef(0);
  const page = stack[stack.length - 1] ?? { id: "home" as const };
  const hold = useRef<number | null>(null);
  const fired = useRef(false);
  const [holding, setHolding] = useState(false);
  const [wifi, setWifi] = useState<WifiReading | null>(null);
  const [wifiOpen, setWifiOpen] = useState(false);
  const [wifiChecking, setWifiChecking] = useState(false);
  const [speed, setSpeed] = useState<1 | 2 | 4>(1);
  const [speedOpen, setSpeedOpen] = useState(false);
  const [recordFrom, setRecordFrom] = useState<number | null>(null);
  const [recordNow, setRecordNow] = useState(0);
  const [shutter, setShutter] = useState(false);
  const wifiBox = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ignore = false;
    void measureWifi().then((reading) => {
      if (!ignore) setWifi(reading);
    });
    const info = networkInfo();
    const refresh = () => {
      void measureWifi().then((reading) => {
        if (!ignore) setWifi(reading);
      });
    };
    window.addEventListener("online", refresh);
    window.addEventListener("offline", refresh);
    info?.addEventListener?.("change", refresh);
    return () => {
      ignore = true;
      window.removeEventListener("online", refresh);
      window.removeEventListener("offline", refresh);
      info?.removeEventListener?.("change", refresh);
    };
  }, []);

  useEffect(() => {
    if (recordFrom === null) return;
    const timer = window.setInterval(() => setRecordNow(Date.now()), 200);
    return () => window.clearInterval(timer);
  }, [recordFrom]);

  useEffect(() => {
    if (!wifiOpen) return;
    const close = (event: Event) => {
      if (!wifiBox.current?.contains(event.target as Node)) setWifiOpen(false);
    };
    window.addEventListener("pointerdown", close);
    return () => window.removeEventListener("pointerdown", close);
  }, [wifiOpen]);

  function inspectWifi() {
    setWifiOpen((open) => !open);
    setWifiChecking(true);
    void measureWifi().then((reading) => {
      setWifi(reading);
      setWifiChecking(false);
    });
  }

  function save(next: LockPanelState, log?: string) {
    patchDevice(device.id, { lock: next });
    if (log) pushLog(device.id, log);
  }

  function open(next: Page) {
    if (next.id === "live") {
      setConnecting(true);
      window.setTimeout(() => setConnecting(false), 1100);
    }
    setDialog(null);
    setStack((current) => [...current, next]);
  }

  function back() {
    if (page.id === "live" && recordFrom !== null && (Date.now() - recordFrom) / 1000 >= 1) {
      saveClip("video");
    } else if (recordFrom !== null) {
      setRecordFrom(null);
      save({ ...panel, recording: false });
    }
    setDialog(null);
    if (stack.length > 1) setStack((current) => current.slice(0, -1));
    else pop();
  }

  function saveClip(kind: "shot" | "video") {
    const album = [{ id: rid(), time: nowLabel(), kind }, ...panel.album].slice(0, 12);
    setRecordFrom(null);
    save({ ...panel, recording: false, album }, kind === "shot" ? "已截图" : "录像已保存至本地相册");
    notify(kind === "shot" ? "已保存到相册" : "录像已保存至本地相册");
  }

  function shoot() {
    setShutter(true);
    window.setTimeout(() => setShutter(false), 160);
    const album = [{ id: rid(), time: nowLabel(), kind: "shot" as const }, ...panel.album].slice(0, 12);
    save({ ...panel, album, recording: recordFrom !== null }, "已截图");
    notify("已保存到相册");
  }

  function toggleRecord() {
    if (recordFrom === null) {
      setRecordFrom(Date.now());
      setRecordNow(Date.now());
      save({ ...panel, recording: true });
      notify("开始录像");
      return;
    }
    const seconds = (Date.now() - recordFrom) / 1000;
    if (seconds < 1) {
      notify("至少录制 1 秒后才能停止");
      return;
    }
    saveClip("video");
  }

  function holdProps(hint: string, fire: () => void) {
    function stop() {
      if (hold.current) window.clearTimeout(hold.current);
      setHolding(false);
    }
    return {
      onPointerDown: (event: PointerEvent<HTMLButtonElement>) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        fired.current = false;
        setHolding(true);
        if (hold.current) window.clearTimeout(hold.current);
        hold.current = window.setTimeout(() => {
          fired.current = true;
          setHolding(false);
          fire();
        }, 1000);
      },
      onPointerUp: () => {
        const done = fired.current;
        stop();
        if (!done) notify(hint);
      },
      onPointerCancel: stop,
      onContextMenu: (event: MouseEvent) => event.preventDefault(),
    };
  }

  function toggleLock() {
    if (device.locked && !panel.remoteUnlock) {
      notify("远程开锁已关闭");
      return;
    }
    const nextLocked = !device.locked;
    patchDevice(device.id, { locked: nextLocked });
    pushLog(device.id, nextLocked ? "长按上锁" : "长按开锁");
    notify(nextLocked ? "已上锁" : "已开锁");
  }

  const unlocked = !device.locked;
  const latest = device.logs[0];
  const clock = latest?.time.match(/(\d{1,2}:\d{2})/)?.[1] ?? "";
  const slides = [
    {
      key: "album",
      title: "相册/日志",
      body: latest ? `${clock}${lockPreviewText(latest.text)}` : "暂无记录",
      count: device.logs.length,
      icon: "list" as const,
      go: () => open({ id: "album" }),
    },
    {
      key: "notice",
      title: "通知",
      body: "本地录像会丢？云存永久存",
      count: 0,
      icon: "bell" as const,
      go: () => setNoticeSheet(true),
    },
  ];
  const peek = 64;
  const gap = 10;
  const inset = 16;
  const cardWidth = Math.max(frameWidth - peek - inset, 0);
  const stride = cardWidth + gap;

  useLayoutEffect(() => {
    const node = frame.current;
    if (!node || page.id !== "home") return;
    const measure = () => setFrameWidth(node.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [page.id]);

  function shiftCard(step: number) {
    setCardIndex((index) => Math.min(slides.length - 1, Math.max(0, index + step)));
  }

  return (
    <div className="relative flex h-full flex-col bg-[#F7F8FA] text-[#222]">
      <div className="min-h-0 flex-1 overflow-y-auto">
        {page.id === "home" ? (
          <section className="min-h-full bg-[#F3F4F6]">
            <header className="relative flex h-12 items-center justify-center px-12">
              <button type="button" aria-label="返回" onClick={back} className="absolute left-1 grid size-10 place-items-center">
                <ChevronLeft className="size-6" />
              </button>
              <h1 className="truncate text-[17px] font-medium">{device.name || "可视智能门锁"}</h1>
              <button type="button" aria-label="设备设置" onClick={() => open({ id: "gear" })} className="absolute right-2 grid size-10 place-items-center">
                <Pencil className="size-5" />
              </button>
            </header>
            <div ref={wifiBox} className="relative z-10 flex justify-center pt-2">
              <button
                type="button"
                aria-label="查看网速"
                aria-expanded={wifiOpen}
                onClick={inspectWifi}
                className="grid size-10 place-items-center rounded-full bg-[#E7F8F2]"
              >
                <WifiMark bars={wifi?.bars ?? 0} />
              </button>
              {wifiOpen ? (
                <div className="absolute top-12 left-1/2 -translate-x-1/2">
                  <div className="relative min-w-[76px] rounded-[10px] bg-white px-3 py-1.5 text-center shadow-[0_6px_18px_rgba(32,36,40,0.12)]">
                    <span className="absolute -top-1 left-1/2 size-2.5 -translate-x-1/2 rotate-45 bg-white" />
                    <p className="relative text-[13px] leading-5 font-medium text-[#333]">
                      {wifiChecking && !wifi ? "检测中" : wifi && wifi.mbps > 0 ? `${wifi.db}DB` : "无网络"}
                    </p>
                    <p className="relative text-[11px] leading-4 text-[#8A8F98]">
                      {wifiChecking && !wifi ? "正在检查" : wifi && wifi.mbps > 0 ? `${formatMbps(wifi.mbps)} Mbps` : "0 Mbps"}
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
            <button
              type="button"
              aria-label={unlocked ? "长按上锁" : "长按开锁"}
              {...holdProps(unlocked ? "请长按上锁" : "请长按开锁", toggleLock)}
              className="mx-auto mt-4 grid size-[210px] select-none place-items-center"
            >
              <span className="relative grid size-[210px] place-items-center">
                <svg viewBox="0 0 100 100" className="absolute inset-0 size-full">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#D9F6EF" strokeWidth="9" />
                  {holding ? (
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#20C6A4"
                      strokeWidth="9"
                      strokeLinecap="round"
                      strokeDasharray="78 174"
                      className="lock-ring-spin"
                    />
                  ) : (
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#20C6A4" strokeWidth="9" />
                  )}
                </svg>
                <span className="grid size-[132px] place-items-center rounded-full bg-white text-[#20C6A4]">
                  <Lock className="size-8" />
                  <span className="mt-1 text-[14px]">{unlocked ? "已开锁" : "长按开锁"}</span>
                </span>
              </span>
            </button>
            <div className="mt-4 flex flex-col items-center text-[#8A8F98]">
              <BatteryGauge percent={device.battery} />
              <p className="mt-1 text-[13px]">电池电量: {device.battery}%</p>
            </div>
            <div
              ref={frame}
              className="mt-5 overflow-hidden"
              style={{ touchAction: "pan-y" }}
              onPointerDown={(event) => {
                const key = (event.target as HTMLElement).closest("[data-slide]")?.getAttribute("data-slide") ?? "";
                drag.current = { x: event.clientX, y: event.clientY, moved: false, key, axis: null };
                offset.current = 0;
              }}
              onPointerMove={(event) => {
                const current = drag.current;
                if (!current || stride <= gap) return;
                const dx = event.clientX - current.x;
                const dy = event.clientY - current.y;
                if (!current.axis && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) {
                  current.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
                  if (current.axis === "x") {
                    current.moved = true;
                    setDragging(true);
                    event.currentTarget.setPointerCapture(event.pointerId);
                  }
                }
                if (current.axis !== "x") return;
                const min = -(slides.length - 1) * stride;
                const next = Math.min(24, Math.max(min - 24, -cardIndex * stride + dx)) + cardIndex * stride;
                offset.current = next;
                setDragX(next);
              }}
              onPointerUp={() => {
                const current = drag.current;
                drag.current = null;
                const delta = offset.current;
                offset.current = 0;
                setDragging(false);
                setDragX(0);
                if (!current || current.axis === "y") return;
                if (!current.moved) {
                  slides.find((slide) => slide.key === current.key)?.go();
                  return;
                }
                if (delta < -40) shiftCard(1);
                else if (delta > 40) shiftCard(-1);
              }}
              onPointerCancel={() => {
                drag.current = null;
                offset.current = 0;
                setDragging(false);
                setDragX(0);
              }}
            >
              <div
                className="flex"
                style={{
                  gap,
                  paddingLeft: inset,
                  transform: `translateX(${-cardIndex * stride + dragX}px)`,
                  transition: dragging ? "none" : "transform 280ms ease",
                }}
              >
                {slides.map((slide) => (
                  <button
                    key={slide.key}
                    type="button"
                    data-slide={slide.key}
                    className="flex shrink-0 items-center gap-3 rounded-2xl bg-white px-4 py-3 text-left shadow-[0_6px_18px_rgba(20,24,40,0.04)]"
                    style={{ width: cardWidth || "100%" }}
                  >
                    {slide.icon === "list" ? (
                      <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-[#2BD18A] text-white">
                        <List className="size-5" strokeWidth={2.4} />
                      </span>
                    ) : (
                      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#E8FBF3] text-[#2BD18A]">
                        <Bell className="size-5" />
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="text-[16px] font-medium">{slide.title}</span>
                        {slide.count > 0 ? (
                          <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[#F04444] px-1 text-[11px] text-white">{slide.count}</span>
                        ) : null}
                      </span>
                      <span className="mt-1 block truncate text-[13px] text-[#666]">· {slide.body}</span>
                    </span>
                    <ChevronRight className="size-4 shrink-0 text-[#D0D0D0]" />
                  </button>
                ))}
              </div>
            </div>
            <div className="mx-4 mt-3 overflow-hidden rounded-2xl bg-white">
              {MENU.map((row) => (
                <button key={row.label} type="button" onClick={() => open({ id: row.id })} className="flex w-full items-center gap-3 px-4 py-3.5 text-left">
                  <span className="grid size-9 place-items-center rounded-full bg-[#2BD18A] text-white">{row.icon}</span>
                  <span className="text-[16px]">{row.label}</span>
                </button>
              ))}
            </div>
          </section>
        ) : null}

        {page.id === "live" ? (
          <section className="flex min-h-full flex-col bg-black text-white">
            <div className="flex h-12 items-center px-2">
              <button type="button" aria-label="返回" onClick={back} className="grid size-10 place-items-center text-[28px]">‹</button>
              <h1 className="flex-1 text-center text-[16px] font-medium">视频监控</h1>
              <span className="w-10" />
            </div>
            <div className="relative min-h-0 flex-1 overflow-hidden bg-[#12181f]">
              <div className={`absolute inset-0 ${panel.clarity === "标清" ? "blur-[1.4px]" : ""}`}>
                <div className="live-pan absolute inset-y-0 -left-[8%] w-[116%] bg-[radial-gradient(circle_at_50%_38%,#60788c,transparent_42%),linear-gradient(#314252,#141a20)]" style={{ animationDuration: `${6 / speed}s` }} />
                <div className="absolute inset-x-[16%] top-[14%] bottom-[16%] rounded-[2px] border-[12px] border-[#16191d] bg-[#2a3846]/40" />
              </div>
              {recordFrom !== null ? (
                <div className="absolute top-4 left-4 flex items-center gap-2 rounded-full bg-black/55 px-3 py-1 text-[13px]">
                  <i className="size-2 rounded-full bg-[#FF3B30]" />
                  {recordClock(recordFrom, recordNow)}
                </div>
              ) : null}
              {panel.muted ? <div className="absolute top-4 right-4 rounded-full bg-black/55 px-3 py-1 text-[12px]">静音</div> : null}
              {shutter ? <div className="absolute inset-0 bg-white/75" /> : null}
              {connecting ? <div className="absolute inset-0 grid place-items-center bg-black/55 text-[15px]">正在构建加密通道</div> : null}
            </div>
            <div className="grid grid-cols-6 items-end gap-1 px-2 pt-3 pb-5 text-center text-[11px]">
              {(["高清", "标清"] as const).map((level) => {
                const active = (panel.clarity === "标清" ? "标清" : "高清") === level;
                return (
                  <button
                    key={level}
                    type="button"
                    aria-label={level}
                    aria-pressed={active}
                    onClick={() => save({ ...panel, clarity: level, recording: recordFrom !== null })}
                    className="flex w-full flex-col items-center gap-1"
                  >
                    <span className={`grid h-9 min-w-11 place-items-center rounded-lg px-1 text-[13px] ${active ? "bg-white font-medium text-[#16181c]" : "bg-white/15 text-white/75"}`}>{level}</span>
                    <span className="text-[11px] text-transparent">清晰</span>
                  </button>
                );
              })}
              <div className="relative">
                <button
                  type="button"
                  aria-label="变速"
                  aria-expanded={speedOpen}
                  onClick={() => setSpeedOpen((open) => !open)}
                  className="flex w-full flex-col items-center gap-1"
                >
                  <i className="grid size-9 place-items-center rounded-full bg-white/15 text-[13px] font-medium not-italic">{speed}×</i>
                  变速
                </button>
                {speedOpen ? (
                  <div className="absolute bottom-14 left-1/2 z-10 w-16 -translate-x-1/2 overflow-hidden rounded-xl bg-white text-[#222] shadow-lg">
                    {([1, 2, 4] as const).map((rate) => (
                      <button
                        key={rate}
                        type="button"
                        aria-label={`${rate}倍速`}
                        onClick={() => {
                          setSpeed(rate);
                          setSpeedOpen(false);
                          notify(`已切换 ${rate}×`);
                        }}
                        className={`block h-9 w-full text-[13px] ${speed === rate ? "bg-[#E8F8F3] font-medium text-[#12987a]" : ""}`}
                      >
                        {rate}×
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
              <button
                type="button"
                aria-label="静音"
                aria-pressed={panel.muted}
                onClick={() => {
                  save({ ...panel, muted: !panel.muted, recording: recordFrom !== null });
                  notify(panel.muted ? "已打开声音" : "已静音");
                }}
                className="flex w-full flex-col items-center gap-1"
              >
                <i className={`grid size-9 place-items-center rounded-full not-italic ${panel.muted ? "bg-[#FF3B30] text-white" : "bg-white/15"}`}>
                  {panel.muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
                </i>
                静音
              </button>
              <button type="button" aria-label="截图" onClick={shoot} className="flex w-full flex-col items-center gap-1">
                <i className="grid size-9 place-items-center rounded-full bg-white/15 not-italic">
                  <Images className="size-4" />
                </i>
                相册
              </button>
              <button type="button" aria-label="录像" aria-pressed={recordFrom !== null} onClick={toggleRecord} className="flex w-full flex-col items-center gap-1">
                <i className={`grid size-9 place-items-center rounded-full not-italic ${recordFrom !== null ? "bg-[#FF3B30] text-white" : "bg-white/15"}`}>
                  <Video className="size-4" />
                </i>
                {recordFrom !== null ? recordClock(recordFrom, recordNow) : "录像"}
              </button>
            </div>
          </section>
        ) : null}

        {page.id === "ai" ? (
          <section>
            <Bar title="门锁 AI" onBack={back} />
            {beta ? (
              <div className="mx-4 flex items-center justify-between rounded-xl bg-[#243044] px-3 py-2 text-[13px] text-white">
                <span>Beta 标记的功能处于试用阶段，AI 会继续学习。</span>
                <button type="button" aria-label="关闭" onClick={() => setBeta(false)} className="px-2">×</button>
              </div>
            ) : null}
            <div className="mx-4 mt-3 h-28 rounded-2xl bg-gradient-to-b from-[#d9f7ef] to-white" />
            <div className="mt-3 flex justify-around text-[14px]">
              {(["voice", "vision", "more"] as const).map((id) => (
                <button key={id} type="button" onClick={() => setAiTab(id)} className={aiTab === id ? "font-semibold text-[#12a888]" : "text-[#8e8e93]"}>
                  {id === "voice" ? "AI×语音" : id === "vision" ? "AI×视觉" : "AI×更多"}
                </button>
              ))}
            </div>
            {aiTab === "voice" ? (
              <div className="mx-4 mt-4 rounded-2xl bg-white p-4">
                <span className="rounded bg-[#ff7a1a] px-1.5 py-0.5 text-[11px] text-white">NEW</span>
                <p className="mt-2">一大波 AI 能力即将上线，敬请期待</p>
                <button type="button" onClick={() => open({ id: "help" })} className="mt-4 h-11 w-full rounded-full bg-[#2f9bff] text-white">服务中心</button>
              </div>
            ) : null}
            {aiTab === "vision" ? (
              <div className="mx-4 mt-4 flex flex-col gap-3">
                <div className="rounded-2xl bg-white p-4"><b>人脸识别</b><p className="mt-1 text-[13px] text-[#8e8e93]">识别熟悉的家人。演示不会采集真实人脸。</p></div>
                <div className="rounded-2xl bg-white p-4"><b>包裹识别</b><p className="mt-1 text-[13px] text-[#8e8e93]">门前出现包裹时记一条消息。演示不会分析真实画面。</p></div>
              </div>
            ) : null}
            {aiTab === "more" ? (
              <div className="mx-4 mt-4 rounded-2xl bg-white px-4">
                <button type="button" onClick={() => open({ id: "services" })} className="flex w-full items-center justify-between border-b border-[#f2f3f5] py-4">精选服务<span>›</span></button>
                <button type="button" onClick={() => open({ id: "redeem" })} className="flex w-full items-center justify-between py-4">兑换中心<span>›</span></button>
              </div>
            ) : null}
          </section>
        ) : null}

        {page.id === "members" ? (
          <section>
            <Bar title="成员管理" onBack={back} extra={<button type="button" aria-label="设置" onClick={() => open({ id: "settings" })}>⚙</button>} />
            <div className="mx-4 rounded-2xl bg-white px-4 py-3">
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索成员" className="h-10 w-full bg-transparent outline-none" />
            </div>
            {!query.trim() || panel.admin.includes(query.trim()) ? (
              <div className="mx-4 mt-3 rounded-2xl bg-white px-4">
                <div className="border-b border-[#f2f3f5] py-3"><b>{panel.admin}</b><small className="ml-2 text-[#8e8e93]">管理员</small></div>
                {["指纹", "密码", "门卡", "人脸识别"].map((type) => {
                  const count = device.lockUsers.filter((user) => user.method === type).length;
                  return (
                    <button key={type} type="button" onClick={() => open({ id: "enroll", type })} className="flex w-full items-center justify-between border-b border-[#f2f3f5] py-4 last:border-b-0">
                      <span>{type}</span><span className="text-[#8e8e93]">{count ? `${count} 枚` : "添加"} ›</span>
                    </button>
                  );
                })}
              </div>
            ) : <div className="mx-4 mt-3 rounded-2xl bg-white p-4 text-[#8e8e93]">没有匹配的成员</div>}
            <p className="px-5 pt-4 text-[13px] text-[#8e8e93]">其他成员</p>
            <div className="mx-4 rounded-2xl bg-white p-4 text-[#8e8e93]">还没有其他成员</div>
            <button type="button" onClick={() => setDialog({ kind: "delete-member" })} className="mx-4 mt-4 h-11 w-[calc(100%-2rem)] rounded-full border border-[#f3d2cc] bg-white text-[#e25b4a]">删除成员</button>
          </section>
        ) : null}

        {page.id === "enroll" ? (
          <section className="bg-white">
            <Bar title={page.type === "指纹" ? "如何添加指纹" : page.type === "人脸识别" ? "如何添加人脸识别" : page.type === "密码" ? "如何添加密码" : "如何添加门卡"} onBack={back} />
            <div className="mx-4 rounded-2xl bg-[#F7F8FA] p-4 leading-6">
              {page.type === "指纹" ? "将手指放在锁的指纹区，按提示抬起再按下，直到提示成功。" : page.type === "人脸识别" ? "正对门锁摄像头，按开始后在锁前停留，直到提示录入成功。" : page.type === "密码" ? "在锁的键盘上输入 6 位数字，再输入一次确认。" : "将门卡放在图示感应区域，直到听到录入成功。若出现其他提示，则添加失败。"}
            </div>
            <button type="button" className="mx-4 mt-6 h-11 w-[calc(100%-2rem)] rounded-full bg-[#12c4a0] text-white" onClick={() => {
              addLockUser(device.id, `${page.type}${device.lockUsers.length + 1}`, page.type);
              pushLog(device.id, `${page.type}添加成功`);
              notify("添加成功");
              back();
            }}>开始添加</button>
          </section>
        ) : null}

        {page.id === "temp" ? (
          <section>
            <Bar title="临时密码" onBack={back} />
            <div className="mx-4 rounded-2xl bg-white p-4">
              <div className="flex items-center justify-between"><span>当前密码</span><b>{panel.tempPass || "未生成"}</b></div>
              <p className="mt-2 text-[13px] text-[#8e8e93]">{panel.tempPass ? `${panel.tempHours} 小时内有效。只在这台浏览器里保存。` : "生成后可在门锁键盘上使用。不会发给真实访客。"}</p>
              {[2, 24].map((hours) => (
                <button key={hours} type="button" className={`mt-3 h-11 w-full rounded-full ${hours === 2 ? "bg-[#12c4a0] text-white" : "bg-[#e8faf5] text-[#12987a]"}`} onClick={() => {
                  const code = String(100000 + Math.floor(Math.random() * 900000));
                  save({ ...panel, tempHours: hours, tempPass: code }, `临时密码 ${code}`);
                  notify(`临时密码 ${code}`);
                }}>生成 {hours} 小时密码</button>
              ))}
              {panel.tempPass ? <button type="button" className="mt-3 h-11 w-full rounded-full bg-[#F2F3F5]" onClick={() => { save({ ...panel, tempPass: "" }, "临时密码已删除"); }}>删除临时密码</button> : null}
            </div>
          </section>
        ) : null}

        {page.id === "link" ? (
          <section>
            <Bar title="智能联动" onBack={back} />
            <div className="mx-4 rounded-2xl bg-white px-4">
              {panel.links.map((item) => (
                <div key={item.id} className="flex items-center justify-between border-b border-[#f2f3f5] py-3 last:border-b-0">
                  <span><b className="block">{item.name}</b><small className="text-[12px] text-[#8e8e93]">{item.desc}</small></span>
                  <Toggle label={item.name} on={item.on} onClick={() => {
                    const links = panel.links.map((link) => link.id === item.id ? { ...link, on: !link.on } : link);
                    save({ ...panel, links }, `${item.name}${item.on ? "已关闭" : "已打开"}`);
                    setLoading(true);
                    window.setTimeout(() => setLoading(false), 700);
                  }} />
                </div>
              ))}
            </div>
            <button type="button" onClick={() => open({ id: "editor" })} className="mx-4 mt-4 h-11 w-[calc(100%-2rem)] rounded-full bg-[#12c4a0] text-white">自定义联动类型</button>
            <button type="button" onClick={() => open({ id: "remind" })} className="mx-4 mt-3 flex h-12 w-[calc(100%-2rem)] items-center justify-between rounded-2xl bg-white px-4">选择提醒方式<span>›</span></button>
            {loading ? <p className="mt-4 text-center text-[13px] text-[#8e8e93]">加载中…</p> : null}
          </section>
        ) : null}

        {page.id === "editor" ? (
          <section>
            <Bar title="编辑" onBack={back} />
            <div className="mx-4 flex flex-col gap-2 rounded-2xl bg-white p-4">
              <b>如果</b>
              <input value={linkIf} onChange={(event) => setLinkIf(event.target.value)} placeholder="例如 门锁告警" className="h-11 rounded-xl bg-[#F7F8FA] px-3 outline-none" />
              <b>执行</b>
              <input value={linkThen} onChange={(event) => setLinkThen(event.target.value)} placeholder="例如 打开玄关灯" className="h-11 rounded-xl bg-[#F7F8FA] px-3 outline-none" />
              <b>名称</b>
              <input value={linkName} onChange={(event) => setLinkName(event.target.value)} placeholder="自定义" className="h-11 rounded-xl bg-[#F7F8FA] px-3 outline-none" />
            </div>
            <button type="button" className="mx-4 mt-4 h-11 w-[calc(100%-2rem)] rounded-full bg-[#12c4a0] text-white" onClick={() => {
              const name = linkName.trim() || "自定义联动";
              save({ ...panel, links: [...panel.links, { id: rid(), name, desc: `${linkIf.trim() || "条件"} → ${linkThen.trim() || "动作"}`, on: true }] });
              setLinkIf(""); setLinkThen(""); setLinkName("");
              notify("已保存联动");
              back();
            }}>保存</button>
          </section>
        ) : null}

        {page.id === "settings" ? (
          <section>
            <Bar title="设置" onBack={back} />
            <div className="mx-4 grid grid-cols-2 gap-3 rounded-2xl bg-white p-4 text-center">
              <button type="button" onClick={() => open({ id: "services" })}><i className="mx-auto grid size-12 place-items-center rounded-full bg-[#2f9bff] text-white not-italic">云</i>云存储服务</button>
              <button type="button" onClick={() => open({ id: "ai" })}><i className="mx-auto grid size-12 place-items-center rounded-full bg-[#12c4a0] text-white not-italic">AI</i>AI设置</button>
            </div>
            <p className="px-5 pt-4 text-[13px] text-[#8e8e93]">通用设置</p>
            <button type="button" onClick={() => open({ id: "camera" })} className="mx-4 flex h-14 w-[calc(100%-2rem)] items-center justify-between rounded-2xl bg-white px-4">摄像头设置<span>›</span></button>
            <p className="px-5 pt-4 text-[13px] text-[#8e8e93]">开锁设置</p>
            <div className="mx-4 rounded-2xl bg-white px-4">
              <div className="flex items-center justify-between border-b border-[#f2f3f5] py-3"><span>远程开锁</span><Toggle label="远程开锁" on={panel.remoteUnlock} onClick={() => save({ ...panel, remoteUnlock: !panel.remoteUnlock })} /></div>
              <button type="button" onClick={() => notify("仅管理员可以使用远程开锁")} className="flex w-full items-center justify-between border-b border-[#f2f3f5] py-4">权限设置<span className="text-[13px] text-[#8e8e93]">仅管理员可以使用 ›</span></button>
              <div className="flex items-center justify-between border-b border-[#f2f3f5] py-3">
                <span>语音密码<small className="block text-[12px] text-[#8e8e93]">语音音箱喊密码开门需要验证此密码</small></span>
                <Toggle label="语音密码" on={panel.voiceOn} onClick={() => {
                  if (!panel.voiceOn) { setVoice(""); setVoice2(""); open({ id: "voice" }); return; }
                  save({ ...panel, voiceOn: false, voicePin: "" });
                  notify("已关闭语音密码");
                }} />
              </div>
              <div className="flex items-center justify-between border-b border-[#f2f3f5] py-3"><span>手势密码</span><Toggle label="手势密码" on={panel.wrist} onClick={() => save({ ...panel, wrist: !panel.wrist })} /></div>
              <div className="flex items-center justify-between py-3"><span>门铃按键电话通知服务</span><Toggle label="门铃电话通知" on={panel.phoneService} onClick={() => save({ ...panel, phoneService: !panel.phoneService })} /></div>
            </div>
          </section>
        ) : null}

        {page.id === "voice" ? (
          <section className="bg-white">
            <Bar title="设置语音密码" onBack={back} />
            <div className="mx-4 flex flex-col gap-3">
              <b>请输入 4-6 位数字密码</b>
              <p className="text-[13px] text-[#8e8e93]">语音音箱喊开门需要验证此密码</p>
              <input value={voice} inputMode="numeric" maxLength={6} onChange={(event) => setVoice(event.target.value.replace(/\D/g, ""))} placeholder="请输入" className="h-11 rounded-xl bg-[#F7F8FA] px-3 outline-none" />
              <input value={voice2} inputMode="numeric" maxLength={6} onChange={(event) => setVoice2(event.target.value.replace(/\D/g, ""))} placeholder="请再次输入" className="h-11 rounded-xl bg-[#F7F8FA] px-3 outline-none" />
              <button type="button" className="h-11 rounded-full bg-[#12c4a0] text-white" onClick={() => {
                if (!/^\d{4,6}$/.test(voice) || voice !== voice2) { notify("请输入一致的 4-6 位数字"); return; }
                save({ ...panel, voicePin: voice, voiceOn: true }, "已设置语音密码");
                notify("语音密码已保存");
                back();
              }}>完成</button>
            </div>
          </section>
        ) : null}

        {page.id === "camera" ? (
          <section>
            <Bar title="摄像头设置" onBack={back} />
            <div className="mx-4 rounded-2xl bg-white px-4">
              <div className="flex items-center justify-between border-b border-[#f2f3f5] py-3"><span>夜视</span><Toggle label="夜视" on={panel.night} onClick={() => save({ ...panel, night: !panel.night })} /></div>
              <div className="flex items-center justify-between border-b border-[#f2f3f5] py-3"><span>宽动态</span><Toggle label="宽动态" on={panel.wdr} onClick={() => save({ ...panel, wdr: !panel.wdr })} /></div>
              <button type="button" onClick={() => open({ id: "live" })} className="flex w-full items-center justify-between py-4">查看实时画面<span>›</span></button>
            </div>
          </section>
        ) : null}

        {page.id === "services" ? (
          <section>
            <Bar title="精选服务" onBack={back} />
            <div className="mx-4 flex items-center gap-3 rounded-2xl bg-white p-4"><i className="grid size-10 place-items-center rounded-full bg-[#243044] text-white not-italic">锁</i><span><small className="block text-[#8e8e93]">当前设备</small><b>可视智能门锁</b></span></div>
            <div className="mx-4 mt-3 rounded-2xl bg-white p-4">
              {[["7天智能云存储 · 年", "199.99", "365"], ["7天智能云存储 · 月", "18.99", "30"], ["30天智能云存储 · 年", "279.99", "365"], ["30天智能云存储 · 月", "26.99", "30"]].map(([name, price, days]) => (
                <div key={name} className="flex items-center justify-between border-b border-[#f2f3f5] py-3"><span><b className="block">{name}</b><small className="text-[12px] text-[#8e8e93]">{days} 天演示套餐，不会扣费</small></span><span className="text-[#e25b4a]">¥{price}</span></div>
              ))}
              <button type="button" onClick={() => open({ id: "redeem" })} className="flex w-full items-center justify-between py-4">更多功能 · 兑换中心<span>›</span></button>
            </div>
            <button type="button" onClick={() => notify("演示环境不会扣费，也没有开通云存储")} className="mx-4 mt-4 h-11 w-[calc(100%-2rem)] rounded-full bg-[#12c4a0] text-white">立即开通</button>
            <p className="mt-3 text-center text-[12px] text-[#8e8e93]">演示价格仅供界面对照，不能付款。</p>
          </section>
        ) : null}

        {page.id === "redeem" ? (
          <section className="min-h-full bg-[#2a2438] text-white">
            <Bar title="兑换中心" onBack={back} />
            <div className="mx-4 rounded-2xl bg-white p-4 text-[#222]">
              <b>输入兑换码兑换</b>
              <input value={redeem} onChange={(event) => setRedeem(event.target.value)} placeholder="请输入兑换码" className="mt-3 h-11 w-full rounded-xl bg-[#F7F8FA] px-3 outline-none" />
              <button type="button" className="mt-3 h-11 w-full rounded-full bg-[#12c4a0] text-white" onClick={() => {
                if (redeem.trim().toUpperCase() !== "MINGGUANG") { notify("兑换码无效，可试 MINGGUANG"); return; }
                setRedeem("");
                notify("兑换成功，权益只记在本机");
              }}>立即兑换</button>
              <p className="mt-4"><b>兑换须知</b></p>
              <p className="mt-1 text-[13px] leading-6 text-[#8e8e93]">1. 请核对数字和字母。<br />2. 连续输错 5 次后需要稍后再试。<br />3. 兑换码不含大写 G、I、O。<br />4. 过期兑换码无效。演示码是 MINGGUANG。</p>
            </div>
          </section>
        ) : null}

        {page.id === "remind" ? (
          <section>
            <div className="flex h-12 items-center px-1">
              <button type="button" aria-label="返回" onClick={back} className="grid size-10 place-items-center text-[28px]">‹</button>
              <h2 className="flex-1 text-center text-[17px] font-semibold">选择提醒方式</h2>
              <button type="button" className="pr-3 text-[#ff7a1a]" onClick={() => { notify("提醒方式已保存"); open({ id: "notify" }); }}>下一步</button>
            </div>
            <p className="px-4 text-[13px] text-[#8e8e93]">消息推送支持多选</p>
            <div className="mx-4 rounded-2xl bg-white px-4">
              {([["center", "消息中心"], ["sms", "短信提醒"], ["call", "电话提醒"]] as const).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between border-b border-[#f2f3f5] py-3 last:border-b-0">
                  <span>{label}</span>
                  <Toggle label={label} on={panel.remind[key]} onClick={() => {
                    if ((key === "sms" || key === "call") && !panel.remind[key]) { setDialog({ kind: "phone-use", key }); return; }
                    save({ ...panel, remind: { ...panel.remind, [key]: !panel.remind[key] } });
                  }} />
                </div>
              ))}
            </div>
            <button type="button" onClick={() => open({ id: "bind" })} className="mx-4 mt-3 flex h-12 w-[calc(100%-2rem)] items-center justify-between rounded-2xl bg-white px-4">手机绑定<span>›</span></button>
          </section>
        ) : null}

        {page.id === "bind" ? (
          <section className="bg-white">
            <Bar title="手机绑定" onBack={back} />
            <div className="mx-4">
              <b>手机号码</b>
              <input value={phone} inputMode="numeric" maxLength={11} onChange={(event) => setPhone(event.target.value.replace(/\D/g, ""))} placeholder="请输入手机号" className="mt-3 h-11 w-full rounded-xl bg-[#F7F8FA] px-3 outline-none" />
              <button type="button" className="mt-4 h-11 w-full rounded-full bg-[#12c4a0] text-white" onClick={() => {
                if (!/^1\d{10}$/.test(phone)) { notify("请输入 11 位手机号"); return; }
                save({ ...panel, boundPhone: phone });
                notify("手机号已保存在本机");
                back();
              }}>保存</button>
              <p className="mt-3 text-[13px] text-[#8e8e93]">号码只保存在本机，不会发送短信。</p>
            </div>
          </section>
        ) : null}

        {page.id === "inbox" ? (
          <section>
            <Bar title="通知" onBack={back} />
            <p className="px-5 py-6 text-center text-[14px] text-[#8e8e93]">开锁、门铃和对讲这些提醒都记在相册和日志里。</p>
            <button type="button" onClick={() => open({ id: "album" })} className="mx-4 h-11 w-[calc(100%-2rem)] rounded-full bg-[#12c4a0] text-white">去看相册和日志</button>
          </section>
        ) : null}

        {page.id === "notify" ? (
          <section>
            <Bar title="通知设置" onBack={back} />
            <div className="mx-4 rounded-2xl bg-white px-4">
              <b className="block py-3">可视智能门锁</b>
              <div className="flex items-center justify-between border-t border-[#f2f3f5] py-3"><span>告警</span><Toggle label="告警" on={panel.notifyLock} onClick={() => save({ ...panel, notifyLock: !panel.notifyLock })} /></div>
              <div className="flex items-center justify-between border-t border-[#f2f3f5] py-3"><span>电话</span><Toggle label="电话" on={panel.notifyCall} onClick={() => save({ ...panel, notifyCall: !panel.notifyCall })} /></div>
            </div>
            <p className="px-5 pt-4 text-[13px] text-[#8e8e93]">移动侦测</p>
            <div className="mx-4 rounded-2xl bg-white px-4">
              <button type="button" onClick={() => open({ id: "dnd" })} className="flex w-full items-center justify-between border-b border-[#f2f3f5] py-4">移动侦测栏<span>›</span></button>
              <div className="flex items-center justify-between py-3"><span>消息中心</span><Toggle label="消息中心" on={panel.aiNotify} onClick={() => save({ ...panel, aiNotify: !panel.aiNotify })} /></div>
            </div>
          </section>
        ) : null}

        {page.id === "dnd" ? (
          <section>
            <Bar title="移动侦测栏" onBack={back} />
            <div className="mx-4 rounded-2xl bg-white p-4">
              <p>有人逗留、门铃呼叫和开锁这些操作提醒，都会记在相册和日志里。</p>
              <div className="mt-3 flex items-center justify-between"><span>勿扰</span><Toggle label="勿扰" on={panel.dnd} onClick={() => save({ ...panel, dnd: !panel.dnd })} /></div>
            </div>
            <button type="button" className="mx-4 mt-4 h-11 w-[calc(100%-2rem)] rounded-full bg-[#12c4a0] text-white" onClick={() => { notify(panel.dnd ? "已开启勿扰" : "设置已保存"); back(); }}>保存设置</button>
          </section>
        ) : null}

        {page.id === "album" ? (
          <LockAlbum device={device} panel={panel} onBack={back} onCloud={() => open({ id: "services" })} notify={notify} />
        ) : null}

        {page.id === "gear" ? (
          <section className="min-h-full bg-[#F4F5F7] pb-8">
            <header className="flex h-12 items-center px-2">
              <button type="button" aria-label="返回" onClick={back} className="grid size-10 place-items-center"><ChevronLeft className="size-6" /></button>
              <span className="grid size-8 place-items-center rounded-lg bg-white text-[#20C6A4]"><Lock className="size-4" /></span>
              {editingName ? (
                <input
                  autoFocus
                  value={device.name}
                  onChange={(event) => patchDevice(device.id, { name: event.target.value })}
                  onBlur={() => setEditingName(false)}
                  className="mx-2 h-9 min-w-0 flex-1 rounded-lg bg-white px-2 text-[16px] outline-none"
                />
              ) : <h1 className="mx-2 min-w-0 flex-1 truncate text-[17px] font-medium">{device.name || "可视智能门锁"}</h1>}
              <button type="button" aria-label="编辑名称" onClick={() => setEditingName(true)} className="grid size-9 place-items-center"><Pencil className="size-4" /></button>
              <button type="button" aria-label="设备信息" onClick={() => open({ id: "info" })} className="grid size-9 place-items-center"><ChevronRight className="size-5 text-[#C8C8C8]" /></button>
            </header>
            <div className="grid grid-cols-2 gap-3 px-4 pt-2">
              <button type="button" onClick={() => open({ id: "info" })} className="rounded-2xl bg-white p-4 text-left">
                <span className="grid size-9 place-items-center rounded-full bg-[#E8F1FF] text-[#3B82F6]"><Info className="size-5" /></span>
                <span className="mt-6 block text-[16px]">设备信息</span>
              </button>
              <button type="button" onClick={() => open({ id: "automation" })} className="rounded-2xl bg-white p-4 text-left">
                <span className="grid size-9 place-items-center rounded-full bg-[#E8F1FF] text-[#3B82F6]"><Check className="size-5" /></span>
                <span className="mt-6 block text-[15px] leading-6">“手动执行”和“自动化”</span>
              </button>
              <button type="button" onClick={() => open({ id: "notify" })} className="rounded-2xl bg-white p-4 text-left">
                <span className="grid size-9 place-items-center rounded-full bg-[#E8F1FF] text-[#3B82F6]"><Bell className="size-5" /></span>
                <span className="mt-6 block text-[15px] leading-6">设备告警电话短信通知</span>
              </button>
            </div>
            <p className="px-5 pb-2 pt-5 text-[13px] text-[#98A0AA]">设备设置</p>
            <div className="mx-4 flex items-center justify-between rounded-2xl bg-white px-4 py-4">
              <span className="text-[16px]">离线提醒</span>
              <Toggle label="离线提醒" on={device.offlineAlert} onClick={() => {
                patchDevice(device.id, { offlineAlert: !device.offlineAlert });
                pushLog(device.id, device.offlineAlert ? "已关闭离线提醒" : "已打开离线提醒");
              }} />
            </div>
            <p className="px-5 pb-2 pt-5 text-[13px] text-[#98A0AA]">通用设置</p>
            <div className="mx-4 overflow-hidden rounded-2xl bg-white px-4">
              <button type="button" onClick={() => open({ id: "help" })} className="flex w-full items-center justify-between border-b border-[#F3F4F6] py-4 text-[16px]">帮助中心<ChevronRight className="size-4 text-[#C8C8C8]" /></button>
              <button type="button" onClick={() => notify("可以在浏览器菜单里选择添加到主屏幕")} className="flex w-full items-center justify-between border-b border-[#F3F4F6] py-4 text-[16px]">添加到主屏幕<ChevronRight className="size-4 text-[#C8C8C8]" /></button>
              <button type="button" onClick={() => open({ id: "upgrade" })} className="flex w-full items-center justify-between py-4 text-[16px]">设备升级<span className="flex items-center gap-1 text-[14px] text-[#98A0AA]">已是最新版本<ChevronRight className="size-4 text-[#C8C8C8]" /></span></button>
            </div>
            <button type="button" onClick={() => setRemoveAsk(true)} className="mx-4 mt-4 h-12 w-[calc(100%-2rem)] rounded-full bg-white text-[16px] text-[#F04444]">移除设备</button>
          </section>
        ) : null}

        {page.id === "info" ? (
          <section>
            <Bar title="设备信息" onBack={back} />
            <div className="mx-4 overflow-hidden rounded-2xl bg-white px-4">
              {[
                ["设备名称", device.name || "可视智能门锁"],
                ["产品型号", productOf(device.productId)?.model ?? "MG-L1"],
                ["所在房间", data.homes.find((home) => home.id === device.homeId)?.rooms.find((room) => room.id === device.roomId)?.name ?? "未分配"],
                ["设备 ID", device.id],
                ["固件版本", "1.0.0"],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between border-b border-[#F3F4F6] py-4 last:border-b-0">
                  <span>{label}</span><span className="max-w-[55%] truncate text-[14px] text-[#98A0AA]">{value}</span>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {page.id === "automation" ? (
          <section>
            <Bar title="手动执行和自动化" onBack={back} />
            <div className="mx-4 rounded-2xl bg-white px-4">
              <button type="button" onClick={() => open({ id: "link" })} className="flex w-full items-center justify-between border-b border-[#F3F4F6] py-4 text-left"><span><b className="block">手动执行</b><small className="text-[12px] text-[#98A0AA]">点一下就开门、开灯或发一条提醒</small></span><ChevronRight className="size-4 text-[#C8C8C8]" /></button>
              <button type="button" onClick={() => open({ id: "link" })} className="flex w-full items-center justify-between py-4 text-left"><span><b className="block">自动化</b><small className="text-[12px] text-[#98A0AA]">家人回家、门锁告警、有人按门铃时自动执行</small></span><ChevronRight className="size-4 text-[#C8C8C8]" /></button>
            </div>
          </section>
        ) : null}

        {page.id === "upgrade" ? (
          <section>
            <Bar title="设备升级" onBack={back} />
            <div className="mx-4 rounded-2xl bg-white p-6 text-center">
              <p className="text-[16px]">已是最新版本</p>
              <p className="mt-2 text-[13px] text-[#98A0AA]">当前版本 1.0.0。演示环境不会连接门锁固件。</p>
            </div>
          </section>
        ) : null}

        {page.id === "help" ? (
          <section className="bg-white">
            <Bar title={page.faq == null ? "服务中心" : "帮助"} onBack={back} />
            {page.faq == null ? FAQS.map((item, index) => (
              <button key={item[0]} type="button" onClick={() => open({ id: "help", faq: index })} className="mx-4 mb-3 block w-[calc(100%-2rem)] rounded-2xl bg-[#F7F8FA] p-4 text-left"><b>{item[0]}</b></button>
            )) : (
              <div className="mx-4 rounded-2xl bg-[#F7F8FA] p-4">
                <b>{FAQS[page.faq]?.[0]}</b>
                <p className="mt-2 leading-6">{FAQS[page.faq]?.[1]}</p>
                <button type="button" onClick={() => notify("谢谢反馈，只记在本机")} className="mt-4 h-11 w-full rounded-full bg-[#eefaf6] text-[#12987a]">有帮助</button>
              </div>
            )}
          </section>
        ) : null}
      </div>
      {noticeSheet ? (
        <div className="absolute inset-0 z-30 bg-black/45" onClick={() => setNoticeSheet(false)}>
          <div
            className="absolute inset-x-0 bottom-0 top-16 flex flex-col rounded-t-[20px] bg-white"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="relative flex h-14 items-center justify-center">
              <h2 className="text-[17px] font-medium">通知</h2>
              <button type="button" aria-label="关闭" onClick={() => setNoticeSheet(false)} className="absolute right-4 text-[22px] text-[#222]">×</button>
            </div>
            <div className="px-4">
              <div className="relative overflow-hidden rounded-2xl">
                <img src="/cloud-storage-banner.png" alt="本地录像会丢？开通门锁云存，录像永不丢失！" className="block w-full" />
                <button
                  type="button"
                  aria-label="立即开通"
                  onClick={() => {
                    setNoticeSheet(false);
                    open({ id: "services" });
                  }}
                  className="absolute left-[4%] top-[58%] h-[24%] w-[20%]"
                />
              </div>
            </div>
          </div>
        </div>
      ) : null}
      {removeAsk ? (
        <div className="absolute inset-0 z-20 grid place-items-center bg-black/40 px-8">
          <div className="w-full rounded-2xl bg-white p-5">
            <p className="text-[16px] font-medium">移除设备</p>
            <p className="mt-2 leading-6">从家里移除「{device.name || "可视智能门锁"}」？</p>
            <div className="mt-4 flex gap-3">
              <button type="button" className="h-10 flex-1 rounded-full bg-[#F2F3F5]" onClick={() => setRemoveAsk(false)}>取消</button>
              <button type="button" className="h-10 flex-1 rounded-full bg-[#F04444] text-white" onClick={() => { removeDevice(device.id); notify("设备已移除"); pop(); }}>移除</button>
            </div>
          </div>
        </div>
      ) : null}
      {dialog ? (
        <div className="absolute inset-0 z-20 grid place-items-center bg-black/40 px-8">
          <div className="w-full rounded-2xl bg-white p-5">
            <p className="leading-6">
              {dialog.kind === "phone-use" ? "我们在此收集您的电话号码仅为了为您提供短信或来电提醒，不会将号码用于其他用途。如果您不提供此信息，对应提醒将无法使用。" : dialog.kind === "delete-member" ? "删除后，该成员的指纹、密码和门卡会从这把演示门锁移除。" : "确定清除全部未读消息？此操作只影响本机演示记录。"}
            </p>
            <div className="mt-4 flex gap-3">
              <button type="button" className="h-10 flex-1 rounded-full bg-[#F2F3F5]" onClick={() => setDialog(null)}>取消</button>
              <button type="button" className="h-10 flex-1 rounded-full bg-[#12c4a0] text-white" onClick={() => {
                if (dialog.kind === "delete-member") {
                  patchDevice(device.id, { lockUsers: [] });
                  pushLog(device.id, "已删除成员凭据");
                  notify("成员凭据已删除");
                }
                if (dialog.kind === "clear-unread") notify("未读已清除");
                if (dialog.kind === "phone-use" && dialog.key) {
                  save({ ...panel, remind: { ...panel.remind, [dialog.key]: true } });
                  notify("已记下提醒方式");
                }
                setDialog(null);
              }}>{dialog.kind === "delete-member" ? "删除" : dialog.kind === "phone-use" ? "设置" : "清除"}</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function recordClock(from: number, now: number) {
  const total = Math.max(0, Math.floor((now - from) / 1000));
  const minutes = String(Math.floor(total / 60)).padStart(2, "0");
  const seconds = String(total % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function batteryFill(percent: number) {
  if (percent <= 0) return 0;
  if (percent <= 20) return 0.25;
  if (percent <= 50) return 0.5;
  if (percent <= 75) return 0.75;
  return 1;
}

function BatteryGauge({ percent }: { percent: number }) {
  const level = batteryFill(percent);
  const color = level === 0 ? "#F04444" : "#2BD18A";
  const innerWidth = 22.2;
  return (
    <svg viewBox="0 0 32 16" className="h-[18px] w-9" aria-hidden>
      <rect
        x="1"
        y="1"
        width="26"
        height="14"
        rx="2.6"
        fill={level === 1 ? color : "none"}
        stroke={color}
        strokeWidth="1.6"
      />
      <rect x="28.2" y="4.7" width="2.5" height="6.6" rx="0.9" fill={color} />
      {level > 0 && level < 1 ? (
        <rect x="2.6" y="2.6" width={innerWidth * level} height="10.8" rx="1.2" fill={color} />
      ) : null}
    </svg>
  );
}

type WifiReading = { bars: 0 | 1 | 2 | 3 | 4; db: number; mbps: number };

type NetworkInfo = {
  downlink?: number;
  effectiveType?: string;
  addEventListener?: (type: string, listener: () => void) => void;
  removeEventListener?: (type: string, listener: () => void) => void;
};

function networkInfo() {
  if (typeof navigator === "undefined") return null;
  const nav = navigator as Navigator & { connection?: NetworkInfo; mozConnection?: NetworkInfo; webkitConnection?: NetworkInfo };
  return nav.connection ?? nav.mozConnection ?? nav.webkitConnection ?? null;
}

function mbpsFromNetwork(info: NetworkInfo | null, online: boolean) {
  if (!online) return 0;
  if (!info) return null;
  if (typeof info.downlink === "number" && info.downlink > 0) return info.downlink;
  if (info.effectiveType === "4g") return 10;
  if (info.effectiveType === "3g") return 1.6;
  if (info.effectiveType === "2g") return 0.3;
  if (info.effectiveType === "slow-2g") return 0.05;
  return info.downlink === 0 ? 0 : null;
}

function wifiFromMbps(mbps: number): WifiReading {
  const bars = mbps >= 8 ? 4 : mbps >= 4 ? 3 : mbps >= 1 ? 2 : mbps > 0 ? 1 : 0;
  const db = mbps <= 0 ? -90 : Math.max(-90, Math.min(-30, Math.round(-48 - Math.log10(10 / mbps) * 24)));
  return { bars, db, mbps: Math.round(mbps * 10) / 10 };
}

function formatMbps(mbps: number) {
  return mbps >= 10 ? String(Math.round(mbps)) : String(Math.round(mbps * 10) / 10);
}

async function probeMbps() {
  if (typeof navigator !== "undefined" && navigator.onLine === false) return 0;
  const started = performance.now();
  try {
    const response = await fetch(`${window.location.origin}/?wifi=${Date.now()}`, { cache: "no-store" });
    await response.arrayBuffer();
    const ms = Math.max(performance.now() - started, 1);
    if (ms < 80) return 10;
    if (ms < 180) return 5;
    if (ms < 400) return 1.5;
    if (ms < 800) return 0.4;
    return 0.1;
  } catch {
    return 0;
  }
}

async function measureWifi() {
  const known = mbpsFromNetwork(networkInfo(), typeof navigator === "undefined" ? true : navigator.onLine);
  return wifiFromMbps(known === null ? await probeMbps() : known);
}

function WifiMark({ bars }: { bars: number }) {
  const on = "#20C6A4";
  const empty = "#C8CDD2";
  const stroke = (level: number) => (bars === 0 ? empty : bars >= level ? on : "none");
  return (
    <svg viewBox="0 0 24 24" className="size-5" data-bars={bars} aria-hidden>
      <path d="M2.6 8.4a13.4 13.4 0 0 1 18.8 0" fill="none" stroke={stroke(4)} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M5.5 11.5a9.2 9.2 0 0 1 13 0" fill="none" stroke={stroke(3)} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8.4 14.6a5 5 0 0 1 7.2 0" fill="none" stroke={stroke(2)} strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="18" r="1.45" fill={bars === 0 ? empty : bars >= 1 ? on : "none"} />
    </svg>
  );
}
