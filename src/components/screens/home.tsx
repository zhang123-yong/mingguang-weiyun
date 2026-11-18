"use client";

import { useState } from "react";
import {
  ChevronDown,
  CloudSun,
  Plus,
  Sparkles,
  House,
  UserRound,
  Workflow,
} from "lucide-react";
import { DeviceGlyph, EmptyState } from "@/components/chrome";
import { Switch } from "@/components/chrome";
import { useApp } from "@/lib/app-state";
import type { Device, Group } from "@/lib/model";
import { useNav, type TabId } from "@/lib/nav";
import { MeScreen } from "@/components/screens/me";
import { SceneScreen } from "@/components/screens/scenes";

export function MainScreen() {
  const { tab, setTab } = useNav();
  const { data } = useApp();
  const unread = data.mails.filter((mail) => !mail.read).length;

  return (
    <div className="flex h-full flex-col bg-[#F5F6F8] text-[#222]">
      <div className="min-h-0 flex-1 overflow-hidden">
        {tab === "home" ? <HomePane /> : null}
        {tab === "scenes" ? <SceneScreen /> : null}
        {tab === "me" ? <MeScreen /> : null}
      </div>
      <nav className="grid h-14 shrink-0 grid-cols-3 border-t border-[#F0F0F0] bg-white pb-[env(safe-area-inset-bottom)]">
        <TabButton id="home" label="首页" active={tab === "home"} icon={<House className="size-5" />} onClick={setTab} />
        <TabButton id="scenes" label="场景" active={tab === "scenes"} icon={<Workflow className="size-5" />} onClick={setTab} />
        <TabButton id="me" label="我的" active={tab === "me"} icon={<UserRound className="size-5" />} badge={unread} onClick={setTab} />
      </nav>
    </div>
  );
}

function TabButton({
  id,
  label,
  active,
  icon,
  badge,
  onClick,
}: {
  id: TabId;
  label: string;
  active: boolean;
  icon: React.ReactNode;
  badge?: number;
  onClick: (id: TabId) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onClick(id)}
      className={`relative flex flex-col items-center justify-center gap-0.5 text-[11px] ${
        active ? "text-[#FF581C]" : "text-[#999]"
      }`}
    >
      {icon}
      {label}
      {badge ? (
        <span className="absolute right-[28%] top-1 grid min-w-4 place-items-center rounded-full bg-[#E23B3B] px-1 text-[10px] leading-4 text-white">
          {badge}
        </span>
      ) : null}
    </button>
  );
}

