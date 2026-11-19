"use client";

import { useState, type ReactNode } from "react";
import {
  AudioLines,
  BadgeCheck,
  ChevronDown,
  ChevronRight,
  CloudUpload,
  Compass,
  Folder,
  House,
  Leaf,
  Lock,
  Menu,
  MessageCircle,
  Mic,
  Plus,
  Sparkles,
  UserRound,
  Zap,
} from "lucide-react";
import { DeviceGlyph } from "@/components/chrome";
import { Switch } from "@/components/chrome";
import { useApp } from "@/lib/app-state";
import type { Device, Group, Scene } from "@/lib/model";
import { useNav, type TabId } from "@/lib/nav";
import { MeScreen } from "@/components/screens/me";
import { SwirlMark } from "@/components/screens/scenes";

export function MainScreen() {
  const { tab, setTab } = useNav();
  const [discoverSeen, setDiscoverSeen] = useState(false);

  return (
    <div className="flex h-full flex-col bg-[#F3F5F8] text-[#222]">
      <div className="min-h-0 flex-1 overflow-hidden">
        {tab === "home" ? <HomePane /> : null}
        {tab === "smart" ? <SmartPane /> : null}
        {tab === "discover" ? <DiscoverPane /> : null}
        {tab === "me" ? <MeScreen /> : null}
      </div>
      {tab === "home" ? <AskBar /> : null}
      {tab === "smart" ? <AskBar smart /> : null}
      <nav className="grid h-[58px] shrink-0 grid-cols-4 border-t border-[#F0F0F0] bg-white pb-[env(safe-area-inset-bottom)]">
        <TabButton id="home" label="首页" active={tab === "home"} icon={<House className="size-5" />} onClick={setTab} />
        <TabButton id="smart" label="智能" active={tab === "smart"} icon={<BadgeCheck className="size-5" />} onClick={setTab} />
        <TabButton
          id="discover"
          label="发现"
          active={tab === "discover"}
          icon={<Compass className="size-5" />}
          dot={!discoverSeen}
          onClick={(id) => {
            setDiscoverSeen(true);
            setTab(id);
          }}
        />
        <TabButton id="me" label="我的" active={tab === "me"} icon={<UserRound className="size-5" />} onClick={setTab} />
      </nav>
    </div>
  );
}

function TabButton({
  id,
  label,
  active,
  icon,
  dot,
  onClick,
}: {
  id: TabId;
  label: string;
  active: boolean;
  icon: React.ReactNode;
  dot?: boolean;
  onClick: (id: TabId) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onClick(id)}
      className={`relative flex flex-col items-center justify-center gap-0.5 text-[11px] ${active ? "text-[#222]" : "text-[#9AA0A8]"}`}
    >
      {icon}
      {label}
      {dot ? <span className="absolute right-[30%] top-1.5 size-1.5 rounded-full bg-[#E23B3B]" /> : null}
    </button>
  );
}

function AskBar({ smart = false }: { smart?: boolean }) {
  const { push } = useNav();
  return (
    <div className={`${smart ? "bg-transparent" : "bg-[#F3F5F8]"} px-4 pb-2`}>
      <div className="flex h-12 w-full items-center gap-2 rounded-full bg-white px-3 shadow-[0_4px_16px_rgba(20,24,40,0.06)]">
        <button type="button" onClick={() => push({ name: "assistant" })} className="flex min-w-0 flex-1 items-center gap-2 text-left">
          {smart ? <SwirlMark /> : <span className="grid size-7 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#7C5CFF] to-[#3AA0FF] text-[11px] text-white">名</span>}
          <span className="truncate text-[14px] text-[#B0B4BA]">需要什么帮助？</span>
        </button>
        <button type="button" aria-label="语音" onClick={() => push({ name: "assistant", voice: true })} className="grid size-8 place-items-center">
          <Mic className="size-5 text-[#666]" />
        </button>
        <button type="button" aria-label="更多提问" onClick={() => push({ name: "assistant" })} className="grid size-8 place-items-center">
          {smart ? <Menu className="size-5 text-[#666]" /> : <AudioLines className="size-5 text-[#666]" />}
        </button>
      </div>
    </div>
  );
}

function AppHeader({
  right,
  title,
}: {
  right: React.ReactNode;
  title: string;
}) {
  const { push } = useNav();
  return (
    <header className="flex items-center justify-between px-4 pb-2 pt-3">
      <button type="button" onClick={() => push({ name: "family" })} className="flex min-w-0 items-center gap-2 text-[20px] font-semibold">
        <House className="size-5 shrink-0" />
        <span className="truncate">{title}</span>
      </button>
      <div className="flex items-center gap-2">{right}</div>
    </header>
  );
}

