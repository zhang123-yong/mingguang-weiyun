export type LoginMethod = "phone" | "qq" | "wechat";
export type DeviceKind = "companion" | "pet" | "lock";
export type LockKind = "auto" | "semi";

export type User = {
  id: string;
  method: LoginMethod;
  nickname: string;
  phone: string;
  password: string;
};

export type Room = { id: string; name: string };
export type Home = {
  id: string;
  name: string;
  rooms: Room[];
  members: string[];
};

export type DeviceLog = { id: string; text: string; time: string };
export type LockUser = { id: string; name: string; method: string };
export type TempCode = { id: string; code: string; expire: string };
export type LockLinkItem = { id: string; name: string; desc: string; on: boolean };
export type LockClip = { id: string; time: string };
export type LockRemind = { center: boolean; sms: boolean; call: boolean };
export type LockPanelState = {
  remoteUnlock: boolean;
  voiceOn: boolean;
  voicePin: string;
  wrist: boolean;
  phoneService: boolean;
  dnd: boolean;
  notifyLock: boolean;
  notifyCall: boolean;
  aiNotify: boolean;
  clarity: string;
  links: LockLinkItem[];
  admin: string;
  night: boolean;
  wdr: boolean;
  muted: boolean;
  recording: boolean;
  album: LockClip[];
  tempPass: string;
  tempHours: number;
  remind: LockRemind;
  boundPhone: string;
};

export type Device = {
  id: string;
  productId: string;
  kind: DeviceKind;
  lockKind?: LockKind;
  name: string;
  homeId: string;
  roomId: string;
  online: boolean;
  on: boolean;
  locked: boolean;
  battery: number;
  volume: number;
  voice: string;
  snacks: number;
  offlineAlert: boolean;
  logs: DeviceLog[];
  shares: string[];
  lockUsers: LockUser[];
  tempCodes: TempCode[];
  lock?: LockPanelState;
};

export type SceneAction =
  | { deviceId: string; command: "power"; on: boolean }
  | { deviceId: string; command: "lock"; locked: boolean }
  | { deviceId: string; command: "feed" };

export type Scene = {
  id: string;
  homeId: string;
  kind: "tap" | "auto";
  name: string;
  enabled: boolean;
  when: string;
  actions: SceneAction[];
};

export type MailFolder = "alarm" | "home" | "notice";
export type Mail = {
  id: string;
  folder: MailFolder;
  title: string;
  body: string;
  time: string;
  read: boolean;
};

export type Group = {
  id: string;
  homeId: string;
  name: string;
  deviceIds: string[];
};

export type AppData = {
  user: User | null;
  homes: Home[];
  currentHomeId: string;
  devices: Device[];
  scenes: Scene[];
  mails: Mail[];
  groups: Group[];
  pushEnabled: boolean;
  soundEnabled: boolean;
  agreed: boolean;
};

export type Product = {
  id: string;
  category: DeviceKind;
  lockKind?: LockKind;
  name: string;
  model: string;
  blurb: string;
};

export const CATEGORIES: { id: DeviceKind; name: string }[] = [
  { id: "companion", name: "AI陪伴" },
  { id: "pet", name: "AI宠物" },
  { id: "lock", name: "智能门锁" },
];

export const PRODUCTS: Product[] = [
  {
    id: "c1",
    category: "companion",
    name: "名光陪伴舱",
    model: "MG-C1",
    blurb: "放在家里，会打招呼，也会记住说话的人",
  },
  {
    id: "c2",
    category: "companion",
    name: "桌面陪伴灯",
    model: "MG-C2",
    blurb: "桌面上的光和声音，适合书房和床头",
  },
  {
    id: "p1",
    category: "pet",
    name: "AI 猫咪",
    model: "MG-P1",
    blurb: "会叫，会跟着人，饿了会提醒",
  },
  {
    id: "p2",
    category: "pet",
    name: "AI 小狗",
    model: "MG-P2",
    blurb: "出门迎接，在家巡一圈",
  },
  {
    id: "l-door",
    category: "lock",
    lockKind: "auto",
    name: "可视智能门锁",
    model: "MG-L1",
    blurb: "带摄像头的智能门锁",
  },
];

