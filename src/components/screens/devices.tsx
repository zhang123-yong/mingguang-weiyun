"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  AudioLines,
  BatteryMedium,
  Bell,
  Bluetooth,
  Bot,
  Cat,
  Check,
  ChevronLeft,
  ChevronRight,
  Dog,
  Grid3x3,
  Lamp,
  List,
  Lock,
  Pencil,
  Search,
  Settings,
  ToggleRight,
  UserRound,
  Video,
  Wifi,
  type LucideIcon,
} from "lucide-react";
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
import { LockPanel } from "@/components/screens/lock-panel";
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

const PRODUCT_MARKS: Record<string, { icon: LucideIcon; bg: string; fg: string }> = {
  c1: { icon: Bot, bg: "#E8F1FF", fg: "#3B82F6" },
  c2: { icon: Lamp, bg: "#FFF4D6", fg: "#D39A00" },
  p1: { icon: Cat, bg: "#F3E8FF", fg: "#8B5CF6" },
  p2: { icon: Dog, bg: "#E7F8EE", fg: "#22A35A" },
};

function ProductGrid({
  products,
  onOpen,
}: {
  products: typeof PRODUCTS;
  onOpen: (id: string) => void;
}) {
  if (products.every((product) => product.category === "lock")) {
    return (
      <div className="grid grid-cols-3 gap-2 pt-2">
        {products.map((product) => (
          <button
            key={product.id}
            type="button"
            onClick={() => onOpen(product.id)}
            className="flex flex-col items-center px-1 text-center"
          >
            <LockCatalogIcon />
            <span className="mt-2 text-[12px] leading-4 text-[#333]">{product.name}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {products.map((product) => {
        const mark = PRODUCT_MARKS[product.id] ?? { icon: AudioLines, bg: "#F3F4F6", fg: "#888" };
        const Icon = mark.icon;
        return (
          <button
            key={product.id}
            type="button"
            onClick={() => onOpen(product.id)}
            className="rounded-2xl bg-[#F7F8FA] px-3 py-4 text-left"
          >
            <span
              className="grid size-12 place-items-center rounded-2xl"
              style={{ background: mark.bg, color: mark.fg }}
            >
              <Icon className="size-6" strokeWidth={1.8} />
            </span>
            <span className="mt-3 block text-[14px] font-medium">{product.name}</span>
          </button>
        );
      })}
    </div>
  );
}

export function PairScreen({ productId }: { productId: string }) {
  const product = productOf(productId);
  const { data, addDevice } = useApp();
  const { pop, push, reset, notify } = useNav();
  const home = data.homes.find((item) => item.id === data.currentHomeId) ?? data.homes[0];
  const [step, setStep] = useState<"choose" | "guide" | "slow" | "wifi" | "wifi-reset" | "hotspot" | "wifi-pass" | "wifi-pick" | "bt1" | "bt2" | "connecting" | "failed" | "search" | "found" | "name">("guide");
  const [bluetoothReady, setBluetoothReady] = useState(false);
  const [phoneWifi, setPhoneWifi] = useState({ connected: false, ssid: "", band: "" });
  const [wifiPassword, setWifiPassword] = useState("");
  const [wifiAlert, setWifiAlert] = useState(false);
  const [pickFrom, setPickFrom] = useState<"pass" | "alert">("pass");
  const [deviceName, setDeviceName] = useState(product?.name ?? "");
  const [roomId, setRoomId] = useState(home.rooms[0]?.id ?? "");

  useEffect(() => {
    if (step !== "search") return;
    const timer = window.setTimeout(() => setStep("found"), 1600);
    return () => window.clearTimeout(timer);
  }, [step]);

  useEffect(() => {
    if (step !== "connecting") return;
    const timer = window.setTimeout(() => setStep("failed"), 2200);
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

  if (product.category === "lock" && step === "choose") {
    return (
      <NetworkChoiceScreen
        onBack={() => setStep("guide")}
        onBluetooth={() => {
          setBluetoothReady(false);
          setStep("guide");
        }}
        onWifi={() => setStep("wifi")}
      />
    );
  }

  if (product.category === "lock" && step === "wifi") {
    return (
      <LockWifiScreen
        alert={wifiAlert}
        onClose={() => {
          setWifiAlert(false);
          setStep("choose");
        }}
        onNext={() => {
          if (phoneWifi.connected && phoneWifi.ssid) setStep("wifi-pass");
          else setWifiAlert(true);
        }}
        onContinue={() => {
          setWifiAlert(false);
          setStep("wifi-pass");
        }}
        onConnect={() => {
          setPickFrom("alert");
          setWifiAlert(false);
          setStep("wifi-pick");
        }}
        onHotspot={() => {
          setWifiAlert(false);
          setStep("hotspot");
        }}
        onReset={() => {
          setWifiAlert(false);
          setStep("wifi-reset");
        }}
      />
    );
  }

  if (product.category === "lock" && step === "wifi-reset") {
    return (
      <WifiResetGuide
        onClose={() => setStep("wifi")}
        onHotspot={() => setStep("hotspot")}
        onFast={() => {
          if (phoneWifi.connected && phoneWifi.ssid) setStep("wifi-pass");
          else {
            setWifiAlert(true);
            setStep("wifi");
          }
        }}
      />
    );
  }

  if (product.category === "lock" && step === "hotspot") {
    return <HotspotScreen onClose={() => setStep("wifi")} onNext={() => setStep("wifi-pass")} />;
  }

  if (product.category === "lock" && step === "wifi-pick") {
    return (
      <WifiPickScreen
        current={phoneWifi.ssid}
        onBack={() => {
          if (pickFrom === "alert" && !phoneWifi.connected) {
            setWifiAlert(true);
            setStep("wifi");
          } else setStep("wifi-pass");
        }}
        onSelect={(network) => {
          setPhoneWifi({ connected: true, ssid: network.ssid, band: network.band });
          setStep("wifi-pass");
        }}
      />
    );
  }

  if (product.category === "lock" && step === "wifi-pass") {
    return (
      <WifiPasswordScreen
        ssid={phoneWifi.ssid}
        band={phoneWifi.band}
        password={wifiPassword}
        onPassword={setWifiPassword}
        onClose={() => setStep("wifi")}
        onPick={() => {
          setPickFrom("pass");
          setStep("wifi-pick");
        }}
        onNext={() => setStep("search")}
      />
    );
  }

  if (product.category === "lock" && (step === "guide" || step === "slow")) {
    return (
      <LockResetScreen
        initialReady={bluetoothReady}
        showReset={step === "slow"}
        onClose={pop}
        onPickNetwork={() => setStep("choose")}
        onNext={() => setStep("search")}
        onReset={() => setStep("bt1")}
      />
    );
  }

  if (product.category === "lock" && (step === "bt1" || step === "bt2")) {
    return (
      <BluetoothStepScreen
        page={step}
        onClose={() => setStep("guide")}
        onPrev={() => setStep("bt1")}
        onNext={() => setStep(step === "bt1" ? "bt2" : "connecting")}
      />
    );
  }

  if (product.category === "lock" && step === "connecting") {
    return <ConnectingScreen onClose={() => setStep("bt2")} />;
  }

  if (product.category === "lock" && step === "failed") {
    return (
      <PairFailedScreen
        onClose={() => setStep("guide")}
        onRetry={() => setStep("bt1")}
        onOther={() => setStep("choose")}
        onFeedback={() => push({ name: "feedback" })}
      />
    );
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

const RESET_STEPS = ["设备上电", "打开手机蓝牙", "按产品说明书使设备进入蓝牙配网状态"];

function LockCatalogIcon() {
  return (
    <svg viewBox="0 0 72 48" className="mt-3 h-12 w-16" aria-hidden>
      <rect x="8" y="16" width="34" height="16" rx="2" fill="#2C3036" />
      <rect x="38" y="20" width="26" height="8" rx="4" fill="#3A3E44" />
      <circle cx="18" cy="24" r="2" fill="#6B7078" />
    </svg>
  );
}

function NetworkChoiceScreen({
  onBack,
  onBluetooth,
  onWifi,
}: {
  onBack: () => void;
  onBluetooth: () => void;
  onWifi: () => void;
}) {
  return (
    <div className="flex h-full flex-col overflow-y-auto bg-white px-5 pb-8 pt-3 text-[#222]">
      <button type="button" aria-label="返回" onClick={onBack} className="grid size-9 place-items-center self-start text-[22px] leading-none">
        ‹
      </button>
      <h1 className="mt-3 text-[22px] font-semibold leading-8">检查设备网络连接协议信息</h1>
      <p className="mt-4 text-[15px] leading-7 text-[#333]">
        设备支持的网络连接协议信息，例如 Wi-Fi、蓝牙、Zigbee 等，通常可以在包装盒、产品说明书、设备铭牌上找到相关信息，可参考下图。若仍未找到也可咨询商家。
      </p>
      <img
        src="/network-guide.png"
        alt="包装盒与说明书上的网络连接信息"
        className="mt-4 w-full rounded-lg"
      />
      <p className="mt-4 text-[15px] leading-7">确认设备支持的网络协议信息后，请选择对应类型尝试连网。</p>
      <p className="mt-5 text-[16px] font-medium">选择配网方式：</p>
      <div className="mt-3 grid gap-3">
        <button type="button" onClick={onBluetooth} className="flex h-14 items-center gap-3 rounded-2xl bg-[#F6F7F9] px-4 text-left text-[16px]">
          <span className="grid size-8 place-items-center rounded-full bg-[#2F7BFF] text-white">
            <Bluetooth className="size-4" />
          </span>
          蓝牙
        </button>
        <button type="button" onClick={onWifi} className="flex h-14 items-center gap-3 rounded-2xl bg-[#F6F7F9] px-4 text-left text-[16px]">
          <span className="grid size-8 place-items-center rounded-full bg-[#2F7BFF] text-white">
            <Wifi className="size-4" />
          </span>
          Wi-Fi
        </button>
      </div>
    </div>
  );
}

const WIFI_NETWORKS = [
  { ssid: "MGYF", band: "2.4GHz" },
  { ssid: "MGYF-5G", band: "5GHz" },
  { ssid: "MINGGUANG", band: "2.4GHz" },
  { ssid: "CMCC-2.4G", band: "2.4GHz" },
];

function LockWifiScreen({
  alert,
  onClose,
  onNext,
  onContinue,
  onConnect,
  onHotspot,
  onReset,
}: {
  alert: boolean;
  onClose: () => void;
  onNext: () => void;
  onContinue: () => void;
  onConnect: () => void;
  onHotspot: () => void;
  onReset: () => void;
}) {
  const [indicator, setIndicator] = useState(false);
  return (
    <div className="relative flex h-full flex-col bg-white px-6 pb-6 pt-3 text-[#222]">
      <div className="flex items-center justify-between">
        <button type="button" aria-label="关闭" onClick={onClose} className="grid size-9 place-items-center text-[22px] leading-none">
          ×
        </button>
        <span className="rounded-full bg-[#F3F4F6] px-4 py-1.5 text-[14px] text-[#666]">Wi-Fi</span>
      </div>
      <h1 className="mt-4 text-[28px] font-semibold tracking-tight">重置设备</h1>
      <div className="flex flex-1 items-center justify-center py-4">
        <LockArtwork />
      </div>
      <p className="text-center text-[16px] leading-7">设备上电，确认设备正常工作，按照说明书指示进入配网状态</p>
      <button type="button" onClick={() => setIndicator(true)} className="mt-8 h-12 w-full rounded-xl bg-[#FF581C] text-[16px] text-white">
        确认键盘灯慢闪
      </button>
      <button type="button" onClick={onReset} className="mt-4 text-center text-[15px] text-[#2F7BFF]">
        按步骤重置设备
      </button>
      {indicator && !alert ? (
        <IndicatorSheet
          onClose={() => setIndicator(false)}
          onHotspot={onHotspot}
          onFast={() => {
            setIndicator(false);
            onNext();
          }}
        />
      ) : null}
      {alert ? (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/45 px-8">
          <div role="dialog" aria-labelledby="wifi-alert-title" className="w-full max-w-[300px] overflow-hidden rounded-2xl bg-white">
            <h2 id="wifi-alert-title" className="pt-5 text-center text-[17px] font-semibold">提醒</h2>
            <p className="px-5 pb-5 pt-3 text-center text-[14px] leading-6 text-[#666]">
              当前手机未连接路由器，无法完成添加，请连接路由器后添加
            </p>
            <div className="grid grid-cols-2 border-t border-[#E8E8E8]">
              <button type="button" onClick={onContinue} className="h-12 border-r border-[#E8E8E8] text-[16px] text-[#333]">
                仍然继续
              </button>
              <button type="button" onClick={onConnect} className="h-12 text-[16px] font-medium text-[#222]">
                去连接
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function IndicatorSheet({
  onClose,
  onHotspot,
  onFast,
}: {
  onClose: () => void;
  onHotspot: () => void;
  onFast: () => void;
}) {
  return (
    <div className="absolute inset-0 z-20 flex flex-col justify-end bg-black/45">
      <div role="dialog" aria-labelledby="indicator-title" className="rounded-t-[18px] bg-white px-5 pb-6 pt-3">
        <div className="relative">
          <button
            type="button"
            aria-label="关闭选项"
            onClick={onClose}
            className="absolute right-0 top-0 grid size-8 place-items-center text-[20px] leading-none text-[#999]"
          >
            ×
          </button>
          <h2 id="indicator-title" className="px-8 pt-1 text-center text-[16px] font-medium">
            选择指示灯状态或听到提示音：
          </h2>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button type="button" onClick={onHotspot} className="flex flex-col items-center rounded-xl bg-[#F7F8FA] px-3 pb-4 pt-4">
            <span className="text-[15px]">热点配网</span>
            <IndicatorBulb blink />
          </button>
          <button type="button" onClick={onFast} className="flex flex-col items-center rounded-xl bg-[#F7F8FA] px-3 pb-4 pt-4">
            <span className="text-[15px]">Wi_Fi 快连</span>
            <IndicatorBulb blink lit />
          </button>
        </div>
      </div>
    </div>
  );
}

function WifiResetGuide({
  onClose,
  onHotspot,
  onFast,
}: {
  onClose: () => void;
  onHotspot: () => void;
  onFast: () => void;
}) {
  const [page, setPage] = useState<1 | 2>(1);
  const [sheet, setSheet] = useState(false);
  return (
    <div className="relative flex h-full flex-col bg-white px-5 pb-6 pt-3 text-[#222]">
      <div className="flex justify-end">
        <button type="button" aria-label="关闭" onClick={onClose} className="grid size-9 place-items-center text-[22px] leading-none">
          ×
        </button>
      </div>
      <h1 className="mt-2 text-[22px] font-semibold">重置设备</h1>
      <div className="mt-6 flex h-[148px] items-center justify-center rounded-lg bg-[#F5F6F8]">
        {page === 1 ? <BatteryInstallArt /> : <LockLineArt />}
      </div>
      <div className="mt-4 flex justify-center gap-3">
        <StepDot n={1} on={page === 1} />
        <StepDot n={2} on={page === 2} />
      </div>
      <p className="mt-5 text-[16px] leading-7">
        {page === 1 ? "设备安装电池" : "按照纸质说明书操作，使设备进入配网状态"}
      </p>
      <div className="mt-auto flex gap-3">
        {page === 2 ? (
          <button type="button" onClick={() => setPage(1)} className="h-12 flex-1 rounded-xl border border-[#E6E6E6] bg-white text-[16px]">
            上一步
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => (page === 1 ? setPage(2) : setSheet(true))}
          className="h-12 flex-1 rounded-xl bg-[#FF581C] text-[16px] text-white"
        >
          下一步
        </button>
      </div>
      {sheet ? <IndicatorSheet onClose={() => setSheet(false)} onHotspot={onHotspot} onFast={onFast} /> : null}
    </div>
  );
}

function StepDot({ n, on }: { n: number; on: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="size-6" aria-hidden>
      <circle cx="12" cy="12" r="11" fill={on ? "#3A3A3A" : "#fff"} stroke={on ? "#3A3A3A" : "#D5D5D5"} strokeWidth="1" />
      <text x="12" y="12" textAnchor="middle" dominantBaseline="central" fill={on ? "#fff" : "#C4C4C4"} fontSize="12">
        {n}
      </text>
    </svg>
  );
}

function BatteryInstallArt() {
  return (
    <svg viewBox="0 0 320 140" className="h-[92px] w-auto" aria-hidden>
      <path d="M72 34h86l-14 76H86z" fill="none" stroke="#C6C6C6" strokeWidth="1.6" strokeLinejoin="round" />
      <rect x="96" y="88" width="36" height="14" rx="3" fill="none" stroke="#C6C6C6" strokeWidth="1.4" />
      <path d="M186 72H162" fill="none" stroke="#C6C6C6" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M170 64l-10 8 10 8" fill="none" stroke="#C6C6C6" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      {[0, 1, 2, 3].map((index) => (
        <g key={index} transform={`translate(206 ${18 + index * 28})`}>
          <rect width="62" height="20" rx="3" fill="none" stroke="#C6C6C6" strokeWidth="1.4" />
          <rect x="62" y="6" width="5" height="8" rx="1" fill="none" stroke="#C6C6C6" strokeWidth="1.2" />
          <path d="M24 15l7-9h-4l5 9h4l-8 9h4z" fill="none" stroke="#C6C6C6" strokeWidth="1.2" strokeLinejoin="round" />
        </g>
      ))}
    </svg>
  );
}

function LockLineArt() {
  return (
    <svg viewBox="0 0 220 120" className="h-[96px] w-auto" aria-hidden>
      <rect x="78" y="6" width="48" height="108" rx="8" fill="none" stroke="#C6C6C6" strokeWidth="1.6" />
      <rect x="90" y="14" width="24" height="12" rx="2" fill="none" stroke="#C6C6C6" strokeWidth="1.2" />
      <circle cx="102" cy="20" r="2.2" fill="#3DDC84" />
      {[0, 1, 2, 3].map((row) =>
        [0, 1, 2].map((col) => (
          <rect
            key={`${row}-${col}`}
            x={90 + col * 9}
            y={32 + row * 10}
            width="6"
            height="6"
            rx="1.2"
            fill="none"
            stroke="#C6C6C6"
            strokeWidth="1"
          />
        )),
      )}
      <circle cx="102" cy="80" r="7" fill="none" stroke="#C6C6C6" strokeWidth="1.3" />
      <circle cx="102" cy="80" r="3" fill="none" stroke="#C6C6C6" strokeWidth="1" />
      <path d="M120 74h46a6 6 0 0 1 0 12h-46" fill="none" stroke="#C6C6C6" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

function IndicatorBulb({ lit = false, blink = false }: { lit?: boolean; blink?: boolean }) {
  return (
    <svg viewBox="0 0 64 72" className={`mt-3 h-11 w-10 ${blink ? "bulb-blink" : ""}`} aria-hidden>
      {lit || blink ? <ellipse className="bulb-glow" cx="32" cy="28" rx="22" ry="22" fill="#FFE38A" opacity={lit ? 0.75 : 0.45} /> : null}
      <path
        className="bulb-glass"
        d="M32 8c-9.4 0-17 7.4-17 16.6 0 6 3.2 11.3 8.1 14.2 1 .6 1.6 1.7 1.6 2.9V46h14.6v-4.3c0-1.2.6-2.3 1.6-2.9 4.9-2.9 8.1-8.2 8.1-14.2C49 15.4 41.4 8 32 8z"
        fill={lit ? "#F6C31A" : "#F6E3A4"}
      />
      <path className="bulb-glass" d="M27 34c1.2 2 2.2 3.2 5 3.2s3.8-1.2 5-3.2" fill="none" stroke={lit ? "#E2A400" : "#E7D7A2"} strokeWidth="1.4" strokeLinecap="round" />
      <rect x="25" y="48" width="14" height="3.2" rx="1" fill="#E4E4E4" />
      <rect x="26.2" y="52.4" width="11.6" height="3" rx="1" fill="#D5D5D5" />
      <rect x="27.4" y="56.6" width="9.2" height="3" rx="1" fill="#C8C8C8" />
    </svg>
  );
}

function HotspotScreen({ onClose, onNext }: { onClose: () => void; onNext: () => void }) {
  return (
    <div className="flex h-full flex-col bg-white px-6 pb-6 pt-3 text-[#222]">
      <div className="flex items-center justify-between">
        <button type="button" aria-label="关闭" onClick={onClose} className="grid size-9 place-items-center text-[22px] leading-none">
          ×
        </button>
        <span className="rounded-full bg-[#F3F4F6] px-4 py-1.5 text-[14px] text-[#666]">热点</span>
      </div>
      <h1 className="mt-4 text-[28px] font-semibold tracking-tight">连接设备热点</h1>
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <IndicatorBulb />
        <p className="mt-6 text-[16px] leading-7">请把手机 Wi-Fi 连到名称以 SmartLife 开头的设备热点，连上后返回继续。</p>
      </div>
      <button type="button" onClick={onNext} className="h-12 w-full rounded-xl bg-[#FF581C] text-[16px] text-white">
        已连接，下一步
      </button>
    </div>
  );
}

function WifiPasswordScreen({
  ssid,
  band,
  password,
  onPassword,
  onClose,
  onPick,
  onNext,
}: {
  ssid: string;
  band: string;
  password: string;
  onPassword: (value: string) => void;
  onClose: () => void;
  onPick: () => void;
  onNext: () => void;
}) {
  const ready = Boolean(ssid && password.trim());
  return (
    <div className="flex h-full flex-col bg-white px-6 pt-3 text-[#222]">
      <button type="button" aria-label="关闭" onClick={onClose} className="grid size-9 place-items-center self-start text-[22px] leading-none">
        ×
      </button>
      <h1 className="mt-14 text-center text-[22px] font-semibold">输入家庭 Wi-Fi 密码</h1>
      <p className="mt-3 text-center text-[13px] leading-6 text-[#A3A3A3]">
        请根据说明书确认设备频段，若不支持 5 Ghz，请选择
        <br />
        2.4 Ghz
      </p>
      <div className="mt-12 flex items-center justify-between border-b border-[#E6E6E6] py-3.5">
        <span className={`text-[16px] ${ssid ? "text-[#222]" : "text-[#C8C8C8]"}`}>{ssid || "未连接"}</span>
        <button type="button" onClick={onPick} className="text-[15px] text-[#2F7BFF]">
          选择 Wi-Fi
        </button>
      </div>
      <input
        type="password"
        value={password}
        autoComplete="off"
        placeholder="密码"
        onChange={(event) => onPassword(event.target.value)}
        className="border-b border-[#E6E6E6] py-3.5 text-[16px] outline-none placeholder:text-[#C8C8C8]"
      />
      {band === "5GHz" ? (
        <p className="mt-3 text-[12px] leading-5 text-[#E23B3B]">当前是 5GHz，设备若不支持请改选 2.4GHz。</p>
      ) : null}
      <button
        type="button"
        disabled={!ready}
        onClick={onNext}
        className={`mt-8 h-12 w-full rounded-[10px] text-[16px] text-white ${ready ? "bg-[#FF581C]" : "bg-[#F6D0C6]"}`}
      >
        下一步
      </button>
    </div>
  );
}

function WifiPickScreen({
  current,
  onBack,
  onSelect,
}: {
  current: string;
  onBack: () => void;
  onSelect: (network: { ssid: string; band: string }) => void;
}) {
  return (
    <div className="flex h-full flex-col bg-white text-[#222]">
      <div className="flex h-12 items-center px-2">
        <button type="button" aria-label="返回" onClick={onBack} className="grid size-9 place-items-center text-[22px] leading-none">
          ‹
        </button>
        <h1 className="flex-1 pr-9 text-center text-[17px] font-medium">选择 Wi-Fi</h1>
      </div>
      <p className="px-5 pb-2 text-[13px] leading-5 text-[#999]">设备若不支持 5GHz，请选择 2.4GHz</p>
      <ul>
        {WIFI_NETWORKS.map((network) => {
          const selected = network.ssid === current;
          return (
            <li key={network.ssid}>
              <button
                type="button"
                onClick={() => onSelect(network)}
                className="flex w-full items-center gap-3 border-b border-[#F0F0F0] px-5 py-4 text-left"
              >
                <Wifi className="size-5 shrink-0 text-[#666]" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[16px]">{network.ssid}</span>
                  <span className="text-[12px] text-[#999]">{network.band}</span>
                </span>
                {selected ? <Check className="size-5 text-[#FF581C]" /> : null}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function BluetoothStepScreen({
  page,
  onClose,
  onPrev,
  onNext,
}: {
  page: "bt1" | "bt2";
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const first = page === "bt1";
  return (
    <div className="flex h-full flex-col bg-white px-5 pb-6 pt-3 text-[#222]">
      <div className="flex items-center justify-end">
        <button type="button" aria-label="关闭" onClick={onClose} className="grid size-9 place-items-center text-[22px] leading-none">
          ×
        </button>
      </div>
      <h1 className="text-[22px] font-semibold">重置设备</h1>
      <div className="mt-6 flex h-[168px] items-center justify-center rounded-xl bg-[#F6F7F8]">
        {first ? <BatteryPhoneArt /> : <LockArtwork tone="gold" className="h-[148px] w-auto" />}
      </div>
      <div className="mt-4 flex justify-center gap-3">
        {[1, 2].map((number) => {
          const on = (first && number === 1) || (!first && number === 2);
          return (
            <span
              key={number}
              className={`grid size-6 place-items-center rounded-full text-[12px] leading-none ${on ? "bg-[#3A3A3A] text-white" : "border border-[#D0D0D0] text-[#B0B0B0]"}`}
            >
              {number}
            </span>
          );
        })}
      </div>
      <p className="mt-5 text-center text-[16px] leading-7">
        {first ? "请将设备装好电池，同时确保手机蓝牙打开" : "按产品说明书使设备进入蓝牙配网状态"}
      </p>
      <div className="mt-auto flex gap-3">
        {first ? null : (
          <button type="button" onClick={onPrev} className="h-12 flex-1 rounded-xl border border-[#E6E6E6] bg-white text-[16px]">
            上一步
          </button>
        )}
        <button type="button" onClick={onNext} className="h-12 flex-1 rounded-xl bg-[#FF581C] text-[16px] text-white">
          下一步
        </button>
      </div>
    </div>
  );
}

function BatteryPhoneArt() {
  return (
    <svg viewBox="0 0 280 120" className="h-28 w-auto" aria-hidden>
      <rect x="78" y="18" width="22" height="78" rx="4" fill="#C4A574" />
      <rect x="74" y="78" width="36" height="10" rx="2" fill="#8E8E8E" />
      <path d="M108 28l-8 16h8l-6 18 16-22h-8l6-12z" fill="#F5C518" />
      <rect x="168" y="16" width="46" height="82" rx="6" fill="none" stroke="#333" strokeWidth="2" />
      <rect x="176" y="24" width="30" height="58" rx="2" fill="#FFF" />
      <path d="M198 8c8 6 12 14 12 22" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" />
      <path d="M206 4c10 8 16 18 16 30" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function ConnectingScreen({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex h-full flex-col bg-white px-6 pt-3 text-[#222]">
      <button type="button" aria-label="关闭" onClick={onClose} className="grid size-9 place-items-center self-start text-[22px] leading-none">
        ×
      </button>
      <h1 className="mt-10 text-center text-[22px] font-semibold">正在连接设备</h1>
      <p className="mt-2 text-center text-[14px] text-[#888]">保持设备处于通电状态</p>
      <div className="mt-16 flex justify-center">
        <span className="relative grid size-24 place-items-center">
          <span className="absolute inset-0 animate-ping rounded-full bg-[#E8F1FF]" />
          <span className="absolute inset-3 rounded-full bg-[#F3F7FF]" />
          <svg viewBox="0 0 40 64" className="relative h-14 w-auto" aria-hidden>
            <rect x="6" y="4" width="28" height="54" rx="4" fill="none" stroke="#8AA0B8" strokeWidth="2" />
            <rect x="12" y="10" width="16" height="36" rx="1" fill="#F7FBFF" />
          </svg>
        </span>
      </div>
      <div className="mx-auto mt-10 h-1 w-48 overflow-hidden rounded-full bg-[#E6E6E6]">
        <div className="h-full w-1/2 animate-pulse rounded-full bg-[#FF581C]" />
      </div>
    </div>
  );
}

function PairFailedScreen({
  onClose,
  onRetry,
  onOther,
  onFeedback,
}: {
  onClose: () => void;
  onRetry: () => void;
  onOther: () => void;
  onFeedback: () => void;
}) {
  return (
    <div className="flex h-full flex-col bg-white px-6 pb-8 pt-3 text-[#222]">
      <button type="button" aria-label="关闭" onClick={onClose} className="grid size-9 place-items-center self-start text-[22px] leading-none">
        ×
      </button>
      <h1 className="mt-8 text-[22px] font-semibold leading-8">设备添加失败</h1>
      <p className="mt-1 text-[22px] font-semibold leading-8">请排查以下问题后重试</p>
      <ul className="mt-6 space-y-3 text-[15px] leading-6 text-[#555]">
        <li>· 设备通电，并处于重置状态</li>
        <li>· 请确保手机在设备附近</li>
      </ul>
      <button type="button" onClick={onRetry} className="mt-auto h-12 w-full rounded-xl bg-[#FF581C] text-[16px] text-white">
        按步骤重试
      </button>
      <button type="button" onClick={onOther} className="mt-3 h-12 w-full rounded-xl bg-[#F3F4F6] text-[16px]">
        尝试其他方式
      </button>
      <button type="button" onClick={onFeedback} className="mt-4 text-center text-[14px] text-[#888]">
        反馈问题
      </button>
    </div>
  );
}

function LockResetScreen({
  initialReady = false,
  showReset,
  onClose,
  onPickNetwork,
  onNext,
  onReset,
}: {
  initialReady?: boolean;
  showReset: boolean;
  onClose: () => void;
  onPickNetwork: () => void;
  onNext: () => void;
  onReset: () => void;
}) {
  const [ready, setReady] = useState(initialReady);

  return (
    <div className="flex h-full flex-col bg-white px-6 pb-6 pt-3 text-[#222]">
      <div className="flex items-center justify-between">
        <button type="button" aria-label="关闭" onClick={onClose} className="grid size-9 place-items-center text-[22px] leading-none">
          ×
        </button>
        <button type="button" onClick={onPickNetwork} className="rounded-full bg-[#F3F4F6] px-4 py-1.5 text-[14px] text-[#666]">
          蓝牙
        </button>
      </div>
      <h1 className="mt-4 text-[28px] font-semibold tracking-tight">重置设备</h1>
      <div className="flex flex-1 items-center justify-center py-4">
        <LockArtwork />
      </div>
      <div>
        <p className="text-[16px]">请按以下步骤完成设置</p>
        <ol className="mt-3 space-y-2">
          {RESET_STEPS.map((text, index) => (
            <li key={text} className="flex items-center gap-2 text-[15px] leading-6 text-[#333]">
              <svg viewBox="0 0 20 20" className="size-5 shrink-0 font-sans" aria-hidden>
                <circle cx="10" cy="10" r="9" fill="none" stroke="#C8C8C8" strokeWidth="1" />
                <text x="10" y="10" textAnchor="middle" dominantBaseline="central" fill="#888" fontSize="11">
                  {index + 1}
                </text>
              </svg>
              <span>{text}</span>
            </li>
          ))}
        </ol>
        {showReset ? (
          <p className="mt-3 text-[13px] leading-5 text-[#888]">长按锁体复位键 5 秒，听到提示音后松开，锁端进入蓝牙配网。</p>
        ) : null}
      </div>
      <button type="button" onClick={() => setReady((value) => !value)} className="mx-auto mt-8 flex w-fit items-center justify-center gap-2 self-center text-[15px]">
        <svg viewBox="0 0 20 20" className="size-5 shrink-0" aria-hidden>
          <circle cx="10" cy="10" r="9" fill={ready ? "#FF581C" : "none"} stroke={ready ? "#FF581C" : "#CFCFCF"} strokeWidth="1" />
          {ready ? (
            <path d="M6.1 10.3 8.7 12.9 13.9 7.4" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          ) : null}
        </svg>
        启动蓝牙配网
      </button>
      <button
        type="button"
        disabled={!ready}
        onClick={onNext}
        className={`mt-4 h-12 w-full rounded-xl text-[16px] ${ready ? "bg-[#FF581C] text-white" : "bg-[#FDECEA] text-[#F3C6BE]"}`}
      >
        下一步
      </button>
      <button type="button" onClick={onReset} className="mt-4 text-center text-[15px] text-[#2F7BFF]">
        按步骤重置设备
      </button>
    </div>
  );
}

function LockArtwork({ tone = "black", className = "h-[236px] w-auto" }: { tone?: "black" | "gold"; className?: string }) {
  const gold = tone === "gold";
  const bodyId = gold ? "lock-body-gold" : "lock-body-black";
  return (
    <svg viewBox="0 0 220 320" className={className} aria-hidden>
      <defs>
        <linearGradient id={bodyId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={gold ? "#E7D3A8" : "#4E535B"} />
          <stop offset="0.35" stopColor={gold ? "#C4A36A" : "#2A2E34"} />
          <stop offset="1" stopColor={gold ? "#8C7044" : "#15171A"} />
        </linearGradient>
        <linearGradient id="lock-handle" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={gold ? "#F2F2F2" : "#6B7078"} />
          <stop offset="1" stopColor={gold ? "#A7A7A7" : "#2C3036"} />
        </linearGradient>
        <linearGradient id="lock-key" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={gold ? "#F3E6C8" : "#3C4148"} />
          <stop offset="1" stopColor={gold ? "#CDB07A" : "#23272C"} />
        </linearGradient>
      </defs>
      <rect x="86" y="16" width="52" height="288" rx="8" fill={`url(#${bodyId})`} />
      <rect x="94" y="28" width="36" height="22" rx="2" fill="#101114" />
      <rect x="100" y="34" width="18" height="8" rx="1" fill="#1C2830" />
      <circle cx="112" cy="38" r="1.4" fill="#3DDC84" />
      {Array.from({ length: 12 }, (_, index) => {
        const col = index % 3;
        const row = Math.floor(index / 3);
        return <rect key={index} x={96 + col * 12} y={60 + row * 16} width="9" height="11" rx="1.5" fill="url(#lock-key)" />;
      })}
      <circle cx="112" cy="142" r="11" fill="#1A1D21" stroke="#8E949C" strokeWidth="1" />
      <path d="M107 142c1.2-3 3-4.2 5-4.2s3.8 1.2 5 4.2c-1.2 3-3 4.2-5 4.2s-3.8-1.2-5-4.2z" fill="none" stroke="#C5C8CE" strokeWidth="0.8" />
      <path d="M112 138.5v7M108.8 142h6.4" stroke="#C5C8CE" strokeWidth="0.7" />
      <rect x="104" y="188" width="22" height="28" rx="3" fill="#1A1C20" />
      <rect x="118" y="194" width="58" height="16" rx="8" fill="url(#lock-handle)" />
      <rect x="92" y="286" width="40" height="6" rx="1" fill="#101214" />
    </svg>
  );
}

function useDevice(id: string) {
  const { data } = useApp();
  return data.devices.find((device) => device.id === id);
}

const LOCK_NOTICES = [
  { title: "通知", body: "本地录像会丢？云存永久存", count: 2 },
  { title: "告警", body: "门口有人停留超过 10 秒", count: 1 },
  { title: "录像", body: "今天 18:02 有一段门口录像", count: 1 },
];

export function DeviceScreen({ id }: { id: string }) {
  const device = useDevice(id);
  const { patchDevice, pushLog } = useApp();
  const { pop, push, notify } = useNav();
  const [phrase, setPhrase] = useState("今天过得怎么样");

  if (!device) return <Page title="设备" onBack={pop}><p>设备已移除。</p></Page>;

  if (device.kind === "lock") {
    return <LockPanel device={device} />;
  }

  const homeName = device.on ? "在线" : "已关闭";

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

        <div className="mt-4">
          <Cell label="操作记录" onClick={() => push({ name: "device-logs", id: device.id })} />
        </div>
      </div>
    </div>
  );
}

function clockOf(label: string) {
  const match = label.match(/(\d{1,2}:\d{2})/);
  return match?.[1] ?? label;
}

function VisualLockScreen({ device }: { device: Device }) {
  const { patchDevice, pushLog } = useApp();
  const { pop, push, notify } = useNav();
  const [holding, setHolding] = useState(false);
  const [progress, setProgress] = useState(0);
  const timer = useRef<number | null>(null);
  const frame = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; moved: boolean; key: string; axis: "x" | "y" | null } | null>(null);
  const offset = useRef(0);
  const [frameWidth, setFrameWidth] = useState(0);
  const [cardIndex, setCardIndex] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const latest = device.logs[0];
  const slides = [
    {
      key: "notice",
      title: "通知",
      body: "本地录像会丢？云存永久存",
      count: 2,
      icon: "bell" as const,
      go: () => push({ name: "lock-notices", id: device.id }),
    },
    {
      key: "album",
      title: "相册/日志",
      body: latest ? `${clockOf(latest.time)} ${latest.text}` : "暂无记录",
      count: device.logs.length,
      icon: "list" as const,
      go: () => push({ name: "device-logs", id: device.id }),
    },
    {
      key: "alarm",
      title: "告警",
      body: "门口有人停留超过 10 秒",
      count: 1,
      icon: "bell" as const,
      go: () => push({ name: "lock-notices", id: device.id }),
    },
  ];
  const peek = 72;
  const gap = 12;
  const cardWidth = Math.max(frameWidth - peek, 0);
  const stride = cardWidth + gap;

  useLayoutEffect(() => {
    const node = frame.current;
    if (!node) return;
    const measure = () => setFrameWidth(node.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  function stopHold() {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = null;
    setHolding(false);
    setProgress(0);
  }

  function startHold() {
    const begun = Date.now();
    setHolding(true);
    const tick = () => {
      const next = Math.min(1, (Date.now() - begun) / 900);
      setProgress(next);
      if (next >= 1) {
        patchDevice(device.id, { locked: false });
        pushLog(device.id, "远程解锁");
        notify("已开锁");
        stopHold();
        return;
      }
      timer.current = window.setTimeout(tick, 30);
    };
    tick();
  }

  const rows: { label: string; icon: React.ReactNode; go: () => void }[] = [
    { label: "视频监控", icon: <Video className="size-5" />, go: () => push({ name: "lock-video", id: device.id }) },
    { label: "AI", icon: <span className="text-[13px] font-semibold">AI</span>, go: () => push({ name: "lock-ai", id: device.id }) },
    { label: "成员管理", icon: <UserRound className="size-5" />, go: () => push({ name: "lock-users", id: device.id }) },
    { label: "临时密码", icon: <Grid3x3 className="size-5" />, go: () => push({ name: "temp-pass", id: device.id }) },
    { label: "智能联动", icon: <ToggleRight className="size-5" />, go: () => push({ name: "lock-link", id: device.id }) },
    { label: "设置", icon: <Settings className="size-5" />, go: () => push({ name: "device-settings", id: device.id }) },
  ];

  return (
    <div className="flex h-full flex-col bg-[#F3F4F6] text-[#222]">
      <header className="relative flex h-12 shrink-0 items-center justify-center px-12">
        <button type="button" aria-label="返回" onClick={pop} className="absolute left-1 grid size-10 place-items-center">
          <ChevronLeft className="size-6" />
        </button>
        <h1 className="truncate text-[17px] font-medium">{device.name || "可视智能门锁"}</h1>
        <button
          type="button"
          aria-label="编辑设备"
          onClick={() => push({ name: "device-settings", id: device.id })}
          className="absolute right-2 grid size-10 place-items-center"
        >
          <Pencil className="size-5" />
        </button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6">
        <div className="flex justify-center pt-2">
          <span className="grid size-10 place-items-center rounded-full bg-[#E7F8F2] text-[#20C6A4]">
            <Wifi className="size-5" />
          </span>
        </div>
        <button
          type="button"
          aria-label="长按开锁"
          onPointerDown={startHold}
          onPointerUp={stopHold}
          onPointerLeave={stopHold}
          onPointerCancel={stopHold}
          className="mx-auto mt-4 grid size-[210px] place-items-center"
        >
          <span className="relative grid size-[210px] place-items-center">
            <svg viewBox="0 0 100 100" className="absolute inset-0 size-full">
              <circle cx="50" cy="50" r="40" fill="none" stroke="#D9F6EF" strokeWidth="9" />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#20C6A4"
                strokeWidth="9"
                strokeLinecap="round"
                strokeDasharray={`${holding ? Math.max(18, 251 * progress) : 251} 251`}
                transform="rotate(-90 50 50)"
              />
            </svg>
            <span className="grid size-[132px] place-items-center rounded-full bg-white text-[#20C6A4]">
              <Lock className="size-8" />
              <span className="mt-1 text-[14px]">{holding && progress > 0.15 ? "松开开锁" : "长按开锁"}</span>
            </span>
          </span>
        </button>
        <div className="mt-4 flex flex-col items-center text-[#8A8F98]">
          <BatteryMedium className="size-6 text-[#2BD18A]" />
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
            if (!current) return;
            const delta = offset.current;
            offset.current = 0;
            setDragging(false);
            setDragX(0);
            if (current.axis === "y") return;
            if (!current.moved) {
              slides.find((slide) => slide.key === current.key)?.go();
              return;
            }
            if (delta < -40) setCardIndex((index) => Math.min(slides.length - 1, index + 1));
            else if (delta > 40) setCardIndex((index) => Math.max(0, index - 1));
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

        <div className="mt-3 overflow-hidden rounded-2xl bg-white">
          {rows.map((row) => (
            <button key={row.label} type="button" onClick={row.go} className="flex w-full items-center gap-3 px-4 py-3.5 text-left">
              <span className="grid size-9 place-items-center rounded-full bg-[#2BD18A] text-white">{row.icon}</span>
              <span className="text-[16px]">{row.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function LockVideoScreen({ id }: { id: string }) {
  const device = useDevice(id);
  const { pop, notify } = useNav();
  if (!device) return <Page title="视频监控" onBack={pop}><p>设备已移除。</p></Page>;
  return (
    <Page title="视频监控" onBack={pop}>
      <div className="overflow-hidden rounded-2xl bg-[#14181c] px-4 py-10 text-center text-white">
        <p className="text-[13px] text-white/60">{device.name}</p>
        <p className="mt-6 text-[18px]">门口实时画面</p>
        <p className="mt-2 text-[13px] text-white/50">摄像头在线 · 今天 20:51</p>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <button type="button" className="h-11 rounded-xl bg-white" onClick={() => notify("正在对讲")}>对讲</button>
        <button type="button" className="h-11 rounded-xl bg-white" onClick={() => notify("已抓拍一张")}>抓拍</button>
      </div>
    </Page>
  );
}

export function LockAiScreen({ id }: { id: string }) {
  const device = useDevice(id);
  const { pop } = useNav();
  if (!device) return <Page title="AI" onBack={pop}><p>设备已移除。</p></Page>;
  return (
    <Page title="AI" onBack={pop}>
      <p className="text-[14px] leading-6 text-[#666]">{device.name}会根据门口录像给出提醒。</p>
      <div className="mt-4 flex flex-col gap-3">
        {["有人在门口停留，可以查看实时画面。", "临时密码今天被使用过一次。", "电量充足，暂不需要更换电池。"].map((item) => (
          <p key={item} className="rounded-2xl bg-white px-4 py-4 text-[15px] leading-6">{item}</p>
        ))}
      </div>
    </Page>
  );
}

export function LockLinkScreen({ id }: { id: string }) {
  const device = useDevice(id);
  const { data } = useApp();
  const { pop, push } = useNav();
  if (!device) return <Page title="智能联动" onBack={pop}><p>设备已移除。</p></Page>;
  const scenes = data.scenes.filter((scene) => scene.homeId === device.homeId);
  return (
    <Page title="智能联动" onBack={pop}>
      <p className="text-[14px] leading-6 text-[#666]">门锁可以和其他设备一起执行。</p>
      <div className="mt-4 overflow-hidden rounded-2xl bg-white">
        {scenes.length === 0 ? <p className="px-4 py-6 text-[14px] text-[#888]">还没有联动。</p> : null}
        {scenes.map((scene) => (
          <button
            key={scene.id}
            type="button"
            onClick={() => push({ name: "scene-edit", kind: scene.kind, id: scene.id })}
            className="flex w-full items-center justify-between border-b border-[#F4F4F4] px-4 py-4 text-left last:border-b-0"
          >
            <span>
              <span className="block text-[16px]">{scene.name}</span>
              <span className="text-[12px] text-[#999]">{scene.when}</span>
            </span>
            <ChevronRight className="size-4 text-[#CCC]" />
          </button>
        ))}
      </div>
      <div className="mt-4">
        <PrimaryButton onClick={() => push({ name: "scene-edit", kind: "auto" })}>创建联动</PrimaryButton>
      </div>
    </Page>
  );
}

export function LockNoticesScreen({ id }: { id: string }) {
  const device = useDevice(id);
  const { pop, push } = useNav();
  if (!device) return <Page title="通知" onBack={pop}><p>设备已移除。</p></Page>;
  return (
    <Page title="通知" onBack={pop}>
      <div className="overflow-hidden rounded-2xl bg-white">
        {LOCK_NOTICES.map((item) => (
          <button
            key={item.title}
            type="button"
            onClick={() => push({ name: "lock-video", id: device.id })}
            className="flex w-full items-center gap-3 border-b border-[#F4F4F4] px-4 py-4 text-left last:border-b-0"
          >
            <span className="grid size-9 place-items-center rounded-full bg-[#E8FBF3] text-[#2BD18A]">
              <Bell className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[16px]">{item.title}</span>
              <span className="mt-1 block text-[13px] text-[#666]">{item.body}</span>
            </span>
            <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[#F04444] px-1 text-[11px] text-white">{item.count}</span>
          </button>
        ))}
      </div>
    </Page>
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
    <Page title={device.kind === "lock" ? "相册/日志" : "操作记录"} onBack={pop} bleed>
      {device.kind === "lock" ? (
        <div className="bg-white px-4 py-4">
          <p className="text-[13px] text-[#999]">相册</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {(device.logs.length ? device.logs.slice(0, 2) : [{ id: "empty", text: "暂无抓拍", time: "" }]).map((shot) => (
              <div key={shot.id} className="overflow-hidden rounded-xl bg-[#E7F6F1]">
                <div className="flex h-24 items-center justify-center text-[#20C6A4]">
                  <Video className="size-7" />
                </div>
                <p className="truncate px-2 py-2 text-[12px] text-[#666]">{shot.time ? `${clockOf(shot.time)} 门口` : shot.text}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
      {device.kind === "lock" ? <p className="px-4 pb-2 pt-4 text-[13px] text-[#999]">日志</p> : null}
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