function HomePane() {
  const { data, patchDevice, pushLog } = useApp();
  const { push, notify } = useNav();
  const [menu, setMenu] = useState(false);
  const [roomTab, setRoomTab] = useState<"common" | "free">("common");
  const [showBanner, setShowBanner] = useState(true);
  const home = data.homes.find((item) => item.id === data.currentHomeId) ?? data.homes[0];
  const devices = data.devices.filter((device) => device.homeId === home.id);
  const groups = data.groups.filter((group) => group.homeId === home.id);
  const visibleDevices = roomTab === "common" ? devices : devices.filter((device) => !device.roomId);
  const visibleGroups = roomTab === "common" ? groups : [];
  const lock = devices.find((device) => device.kind === "lock");

  function togglePower(device: Device) {
    const on = !device.on;
    patchDevice(device.id, { on });
    pushLog(device.id, on ? "已开启" : "已关闭");
    notify(on ? `${device.name}已开启` : `${device.name}已关闭`);
  }

  return (
    <div className="relative flex h-full flex-col">
      <AppHeader
        title={home.name}
        right={
          <>
            <button type="button" onClick={() => push({ name: "plus" })} className="rounded-full bg-[#F3E8FF] px-3 py-1 text-[13px] text-[#7C3AED]">
              Plus
            </button>
            <button type="button" aria-label="添加" onClick={() => setMenu((open) => !open)} className="grid size-8 place-items-center">
              <Plus className="size-5" />
            </button>
          </>
        }
      />
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
        {devices.length === 0 && groups.length === 0 ? (
          <button type="button" onClick={() => push({ name: "calorie" })} className="mt-2 block w-full overflow-hidden rounded-2xl bg-gradient-to-r from-[#FFE7C2] via-[#FFF6EA] to-[#F7D7C4] px-4 py-4 text-left">
            <p className="text-[20px] font-semibold text-[#5C3418]">拍一拍，热量就清楚</p>
            <span className="mt-3 inline-flex h-8 items-center rounded-full bg-[#FF6A2A] px-3 text-[13px] text-white">立即体验 ›</span>
          </button>
        ) : null}

        {devices.length === 0 && groups.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-[18px]">添加你的第一台设备</p>
            <p className="mt-2 text-[13px] text-[#98A0AA]">连上设备，AI 就能帮你智能控制</p>
            <button type="button" onClick={() => push({ name: "add" })} className="mx-auto mt-5 block h-11 w-36 rounded-full bg-[#222] text-[15px] text-white">
              去添加
            </button>
          </div>
        ) : (
          <>
            <div className="mt-1 flex items-center gap-5 text-[16px]">
              <button type="button" onClick={() => setRoomTab("common")} className={roomTab === "common" ? "font-semibold" : "text-[#98A0AA]"}>
                常用
              </button>
              <button type="button" onClick={() => setRoomTab("free")} className={roomTab === "free" ? "font-semibold" : "text-[#98A0AA]"}>
                未分配
              </button>
            </div>
            {showBanner && lock && roomTab === "common" ? (
              <div className="relative mt-3 overflow-hidden rounded-2xl bg-gradient-to-r from-[#F7E7D4] via-[#F8EFE4] to-[#E7D3BE] px-4 py-3">
                <button type="button" aria-label="关闭推广" onClick={() => setShowBanner(false)} className="absolute right-2 top-2 text-[16px] text-[#8A8178]">
                  ×
                </button>
                <p className="text-[16px] font-semibold text-[#3A2A1A]">门锁视频云储存</p>
                <p className="mt-1 max-w-[14em] text-[12px] leading-5 text-[#6B5A48]">自动循环存储，24/7 守护家门，隐私全程加密</p>
                <button
                  type="button"
                  onClick={() => push({ name: "device", id: lock.id })}
                  className="mt-2 h-7 rounded-full bg-[#3DDC84] px-3 text-[12px] text-white"
                >
                  了解更多
                </button>
              </div>
            ) : null}
            {visibleDevices.length === 0 && visibleGroups.length === 0 ? (
              <p className="px-2 py-10 text-center text-[14px] text-[#98A0AA]">这里还没有设备</p>
            ) : (
              <div className="mt-3 grid grid-cols-2 gap-3">
                {visibleDevices.map((device) => (
                  <article key={device.id} className="relative min-h-[148px] rounded-2xl bg-white p-3">
                    <button type="button" className="flex h-full w-full flex-col items-start text-left" onClick={() => push({ name: "device", id: device.id })}>
                      {device.kind === "lock" ? <VisualLockMark /> : <DeviceGlyph kind={device.kind} />}
                      <span className="mt-6 text-[15px] font-medium">{device.kind === "lock" ? device.name || "可视智能门锁" : device.name}</span>
                    </button>
                    {device.kind !== "lock" ? (
                      <div className="absolute right-3 top-3">
                        <Switch checked={device.on} label={`${device.name}开关`} onChange={() => togglePower(device)} />
                      </div>
                    ) : null}
                  </article>
                ))}
                {visibleGroups.map((group) => (
                  <GroupCard key={group.id} group={group} />
                ))}
              </div>
            )}
          </>
        )}

        <div className="mt-2 flex items-center justify-between">
          <p className="text-[16px] font-medium">为你推荐</p>
          <button type="button" onClick={() => push({ name: "explore" })} className="text-[13px] text-[#8B919A]">
            探索 ›
          </button>
        </div>
        <button type="button" onClick={() => push({ name: "notes" })} className="relative mt-3 block w-full overflow-hidden rounded-2xl bg-white px-4 py-4 text-left">
          <span className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-[#E8F0FF] text-[16px]">记</span>
            <span>
              <span className="block text-[16px] font-medium">AI 笔记</span>
              <span className="block text-[12px] text-[#98A0AA]">录音转写，一键总结</span>
            </span>
          </span>
          <span className="absolute right-3 top-4 rounded-full bg-[#2F7BFF] px-3 py-1 text-[12px] text-white">添加</span>
          <span className="mt-3 grid grid-cols-2 gap-2">
            <span className="rounded-xl bg-[#F6F7F9] px-3 py-3 text-[14px] text-[#333]">录音</span>
            <span className="rounded-xl bg-[#F6F7F9] px-3 py-3 text-[14px] text-[#333]">实时转写</span>
          </span>
        </button>
      </div>

      {menu ? (
        <div className="absolute inset-0 z-20" onClick={() => setMenu(false)}>
          <span className="absolute right-4 top-14 w-40 overflow-hidden rounded-xl bg-white py-1 text-left shadow-xl">
            <MenuItem label="添加设备" onClick={() => { setMenu(false); push({ name: "add" }); }} />
            <MenuItem label="扫一扫" onClick={() => { setMenu(false); push({ name: "scan" }); }} />
            <MenuItem label="手机投屏" onClick={() => { setMenu(false); push({ name: "cast" }); }} />
            <MenuItem label="创建应用" onClick={() => { setMenu(false); push({ name: "scene-edit", kind: "tap" }); }} />
          </span>
        </div>
      ) : null}
    </div>
  );
}

