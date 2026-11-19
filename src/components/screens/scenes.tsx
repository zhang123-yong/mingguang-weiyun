"use client";

import { useState } from "react";
import {
  Bell,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  CloudRain,
  DoorOpen,
  Hand,
  Info,
  Lightbulb,
  Mic,
  Plus,
  SunMedium,
} from "lucide-react";
import {
  ConfirmDialog,
  EmptyState,
  Field,
  Page,
  PrimaryButton,
  Switch,
  TextInput,
} from "@/components/chrome";
import { useApp } from "@/lib/app-state";
import { actionText, type Device, type Scene, type SceneAction } from "@/lib/model";
import { useNav } from "@/lib/nav";

export function SceneScreen({ fixedKind }: { fixedKind: "tap" | "auto" }) {
  const { data, patchScene, runScene } = useApp();
  const { push, pop, notify } = useNav();
  const kind = fixedKind;
  const homeId = data.currentHomeId;
  const scenes = data.scenes.filter((scene) => scene.homeId === homeId && scene.kind === kind);

  return (
    <div className="flex h-full flex-col bg-[#F5F6F8]">
      <header className="flex h-12 items-center justify-between bg-white px-2">
        <button type="button" aria-label="返回" onClick={pop} className="grid size-10 place-items-center">
          <ChevronLeft className="size-6" />
        </button>
        <h1 className="text-[17px] font-medium">{kind === "auto" ? "自动化" : "手动执行"}</h1>
        <button
          type="button"
          aria-label="创建"
          className="grid size-10 place-items-center text-[#222]"
          onClick={() => push({ name: "scene-edit", kind })}
        >
          <Plus className="size-5" />
        </button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {scenes.length === 0 ? (
          <EmptyState
            title={kind === "tap" ? "还没有一键执行" : "还没有自动化"}
            body="创建一个场景，把开锁、开灯和喂食放在一起。"
            action="创建场景"
            onAction={() => push({ name: "scene-edit", kind })}
          />
        ) : (
          <div className="flex flex-col gap-3">
            {scenes.map((scene) => (
              <article key={scene.id} className="rounded-2xl bg-white p-4">
                <button
                  type="button"
                  className="w-full text-left"
                  onClick={() => push({ name: "scene-edit", kind: scene.kind, id: scene.id })}
                >
                  <p className="text-[16px] font-medium">{scene.name}</p>
                  <p className="mt-1 text-[12px] leading-5 text-[#888]">
                    {scene.when} · {scene.actions.map((action) => actionText(action, data.devices)).join("，") || "未设置动作"}
                  </p>
                </button>
                <div className="mt-3 flex items-center justify-between">
                  {scene.kind === "tap" ? (
                    <button
                      type="button"
                      className="h-8 rounded-full bg-[#FFF1EA] px-4 text-[13px] text-[#FF581C]"
                      onClick={() => notify(runScene(scene.id))}
                    >
                      执行
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="text-[13px] text-[#3A7BFF]"
                      onClick={() => notify(runScene(scene.id))}
                    >
                      试运行
                    </button>
                  )}
                  {scene.kind === "auto" ? (
                    <Switch
                      checked={scene.enabled}
                      label={`${scene.name}开关`}
                      onChange={(enabled) => {
                        patchScene(scene.id, { enabled });
                        notify(enabled ? "自动化已启用" : "自动化已关闭");
                      }}
                    />
                  ) : (
                    <span className="text-[12px] text-[#AAA]">一键执行</span>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const WHEN_OPTIONS = ["点击执行", "每天 07:00", "每天早上7点", "每天 23:00", "有人到家", "设备状态变化时", "温度高于 28°C", "在家布防", "触发烟雾报警", "暴雨暴雪预警"];

export function SceneEditor({
  kind,
  id,
  initialName,
  initialWhen,
}: {
  kind: "tap" | "auto";
  id?: string;
  initialName?: string;
  initialWhen?: string;
}) {
  const { data, addScene, patchScene, removeScene } = useApp();
  const { pop, notify } = useNav();
  const existing = data.scenes.find((scene) => scene.id === id);
  const homeId = existing?.homeId ?? data.currentHomeId;
  const devices = data.devices.filter((device) => device.homeId === homeId);
  const [name, setName] = useState(existing?.name ?? initialName ?? (kind === "tap" ? "新的一键执行" : "新的自动化"));
  const [when, setWhen] = useState(existing?.when ?? initialWhen ?? (kind === "tap" ? "点击执行" : "每天 23:00"));
  const [actions, setActions] = useState<SceneAction[]>(existing?.actions ?? []);
  const [confirmDelete, setConfirmDelete] = useState(false);

  function sameAction(left: SceneAction, right: SceneAction) {
    if (left.deviceId !== right.deviceId || left.command !== right.command) return false;
    if (left.command === "power" && right.command === "power") return left.on === right.on;
    if (left.command === "lock" && right.command === "lock") return left.locked === right.locked;
    return true;
  }

  function toggleAction(next: SceneAction) {
    setActions((current) => {
      if (current.some((item) => sameAction(item, next))) {
        return current.filter((item) => !sameAction(item, next));
      }
      return [
        ...current.filter((item) => {
          if (item.deviceId !== next.deviceId) return true;
          if (next.command === "feed") return item.command !== "feed";
          if (item.command === "feed") return true;
          return false;
        }),
        next,
      ];
    });
  }

  function lockActive(deviceId: string, locked: boolean) {
    return actions.some(
      (item) => item.deviceId === deviceId && item.command === "lock" && item.locked === locked,
    );
  }

  function powerActive(deviceId: string, on: boolean) {
    return actions.some(
      (item) => item.deviceId === deviceId && item.command === "power" && item.on === on,
    );
  }

  function save() {
    if (!name.trim()) {
      notify("请填写场景名称");
      return;
    }
    if (actions.length === 0) {
      notify("请至少选择一个动作");
      return;
    }
    const scene: Omit<Scene, "id"> = {
      homeId,
      kind: existing?.kind ?? kind,
      name: name.trim(),
      enabled: existing?.enabled ?? true,
      when,
      actions,
    };
    if (existing) patchScene(existing.id, scene);
    else addScene(scene);
    notify(existing ? "场景已保存" : "场景已创建");
    pop();
  }

  return (
    <Page title={existing ? "编辑场景" : "创建场景"} onBack={pop}>
      <div className="flex flex-col gap-4 pb-8">
        <Field label="名称">
          <TextInput value={name} onChange={(event) => setName(event.target.value)} />
        </Field>
        <div>
          <p className="mb-2 text-[13px] text-[#888]">当</p>
          <div className="flex flex-wrap gap-2">
            {(() => {
              const choices = WHEN_OPTIONS.filter((item) => (kind === "tap" ? item === "点击执行" : item !== "点击执行"));
              return choices.includes(when) ? choices : [when, ...choices];
            })().map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setWhen(item)}
                className={`rounded-full px-3 py-1.5 text-[13px] ${
                  when === item ? "bg-[#FF581C] text-white" : "bg-white text-[#555]"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-[13px] text-[#888]">就执行</p>
          {devices.length === 0 ? (
            <p className="rounded-2xl bg-white px-4 py-4 text-[14px] text-[#888]">当前家庭还没有设备。</p>
          ) : (
            <div className="flex flex-col gap-2">
              {devices.map((device) => (
                <div key={device.id} className="rounded-2xl bg-white px-4 py-3">
                  <p className="text-[15px]">{device.name}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {device.kind === "lock" ? (
                      <>
                        <Choice
                          label="开锁"
                          active={lockActive(device.id, false)}
                          onClick={() => toggleAction({ deviceId: device.id, command: "lock", locked: false })}
                        />
                        <Choice
                          label={device.lockKind === "semi" ? "手动上锁提醒" : "上锁"}
                          active={lockActive(device.id, true)}
                          onClick={() => toggleAction({ deviceId: device.id, command: "lock", locked: true })}
                        />
                      </>
                    ) : null}
                    {device.kind !== "lock" ? (
                      <>
                        <Choice
                          label="开启"
                          active={powerActive(device.id, true)}
                          onClick={() => toggleAction({ deviceId: device.id, command: "power", on: true })}
                        />
                        <Choice
                          label="关闭"
                          active={powerActive(device.id, false)}
                          onClick={() => toggleAction({ deviceId: device.id, command: "power", on: false })}
                        />
                      </>
                    ) : null}
                    {device.kind === "pet" ? (
                      <Choice
                        label="喂食"
                        active={actions.some((item) => item.deviceId === device.id && item.command === "feed")}
                        onClick={() => toggleAction({ deviceId: device.id, command: "feed" })}
                      />
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <PrimaryButton onClick={save}>保存</PrimaryButton>
        {existing ? (
          <button type="button" className="h-11 text-[15px] text-[#E23B3B]" onClick={() => setConfirmDelete(true)}>
            删除场景
          </button>
        ) : null}
      </div>
      {confirmDelete && existing ? (
        <ConfirmDialog
          title="删除场景"
          body={`删除「${existing.name}」后不能恢复。`}
          confirmText="删除"
          danger
          onClose={() => setConfirmDelete(false)}
          onConfirm={() => {
            removeScene(existing.id);
            notify("场景已删除");
            pop();
          }}
        />
      ) : null}
    </Page>
  );
}

const APP_PROMPTS = [
  { icon: "💡", title: "全屋灯光一键切换", when: "点击执行", action: "off" },
  { icon: "🏠", title: "打造宠物智能小家", when: "点击执行", action: "feed" },
  { icon: "🤖", title: "扫地机别再每次重设了", when: "点击执行", action: "on" },
  { icon: "🔌", title: "一键管理所有宠物设备", when: "点击执行", action: "on" },
] as const;

export function SmartCreateScreen({ prompt = "" }: { prompt?: string }) {
  const { data, addScene } = useApp();
  const { pop, push, notify } = useNav();
  const [text, setText] = useState(prompt);
  const homeId = data.currentHomeId;
  const devices = data.devices.filter((device) => device.homeId === homeId);

  function listen() {
    notify("请说出想要的应用");
    window.setTimeout(() => {
      setText((current) => (current.trim() ? current : "全屋灯光一键切换"));
    }, 700);
  }

  function create() {
    const spoken = text.trim();
    if (!spoken) {
      notify("先说出你想要的应用");
      return;
    }
    addScene(sceneFromPrompt(spoken, homeId, devices));
    notify("智能应用已创建");
    pop();
  }

  return (
    <div className="flex h-full flex-col bg-[#F7F8FB]">
      <header className="grid h-12 grid-cols-[40px_1fr_72px] items-center px-2">
        <button type="button" aria-label="返回" onClick={pop} className="grid size-10 place-items-center text-[28px]">‹</button>
        <h1 className="text-center text-[17px] font-medium">创建智能应用</h1>
        <button type="button" onClick={() => push({ name: "plus" })} className="justify-self-end rounded-full bg-[#F6F0FF] px-3 py-1 text-[13px] text-[#D4C4F5]">
          Plus
        </button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-4">
        <p className="pt-6 text-center text-[22px] font-medium text-[#E4E7EE]">创建你的专属智能应用</p>
        <div className="mt-10 flex flex-col gap-6">
          {APP_PROMPTS.map((item) => (
            <button key={item.title} type="button" onClick={() => setText(item.title)} className="flex items-center gap-3 text-left text-[16px]">
              <span className="text-[18px]">{item.icon}</span>
              <span>{item.title}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="px-4 pb-4">
        <div className="rounded-2xl bg-white p-3 shadow-[0_8px_24px_rgba(20,24,40,0.06)]">
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="说出你想要的应用..."
            rows={2}
            className="w-full resize-none bg-transparent px-1 text-[15px] outline-none placeholder:text-[#C5C8CE]"
          />
          <div className="mt-1 flex items-center justify-between">
            <button type="button" onClick={create} className="h-9 rounded-full bg-[#E7F3FF] px-4 text-[14px] text-[#3A8DFF]">
              创建智能应用
            </button>
            <button type="button" aria-label="语音输入" onClick={listen} className="grid size-10 place-items-center rounded-full border border-[#EEE]">
              <Mic className="size-5 text-[#666]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const TRIGGERS: {
  title: string;
  example: string;
  kind: "tap" | "auto";
  when: string;
  tint: string;
  mark: "hand" | "bulb" | "clock" | "sun" | "check" | "bell" | "door" | "rain";
}[] = [
  { title: "手动执行", example: "例如：一键关闭卧室所有的灯", kind: "tap", when: "点击执行", tint: "#2FCF8A", mark: "hand" },
  { title: "设备状态变化时", example: "例如：当报警器检测报警时", kind: "auto", when: "设备状态变化时", tint: "#F5C542", mark: "bulb" },
  { title: "定时", example: "例如：每天早上7点", kind: "auto", when: "每天早上7点", tint: "#3A8DFF", mark: "clock" },
  { title: "气象变化时", example: "例如：当所在城市温度>28°C时", kind: "auto", when: "温度高于 28°C", tint: "#F6A623", mark: "sun" },
  { title: "更改布防模式", example: "例如：网关在家布防", kind: "auto", when: "在家布防", tint: "#3A8DFF", mark: "check" },
  { title: "报警触发时", example: "例如：触发烟雾报警", kind: "auto", when: "触发烟雾报警", tint: "#FF5A5A", mark: "bell" },
  { title: "家人回家", example: "例如：母亲节，当母亲进门时", kind: "auto", when: "有人到家", tint: "#2FCF8A", mark: "door" },
  { title: "灾害预警", example: "例如：暴雨、暴雪等24小时灾害预警", kind: "auto", when: "暴雨暴雪预警", tint: "#5B8CFF", mark: "rain" },
];

export function SceneCreateScreen() {
  const { pop, push } = useNav();
  function edit(kind: "tap" | "auto", initialName: string, initialWhen: string) {
    pop();
    push({ name: "scene-edit", kind, initialName, initialWhen });
  }
  return (
    <div className="relative flex h-full flex-col bg-[#F4F6F8]">
      <header className="grid h-12 grid-cols-[40px_1fr_40px] items-center px-2">
        <button type="button" aria-label="返回" onClick={pop} className="grid size-10 place-items-center text-[28px]">‹</button>
        <h1 className="text-center text-[17px] font-medium">创建场景</h1>
        <span />
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-24">
        <p className="px-1 pb-3 text-[13px] text-[#A0A4AA]">请选择场景触发方式</p>
        <div className="flex flex-col gap-3">
          {TRIGGERS.map((item) => (
            <button
              key={item.title}
              type="button"
              onClick={() => edit(item.kind, item.title === "手动执行" ? "新的手动执行" : item.title, item.when)}
              className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3.5 text-left"
            >
              <TriggerMark mark={item.mark} tint={item.tint} />
              <span className="min-w-0 flex-1">
                <span className="block text-[16px]">{item.title}</span>
                <span className="mt-1 block text-[12px] text-[#A0A4AA]">{item.example}</span>
              </span>
              <ChevronRight className="size-4 shrink-0 text-[#C8C8C8]" />
            </button>
          ))}
        </div>
      </div>
      <button
        type="button"
        onClick={() => push({ name: "smart-create" })}
        className="absolute bottom-[72px] right-4 flex h-11 items-center gap-2 rounded-full bg-white px-3 shadow-[0_8px_24px_rgba(20,24,40,0.12)]"
      >
        <SwirlMark className="size-7" />
        <span className="pr-1 text-[14px]">AI创建</span>
      </button>
      <button
        type="button"
        onClick={() => edit("tap", "新的手动执行", "点击执行")}
        className="flex h-14 items-center justify-center gap-2 border-t border-[#F0F0F0] bg-white text-[15px]"
      >
        <Info className="size-4 text-[#666]" />
        点击快速创建场景
      </button>
    </div>
  );
}

export function SmartAppsScreen() {
  const { data } = useApp();
  const { pop, push } = useNav();
  const scenes = data.scenes.filter((scene) => scene.homeId === data.currentHomeId);
  const groups = [
    ["智能应用", scenes.filter((scene) => scene.smartApp)],
    ["手动执行", scenes.filter((scene) => scene.kind === "tap" && !scene.smartApp)],
    ["自动化", scenes.filter((scene) => scene.kind === "auto" && !scene.smartApp)],
  ] as const;
  return (
    <div className="flex h-full flex-col bg-[#F7F8FB]">
      <header className="grid h-12 grid-cols-[40px_1fr_40px] items-center px-2">
        <button type="button" aria-label="返回" onClick={pop} className="grid size-10 place-items-center text-[28px]">‹</button>
        <h1 className="text-center text-[17px] font-medium">我的应用</h1>
        <span />
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6">
        {scenes.length === 0 ? (
          <p className="px-6 py-16 text-center text-[15px] text-[#A0A4AA]">暂无应用</p>
        ) : groups.map(([title, items]) => items.length ? (
          <div key={title} className="mb-4">
            <p className="px-1 pb-2 text-[13px] text-[#A0A4AA]">{title}</p>
            <div className="overflow-hidden rounded-2xl bg-white">
              {items.map((scene) => (
                <button key={scene.id} type="button" onClick={() => push({ name: "scene-edit", kind: scene.kind, id: scene.id })} className="flex w-full items-center justify-between border-b border-[#F4F5F7] px-4 py-4 text-left last:border-b-0">
                  <span>
                    <span className="block text-[16px]">{scene.name}</span>
                    <span className="mt-1 block text-[12px] text-[#A0A4AA]">{scene.when}</span>
                  </span>
                  <ChevronRight className="size-4 text-[#C8C8C8]" />
                </button>
              ))}
            </div>
          </div>
        ) : null)}
      </div>
    </div>
  );
}

function sceneFromPrompt(spoken: string, homeId: string, devices: Device[]): Omit<Scene, "id"> {
  const known = APP_PROMPTS.find((item) => spoken.includes(item.title));
  const when = known?.when ?? (spoken.includes("定时") || spoken.includes("早上") ? "每天早上7点" : spoken.includes("到家") || spoken.includes("进门") ? "有人到家" : spoken.includes("报警") ? "触发烟雾报警" : "点击执行");
  const name = known?.title ?? (spoken.length > 16 ? `${spoken.slice(0, 16)}…` : spoken);
  const wanted = known?.action ?? (spoken.includes("关") ? "off" : spoken.includes("喂") || spoken.includes("宠物") ? "feed" : "on");
  const actions: SceneAction[] = [];
  if (wanted === "feed") {
    const pet = devices.find((device) => device.kind === "pet");
    if (pet) actions.push({ deviceId: pet.id, command: "feed" });
  } else if (wanted === "off") {
    devices.filter((device) => device.kind !== "lock").forEach((device) => actions.push({ deviceId: device.id, command: "power", on: false }));
    if (actions.length === 0) {
      const lock = devices.find((device) => device.kind === "lock");
      if (lock) actions.push({ deviceId: lock.id, command: "lock", locked: true });
    }
  } else {
    const device = devices.find((item) => item.kind !== "lock") ?? devices[0];
    if (device?.kind === "lock") actions.push({ deviceId: device.id, command: "lock", locked: false });
    else if (device) actions.push({ deviceId: device.id, command: "power", on: true });
  }
  return { homeId, kind: when === "点击执行" ? "tap" : "auto", smartApp: true, name, enabled: true, when, actions };
}

function TriggerMark({ mark, tint }: { mark: (typeof TRIGGERS)[number]["mark"]; tint: string }) {
  const className = "size-5";
  const icon = mark === "hand" ? <Hand className={className} />
    : mark === "bulb" ? <Lightbulb className={className} />
    : mark === "clock" ? <Clock3 className={className} />
    : mark === "sun" ? <SunMedium className={className} />
    : mark === "check" ? <Check className={className} />
    : mark === "bell" ? <Bell className={className} />
    : mark === "door" ? <DoorOpen className={className} />
    : <CloudRain className={className} />;
  return <span className="grid size-10 shrink-0 place-items-center rounded-xl text-white" style={{ background: tint }}>{icon}</span>;
}

export function SwirlMark({ className = "size-7" }: { className?: string }) {
  const id = "smart-swirl";
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#2FE2A0" />
          <stop offset="0.5" stopColor="#3AA0FF" />
          <stop offset="1" stopColor="#7A5CFF" />
        </linearGradient>
      </defs>
      <path fill={`url(#${id})`} d="M16.2 2.8c1.6 3.6 1.2 6.2-.8 8 2.8-.6 5.4.4 7 2.4-2.6.2-4.4 1.8-4.8 4.4 3.2-.4 5.8 1 7.2 3.4-3.4.6-5.4 2.6-5.6 5.8-.8-3.4-2.8-5.4-6.2-5.6 1.2-2.6-.2-5.2-3.2-6.4 2.6-.8 4.4-2.8 5-5.6-1.8 1.6-4.2 2-6.6.8 2.2-2 4.2-4.4 8-7.2Z" />
    </svg>
  );
}

function Choice({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-[12px] ${active ? "bg-[#FFF1EA] text-[#FF581C]" : "bg-[#F4F4F4] text-[#666]"}`}
    >
      {label}
    </button>
  );
}
