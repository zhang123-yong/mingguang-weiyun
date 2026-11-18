"use client";

import { useState } from "react";
import {
  Bell,
  Bot,
  ChevronRight,
  CircleHelp,
  House,
  Info,
  ScanLine,
  Settings,
  Shield,
  ShoppingBag,
  Volume2,
  Wifi,
  Waypoints,
} from "lucide-react";
import {
  Cell,
  ConfirmDialog,
  Field,
  Group,
  Page,
  PrimaryButton,
  Switch,
  TextInput,
} from "@/components/chrome";
import { useApp } from "@/lib/app-state";
import { ROOM_PRESETS } from "@/lib/model";
import { useNav } from "@/lib/nav";

export function MeScreen() {
  const { data } = useApp();
  const { push } = useNav();
  const user = data.user;
  const unread = data.mails.filter((mail) => !mail.read).length;

  const customName = user?.nickname && !/^(用户\d+|QQ 用户|微信用户)$/.test(user.nickname);
  return (
    <div className="h-full overflow-y-auto bg-[#F3F5F8]">
      <div className="flex justify-end gap-3 px-4 pt-3">
        <button type="button" aria-label="扫一扫" onClick={() => push({ name: "scan" })} className="grid size-8 place-items-center">
          <ScanLine className="size-5" />
        </button>
        <button type="button" aria-label="设置" onClick={() => push({ name: "settings" })} className="grid size-8 place-items-center">
          <Settings className="size-5" />
        </button>
      </div>
      <button type="button" onClick={() => push({ name: "profile" })} className="flex w-full items-center gap-3 px-4 py-3 text-left">
        <span className="grid size-12 place-items-center rounded-full bg-white text-[#7AA2FF] shadow-sm">
          <Bot className="size-7" />
        </span>
        <span className="min-w-0 flex-1 text-[18px] font-medium">{customName ? user?.nickname : "点此设置昵称"}</span>
        <ChevronRight className="size-4 text-[#CCC]" />
      </button>
      <div className="px-4 pb-6">
        <Group>
          <Cell icon={<Badge color="bg-[#FF7A45]"><House className="size-4" /></Badge>} label="家庭管理" onClick={() => push({ name: "family" })} />
          <Cell icon={<Badge color="bg-[#3DDC84]"><Bell className="size-4" /></Badge>} label="消息中心" value={unread ? `${unread}` : ""} onClick={() => push({ name: "messages" })} />
          <Cell icon={<Badge color="bg-[#F5B400]"><ShoppingBag className="size-4" /></Badge>} label="我的订单" onClick={() => push({ name: "orders" })} />
          <Cell icon={<Badge color="bg-[#3A7BFF]"><Wifi className="size-4" /></Badge>} label="家庭网络" onClick={() => push({ name: "network" })} />
          <Cell icon={<Badge color="bg-[#3EC6E0]"><CircleHelp className="size-4" /></Badge>} label="帮助中心" onClick={() => push({ name: "help" })} />
          <Cell icon={<Badge color="bg-[#FF7A45]"><Waypoints className="size-4" /></Badge>} label="三方设备与服务" onClick={() => push({ name: "voice" })} />
          <Cell icon={<Badge color="bg-[#3A7BFF]"><Bot className="size-4" /></Badge>} label="名光 AI 网页版" onClick={() => push({ name: "web-ai" })} />
        </Group>
      </div>
    </div>
  );
}

function Badge({ color, children }: { color: string; children: React.ReactNode }) {
  return <span className={`grid size-7 place-items-center rounded-lg text-white ${color}`}>{children}</span>;
}

export function ProfileScreen() {
  const { data, setNickname } = useApp();
  const { pop, notify } = useNav();
  const [name, setName] = useState(data.user?.nickname ?? "");

  return (
    <Page title="个人资料" onBack={pop}>
      <div className="flex flex-col gap-4">
        <Field label="昵称">
          <TextInput value={name} maxLength={12} onChange={(event) => setName(event.target.value)} />
        </Field>
        <PrimaryButton
          onClick={() => {
            if (!name.trim()) return;
            setNickname(name.trim());
            notify("昵称已保存");
            pop();
          }}
        >
          保存
        </PrimaryButton>
      </div>
    </Page>
  );
}

