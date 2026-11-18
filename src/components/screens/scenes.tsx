"use client";

import { useState } from "react";
import { ChevronLeft, Plus } from "lucide-react";
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
import { actionText, type Scene, type SceneAction } from "@/lib/model";
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

const WHEN_OPTIONS = ["点击执行", "每天 07:00", "每天 23:00", "有人到家"];

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
            {WHEN_OPTIONS.filter((item) => (kind === "tap" ? item === "点击执行" : item !== "点击执行")).map((item) => (
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
