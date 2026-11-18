"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  actionText,
  createSeed,
  nowLabel,
  productOf,
  rid,
  type AppData,
  type Device,
  type LoginMethod,
  type Scene,
  type SceneAction,
} from "@/lib/model";

const STORAGE_KEY = "mingguang-home-v2";

type AppStateValue = {
  data: AppData;
  ready: boolean;
  login: (input: {
    method: LoginMethod;
    nickname: string;
    phone?: string;
    password?: string;
  }) => void;
  logout: () => void;
  eraseAccount: () => void;
  setAgreed: (value: boolean) => void;
  setHome: (id: string) => void;
  addHome: (name: string, roomNames: string[]) => string;
  renameHome: (id: string, name: string) => void;
  removeHome: (id: string) => void;
  addRoom: (homeId: string, name: string) => void;
  renameRoom: (homeId: string, roomId: string, name: string) => void;
  removeRoom: (homeId: string, roomId: string) => void;
  addMember: (homeId: string, name: string) => void;
  removeMember: (homeId: string, name: string) => void;
  addDevice: (input: {
    productId: string;
    name: string;
    homeId: string;
    roomId: string;
  }) => string;
  patchDevice: (id: string, patch: Partial<Device>) => void;
  removeDevice: (id: string) => void;
  pushLog: (id: string, text: string) => void;
  addShare: (id: string, phone: string) => void;
  removeShare: (id: string, phone: string) => void;
  addLockUser: (id: string, name: string, method: string) => void;
  removeLockUser: (id: string, userId: string) => void;
  addTempCode: (id: string) => string;
  addGroup: (homeId: string, name: string, deviceIds: string[]) => void;
  removeGroup: (id: string) => void;
  addScene: (scene: Omit<Scene, "id">) => void;
  patchScene: (id: string, patch: Partial<Scene>) => void;
  removeScene: (id: string) => void;
  runScene: (id: string) => string;
  markMail: (id: string) => void;
  setPush: (value: boolean) => void;
  setSound: (value: boolean) => void;
  setNickname: (nickname: string) => void;
};