export function FamilyScreen() {
  const { data, addHome, setHome } = useApp();
  const { push, pop, notify } = useNav();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [rooms, setRooms] = useState<string[]>(["客厅"]);

  return (
    <Page title="家庭管理" onBack={pop} right={<button type="button" className="text-[14px] text-[#FF581C]" onClick={() => setCreating(true)}>新建</button>}>
      <div className="flex flex-col gap-3">
        {data.homes.map((home) => (
          <button
            key={home.id}
            type="button"
            onClick={() => push({ name: "home-detail", id: home.id })}
            className="rounded-2xl bg-white px-4 py-4 text-left"
          >
            <span className="flex items-center justify-between">
              <span className="text-[16px] font-medium">{home.name}</span>
              {home.id === data.currentHomeId ? <span className="text-[12px] text-[#FF581C]">当前</span> : null}
            </span>
            <span className="mt-1 block text-[12px] text-[#888]">
              {home.rooms.length} 个房间 · {home.members.length} 位成员
            </span>
          </button>
        ))}
      </div>
      {creating ? (
        <div className="absolute inset-0 z-20 flex items-end bg-black/45" onClick={() => setCreating(false)}>
          <div className="max-h-[80%] w-full overflow-y-auto rounded-t-3xl bg-white px-4 pb-6 pt-4" onClick={(event) => event.stopPropagation()}>
            <p className="text-center text-[16px] font-medium">新建家庭</p>
            <div className="mt-4">
              <Field label="家庭名称">
                <TextInput value={name} placeholder="例如 办公室" onChange={(event) => setName(event.target.value)} />
              </Field>
            </div>
            <p className="mb-2 mt-4 text-[13px] text-[#888]">房间</p>
            <div className="flex flex-wrap gap-2">
              {ROOM_PRESETS.map((room) => {
                const on = rooms.includes(room);
                return (
                  <button
                    key={room}
                    type="button"
                    onClick={() =>
                      setRooms((current) =>
                        on ? current.filter((item) => item !== room) : [...current, room],
                      )
                    }
                    className={`rounded-full px-3 py-1.5 text-[13px] ${on ? "bg-[#FF581C] text-white" : "bg-[#F4F4F4]"}`}
                  >
                    {room}
                  </button>
                );
              })}
            </div>
            <div className="mt-5">
              <PrimaryButton
                onClick={() => {
                  if (!name.trim()) {
                    notify("请填写家庭名称");
                    return;
                  }
                  const id = addHome(name.trim(), rooms);
                  setHome(id);
                  setCreating(false);
                  notify("家庭已创建");
                }}
              >
                创建
              </PrimaryButton>
            </div>
          </div>
        </div>
      ) : null}
    </Page>
  );
}

export function HomeDetailScreen({ id }: { id: string }) {
  const { data, renameHome, removeHome } = useApp();
  const { pop, push, notify } = useNav();
  const home = data.homes.find((item) => item.id === id);
  const [name, setName] = useState(home?.name ?? "");
  const [confirm, setConfirm] = useState(false);
  if (!home) return <Page title="家庭" onBack={pop}><p className="text-[#888]">这个家庭已经不在了。</p></Page>;

  return (
    <Page title={home.name} onBack={pop}>
      <div className="flex flex-col gap-3">
        <Field label="家庭名称">
          <TextInput value={name} onChange={(event) => setName(event.target.value)} />
        </Field>
        <PrimaryButton
          onClick={() => {
            if (!name.trim()) return;
            renameHome(home.id, name.trim());
            notify("名称已保存");
          }}
        >
          保存名称
        </PrimaryButton>
        <Group>
          <Cell label="房间管理" value={`${home.rooms.length} 个`} onClick={() => push({ name: "rooms", homeId: home.id })} />
          <Cell label="家庭成员" value={`${home.members.length} 人`} onClick={() => push({ name: "members", homeId: home.id })} />
        </Group>
        {data.homes.length > 1 ? (
          <button type="button" className="h-11 text-[15px] text-[#E23B3B]" onClick={() => setConfirm(true)}>
            删除家庭
          </button>
        ) : null}
      </div>
      {confirm ? (
        <ConfirmDialog
          title="删除家庭"
          body="这个家庭里的设备和场景会一起删除。"
          confirmText="删除"
          danger
          onClose={() => setConfirm(false)}
          onConfirm={() => {
            removeHome(home.id);
            notify("家庭已删除");
            pop();
          }}
        />
      ) : null}
    </Page>
  );
}