let smartSection: "app" | "tap" | "auto" = "app";

function SmartPane() {
  const { data, patchScene, runScene } = useApp();
  const { push, notify } = useNav();
  const [section, setSection] = useState<"app" | "tap" | "auto">(smartSection);
  function chooseSection(id: "app" | "tap" | "auto") {
    smartSection = id;
    setSection(id);
  }
  const [filter, setFilter] = useState<"all" | "on" | "off">("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const home = data.homes.find((item) => item.id === data.currentHomeId) ?? data.homes[0];
  const scenes = data.scenes.filter((scene) => scene.homeId === data.currentHomeId);
  const apps = scenes.filter((scene) => scene.smartApp);
  const manual = scenes.filter((scene) => scene.kind === "tap" && !scene.smartApp);
  const autos = scenes.filter((scene) => scene.kind === "auto" && !scene.smartApp);
  const pool = section === "tap" ? manual : autos;
  const shown = pool.filter((scene) => filter === "all" || (filter === "on" ? scene.enabled : !scene.enabled));
  const filterLabel = filter === "on" ? "已启用" : filter === "off" ? "未启用" : "全部筛选";

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-[#EEF3FA] to-[#F7F8FB]">
      <AppHeader
        title={home?.name ?? "我的家"}
        right={
          <>
            <button type="button" aria-label="我的应用" onClick={() => push({ name: "smart-apps" })} className="grid size-8 place-items-center">
              <ListMark />
            </button>
            <button type="button" aria-label="创建" onClick={() => push({ name: "scene-create" })} className="grid size-8 place-items-center">
              <Plus className="size-5" />
            </button>
          </>
        }
      />
      <div className="flex items-end gap-5 px-5 pb-3">
        {([
          ["app", "智能应用"],
          ["tap", "手动执行"],
          ["auto", "自动化"],
        ] as const).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => { chooseSection(id); setFilter("all"); setFilterOpen(false); }}
            className={section === id ? "text-[20px] font-semibold" : "pb-0.5 text-[16px] text-[#B0B4BA]"}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {section === "app" ? (
          <div className="flex min-h-full flex-col px-4 pb-4">
            {apps.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
                <p className="text-[18px] font-medium">暂无应用</p>
                <p className="mt-2 text-[13px] text-[#A0A4AA]">创建你的专属智能应用</p>
                <button type="button" onClick={() => push({ name: "smart-create" })} className="mt-5 h-11 rounded-full bg-[#1A1A1A] px-8 text-[15px] text-white">
                  去创建
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3 pt-1">
                {apps.map((scene) => (
                  <SceneRow key={scene.id} scene={scene} onOpen={() => push({ name: "scene-edit", kind: scene.kind, id: scene.id })} onRun={() => notify(runScene(scene.id))} onToggle={(enabled) => { patchScene(scene.id, { enabled }); notify(enabled ? "自动化已启用" : "自动化已关闭"); }} />
                ))}
              </div>
            )}
            <p className="mb-2 mt-6 text-[14px] text-[#666]">推荐</p>
            <button type="button" onClick={() => push({ name: "smart-create", prompt: "为感恩节准备一场温暖的灯光盛宴" })} className="flex items-center gap-3 rounded-2xl bg-white p-3 text-left shadow-[0_6px_18px_rgba(20,24,40,0.04)]">
              <LightsThumb />
              <span className="min-w-0">
                <span className="block text-[16px] font-medium">感恩节灯光</span>
                <span className="mt-1 block truncate text-[12px] text-[#A0A4AA]">为感恩节准备一场温暖的灯光盛…</span>
              </span>
            </button>
          </div>
        ) : (
          <div className="flex min-h-full flex-col px-4 pb-4">
            <div className="relative">
              <button type="button" onClick={() => setFilterOpen((open) => !open)} className="flex h-12 w-full items-center justify-between rounded-2xl bg-white px-4 text-[15px]">
                {filterLabel}
                <ChevronDown className="size-4 text-[#666]" />
              </button>
              {filterOpen ? (
                <div className="absolute inset-x-0 top-14 z-10 overflow-hidden rounded-2xl bg-white shadow-lg">
                  {([
                    ["all", "全部筛选"],
                    ["on", "已启用"],
                    ["off", "未启用"],
                  ] as const).map(([id, label]) => (
                    <button key={id} type="button" onClick={() => { setFilter(id); setFilterOpen(false); }} className="block w-full border-b border-[#F4F5F7] px-4 py-3 text-left last:border-b-0">
                      {label}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            {pool.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
                <p className="text-[18px] font-medium">{section === "tap" ? "暂无“手动执行”" : "暂无“自动化”"}</p>
                <p className="mt-2 text-[13px] leading-6 text-[#A0A4AA]">
                  {section === "tap" ? "设置后，在APP内手动点击控制设备，快捷便利" : "设置后，满足条件时自动执行，无需在 App 里手动点击"}
                </p>
                <button type="button" onClick={() => push({ name: "scene-create" })} className="mt-5 h-11 rounded-full bg-[#1A1A1A] px-8 text-[15px] text-white">
                  去创建
                </button>
              </div>
            ) : shown.length === 0 ? (
              <p className="px-6 py-16 text-center text-[14px] text-[#A0A4AA]">没有符合筛选的场景</p>
            ) : (
              <div className="mt-3 flex flex-col gap-3">
                {shown.map((scene) => (
                  <SceneRow key={scene.id} scene={scene} onOpen={() => push({ name: "scene-edit", kind: scene.kind, id: scene.id })} onRun={() => notify(runScene(scene.id))} onToggle={(enabled) => { patchScene(scene.id, { enabled }); notify(enabled ? "自动化已启用" : "自动化已关闭"); }} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SceneRow({ scene, onOpen, onRun, onToggle }: { scene: Scene; onOpen: () => void; onRun: () => void; onToggle: (enabled: boolean) => void }) {
  return (
    <article className="rounded-2xl bg-white px-4 py-4">
      <button type="button" onClick={onOpen} className="w-full text-left">
        <span className="block text-[16px] font-medium">{scene.name}</span>
        <span className="mt-1 block text-[12px] text-[#A0A4AA]">{scene.when}</span>
      </button>
      <div className="mt-3 flex items-center justify-between">
        <button type="button" onClick={onRun} className="h-8 rounded-full bg-[#F4F5F7] px-4 text-[13px]">{scene.kind === "tap" ? "执行" : "试运行"}</button>
        {scene.kind === "auto" ? <Switch checked={scene.enabled} label={`${scene.name}开关`} onChange={onToggle} /> : null}
      </div>
    </article>
  );
}

function ListMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
      <rect x="4" y="4" width="16" height="16" rx="3" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 9h8M8 12h8M8 15h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function LightsThumb() {
  return (
    <svg viewBox="0 0 72 72" className="size-14 shrink-0 rounded-xl" aria-hidden>
      <rect width="72" height="72" fill="#7A3428" />
      <path d="M4 20c14 10 24-8 40-2 10 4 16 6 24 2" fill="none" stroke="#F6C15A" strokeWidth="1.4" />
      <path d="M6 34c16 8 26-6 42 0 8 3 14 3 20 0" fill="none" stroke="#F3B24A" strokeWidth="1.4" />
      <circle cx="18" cy="24" r="2.2" fill="#FFE08A" />
      <circle cx="34" cy="18" r="2" fill="#FF8A5A" />
      <circle cx="50" cy="22" r="2.2" fill="#FFF1C2" />
      <circle cx="22" cy="38" r="2" fill="#FFD36A" />
      <circle cx="40" cy="34" r="2.2" fill="#FFE7A8" />
      <circle cx="56" cy="36" r="2" fill="#FF9A62" />
      <circle cx="30" cy="52" r="8" fill="#C45A3A" />
      <circle cx="30" cy="52" r="4" fill="#E7C07A" />
    </svg>
  );
}

function DiscoverPane() {
  const { data } = useApp();
  const { push, notify } = useNav();
  const [badges, setBadges] = useState({ energy: true, sms: true, notes: true });
  const home = data.homes.find((item) => item.id === data.currentHomeId) ?? data.homes[0];
  const lock = data.devices.find((device) => device.homeId === home?.id && device.kind === "lock");

  function openLock() {
    if (!lock) {
      notify("当前家庭还没有门锁");
      return;
    }
    push({ name: "device", id: lock.id });
  }

  function open(route: Parameters<typeof push>[0], badge?: keyof typeof badges) {
    if (badge) setBadges((current) => ({ ...current, [badge]: false }));
    push(route);
  }

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-[#EEF3FA] to-[#F7F8FB]">
      <AppHeader
        title={home?.name ?? "我的家"}
        right={
          <button type="button" aria-label="更多" onClick={() => push({ name: "family" })} className="px-1 text-[22px] leading-none tracking-widest text-[#222]">
            ···
          </button>
        }
      />
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6">
        <p className="px-1 text-[16px] font-medium">最近使用</p>
        <div className="mt-4 grid grid-cols-3">
          <RecentItem label="AI节能" onClick={() => open({ name: "energy" }, "energy")}>
            <span className="grid size-14 place-items-center rounded-full bg-white shadow-[0_4px_14px_rgba(20,24,40,0.05)]">
              <Zap className="size-7 text-[#F5C542]" fill="#F5C542" />
            </span>
          </RecentItem>
          <RecentItem label="AI舒适空间" onClick={() => open({ name: "environment" })}>
            <span className="grid size-14 place-items-center rounded-full bg-white shadow-[0_4px_14px_rgba(20,24,40,0.05)]">
              <Leaf className="size-7 text-[#3DDC84]" fill="#3DDC84" />
            </span>
          </RecentItem>
          <RecentItem label="AI翻译" onClick={() => open({ name: "translate" })}>
            <span className="grid size-14 place-items-center rounded-full bg-white shadow-[0_4px_14px_rgba(20,24,40,0.05)]">
              <TranslateMark />
            </span>
          </RecentItem>
        </div>
        <div className="mt-5 overflow-hidden rounded-[20px] bg-white">
          <DiscoverRow
            icon={<CloudUpload className="size-6 text-[#3A8DFF]" />}
            title="AI安全守护（云存储）"
            body="云存储全新升级，AI智能总结、巡检哨兵，智能守护您的安全"
            onClick={openLock}
          />
          <DiscoverRow
            icon={<Zap className="size-6 text-[#F5C542]" fill="#F5C542" />}
            title="AI节能"
            body="了解家庭智能设备的能耗状况，获取节能建议"
            badge={badges.energy}
            onClick={() => open({ name: "energy" }, "energy")}
          />
          <DiscoverRow
            icon={<MessageCircle className="size-6 text-[#F6B429]" fill="#F6B429" />}
            title="短信和电话通知"
            body="接收设备警报和场景通知消息"
            badge={badges.sms}
            onClick={() => open({ name: "alarm" }, "sms")}
          />
          <DiscoverRow
            icon={<Lock className="size-6 text-[#3A4250]" />}
            title="门锁服务"
            body="开通和管理智能门锁云存储、AI等精选服务"
            last
            onClick={() => open({ name: "lock-service" })}
          />
        </div>
        <div className="mt-3 overflow-hidden rounded-[20px] bg-white">
          <DiscoverRow
            icon={
              <span className="relative">
                <Folder className="size-6 text-[#3A8DFF]" fill="#E8F1FF" />
                {badges.notes ? <i className="absolute -right-0.5 -top-0.5 size-1.5 rounded-full bg-[#FF3B30]" /> : null}
              </span>
            }
            title="AI笔记"
            body="录音转写，一键总结"
            onClick={() => open({ name: "notes" }, "notes")}
          />
          <DiscoverRow
            icon={<TranslateMark />}
            title="AI翻译"
            body="AI大模型驱动，准确又自然"
            last
            onClick={() => open({ name: "translate" })}
          />
        </div>
      </div>
    </div>
  );
}

function RecentItem({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="flex flex-col items-center gap-2">
      {children}
      <span className="text-[12px] text-[#666]">{label}</span>
    </button>
  );
}

function DiscoverRow({
  icon,
  title,
  body,
  badge,
  last,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  body: string;
  badge?: boolean;
  last?: boolean;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className={`flex w-full items-center gap-3 px-4 py-3.5 text-left ${last ? "" : "border-b border-[#F4F5F7]"}`}>
      <span className="grid size-9 shrink-0 place-items-center">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[16px]">{title}</span>
        <span className="mt-0.5 block text-[12px] leading-5 text-[#A0A4AA]">{body}</span>
      </span>
      {badge ? <span className="size-1.5 shrink-0 rounded-full bg-[#FF3B30]" /> : null}
      <ChevronRight className="size-4 shrink-0 text-[#C8C8C8]" />
    </button>
  );
}

function TranslateMark() {
  return (
    <svg viewBox="0 0 32 32" className="size-7" aria-hidden>
      <rect x="3" y="6" width="16" height="16" rx="4" fill="#FFE7D6" />
      <text x="11" y="18" textAnchor="middle" fontSize="11" fontWeight="700" fill="#F08A3A">文</text>
      <rect x="13" y="12" width="16" height="16" rx="4" fill="#E7F0FF" />
      <text x="21" y="24" textAnchor="middle" fontSize="11" fontWeight="700" fill="#3A8DFF">A</text>
    </svg>
  );
}

function MenuItem({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <span
      role="button"
      tabIndex={0}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      className="block px-4 py-3 text-[14px] hover:bg-[#FAFAFA]"
    >
      {label}
    </span>
  );
}

function VisualLockMark() {
  return (
    <svg viewBox="0 0 36 64" className="h-14 w-8" aria-hidden>
      <rect x="10" y="2" width="16" height="22" rx="3" fill="#F4F5F7" stroke="#D5D8DE" />
      <rect x="14" y="8" width="8" height="6" rx="1" fill="#E6E8EE" />
      <rect x="4" y="22" width="28" height="38" rx="4" fill="#F7F8FA" stroke="#E1E3E8" />
      <circle cx="18" cy="36" r="3" fill="#C5C8D0" />
      <rect x="16.5" y="38" width="3" height="8" rx="1" fill="#C5C8D0" />
    </svg>
  );
}

function GroupCard({ group }: { group: Group }) {
  const { push } = useNav();
  const { data } = useApp();
  const devices = data.devices.filter((device) => group.deviceIds.includes(device.id));
  return (
    <button type="button" onClick={() => push({ name: "group", id: group.id })} className="min-h-[132px] rounded-2xl bg-white p-3 text-left">
      <span className="grid size-11 place-items-center rounded-2xl bg-[#EEF4FF] text-[#3A7BFF]">
        <Sparkles className="size-5" />
      </span>
      <span className="mt-3 block text-[15px] font-medium">{group.name}</span>
      <span className="mt-0.5 block text-[12px] text-[#999]">{devices.length} 个设备</span>
    </button>
  );
}