function HomePane() {
  const { data, setHome, patchDevice, pushLog } = useApp();
  const { push, notify } = useNav();
  const [menu, setMenu] = useState(false);
  const [homesOpen, setHomesOpen] = useState(false);
  const [roomId, setRoomId] = useState("all");
  const home = data.homes.find((item) => item.id === data.currentHomeId) ?? data.homes[0];
  const devices = data.devices.filter(
    (device) =>
      device.homeId === home.id && (roomId === "all" || device.roomId === roomId),
  );
  const groups = data.groups.filter((group) => group.homeId === home.id);

  function togglePower(device: Device) {
    const on = !device.on;
    patchDevice(device.id, { on });
    pushLog(device.id, on ? "已开启" : "已关闭");
    notify(on ? `${device.name}已开启` : `${device.name}已关闭`);
  }

  return (
    <div className="relative flex h-full flex-col">
      <header className="bg-white px-4 pb-3 pt-3">
        <div className="flex items-center justify-between">
          <button type="button" className="flex items-center gap-1 text-[20px] font-medium" onClick={() => setHomesOpen(true)}>
            {home.name}
            <ChevronDown className="size-4 text-[#999]" />
          </button>
          <button
            type="button"
            aria-label="添加"
            className="grid size-9 place-items-center rounded-full bg-[#FFF1EA] text-[#FF581C]"
            onClick={() => setMenu((open) => !open)}
          >
            <Plus className="size-5" />
          </button>
        </div>
        <button
          type="button"
          onClick={() => push({ name: "weather" })}
          className="mt-2 flex items-center gap-1 text-[12px] text-[#888]"
        >
          <CloudSun className="size-3.5" />
          上海 · 多云 22°
        </button>
        <div className="mt-3 flex gap-4 overflow-x-auto text-[14px]">
          <RoomChip label="全部" active={roomId === "all"} onClick={() => setRoomId("all")} />
          {home.rooms.map((room) => (
            <RoomChip
              key={room.id}
              label={room.name}
              active={roomId === room.id}
              onClick={() => setRoomId(room.id)}
            />
          ))}
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {devices.length === 0 && groups.length === 0 ? (
          <EmptyState
            title="暂无设备"
            body="点右上角加号，或从这里添加第一台设备。"
            action="添加设备"
            onAction={() => push({ name: "add" })}
          />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {devices.map((device) => (
              <article key={device.id} className="relative min-h-[132px] rounded-2xl bg-white p-3 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
                <button
                  type="button"
                  className="flex h-full w-full flex-col items-start text-left"
                  onClick={() => push({ name: "device", id: device.id })}
                >
                  <DeviceGlyph kind={device.kind} />
                  <span className="mt-3 text-[15px] font-medium">{device.name}</span>
                  <span className="mt-0.5 text-[12px] text-[#999]">
                    {device.kind === "lock"
                      ? device.locked
                        ? "已上锁"
                        : "已开锁"
                      : device.on
                        ? "在线"
                        : "已关闭"}
                    {" · "}
                    {home.rooms.find((room) => room.id === device.roomId)?.name}
                  </span>
                </button>
                {device.kind !== "lock" ? (
                  <div className="absolute right-3 top-3">
                    <Switch checked={device.on} label={`${device.name}开关`} onChange={() => togglePower(device)} />
                  </div>
                ) : null}
              </article>
            ))}
            {roomId === "all"
              ? groups.map((group) => <GroupCard key={group.id} group={group} />)
              : null}
          </div>
        )}
      </div>

      {menu ? (
        <div
          className="absolute inset-0 z-20"
          onClick={() => setMenu(false)}
        >
          <span className="absolute right-4 top-14 w-36 overflow-hidden rounded-xl bg-white py-1 text-left shadow-xl">
            <MenuItem label="添加设备" onClick={() => { setMenu(false); push({ name: "add" }); }} />
            <MenuItem label="扫一扫" onClick={() => { setMenu(false); push({ name: "scan" }); }} />
            <MenuItem label="创建场景" onClick={() => { setMenu(false); push({ name: "scene-edit", kind: "tap" }); }} />
          </span>
        </div>
      ) : null}

      {homesOpen ? (
        <div className="absolute inset-0 z-20 flex items-end bg-black/45" onClick={() => setHomesOpen(false)}>
          <div className="w-full rounded-t-3xl bg-white px-4 pb-6 pt-4" onClick={(event) => event.stopPropagation()}>
            <p className="text-center text-[16px] font-medium">切换家庭</p>
            <div className="mt-3">
              {data.homes.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="flex w-full items-center justify-between border-b border-[#F4F4F4] py-3 text-left"
                  onClick={() => {
                    setHome(item.id);
                    setRoomId("all");
                    setHomesOpen(false);
                  }}
                >
                  <span>{item.name}</span>
                  <span className={item.id === home.id ? "text-[#FF581C]" : "text-[#CCC]"}>
                    {item.id === home.id ? "当前" : ""}
                  </span>
                </button>
              ))}
            </div>
            <button
              type="button"
              className="mt-3 h-11 w-full rounded-[10px] bg-[#FF581C] text-white"
              onClick={() => {
                setHomesOpen(false);
                push({ name: "family" });
              }}
            >
              家庭管理
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function RoomChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`shrink-0 pb-1 ${active ? "border-b-2 border-[#FF581C] text-[#FF581C]" : "text-[#666]"}`}>
      {label}
    </button>
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

function GroupCard({ group }: { group: Group }) {
  const { push } = useNav();
  const { data } = useApp();
  const devices = data.devices.filter((device) => group.deviceIds.includes(device.id));
  return (
    <button
      type="button"
      onClick={() => push({ name: "group", id: group.id })}
      className="min-h-[132px] rounded-2xl bg-white p-3 text-left"
    >
      <span className="grid size-11 place-items-center rounded-2xl bg-[#EEF4FF] text-[#3A7BFF]">
        <Sparkles className="size-5" />
      </span>
      <span className="mt-3 block text-[15px] font-medium">{group.name}</span>
      <span className="mt-0.5 block text-[12px] text-[#999]">{devices.length} 个设备</span>
    </button>
  );
}