const AppStateContext = createContext<AppStateValue | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(createSeed);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as AppData;
        if (parsed && Array.isArray(parsed.homes) && Array.isArray(parsed.devices)) {
          setData({ ...createSeed(), ...parsed });
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data, ready]);

  function update(recipe: (current: AppData) => AppData) {
    setData((current) => recipe(current));
  }

  const value: AppStateValue = {
    data,
    ready,
    setAgreed: (agreed) => update((current) => ({ ...current, agreed })),
    login: ({ method, nickname, phone, password }) =>
      update((current) => ({
        ...current,
        user: {
          id: current.user?.id ?? rid(),
          method,
          nickname,
          phone: phone ?? current.user?.phone ?? "",
          password: password ?? current.user?.password ?? "",
        },
      })),
    logout: () => update((current) => ({ ...current, user: null })),
    eraseAccount: () => {
      const fresh = createSeed();
      update(() => fresh);
    },
    setHome: (id) => update((current) => ({ ...current, currentHomeId: id })),
    addHome: (name, roomNames) => {
      const id = rid();
      update((current) => ({
        ...current,
        currentHomeId: id,
        homes: [
          ...current.homes,
          {
            id,
            name,
            members: ["我"],
            rooms: (roomNames.length ? roomNames : ["客厅"]).map((roomName) => ({
              id: rid(),
              name: roomName,
            })),
          },
        ],
      }));
      return id;
    },
    renameHome: (id, name) =>
      update((current) => ({
        ...current,
        homes: current.homes.map((home) => (home.id === id ? { ...home, name } : home)),
      })),
    removeHome: (id) =>
      update((current) => {
        const homes = current.homes.filter((home) => home.id !== id);
        const nextHome = homes[0];
        if (!nextHome) return current;
        return {
          ...current,
          homes,
          currentHomeId:
            current.currentHomeId === id ? nextHome.id : current.currentHomeId,
          devices: current.devices.filter((device) => device.homeId !== id),
          scenes: current.scenes.filter((scene) => scene.homeId !== id),
          groups: current.groups.filter((group) => group.homeId !== id),
        };
      }),
    addRoom: (homeId, name) =>
      update((current) => ({
        ...current,
        homes: current.homes.map((home) =>
          home.id === homeId
            ? { ...home, rooms: [...home.rooms, { id: rid(), name }] }
            : home,
        ),
      })),
    renameRoom: (homeId, roomId, name) =>
      update((current) => ({
        ...current,
        homes: current.homes.map((home) =>
          home.id === homeId
            ? {
                ...home,
                rooms: home.rooms.map((room) =>
                  room.id === roomId ? { ...room, name } : room,
                ),
              }
            : home,
        ),
      })),
    removeRoom: (homeId, roomId) =>
      update((current) => ({
        ...current,
        homes: current.homes.map((home) => {
          if (home.id !== homeId || home.rooms.length < 2) return home;
          const rooms = home.rooms.filter((room) => room.id !== roomId);
          return { ...home, rooms };
        }),
        devices: current.devices.map((device) => {
          if (device.homeId !== homeId || device.roomId !== roomId) return device;
          const home = current.homes.find((item) => item.id === homeId);
          const fallback = home?.rooms.find((room) => room.id !== roomId);
          return fallback ? { ...device, roomId: fallback.id } : device;
        }),
      })),
    addMember: (homeId, name) =>
      update((current) => ({
        ...current,
        homes: current.homes.map((home) =>
          home.id === homeId && !home.members.includes(name)
            ? { ...home, members: [...home.members, name] }
            : home,
        ),
      })),
    removeMember: (homeId, name) =>
      update((current) => ({
        ...current,
        homes: current.homes.map((home) =>
          home.id === homeId
            ? { ...home, members: home.members.filter((member) => member !== name || member === "我") }
            : home,
        ),
      })),
    addDevice: ({ productId, name, homeId, roomId }) => {
      const product = productOf(productId);
      const id = rid();
      if (!product) return id;
      const device: Device = {
        id,
        productId,
        kind: product.category,
        lockKind: product.lockKind,
        name,
        homeId,
        roomId,
        online: true,
        on: true,
        locked: product.category === "lock",
        battery: 100,
        volume: 50,
        voice: "温柔",
        snacks: 0,
        offlineAlert: true,
        shares: [],
        lockUsers:
          product.category === "lock"
            ? [{ id: rid(), name: "管理员", method: "指纹" }]
            : [],
        tempCodes: [],
        logs:
          product.category === "lock"
            ? [
                { id: rid(), text: "远程解锁", time: nowLabel() },
                { id: rid(), text: "设备添加成功", time: nowLabel() },
              ]
            : [{ id: rid(), text: "设备添加成功", time: nowLabel() }],
      };
      update((current) => ({ ...current, devices: [device, ...current.devices] }));
      return id;
    },
    patchDevice: (id, patch) =>
      update((current) => ({
        ...current,
        devices: current.devices.map((device) =>
          device.id === id ? { ...device, ...patch } : device,
        ),
      })),
    removeDevice: (id) =>
      update((current) => ({
        ...current,
        devices: current.devices.filter((device) => device.id !== id),
        groups: current.groups
          .map((group) => ({
            ...group,
            deviceIds: group.deviceIds.filter((deviceId) => deviceId !== id),
          }))
          .filter((group) => group.deviceIds.length > 0),
        scenes: current.scenes.map((scene) => ({
          ...scene,
          actions: scene.actions.filter((action) => action.deviceId !== id),
        })),
      })),
    pushLog: (id, text) =>
      update((current) => ({
        ...current,
        devices: current.devices.map((device) =>
          device.id === id
            ? {
                ...device,
                logs: [{ id: rid(), text, time: nowLabel() }, ...device.logs].slice(0, 30),
              }
            : device,
        ),
      })),
    addShare: (id, phone) =>
      update((current) => ({
        ...current,
        devices: current.devices.map((device) =>
          device.id === id && !device.shares.includes(phone)
            ? { ...device, shares: [...device.shares, phone] }
            : device,
        ),
      })),
    removeShare: (id, phone) =>
      update((current) => ({
        ...current,
        devices: current.devices.map((device) =>
          device.id === id
            ? { ...device, shares: device.shares.filter((item) => item !== phone) }
            : device,
        ),
      })),
    addLockUser: (id, name, method) =>
      update((current) => ({
        ...current,
        devices: current.devices.map((device) =>
          device.id === id
            ? { ...device, lockUsers: [...device.lockUsers, { id: rid(), name, method }] }
            : device,
        ),
      })),
    removeLockUser: (id, userId) =>
      update((current) => ({
        ...current,
        devices: current.devices.map((device) =>
          device.id === id
            ? { ...device, lockUsers: device.lockUsers.filter((user) => user.id !== userId) }
            : device,
        ),
      })),
    addTempCode: (id) => {
      const code = String(Math.floor(100000 + Math.random() * 900000));
      update((current) => ({
        ...current,
        devices: current.devices.map((device) =>
          device.id === id
            ? {
                ...device,
                tempCodes: [
                  { id: rid(), code, expire: "30 分钟内有效" },
                  ...device.tempCodes,
                ].slice(0, 8),
                logs: [
                  { id: rid(), text: `生成临时密码 ${code}`, time: nowLabel() },
                  ...device.logs,
                ],
              }
            : device,
        ),
      }));
      return code;
    },
    addGroup: (homeId, name, deviceIds) =>
      update((current) => ({
        ...current,
        groups: [...current.groups, { id: rid(), homeId, name, deviceIds }],
      })),
    removeGroup: (id) =>
      update((current) => ({
        ...current,
        groups: current.groups.filter((group) => group.id !== id),
      })),
    addScene: (scene) =>
      update((current) => ({
        ...current,
        scenes: [{ ...scene, id: rid() }, ...current.scenes],
      })),
    patchScene: (id, patch) =>
      update((current) => ({
        ...current,
        scenes: current.scenes.map((scene) =>
          scene.id === id ? { ...scene, ...patch } : scene,
        ),
      })),
    removeScene: (id) =>
      update((current) => ({
        ...current,
        scenes: current.scenes.filter((scene) => scene.id !== id),
      })),
    runScene: (id) => {
      const scene = data.scenes.find((item) => item.id === id);
      if (!scene || scene.actions.length === 0) return "没有可执行的动作";
      const summary = `已执行：${scene.actions
        .map((action) => actionText(action, data.devices))
        .join("，")}`;
      update((current) => ({
        ...current,
        devices: current.devices.map((device) =>
          scene.actions
            .filter((action) => action.deviceId === device.id)
            .reduce((next, action) => applyAction(next, action), device),
        ),
      }));
      return summary;
    },
    markMail: (id) =>
      update((current) => ({
        ...current,
        mails: current.mails.map((mail) =>
          mail.id === id ? { ...mail, read: true } : mail,
        ),
      })),
    setPush: (pushEnabled) => update((current) => ({ ...current, pushEnabled })),
    setSound: (soundEnabled) => update((current) => ({ ...current, soundEnabled })),
    setNickname: (nickname) =>
      update((current) =>
        current.user ? { ...current, user: { ...current.user, nickname } } : current,
      ),
  };

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

function applyAction(device: Device, action: SceneAction) {
  if (device.id !== action.deviceId) return device;
  const time = nowLabel();
  if (action.command === "power") {
    return {
      ...device,
      on: action.on,
      logs: [{ id: rid(), text: action.on ? "已开启" : "已关闭", time }, ...device.logs],
    };
  }
  if (action.command === "feed") {
    return {
      ...device,
      snacks: device.snacks + 1,
      logs: [{ id: rid(), text: "喂食一次", time }, ...device.logs],
    };
  }
  if (device.lockKind === "semi" && action.locked) {
    return {
      ...device,
      logs: [{ id: rid(), text: "半自动锁需要在门内手动上锁", time }, ...device.logs],
    };
  }
  return {
    ...device,
    locked: action.locked,
    logs: [{ id: rid(), text: action.locked ? "已上锁" : "已开锁", time }, ...device.logs],
  };
}

export function useApp() {
  const value = useContext(AppStateContext);
  if (!value) throw new Error("useApp 必须在 AppStateProvider 内使用");
  return value;
}
