"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import {
  ConfirmDialog,
  DeviceGlyph,
  Field,
  Group,
  Page,
  PrimaryButton,
  Switch,
  TextInput,
  Cell,
} from "@/components/chrome";
import { useApp } from "@/lib/app-state";
import {
  CATEGORIES,
  PRODUCTS,
  VOICES,
  kindLabel,
  productOf,
  type Device,
  type DeviceKind,
} from "@/lib/model";
import { useNav } from "@/lib/nav";

export function AddDeviceScreen() {
  const { pop, push } = useNav();
  const [category, setCategory] = useState<DeviceKind>("companion");
  const [query, setQuery] = useState("");
  const [discovering, setDiscovering] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setDiscovering(false), 1800);
    return () => window.clearTimeout(timer);
  }, []);

  const categories = CATEGORIES.filter((item) => item.id === "companion" || item.id === "pet" || item.id === "lock");
  const products = PRODUCTS.filter(
    (product) =>
      product.category === category &&
      (query.trim() === "" || product.name.includes(query.trim())),
  );

  return (
    <div className="flex h-full flex-col bg-[#F5F6F8] text-[#222]">
      <header className="relative flex h-12 shrink-0 items-center justify-center bg-white px-14">
        <button type="button" aria-label="返回" onClick={pop} className="absolute left-3 text-[22px] leading-none text-[#222]">‹</button>
        <h1 className="text-[17px] font-semibold">添加设备</h1>
        <button type="button" onClick={() => push({ name: "scan" })} className="absolute right-3 text-[15px] text-[#222]">扫码</button>
      </header>
      <div className="bg-[#F5F6F8] px-6 pb-2 pt-4 text-center">
        <p className="text-[16px] font-semibold">正在搜索附近设备</p>
        <p className="mx-auto mt-2 max-w-[280px] text-[13px] leading-5 text-[#8A8A8A]">
          请保证设备已上电，处于配网状态。演示搜索不会发现真实设备。
        </p>
        <div className="mx-auto mt-4 grid size-28 place-items-center">
          <div className={`size-24 rounded-full border-[10px] border-[#E7EEF8] border-t-[#7EB6FF] ${discovering ? "animate-spin" : ""}`} />
        </div>
      </div>
      <h2 className="bg-white px-4 pb-2 pt-3 text-[16px] font-semibold">手动添加</h2>
      <div className="bg-white px-4 pb-3">
        <div className="flex h-10 items-center gap-2 rounded-lg bg-[#F4F5F7] px-3">
          <Search className="size-4 text-[#C5C5C5]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜品类"
            className="h-full min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-[#C5C5C5]"
          />
        </div>
      </div>
      <div className="flex min-h-0 flex-1 border-t border-[#F0F0F0] bg-white">
        <aside className="w-[104px] shrink-0 bg-[#F7F8FA]">
          {categories.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setCategory(item.id)}
              className={`block w-full whitespace-nowrap px-3 py-4 text-left text-[13px] ${
                category === item.id ? "bg-white font-semibold text-[#222]" : "text-[#666]"
              }`}
            >
              {item.name}
            </button>
          ))}
        </aside>
        <div className="min-w-0 flex-1 overflow-y-auto p-3">
          {products.length === 0 ? (
            <p className="px-2 py-8 text-center text-[13px] text-[#999]">没有匹配的产品</p>
          ) : (
            <ProductGrid products={products} onOpen={(id) => push({ name: "pair", productId: id })} />
          )}
        </div>
      </div>
    </div>
  );
}

function ProductGrid({
  products,
  onOpen,
}: {
  products: typeof PRODUCTS;
  onOpen: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {products.map((product) => (
        <button
          key={product.id}
          type="button"
          onClick={() => onOpen(product.id)}
          className="rounded-2xl bg-[#F7F8FA] px-3 py-4 text-left"
        >
          <span className="block size-12 rounded-xl bg-[#F3F4F6]" />
          <span className="mt-3 block text-[14px] font-medium">{product.name}</span>
        </button>
      ))}
    </div>
  );
}