export function RoomsScreen({ homeId }: { homeId: string }) {
  const { data, addRoom, renameRoom, removeRoom } = useApp();
  const { pop, notify } = useNav();
  const home = data.homes.find((item) => item.id === homeId);
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  if (!home) return <Page title="房间" onBack={pop}><p>家庭不存在。</p></Page>;

  return (
    <Page title="房间管理" onBack={pop}>
      <div className="flex flex-col gap-3">
        {home.rooms.map((room) => {
          const count = data.devices.filter((device) => device.roomId === room.id).length;
          return (
            <div key={room.id} className="rounded-2xl bg-white px-4 py-3">
              {editing === room.id ? (
                <div className="flex gap-2">
                  <TextInput value={editName} onChange={(event) => setEditName(event.target.value)} />
                  <button
                    type="button"
                    className="shrink-0 text-[14px] text-[#FF581C]"
                    onClick={() => {
                      if (!editName.trim()) return;
                      renameRoom(home.id, room.id, editName.trim());
                      setEditing(null);
                      notify("房间已改名");
                    }}
                  >
                    完成
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <button type="button" className="text-left" onClick={() => { setEditing(room.id); setEditName(room.name); }}>
                    <span className="block text-[15px]">{room.name}</span>
                    <span className="text-[12px] text-[#999]">{count} 个设备</span>
                  </button>
                  {home.rooms.length > 1 ? (
                    <button type="button" className="text-[13px] text-[#E23B3B]" onClick={() => { removeRoom(home.id, room.id); notify("房间已删除，设备已挪到其他房间"); }}>
                      删除
                    </button>
                  ) : null}
                </div>
              )}
            </div>
          );
        })}
        <div className="flex gap-2">
          <TextInput value={draft} placeholder="新房间名称" onChange={(event) => setDraft(event.target.value)} />
          <button
            type="button"
            className="h-11 shrink-0 rounded-xl bg-[#FF581C] px-4 text-white"
            onClick={() => {
              if (!draft.trim()) return;
              addRoom(home.id, draft.trim());
              setDraft("");
              notify("房间已添加");
            }}
          >
            添加
          </button>
        </div>
      </div>
    </Page>
  );
}

export function MembersScreen({ homeId }: { homeId: string }) {
  const { data, addMember, removeMember } = useApp();
  const { pop, notify } = useNav();
  const home = data.homes.find((item) => item.id === homeId);
  const [name, setName] = useState("");
  if (!home) return <Page title="成员" onBack={pop}><p>家庭不存在。</p></Page>;

  return (
    <Page title="家庭成员" onBack={pop}>
      <div className="flex flex-col gap-3">
        {home.members.map((member) => (
          <div key={member} className="flex items-center justify-between rounded-2xl bg-white px-4 py-3">
            <span>{member}</span>
            {member !== "我" ? (
              <button type="button" className="text-[13px] text-[#E23B3B]" onClick={() => { removeMember(home.id, member); notify("已移除成员"); }}>
                移除
              </button>
            ) : (
              <span className="text-[12px] text-[#999]">管理员</span>
            )}
          </div>
        ))}
        <div className="flex gap-2">
          <TextInput value={name} placeholder="成员备注名" onChange={(event) => setName(event.target.value)} />
          <button
            type="button"
            className="h-11 shrink-0 rounded-xl bg-[#FF581C] px-4 text-white"
            onClick={() => {
              if (!name.trim()) return;
              addMember(home.id, name.trim());
              setName("");
              notify("已邀请成员");
            }}
          >
            邀请
          </button>
        </div>
        <p className="text-[12px] leading-5 text-[#999]">邀请会记在这个家庭里。对方要真正加入，还需要后续接入账号。</p>
      </div>
    </Page>
  );
}

