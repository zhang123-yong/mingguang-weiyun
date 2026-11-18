"use client";

import { useState } from "react";
import {
  AudioLines,
  BadgeCheck,
  ChevronRight,
  Compass,
  Hand,
  House,
  Mic,
  Plus,
  Sparkles,
  SquarePlus,
  UserRound,
  Zap,
} from "lucide-react";
import { DeviceGlyph } from "@/components/chrome";
import { Switch } from "@/components/chrome";
import { useApp } from "@/lib/app-state";
import type { Device, Group } from "@/lib/model";
import { useNav, type TabId } from "@/lib/nav";
import { MeScreen } from "@/components/screens/me";

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
      {tab === "home" || tab === "smart" ? <AskBar /> : null}
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

function AskBar() {
  const { push } = useNav();
  return (
    <div className="bg-[#F3F5F8] px-4 pb-2">
      <div className="flex h-12 w-full items-center gap-2 rounded-full bg-white px-3 shadow-[0_4px_16px_rgba(20,24,40,0.06)]">
        <button type="button" onClick={() => push({ name: "assistant" })} className="flex min-w-0 flex-1 items-center gap-2 text-left">
          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#7C5CFF] to-[#3AA0FF] text-[11px] text-white">名</span>
          <span className="truncate text-[14px] text-[#B0B4BA]">需要什么帮助?</span>
        </button>
        <button type="button" aria-label="语音" onClick={() => push({ name: "assistant", voice: true })} className="grid size-8 place-items-center">
          <Mic className="size-5 text-[#666]" />
        </button>
        <button type="button" aria-label="更多提问" onClick={() => push({ name: "assistant" })} className="grid size-8 place-items-center">
          <AudioLines className="size-5 text-[#666]" />
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

function SmartPane() {
  const { data } = useApp();
  const { push } = useNav();
  const scenes = data.scenes.filter((scene) => scene.homeId === data.currentHomeId);
  const rows = [
    { icon: <BadgeCheck className="size-5 text-[#F5B400]" />, label: "自动化", go: () => push({ name: "scene-list", kind: "auto" }) },
    { icon: <Hand className="size-5 text-[#2FBF71]" />, label: "手动执行", go: () => push({ name: "scene-list", kind: "tap" }) },
    { icon: <Sparkles className="size-5 text-[#5B7CFF]" />, label: "推荐应用模版", go: () => push({ name: "templates" }) },
  ];

  return (
    <div className="flex h-full flex-col">
      <AppHeader
        title={(data.homes.find((item) => item.id === data.currentHomeId) ?? data.homes[0])?.name ?? "我的家"}
        right={
          <>
            <button type="button" aria-label="我的应用" onClick={() => push({ name: "scene-list", kind: "tap" })} className="grid size-8 place-items-center">
              <span className="text-[18px] leading-none">☰</span>
            </button>
            <button type="button" aria-label="创建" onClick={() => push({ name: "scene-edit", kind: "auto" })} className="grid size-8 place-items-center">
              <SquarePlus className="size-5" />
            </button>
          </>
        }
      />
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
        <div className="overflow-hidden rounded-2xl bg-white">
          {rows.map((row) => (
            <button key={row.label} type="button" onClick={row.go} className="flex w-full items-center gap-3 border-b border-[#F4F5F7] px-4 py-4 text-left last:border-b-0">
              {row.icon}
              <span className="flex-1 text-[16px]">{row.label}</span>
              <ChevronRight className="size-4 text-[#CCC]" />
            </button>
          ))}
        </div>
        <p className="mb-3 mt-5 text-[15px] text-[#666]">我的应用</p>
        {scenes.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <p className="text-[18px]">暂无应用</p>
            <p className="mt-2 text-[13px] text-[#98A0AA]">创建你的专属智能应用</p>
            <button type="button" onClick={() => push({ name: "scene-edit", kind: "auto" })} className="mx-auto mt-5 block h-11 w-36 rounded-full bg-[#222] text-[15px] text-white">
              去创建
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {scenes.map((scene) => (
              <button
                key={scene.id}
                type="button"
                onClick={() => push({ name: "scene-edit", kind: scene.kind, id: scene.id })}
                className="rounded-2xl bg-white px-4 py-4 text-left"
              >
                <span className="block text-[16px] font-medium">{scene.name}</span>
                <span className="mt-1 block text-[12px] text-[#888]">{scene.kind === "auto" ? "自动化" : "手动执行"} · {scene.when}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DiscoverPane() {
  const { data } = useApp();
  const { push } = useNav();
  const homeName = (data.homes.find((item) => item.id === data.currentHomeId) ?? data.homes[0])?.name ?? "我的家";
  return (
    <div className="flex h-full flex-col">
      <AppHeader title={homeName} right={<span className="px-2 text-[20px] tracking-widest text-[#666]">···</span>} />
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
        <button type="button" onClick={() => push({ name: "energy" })} className="flex w-full items-center gap-3 rounded-2xl bg-white px-4 py-4 text-left">
          <Zap className="size-6 text-[#F5B400]" />
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2 text-[16px] font-medium">AI 节能 <span className="size-1.5 rounded-full bg-[#E23B3B]" /></span>
            <span className="mt-1 block text-[12px] text-[#98A0AA]">了解家庭智能设备的能耗状况，获取节能建议</span>
          </span>
          <ChevronRight className="size-4 text-[#CCC]" />
        </button>
        <div className="mt-3 overflow-hidden rounded-2xl bg-white">
          <button type="button" onClick={() => push({ name: "notes" })} className="flex w-full items-center gap-3 border-b border-[#F4F5F7] px-4 py-4 text-left">
            <span className="grid size-8 place-items-center rounded-lg bg-[#E8F0FF] text-[#3A7BFF]">记</span>
            <span className="min-w-0 flex-1">
              <span className="block text-[16px]">AI 笔记</span>
              <span className="mt-1 block text-[12px] text-[#98A0AA]">录音转写，一键总结</span>
            </span>
            <ChevronRight className="size-4 text-[#CCC]" />
          </button>
          <button type="button" onClick={() => push({ name: "translate" })} className="flex w-full items-center gap-3 px-4 py-4 text-left">
            <span className="grid size-8 place-items-center rounded-lg bg-[#FFF1E4] text-[#FF8A2A]">译</span>
            <span className="min-w-0 flex-1">
              <span className="block text-[16px]">AI 翻译</span>
              <span className="mt-1 block text-[12px] text-[#98A0AA]">AI大模型驱动，准确又自然</span>
            </span>
            <ChevronRight className="size-4 text-[#CCC]" />
          </button>
        </div>
        <button type="button" onClick={() => push({ name: "cast" })} className="mt-3 flex w-full items-center gap-3 rounded-2xl bg-white px-4 py-4 text-left">
          <span className="grid size-8 place-items-center rounded-lg bg-[#F3E8FF] text-[#7C3AED]">投</span>
          <span className="min-w-0 flex-1">
            <span className="block text-[16px]">手机投屏</span>
            <span className="mt-1 block text-[12px] text-[#98A0AA]">把手机画面投到电视或陪伴设备</span>
          </span>
          <ChevronRight className="size-4 text-[#CCC]" />
        </button>
        <button type="button" onClick={() => push({ name: "agents" })} className="mt-3 flex w-full items-center gap-3 rounded-2xl bg-white px-4 py-4 text-left">
          <span className="flex-1 text-[16px]">更多 AI Agent</span>
          <span className="flex -space-x-1">
            <span className="grid size-6 place-items-center rounded-full bg-[#E7F8EF] text-[10px]">宠</span>
            <span className="grid size-6 place-items-center rounded-full bg-[#FFF4D8] text-[10px]">锁</span>
            <span className="grid size-6 place-items-center rounded-full bg-[#E8F0FF] text-[10px]">电</span>
          </span>
          <ChevronRight className="size-4 text-[#CCC]" />
        </button>
      </div>
    </div>
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