export function PairScreen({ productId }: { productId: string }) {
  const product = productOf(productId);
  const { data, addDevice } = useApp();
  const { pop, reset, notify } = useNav();
  const home = data.homes.find((item) => item.id === data.currentHomeId) ?? data.homes[0];
  const [step, setStep] = useState<"guide" | "slow" | "search" | "found" | "name">("guide");
  const [deviceName, setDeviceName] = useState(product?.name ?? "");
  const [roomId, setRoomId] = useState(home.rooms[0]?.id ?? "");

  useEffect(() => {
    if (step !== "search") return;
    const timer = window.setTimeout(() => setStep("found"), 1600);
    return () => window.clearTimeout(timer);
  }, [step]);

  if (!product) {
    return (
      <Page title="添加设备" onBack={pop}>
        <p>找不到这个产品。</p>
      </Page>
    );
  }

  function finish() {
    if (!deviceName.trim() || !roomId) {
      notify("请填写名称并选择房间");
      return;
    }
    addDevice({
      productId: product!.id,
      name: deviceName.trim(),
      homeId: home.id,
      roomId,
    });
    const room = home.rooms.find((item) => item.id === roomId)?.name ?? "";
    notify(`已添加到${room}`);
    reset({ name: "tabs" });
  }

  return (
    <Page title={product.name} onBack={pop}>
      {step === "guide" || step === "slow" ? (
        <div className="flex flex-col items-center pt-8 text-center">
          <DeviceGlyph kind={product.category} className="size-20" />
          <p className="mt-6 px-4 text-[16px] leading-7">
            {step === "guide"
              ? "请接通电源，确认指示灯在快闪。"
              : "请长按复位键 5 秒，直到指示灯慢闪，然后继续搜索。"}
          </p>
          <p className="mt-2 text-[13px] text-[#999]">{product.model}</p>
          <div className="mt-8 w-full">
            <PrimaryButton onClick={() => setStep("search")}>下一步</PrimaryButton>
          </div>
          {step === "guide" ? (
            <button type="button" className="mt-4 text-[13px] text-[#3A7BFF]" onClick={() => setStep("slow")}>
              指示灯没有快闪？
            </button>
          ) : null}
        </div>
      ) : null}
      {step === "search" ? (
        <div className="flex flex-col items-center pt-16">
          <div className="size-24 animate-pulse rounded-full border-4 border-[#FFD5C4] border-t-[#FF581C]" />
          <p className="mt-6 text-[16px]">正在搜索附近的设备</p>
          <p className="mt-2 text-[13px] text-[#999]">请把手机尽量靠近设备</p>
        </div>
      ) : null}
      {step === "found" ? (
        <div>
          <p className="text-[14px] text-[#888]">发现 1 台设备</p>
          <button
            type="button"
            onClick={() => setStep("name")}
            className="mt-3 flex w-full items-center gap-3 rounded-2xl bg-white px-4 py-4 text-left"
          >
            <DeviceGlyph kind={product.category} />
            <span>
              <span className="block text-[16px]">{product.name}</span>
              <span className="text-[12px] text-[#999]">信号良好</span>
            </span>
          </button>
        </div>
      ) : null}
      {step === "name" ? (
        <div className="flex flex-col gap-4">
          <p className="text-[16px] font-medium">添加成功</p>
          <Field label="设备名称">
            <TextInput value={deviceName} onChange={(event) => setDeviceName(event.target.value)} />
          </Field>
          <div>
            <p className="mb-2 text-[13px] text-[#888]">选择房间</p>
            <div className="flex flex-wrap gap-2">
              {home.rooms.map((room) => (
                <button
                  key={room.id}
                  type="button"
                  onClick={() => setRoomId(room.id)}
                  className={`rounded-full px-3 py-1.5 text-[13px] ${
                    roomId === room.id ? "bg-[#FF581C] text-white" : "bg-white"
                  }`}
                >
                  {room.name}
                </button>
              ))}
            </div>
          </div>
          <PrimaryButton onClick={finish}>完成</PrimaryButton>
        </div>
      ) : null}
    </Page>
  );
}

function useDevice(id: string) {
  const { data } = useApp();
  return data.devices.find((device) => device.id === id);
}