export const ROOM_PRESETS = ["客厅", "主卧", "次卧", "书房", "餐厅", "厨房", "门口", "阳台"];

export const VOICES = ["温柔", "活泼", "沉稳"];

export function defaultLockPanel(): LockPanelState {
  return {
    remoteUnlock: true,
    voiceOn: false,
    voicePin: "",
    wrist: false,
    phoneService: false,
    dnd: false,
    notifyLock: true,
    notifyCall: false,
    aiNotify: true,
    clarity: "高清",
    links: [
      { id: "home", name: "家人回家", desc: "家人回家时，触发联动", on: false },
      { id: "alarm", name: "门锁告警", desc: "门锁异常告警时，触发联动", on: false },
      { id: "bell", name: "有人按门铃", desc: "有人按门铃，电话短信通知", on: false },
    ],
    admin: "我",
    night: true,
    wdr: false,
    muted: false,
    recording: false,
    album: [],
    tempPass: "",
    tempHours: 2,
    remind: { center: true, sms: false, call: false },
    boundPhone: "",
  };
}

export function lockPanelOf(lock?: LockPanelState): LockPanelState {
  const base = defaultLockPanel();
  if (!lock) return base;
  return {
    ...base,
    ...lock,
    links: lock.links?.length ? lock.links : base.links,
    remind: { ...base.remind, ...lock.remind },
    album: lock.album ?? [],
  };
}

export function rid() {
  return Math.random().toString(36).slice(2, 10);
}

export function nowLabel() {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
}

export function productOf(id: string) {
  return PRODUCTS.find((item) => item.id === id);
}

export function kindLabel(kind: DeviceKind, lockKind?: LockKind) {
  if (kind === "companion") return "AI陪伴";
  if (kind === "pet") return "AI宠物";
  return lockKind === "semi" ? "半自动" : "智能门锁";
}

function room(id: string, name: string): Room {
  return { id, name };
}

export function createSeed(): AppData {
  const homeId = "home-mine";
  const parentId = "home-parent";

  return {
    user: null,
    agreed: false,
    currentHomeId: homeId,
    pushEnabled: true,
    soundEnabled: true,
    homes: [
      {
        id: homeId,
        name: "我的家",
        members: ["我"],
        rooms: [room("room-living", "客厅"), room("room-bed", "主卧"), room("room-door", "门口")],
      },
      {
        id: parentId,
        name: "父母家",
        members: ["我", "妈妈"],
        rooms: [room("room-parent-living", "客厅"), room("room-parent-door", "门口")],
      },
    ],
    devices: [],
    scenes: [],
    groups: [],
    mails: [
      {
        id: "mail-2",
        folder: "home",
        title: "父母家有一位成员",
        body: "你在父母家里，目前成员是「我」和「妈妈」。可以在家庭管理里继续邀请。",
        time: "11月17日 20:18",
        read: false,
      },
      {
        id: "mail-3",
        folder: "notice",
        title: "名光智能可以使用了",
        body: "手机号、QQ 和微信都能进入家庭。添加设备时，先选 AI陪伴、AI宠物或智能门锁。",
        time: "11月16日 10:00",
        read: true,
      },
    ],
  };
}

export function actionText(action: SceneAction, devices: Device[]) {
  const device = devices.find((item) => item.id === action.deviceId);
  const name = device?.name ?? "已删除的设备";
  if (action.command === "power") return `${name}${action.on ? "开启" : "关闭"}`;
  if (action.command === "feed") return `给${name}喂食`;
  if (action.command === "lock" && device?.lockKind === "semi" && action.locked) {
    return `${name}需要手动上锁`;
  }
  return action.locked ? `${name}上锁` : `${name}开锁`;
}