export function MessagesScreen() {
  const { data, markMail } = useApp();
  const { pop, push } = useNav();
  const [folder, setFolder] = useState<"alarm" | "home" | "notice">("alarm");
  const mails = data.mails.filter((mail) => mail.folder === folder);
  const tabs = [
    { id: "alarm" as const, label: "告警" },
    { id: "home" as const, label: "家庭" },
    { id: "notice" as const, label: "通知" },
  ];

  return (
    <Page title="消息中心" onBack={pop} bleed>
      <div className="flex gap-6 border-b border-[#F2F2F2] bg-white px-4 text-[15px]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`py-3 ${folder === tab.id ? "border-b-2 border-[#FF581C] text-[#FF581C]" : "text-[#888]"}`}
            onClick={() => setFolder(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="flex flex-col">
        {mails.length === 0 ? <p className="px-4 py-10 text-center text-[#999]">没有消息</p> : null}
        {mails.map((mail) => (
          <button
            key={mail.id}
            type="button"
            onClick={() => {
              markMail(mail.id);
              push({ name: "message", id: mail.id });
            }}
            className="border-b border-[#F4F4F4] bg-white px-4 py-3 text-left"
          >
            <span className="flex items-center gap-2">
              {!mail.read ? <span className="size-2 rounded-full bg-[#E23B3B]" /> : null}
              <span className="text-[15px]">{mail.title}</span>
            </span>
            <span className="mt-1 block text-[12px] text-[#999]">{mail.time}</span>
          </button>
        ))}
      </div>
    </Page>
  );
}

export function MessageScreen({ id }: { id: string }) {
  const { data } = useApp();
  const { pop } = useNav();
  const mail = data.mails.find((item) => item.id === id);
  if (!mail) return <Page title="消息" onBack={pop}><p>消息不存在。</p></Page>;
  return (
    <Page title="消息" onBack={pop}>
      <article className="rounded-2xl bg-white px-4 py-4">
        <h2 className="text-[18px] font-medium">{mail.title}</h2>
        <p className="mt-1 text-[12px] text-[#999]">{mail.time}</p>
        <p className="mt-4 text-[15px] leading-7 text-[#333]">{mail.body}</p>
      </article>
    </Page>
  );
}

export function SettingsScreen() {
  const { data, setPush, setSound, logout } = useApp();
  const { pop, push, reset } = useNav();
  const [confirm, setConfirm] = useState(false);

  return (
    <Page title="设置" onBack={pop}>
      <div className="flex flex-col gap-3">
        <Group>
          <Cell icon={<Shield className="size-4 text-[#FF581C]" />} label="账号与安全" onClick={() => push({ name: "account" })} />
          <Cell
            icon={<Bell className="size-4 text-[#3A7BFF]" />}
            label="消息推送"
            onClick={undefined}
            extra={<Switch checked={data.pushEnabled} label="消息推送" onChange={setPush} />}
          />
          <Cell
            icon={<Volume2 className="size-4 text-[#28C445]" />}
            label="操作音效"
            extra={<Switch checked={data.soundEnabled} label="操作音效" onChange={setSound} />}
          />
        </Group>
        <Group>
          <Cell icon={<Info className="size-4 text-[#888]" />} label="关于名光智能" onClick={() => push({ name: "about" })} />
        </Group>
        <button
          type="button"
          className="h-12 rounded-2xl bg-white text-[15px] text-[#E23B3B]"
          onClick={() => setConfirm(true)}
        >
          退出登录
        </button>
      </div>
      {confirm ? (
        <ConfirmDialog
          title="退出登录"
          body="退出后会回到封面，家庭和设备会留在这台设备上。"
          confirmText="退出"
          danger
          onClose={() => setConfirm(false)}
          onConfirm={() => {
            logout();
            reset({ name: "cover" });
          }}
        />
      ) : null}
    </Page>
  );
}

export function AccountScreen() {
  const { data, login, eraseAccount } = useApp();
  const { pop, reset, notify } = useNav();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState(false);
  const user = data.user;

  return (
    <Page title="账号与安全" onBack={pop}>
      <div className="flex flex-col gap-4">
        <Group>
          <Cell label="登录方式" value={user?.method === "phone" ? "手机号" : user?.method === "qq" ? "QQ" : "微信"} />
          <Cell label="手机号" value={user?.phone || "未绑定"} />
        </Group>
        {user?.method === "phone" ? (
          <Field label="新密码">
            <TextInput type="password" value={password} placeholder="至少 6 位" onChange={(event) => setPassword(event.target.value)} />
          </Field>
        ) : null}
        {user?.method === "phone" ? (
          <PrimaryButton
            onClick={() => {
              if (password.length < 6) {
                notify("密码至少 6 位");
                return;
              }
              login({ method: "phone", nickname: user.nickname, phone: user.phone, password });
              setPassword("");
              notify("密码已更新");
            }}
          >
            更新密码
          </PrimaryButton>
        ) : null}
        <button type="button" className="h-11 text-[15px] text-[#E23B3B]" onClick={() => setConfirm(true)}>
          注销账号
        </button>
      </div>
      {confirm ? (
        <ConfirmDialog
          title="注销账号"
          body="会清空这台设备上的家庭、设备和场景，并回到封面。"
          confirmText="注销"
          danger
          onClose={() => setConfirm(false)}
          onConfirm={() => {
            eraseAccount();
            reset({ name: "cover" });
          }}
        />
      ) : null}
    </Page>
  );
}

export function AboutScreen() {
  const { pop } = useNav();
  return (
    <Page title="关于名光智能" onBack={pop}>
      <div className="rounded-2xl bg-white px-4 py-6 text-center">
        <p className="text-[18px] font-medium">名光智能</p>
        <p className="mt-1 text-[13px] text-[#999]">版本 0.2.0</p>
        <p className="mt-4 text-left text-[14px] leading-7 text-[#555]">
          名光智能用来管理家里的陪伴、宠物和门锁。当前数据保存在这台设备的浏览器里，不会上传到服务器。
        </p>
      </div>
    </Page>
  );
}

const ARTICLES = [
  { id: "add", title: "设备添加失败怎么办", body: "确认设备已通电，指示灯在快闪。如果灯在慢闪，先在添加页里改成热点方式，再搜索一次。离路由器太远时，把手机靠近设备。" },
  { id: "offline", title: "设备离线怎么办", body: "先看家里的网络是否正常，再给设备重新上电。门锁离线时，仍然可以用指纹和密码在门上打开。" },
  { id: "share", title: "如何共享设备", body: "打开设备右上角的设置，进入共享设备，填入对方的 11 位手机号。对方登录同一个家庭后就能看到这台设备。" },
  { id: "auto", title: "如何创建自动化", body: "在场景页切到自动化，点加号。先选时间或到家条件，再选要开锁、开关或喂食的设备，保存后可以试运行。" },
];

export function HelpScreen() {
  const { pop, push } = useNav();
  return (
    <Page title="帮助与反馈" onBack={pop}>
      <div className="flex flex-col gap-3">
        <Group>
          {ARTICLES.map((article) => (
            <Cell key={article.id} label={article.title} onClick={() => push({ name: "help-article", id: article.id })} />
          ))}
        </Group>
        <button type="button" className="h-12 rounded-2xl bg-white text-[15px] text-[#FF581C]" onClick={() => push({ name: "feedback" })}>
          我要反馈
        </button>
      </div>
    </Page>
  );
}

export function HelpArticle({ id }: { id: string }) {
  const { pop } = useNav();
  const article = ARTICLES.find((item) => item.id === id);
  return (
    <Page title="帮助" onBack={pop}>
      <article className="rounded-2xl bg-white px-4 py-4">
        <h2 className="text-[17px] font-medium">{article?.title}</h2>
        <p className="mt-3 text-[15px] leading-7 text-[#444]">{article?.body}</p>
      </article>
    </Page>
  );
}

export function FeedbackScreen() {
  const { pop, notify } = useNav();
  const [text, setText] = useState("");
  return (
    <Page title="我要反馈" onBack={pop}>
      <textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="写下使用中遇到的问题"
        className="h-36 w-full rounded-2xl border border-[#E8E8E8] bg-white p-3 text-[15px] outline-none"
      />
      <div className="mt-4">
        <PrimaryButton
          disabled={!text.trim()}
          onClick={() => {
            notify("反馈已记下");
            pop();
          }}
        >
          提交
        </PrimaryButton>
      </div>
    </Page>
  );
}

const VOICE_SERVICES = ["小爱同学", "天猫精灵", "小度", "Alexa"];

export function VoiceScreen() {
  const { pop, push } = useNav();
  return (
    <Page title="三方设备与服务" onBack={pop}>
      <Group>
        <Cell label="扫码添加第三方设备" onClick={() => push({ name: "scan" })} />
        {VOICE_SERVICES.map((service) => (
          <Cell key={service} label={service} onClick={() => push({ name: "voice-bind", service })} />
        ))}
      </Group>
    </Page>
  );
}

export function VoiceBindScreen({ service }: { service: string }) {
  const { pop, notify } = useNav();
  const [bound, setBound] = useState(false);
  return (
    <Page title={service} onBack={pop}>
      <div className="rounded-2xl bg-white px-4 py-4 text-[14px] leading-7 text-[#444]">
        <p>1. 打开{service}的技能页面。</p>
        <p>2. 搜索「名光智能」并启用。</p>
        <p>3. 回到这里确认绑定。绑定后可以用语音开关陪伴设备和开锁。</p>
      </div>
      <div className="mt-4">
        <PrimaryButton
          onClick={() => {
            setBound(true);
            notify(bound ? "已经绑定过了" : `${service}已绑定`);
          }}
        >
          {bound ? "已绑定" : "去绑定"}
        </PrimaryButton>
      </div>
    </Page>
  );
}

export function WeatherScreen() {
  const { pop } = useNav();
  return (
    <Page title="天气" onBack={pop}>
      <div className="rounded-2xl bg-white px-4 py-6 text-center">
        <p className="text-[14px] text-[#888]">上海</p>
        <p className="mt-2 text-[40px] font-medium">22°</p>
        <p className="text-[15px] text-[#666]">多云</p>
        <div className="mt-5 grid grid-cols-3 text-[13px] text-[#888]">
          <span>湿度 62%</span>
          <span>空气 良</span>
          <span>风力 2 级</span>
        </div>
      </div>
    </Page>
  );
}

export function ScanScreen() {
  const { pop, push, notify } = useNav();
  const [found, setFound] = useState(false);

  return (
    <Page title="扫一扫" onBack={pop}>
      <div className="mx-auto mt-6 grid h-56 w-56 place-items-center rounded-3xl border-2 border-[#FF581C] bg-[#1c1c1c] text-white">
        <p className="px-6 text-center text-[13px] leading-6">将设备或家庭二维码放入框内</p>
      </div>
      <div className="mt-6 flex flex-col gap-3">
        <PrimaryButton onClick={() => setFound(true)}>识别框内二维码</PrimaryButton>
        <button type="button" className="h-11 text-[14px] text-[#666]" onClick={() => push({ name: "add" })}>
          手动添加
        </button>
      </div>
      {found ? (
        <div className="absolute inset-0 z-20 flex items-end bg-black/45" onClick={() => setFound(false)}>
          <div className="w-full rounded-t-3xl bg-white px-4 pb-6 pt-5" onClick={(event) => event.stopPropagation()}>
            <p className="text-center text-[16px] font-medium">识别到门锁</p>
            <p className="mt-2 text-center text-[13px] text-[#888]">是否添加到当前家庭？</p>
            <div className="mt-4">
              <PrimaryButton
                onClick={() => {
                  notify("继续完成命名和房间");
                  push({ name: "pair", productId: "l-door" });
                }}
              >
                去添加
              </PrimaryButton>
            </div>
          </div>
        </div>
      ) : null}
    </Page>
  );
}