export function DeviceScreen({ id }: { id: string }) {
  const device = useDevice(id);
  const { patchDevice, pushLog } = useApp();
  const { pop, push, notify } = useNav();
  const [phrase, setPhrase] = useState("今天过得怎么样");

  if (!device) return <Page title="设备" onBack={pop}><p>设备已移除。</p></Page>;

  const homeName = device.kind === "lock"
    ? device.locked ? "已上锁" : "已开锁"
    : device.on ? "在线" : "已关闭";

  function setLocked(locked: boolean) {
    if (device!.lockKind === "semi" && locked) {
      pushLog(device!.id, "半自动锁需要在门内手动上锁");
      notify("半自动锁需要在门内提把手上锁");
      return;
    }
    patchDevice(device!.id, { locked });
    pushLog(device!.id, locked ? "已上锁" : "已开锁");
    notify(locked ? "已上锁" : "已开锁");
  }

  return (
    <div className="flex h-full flex-col bg-[#F5F6F8]">
      <header className="relative flex h-12 items-center justify-center bg-white px-12">
        <button type="button" aria-label="返回" onClick={pop} className="absolute left-2 text-[14px] text-[#666]">返回</button>
        <div className="text-center">
          <p className="text-[16px] font-medium">{device.name}</p>
          <p className="text-[11px] text-[#999]">{homeName}</p>
        </div>
        <button type="button" className="absolute right-3 text-[14px] text-[#FF581C]" onClick={() => push({ name: "device-settings", id: device.id })}>
          设置
        </button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <div className="flex flex-col items-center rounded-3xl bg-white px-4 py-8">
          <DeviceGlyph kind={device.kind} className="size-20" />
          <p className="mt-4 text-[13px] text-[#888]">{kindLabel(device.kind, device.lockKind)}</p>
          <p className="mt-1 text-[20px] font-medium">{homeName}</p>
          <p className="mt-1 text-[12px] text-[#AAA]">电量 {device.battery}%</p>
        </div>

        {device.kind === "lock" ? (
          <div className="mt-4 grid grid-cols-2 gap-3">
            <PrimaryButton onClick={() => setLocked(false)}>远程开锁</PrimaryButton>
            <button type="button" onClick={() => setLocked(true)} className="h-11 rounded-[10px] bg-white text-[16px]">
              {device.lockKind === "semi" ? "手动上锁说明" : "远程关锁"}
            </button>
          </div>
        ) : (
          <div className="mt-4 flex items-center justify-between rounded-2xl bg-white px-4 py-3">
            <span>电源</span>
            <Switch
              checked={device.on}
              label="电源"
              onChange={(on) => {
                patchDevice(device.id, { on });
                pushLog(device.id, on ? "已开启" : "已关闭");
              }}
            />
          </div>
        )}

        {device.kind === "companion" ? (
          <div className="mt-4 flex flex-col gap-3 rounded-2xl bg-white px-4 py-4">
            <label className="text-[14px]">
              音量 {device.volume}
              <input
                type="range"
                min={0}
                max={100}
                value={device.volume}
                onChange={(event) => patchDevice(device.id, { volume: Number(event.target.value) })}
                className="mt-2 w-full accent-[#FF581C]"
              />
            </label>
            <div className="flex gap-2">
              {VOICES.map((voice) => (
                <button
                  key={voice}
                  type="button"
                  onClick={() => {
                    patchDevice(device.id, { voice });
                    pushLog(device.id, `音色改为${voice}`);
                  }}
                  className={`rounded-full px-3 py-1 text-[13px] ${device.voice === voice ? "bg-[#FF581C] text-white" : "bg-[#F4F4F4]"}`}
                >
                  {voice}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <TextInput value={phrase} onChange={(event) => setPhrase(event.target.value)} />
              <button
                type="button"
                className="h-11 shrink-0 rounded-xl bg-[#FF581C] px-3 text-white"
                onClick={() => {
                  if (!phrase.trim()) return;
                  pushLog(device.id, `说：${phrase.trim()}`);
                  notify("已经说出去了");
                }}
              >
                说一句
              </button>
            </div>
          </div>
        ) : null}

        {device.kind === "pet" ? (
          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              type="button"
              className="h-20 rounded-2xl bg-white"
              onClick={() => {
                patchDevice(device.id, { snacks: device.snacks + 1 });
                pushLog(device.id, "喂食一次");
                notify("团子吃到了");
              }}
            >
              <span className="block text-[15px]">喂食</span>
              <span className="text-[12px] text-[#999]">已喂 {device.snacks} 次</span>
            </button>
            <button
              type="button"
              className="h-20 rounded-2xl bg-white"
              onClick={() => {
                pushLog(device.id, "过来一下");
                notify("它抬起头看了你一眼");
              }}
            >
              <span className="block text-[15px]">呼唤</span>
              <span className="text-[12px] text-[#999]">{device.on ? "醒着" : "在休息"}</span>
            </button>
          </div>
        ) : null}

        {device.kind === "lock" ? (
          <div className="mt-4 overflow-hidden rounded-2xl bg-white">
            <Cell label="开锁记录" onClick={() => push({ name: "device-logs", id: device.id })} />
            <Cell label="门锁用户" value={`${device.lockUsers.length} 人`} onClick={() => push({ name: "lock-users", id: device.id })} />
            <Cell label="临时密码" onClick={() => push({ name: "temp-pass", id: device.id })} />
          </div>
        ) : (
          <div className="mt-4">
            <Cell label="操作记录" onClick={() => push({ name: "device-logs", id: device.id })} />
          </div>
        )}
      </div>
    </div>
  );
}

export function DeviceSettingsScreen({ id }: { id: string }) {
  const device = useDevice(id);
  const { data, patchDevice, removeDevice, pushLog } = useApp();
  const { pop, push, notify } = useNav();
  const [confirm, setConfirm] = useState(false);
  const home = data.homes.find((item) => item.id === device?.homeId);

  if (!device || !home) return <Page title="设置" onBack={pop}><p>设备已移除。</p></Page>;

  return (
    <Page title="设备设置" onBack={pop}>
      <div className="flex flex-col gap-3">
        <Field label="设备名称">
          <TextInput
            value={device.name}
            onChange={(event) => patchDevice(device.id, { name: event.target.value })}
          />
        </Field>
        <div>
          <p className="mb-2 text-[13px] text-[#888]">设备位置</p>
          <div className="flex flex-wrap gap-2">
            {home.rooms.map((room) => (
              <button
                key={room.id}
                type="button"
                onClick={() => {
                  patchDevice(device.id, { roomId: room.id });
                  notify(`已移到${room.name}`);
                }}
                className={`rounded-full px-3 py-1.5 text-[13px] ${device.roomId === room.id ? "bg-[#FF581C] text-white" : "bg-white"}`}
              >
                {room.name}
              </button>
            ))}
          </div>
        </div>
        <Group>
          <Cell label="设备信息" onClick={() => push({ name: "device-info", id: device.id })} />
          <Cell label="共享设备" value={device.shares.length ? `${device.shares.length} 人` : "未共享"} onClick={() => push({ name: "device-share", id: device.id })} />
          <Cell label="创建群组" onClick={() => push({ name: "group-edit", deviceId: device.id })} />
          <Cell
            label="离线提醒"
            extra={
              <Switch
                checked={device.offlineAlert}
                label="离线提醒"
                onChange={(offlineAlert) => {
                  patchDevice(device.id, { offlineAlert });
                  pushLog(device.id, offlineAlert ? "已打开离线提醒" : "已关闭离线提醒");
                }}
              />
            }
          />
        </Group>
        <button type="button" className="h-12 rounded-2xl bg-white text-[#E23B3B]" onClick={() => setConfirm(true)}>
          移除设备
        </button>
      </div>
      {confirm ? (
        <ConfirmDialog
          title="移除设备"
          body={`从「${home.name}」移除「${device.name}」？`}
          confirmText="移除"
          danger
          onClose={() => setConfirm(false)}
          onConfirm={() => {
            removeDevice(device.id);
            notify("设备已移除");
            pop();
            pop();
          }}
        />
      ) : null}
    </Page>
  );
}

export function DeviceInfoScreen({ id }: { id: string }) {
  const device = useDevice(id);
  const { pop } = useNav();
  if (!device) return <Page title="设备信息" onBack={pop}><p>设备已移除。</p></Page>;
  const mac = device.id.padEnd(12, "a").slice(0, 12).replace(/(.{2})/g, "$1:").slice(0, -1);
  return (
    <Page title="设备信息" onBack={pop}>
      <Group>
        <Cell label="产品" value={productOf(device.productId)?.name ?? kindLabel(device.kind, device.lockKind)} />
        <Cell label="型号" value={productOf(device.productId)?.model ?? "-"} />
        <Cell label="设备 ID" value={device.id} />
        <Cell label="MAC" value={mac} />
        <Cell label="固件" value="1.2.0" />
        <Cell label="电量" value={`${device.battery}%`} />
      </Group>
    </Page>
  );
}

export function DeviceShareScreen({ id }: { id: string }) {
  const device = useDevice(id);
  const { addShare, removeShare } = useApp();
  const { pop, notify } = useNav();
  const [phone, setPhone] = useState("");
  if (!device) return <Page title="共享设备" onBack={pop}><p>设备已移除。</p></Page>;

  return (
    <Page title="共享设备" onBack={pop}>
      <div className="flex gap-2">
        <TextInput
          value={phone}
          inputMode="numeric"
          maxLength={11}
          placeholder="对方手机号"
          onChange={(event) => setPhone(event.target.value.replace(/\D/g, ""))}
        />
        <button
          type="button"
          className="h-11 shrink-0 rounded-xl bg-[#FF581C] px-4 text-white"
          onClick={() => {
            if (!/^1\d{10}$/.test(phone)) {
              notify("请输入 11 位手机号");
              return;
            }
            addShare(device.id, phone);
            setPhone("");
            notify("已共享");
          }}
        >
          共享
        </button>
      </div>
      <div className="mt-4 flex flex-col gap-2">
        {device.shares.length === 0 ? <p className="text-[13px] text-[#999]">还没有共享给其他人。</p> : null}
        {device.shares.map((item) => (
          <div key={item} className="flex items-center justify-between rounded-2xl bg-white px-4 py-3">
            <span>{item}</span>
            <button type="button" className="text-[13px] text-[#E23B3B]" onClick={() => removeShare(device.id, item)}>
              取消
            </button>
          </div>
        ))}
      </div>
    </Page>
  );
}

export function DeviceLogsScreen({ id }: { id: string }) {
  const device = useDevice(id);
  const { pop } = useNav();
  if (!device) return <Page title="记录" onBack={pop}><p>设备已移除。</p></Page>;
  return (
    <Page title={device.kind === "lock" ? "开锁记录" : "操作记录"} onBack={pop} bleed>
      {device.logs.length === 0 ? <p className="px-4 py-8 text-center text-[#999]">还没有记录</p> : null}
      {device.logs.map((log) => (
        <div key={log.id} className="border-b border-[#F3F3F3] bg-white px-4 py-3">
          <p className="text-[15px]">{log.text}</p>
          <p className="mt-1 text-[12px] text-[#999]">{log.time}</p>
        </div>
      ))}
    </Page>
  );
}

export function LockUsersScreen({ id }: { id: string }) {
  const device = useDevice(id);
  const { addLockUser, removeLockUser } = useApp();
  const { pop, notify } = useNav();
  const [name, setName] = useState("");
  const [method, setMethod] = useState("指纹");
  if (!device) return <Page title="门锁用户" onBack={pop}><p>设备已移除。</p></Page>;

  return (
    <Page title="门锁用户" onBack={pop}>
      <div className="flex flex-col gap-2">
        {device.lockUsers.map((user) => (
          <div key={user.id} className="flex items-center justify-between rounded-2xl bg-white px-4 py-3">
            <span>
              <span className="block text-[15px]">{user.name}</span>
              <span className="text-[12px] text-[#999]">{user.method}</span>
            </span>
            <button type="button" className="text-[13px] text-[#E23B3B]" onClick={() => removeLockUser(device.id, user.id)}>
              删除
            </button>
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-col gap-3 rounded-2xl bg-white p-4">
        <TextInput value={name} placeholder="用户名称" onChange={(event) => setName(event.target.value)} />
        <div className="flex gap-2">
          {["指纹", "密码", "卡片", "人脸"].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setMethod(item)}
              className={`rounded-full px-3 py-1 text-[12px] ${method === item ? "bg-[#FF581C] text-white" : "bg-[#F4F4F4]"}`}
            >
              {item}
            </button>
          ))}
        </div>
        <PrimaryButton
          onClick={() => {
            if (!name.trim()) {
              notify("请填写用户名称");
              return;
            }
            addLockUser(device.id, name.trim(), method);
            setName("");
            notify("用户已添加");
          }}
        >
          添加用户
        </PrimaryButton>
      </div>
    </Page>
  );
}

export function TempPassScreen({ id }: { id: string }) {
  const device = useDevice(id);
  const { addTempCode } = useApp();
  const { pop, notify } = useNav();
  if (!device) return <Page title="临时密码" onBack={pop}><p>设备已移除。</p></Page>;
  return (
    <Page title="临时密码" onBack={pop}>
      <PrimaryButton
        onClick={() => {
          const code = addTempCode(device.id);
          notify(`临时密码 ${code}`);
        }}
      >
        生成 6 位临时密码
      </PrimaryButton>
      <div className="mt-4 flex flex-col gap-2">
        {device.tempCodes.map((item) => (
          <div key={item.id} className="rounded-2xl bg-white px-4 py-3">
            <p className="text-[20px] tracking-[0.2em]">{item.code}</p>
            <p className="text-[12px] text-[#999]">{item.expire}</p>
          </div>
        ))}
      </div>
    </Page>
  );
}

export function GroupEditScreen({ deviceId }: { deviceId?: string }) {
  const { data, addGroup } = useApp();
  const { pop, notify } = useNav();
  const seed = data.devices.find((device) => device.id === deviceId);
  const homeId = seed?.homeId ?? data.currentHomeId;
  const candidates = data.devices.filter(
    (device) => device.homeId === homeId && (!seed || device.kind === seed.kind),
  );
  const [name, setName] = useState(seed ? `${seed.name}群组` : "新群组");
  const [picked, setPicked] = useState<string[]>(seed ? [seed.id] : []);

  return (
    <Page title="创建群组" onBack={pop}>
      <div className="flex flex-col gap-4">
        <Field label="群组名称">
          <TextInput value={name} onChange={(event) => setName(event.target.value)} />
        </Field>
        <div className="flex flex-col gap-2">
          {candidates.map((device) => {
            const on = picked.includes(device.id);
            return (
              <button
                key={device.id}
                type="button"
                onClick={() =>
                  setPicked((current) =>
                    on ? current.filter((item) => item !== device.id) : [...current, device.id],
                  )
                }
                className={`rounded-2xl px-4 py-3 text-left ${on ? "bg-[#FFF1EA]" : "bg-white"}`}
              >
                {device.name}
                <span className="ml-2 text-[12px] text-[#999]">{kindLabel(device.kind, device.lockKind)}</span>
              </button>
            );
          })}
        </div>
        <PrimaryButton
          onClick={() => {
            if (!name.trim() || picked.length < 2) {
              notify("群组至少选择 2 台同类设备");
              return;
            }
            addGroup(homeId, name.trim(), picked);
            notify("群组已创建");
            pop();
          }}
        >
          保存
        </PrimaryButton>
      </div>
    </Page>
  );
}

export function GroupScreen({ id }: { id: string }) {
  const { data, patchDevice, pushLog, removeGroup } = useApp();
  const { pop, notify } = useNav();
  const group = data.groups.find((item) => item.id === id);
  const devices = data.devices.filter((device) => group?.deviceIds.includes(device.id));
  if (!group) return <Page title="群组" onBack={pop}><p>群组已解散。</p></Page>;
  const kind = devices[0]?.kind;

  function applyAll(locked: boolean) {
    for (const device of devices) {
      if (device.kind === "lock") {
        if (device.lockKind === "semi" && locked) {
          pushLog(device.id, "半自动锁需要在门内手动上锁");
        } else {
          patchDevice(device.id, { locked });
          pushLog(device.id, locked ? "群组上锁" : "群组开锁");
        }
      } else {
        patchDevice(device.id, { on: !locked });
        pushLog(device.id, locked ? "群组关闭" : "群组开启");
      }
    }
    notify(locked ? "已关闭或上锁" : "已开启或开锁");
  }

  return (
    <Page title={group.name} onBack={pop}>
      <div className="grid grid-cols-2 gap-3">
        <PrimaryButton onClick={() => applyAll(false)}>{kind === "lock" ? "全部开锁" : "全部开启"}</PrimaryButton>
        <button type="button" className="h-11 rounded-[10px] bg-white" onClick={() => applyAll(true)}>
          {kind === "lock" ? "全部上锁" : "全部关闭"}
        </button>
      </div>
      <div className="mt-4 flex flex-col gap-2">
        {devices.map((device) => (
          <div key={device.id} className="rounded-2xl bg-white px-4 py-3 text-[15px]">{device.name}</div>
        ))}
      </div>
      <button
        type="button"
        className="mt-6 h-11 w-full text-[#E23B3B]"
        onClick={() => {
          removeGroup(group.id);
          notify("群组已解散");
          pop();
        }}
      >
        解散群组
      </button>
    </Page>
  );
}

export type { Device };
