"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown, ChevronRight, Gift, Leaf, Mic, Plus, Search, X, Zap } from "lucide-react";
import { Group, Page, PrimaryButton, TextInput } from "@/components/chrome";
import { SwirlMark } from "@/components/screens/scenes";
import { useApp } from "@/lib/app-state";
import { useNav } from "@/lib/nav";
import { recognizeMeal, replyTo, translateText } from "@/lib/tuya";

type NoteKind = "record" | "live" | "interpret" | "import";
type NoteItem = { id: string; title: string; body: string; kind: NoteKind };
type Strategy = { id: string; name: string; detail: string; saving: string };

type TransItem = { id: string; kind: "文本" | "同声传译" | "对话翻译"; source: string; result: string };

const session = {
  notes: [] as NoteItem[],
  messages: [] as { role: "user" | "assistant"; text: string }[],
  strategies: [] as Strategy[],
  cloudSync: false,
  translations: [] as TransItem[],
};

export const AGENTS = [
  { id: "lock", name: "门锁管家", blurb: "查看门锁状态，生成临时密码前先确认是哪一把锁。" },
  { id: "pet", name: "宠物助手", blurb: "记录喂食和陪伴设备的开关。" },
  { id: "save", name: "节能顾问", blurb: "按房间看用电，并给出可关闭的设备。" },
];

export const TEMPLATES = [
  { id: "home", name: "回家开锁", kind: "tap" as const, when: "点击执行", blurb: "到家后一键查看门锁，并打开门口的设备。" },
  { id: "night", name: "晚间布防", kind: "auto" as const, when: "每天 23:00", blurb: "晚上确认门锁已锁上，关闭不需要的灯光。" },
  { id: "pet", name: "宠物喂食", kind: "auto" as const, when: "每天 07:00", blurb: "早上给宠物设备发一次喂食。" },
];

export function PlusScreen() {
  const { pop, push } = useNav();
  const items = [
    { title: "拍一拍识热量", body: "拍下餐食，先用本地示例给出热量。", route: { name: "calorie" as const } },
    { title: "AI 节能", body: "查看各房间用电建议。", route: { name: "energy" as const } },
    { title: "更多助手", body: "门锁、宠物和节能三个助手。", route: { name: "agents" as const } },
  ];
  return (
    <Page title="名光 Plus" onBack={pop}>
      <p className="text-[14px] leading-6 text-[#666]">这些能力现在可以在本机体验。账号和设备协议接入后，会换成你家的真实数据。</p>
      <div className="mt-4 flex flex-col gap-3">
        {items.map((item) => (
          <button key={item.title} type="button" onClick={() => push(item.route)} className="rounded-2xl bg-white px-4 py-4 text-left">
            <span className="block text-[16px] font-medium">{item.title}</span>
            <span className="mt-1 block text-[13px] leading-5 text-[#888]">{item.body}</span>
          </button>
        ))}
      </div>
    </Page>
  );
}

export function CalorieScreen() {
  const { pop } = useNav();
  const [meal, setMeal] = useState<ReturnType<typeof recognizeMeal> | null>(null);
  return (
    <Page title="拍一拍" onBack={pop}>
      <div className="rounded-2xl bg-gradient-to-br from-[#FF8A4C] to-[#E85D4C] px-5 py-8 text-white">
        <p className="text-[22px] font-semibold">拍一拍，热量就清楚</p>
        <p className="mt-2 text-[14px] text-white/85">对准餐食拍一张。当前用本地示例识别，接入视觉服务后会换成实拍结果。</p>
      </div>
      <div className="mt-4">
        <PrimaryButton onClick={() => setMeal(recognizeMeal())}>{meal ? "再识别一次" : "拍一张"}</PrimaryButton>
      </div>
      {meal ? (
        <div className="mt-4 rounded-2xl bg-white px-4 py-4">
          <p className="text-[18px] font-medium">{meal.name}</p>
          <p className="mt-1 text-[28px] font-semibold text-[#FF581C]">{meal.kcal} <span className="text-[14px] font-normal text-[#888]">千卡</span></p>
          <p className="mt-3 text-[14px] text-[#666]">蛋白质 {meal.protein} · 脂肪 {meal.fat} · 碳水 {meal.carb}</p>
        </div>
      ) : null}
    </Page>
  );
}

export function AssistantScreen({ voice = false }: { voice?: boolean }) {
  const { pop } = useNav();
  const [messages, setMessages] = useState(session.messages);
  const [text, setText] = useState(voice ? "帮我看看门锁" : "");

  function send(value: string) {
    const content = value.trim();
    if (!content) return;
    const next = [
      ...messages,
      { role: "user" as const, text: content },
      { role: "assistant" as const, text: replyTo(content) },
    ];
    session.messages = next;
    setMessages(next);
    setText("");
  }

  return (
    <Page title="名光助手" onBack={pop}>
      <div className="flex min-h-[60%] flex-col gap-3">
        {messages.length === 0 ? (
          <p className="text-[14px] leading-6 text-[#888]">可以问门锁怎么添加、怎么创建场景，或节能建议。</p>
        ) : (
          messages.map((item, index) => (
            <p
              key={`${item.role}-${index}`}
              className={`max-w-[85%] rounded-2xl px-3 py-2 text-[14px] leading-6 ${
                item.role === "user" ? "ml-auto bg-[#FF581C] text-white" : "bg-white"
              }`}
            >
              {item.text}
            </p>
          ))
        )}
      </div>
      <form
        className="mt-4 flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          send(text);
        }}
      >
        <TextInput value={text} placeholder="需要什么帮助?" onChange={(event) => setText(event.target.value)} />
        <button type="submit" className="h-11 shrink-0 rounded-xl bg-[#222] px-4 text-[14px] text-white">
          发送
        </button>
      </form>
    </Page>
  );
}

export function ExploreScreen() {
  const { pop, push } = useNav();
  const items = [
    { title: "室内环境", body: "温度、湿度还没有传感器。", go: () => push({ name: "environment" }) },
    { title: "智能门锁", body: "添加门锁，用蓝牙或 Wi-Fi 配网。", go: () => push({ name: "add" }) },
    { title: "推荐应用模版", body: "回家、晚间布防、宠物喂食。", go: () => push({ name: "templates" }) },
  ];
  return (
    <Page title="为你推荐" onBack={pop}>
      <div className="flex flex-col gap-3">
        {items.map((item) => (
          <button key={item.title} type="button" onClick={item.go} className="flex items-center rounded-2xl bg-white px-4 py-4 text-left">
            <span className="min-w-0 flex-1">
              <span className="block text-[16px] font-medium">{item.title}</span>
              <span className="mt-1 block text-[13px] text-[#888]">{item.body}</span>
            </span>
            <ChevronRight className="size-4 text-[#CCC]" />
          </button>
        ))}
      </div>
    </Page>
  );
}

export function EnvironmentScreen() {
  const { data } = useApp();
  const { pop, push } = useNav();
  const home = data.homes.find((item) => item.id === data.currentHomeId) ?? data.homes[0];
  return (
    <Page title="室内环境" onBack={pop} right={<button type="button" className="text-[14px] text-[#2F7BFF]" onClick={() => push({ name: "add" })}>添加</button>}>
      <div className="flex flex-col gap-3">
        {home.rooms.map((room) => (
          <article key={room.id} className="rounded-2xl bg-white px-4 py-4">
            <p className="text-[16px] font-medium">{room.name}</p>
            <p className="mt-2 text-[14px] text-[#999]">暂无温湿度数据</p>
          </article>
        ))}
      </div>
      <p className="mt-4 text-[13px] leading-5 text-[#888]">添加环境传感器后，这里会显示温度和湿度。现在可以先去添加设备。</p>
    </Page>
  );
}

export function TemplateScreen() {
  const { pop, push } = useNav();
  return (
    <Page title="推荐应用模版" onBack={pop}>
      <div className="flex flex-col gap-3">
        {TEMPLATES.map((item) => (
          <article key={item.id} className="rounded-2xl bg-white px-4 py-4">
            <p className="text-[16px] font-medium">{item.name}</p>
            <p className="mt-1 text-[13px] text-[#888]">{item.when}</p>
            <p className="mt-2 text-[14px] leading-6 text-[#444]">{item.blurb}</p>
            <button
              type="button"
              className="mt-3 h-9 rounded-full bg-[#222] px-4 text-[13px] text-white"
              onClick={() =>
                push({
                  name: "scene-edit",
                  kind: item.kind,
                  initialName: item.name,
                  initialWhen: item.when,
                })
              }
            >
              使用模版
            </button>
          </article>
        ))}
      </div>
    </Page>
  );
}

const NOTE_FILTERS: { id: "all" | NoteKind; label: string }[] = [
  { id: "all", label: "所有文件" },
  { id: "record", label: "录音" },
  { id: "live", label: "实时转写" },
  { id: "interpret", label: "同声传译" },
  { id: "import", label: "导入音频" },
];

const VALVE: Strategy = {
  id: "valve",
  name: "温控阀-暖气节能",
  detail: "根据室外天气和室内温度调整温度设置，保持室内舒适并节约能耗。",
  saving: "10%~20%",
};

export function EnergyScreen() {
  const { pop, push, notify } = useNav();
  const [tab, setTab] = useState<"data" | "save">("data");
  const [strategies, setStrategies] = useState(session.strategies);
  const [roomTab, setRoomTab] = useState<"all" | "none">("all");
  const [minutes, setMinutes] = useState(session.strategies.length * 18);
  const [more, setMore] = useState(false);
  const [naming, setNaming] = useState(false);
  const [draft, setDraft] = useState("");
  const [ask, setAsk] = useState("");

  function addStrategy(item: Strategy) {
    if (strategies.some((current) => current.name === item.name)) {
      notify("这个策略已经添加");
      setTab("save");
      return;
    }
    const next = [item, ...strategies];
    session.strategies = next;
    setStrategies(next);
    setMinutes((value) => value + 18);
    setNaming(false);
    setDraft("");
    setTab("save");
    notify("已添加节能策略");
  }

  function askReport() {
    const text = ask.trim() || "点击获取AI策略/能源报告";
    setAsk("");
    notify(text.includes("报告") || !ask.trim()
      ? `本月节能 ${minutes} 分钟。建议添加温控阀策略，预计可省 10% 到 20%。`
      : "已记下这个问题。演示不会连接真实能源数据。");
  }

  return (
    <div className="relative flex h-full flex-col bg-[#F5F7FB] text-[#222]">
      <FeatureHead title="AI节能" onClose={pop} onMore={() => setMore((open) => !open)} />
      {more ? (
        <div className="absolute right-4 top-16 z-20 w-36 overflow-hidden rounded-2xl bg-white py-1 shadow-xl">
          <button type="button" className="block w-full px-4 py-3 text-left text-[14px]" onClick={() => { setMore(false); push({ name: "feedback" }); }}>去反馈</button>
        </div>
      ) : null}
      <div className="flex gap-5 px-4 pt-4 text-[16px]">
        <button type="button" onClick={() => setTab("data")} className={tab === "data" ? "font-semibold" : "text-[#B0B4BA]"}>数据</button>
        <button type="button" onClick={() => setTab("save")} className={tab === "save" ? "font-semibold" : "text-[#B0B4BA]"}>节能</button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
        {tab === "data" ? (
          <div className="pt-4 text-center">
            <LivingRoom />
            <p className="mt-4 text-[20px] font-semibold">欢迎使用AI节能助手</p>
            <p className="mt-2 text-[13px] text-[#A0A4AA]">你还没有支持用电统计的设备</p>
            <div className="mt-5 rounded-3xl bg-gradient-to-br from-[#7A6CFF] via-[#8A63F0] to-[#C06BFF] px-5 py-5 text-white">
              <p className="text-[18px] font-semibold">定制能源监控方案</p>
              <p className="mt-2 text-left text-[13px] leading-6 text-white/90">要成为节能高手，我们首先要了解对手！请花30秒，勾选或输入您家中的电器，让我们为您设计家庭的能源智能化方案。</p>
              <button type="button" onClick={() => setTab("save")} className="mt-4 h-12 w-full rounded-full bg-[#1A1A1A] text-[16px]">去定制</button>
            </div>
            <div className="mt-3 flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-left">
              <p className="min-w-0 flex-1 text-[13px] leading-5 text-[#666]">如果你有智能设备，但是设备没有支持电量统计，可以点击反馈</p>
              <button type="button" onClick={() => push({ name: "feedback" })} className="h-8 shrink-0 rounded-full bg-[#3A8DFF] px-3 text-[13px] text-white">去反馈</button>
            </div>
          </div>
        ) : (
          <div className="pt-4">
            <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-4">
              <span className="flex items-center gap-3 text-[15px]"><span className="grid size-9 place-items-center rounded-full bg-[#E9FBF2]"><Leaf className="size-5 text-[#2FCF8A]" /></span>本月节能总时长</span>
              <span className="text-[18px]"><b>{minutes}</b> <span className="text-[14px] font-normal">分钟</span></span>
            </div>
            <p className="px-1 pb-2 pt-5 text-[16px] font-semibold">节能策略</p>
            {strategies.length === 0 && !naming ? (
              <div className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-[#D9FBE8] to-[#F4FFF8] px-4 py-4">
                <span>
                  <span className="block text-[16px] font-medium">添加节能策略</span>
                  <span className="mt-1 block text-[12px] text-[#7AA892]">点击添加节能策略</span>
                </span>
                <button type="button" onClick={() => setNaming(true)} className="h-8 rounded-full bg-white px-3 text-[13px] text-[#3C8F62]">去添加</button>
              </div>
            ) : null}
            {naming ? (
              <div className="rounded-2xl bg-white p-3">
                <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="策略名称，例如 夜间关灯" className="h-11 w-full rounded-xl bg-[#F5F7FB] px-3 outline-none" />
                <button type="button" className="mt-3 h-10 w-full rounded-full bg-[#1A1A1A] text-white" onClick={() => {
                  if (!draft.trim()) { notify("先填写策略名称"); return; }
                  addStrategy({ id: `${Date.now()}`, name: draft.trim(), detail: "自定义策略，只记在本机。", saving: "约 5%" });
                }}>添加</button>
              </div>
            ) : null}
            <div className="flex gap-5 px-1 pb-2 pt-5 text-[16px]">
              <button type="button" onClick={() => setRoomTab("all")} className={roomTab === "all" ? "font-semibold" : "text-[#B0B4BA]"}>全部</button>
              <button type="button" onClick={() => setRoomTab("none")} className={roomTab === "none" ? "font-semibold" : "text-[#B0B4BA]"}>无房间设备</button>
            </div>
            {strategies.length === 0 ? <ClockEmpty /> : (
              <div className="flex flex-col gap-3">
                {strategies.map((item) => (
                  <article key={item.id} className="rounded-2xl bg-white px-4 py-4">
                    <p className="text-[16px] font-medium">{item.name}</p>
                    <p className="mt-1 text-[13px] leading-5 text-[#8A9098]">{item.detail}</p>
                    <p className="mt-2 text-[12px] text-[#3A8DFF]">预估节能：{item.saving}</p>
                  </article>
                ))}
              </div>
            )}
            <p className="px-1 pb-2 pt-6 text-[16px] font-semibold">策略推荐</p>
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#4C8DFF] to-[#2F6BFF] p-4 text-white">
              <p className="pr-10 text-[16px] font-semibold">{VALVE.name}</p>
              <p className="mt-1 text-[12px] leading-5 text-white/85">{VALVE.detail}</p>
              <p className="mt-4 flex items-center gap-1 text-[12px]"><Leaf className="size-3.5" />预估节能：{VALVE.saving}</p>
              <Zap className="absolute bottom-3 right-4 size-10 text-white/30" />
              <button type="button" aria-label="添加推荐策略" onClick={() => addStrategy(VALVE)} className="absolute right-3 top-3 grid size-7 place-items-center rounded-full bg-white/25"><Plus className="size-4" /></button>
            </div>
          </div>
        )}
      </div>
      <div className="px-4 pb-4">
        <AskPill value={ask} placeholder="点击获取AI策略/能源报告" onChange={setAsk} onSubmit={askReport} />
      </div>
    </div>
  );
}

export function NotesScreen() {
  const { pop, notify } = useNav();
  const fileRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<"files" | "mine">("files");
  const [notes, setNotes] = useState(session.notes);
  const [filter, setFilter] = useState<(typeof NOTE_FILTERS)[number]["id"]>("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState("");
  const [sync, setSync] = useState(session.cloudSync);
  const [more, setMore] = useState(false);
  const [ask, setAsk] = useState("");

  function add(kind: NoteKind, title: string, body: string) {
    const next = [{ id: `${Date.now()}`, title, body, kind }, ...notes];
    session.notes = next;
    setNotes(next);
    setTab("files");
    notify("已保存到文件");
  }

  const shown = notes.filter((note) => {
    if (tab === "mine" && note.kind !== "record" && note.kind !== "import") return false;
    if (filter !== "all" && note.kind !== filter) return false;
    if (query.trim() && !`${note.title}${note.body}`.includes(query.trim())) return false;
    return true;
  });
  const filterLabel = NOTE_FILTERS.find((item) => item.id === filter)?.label ?? "所有文件";

  return (
    <div className="relative flex h-full flex-col bg-[#F5F7FB] text-[#222]">
      <FeatureHead
        title="AI笔记"
        onClose={pop}
        onMore={() => setMore((open) => !open)}
        extra={<button type="button" aria-label="礼包" onClick={() => notify("会员礼包暂未开放")} className="grid size-9 place-items-center"><Gift className="size-5" /></button>}
      />
      {more ? (
        <div className="absolute right-4 top-16 z-20 w-36 overflow-hidden rounded-2xl bg-white py-1 shadow-xl">
          <button type="button" className="block w-full px-4 py-3 text-left text-[14px]" onClick={() => { session.notes = []; setNotes([]); setMore(false); notify("文件已清空"); }}>清空文件</button>
        </div>
      ) : null}
      <div className="flex gap-5 px-4 pt-4 text-[16px]">
        <button type="button" onClick={() => setTab("files")} className={tab === "files" ? "font-semibold" : "text-[#B0B4BA]"}>文件</button>
        <button type="button" onClick={() => setTab("mine")} className={tab === "mine" ? "font-semibold" : "text-[#B0B4BA]"}>我的</button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto pb-24">
        <div className="grid grid-cols-3 gap-3 px-4 pt-4">
          <NoteAction icon={<Mic className="size-6" />} label="录音" onClick={() => add("record", "录音", "演示录音已保存在本机，不会上传真实音频。")} />
          <NoteAction icon={<LiveMark />} label="实时转写" onClick={() => add("live", "实时转写", "示例：门锁电量还剩百分之八十。")} />
          <NoteAction icon={<InterpretMark />} label="同声传译" onClick={() => add("interpret", "同声传译", "打开门锁 → Unlock the door")} />
          <NoteAction icon={<ImportMark />} label="导入音频" onClick={() => fileRef.current?.click()} />
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (!file) return;
            add("import", file.name, "已从本机导入音频，演示不会上传。");
          }}
        />
        <div className="relative mt-5 flex items-center justify-between px-4">
          <button type="button" onClick={() => setFilterOpen((open) => !open)} className="flex items-center gap-1 text-[16px] font-semibold">
            {filterLabel}
            <ChevronDown className="size-4" />
          </button>
          <button type="button" aria-label="搜索" onClick={() => setSearching((open) => !open)} className="grid size-8 place-items-center"><Search className="size-5" /></button>
          {filterOpen ? (
            <div className="absolute left-4 top-9 z-10 w-36 overflow-hidden rounded-2xl bg-white py-1 shadow-xl">
              {NOTE_FILTERS.map((item) => (
                <button key={item.id} type="button" className="block w-full px-4 py-2.5 text-left text-[14px]" onClick={() => { setFilter(item.id); setFilterOpen(false); }}>{item.label}</button>
              ))}
            </div>
          ) : null}
        </div>
        {searching ? (
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索文件" className="mx-4 mt-3 h-10 w-[calc(100%-2rem)] rounded-xl bg-white px-3 outline-none" />
        ) : null}
        {!sync ? (
          <div className="mx-4 mt-3 flex items-center gap-3 rounded-2xl bg-[#EAF3FF] px-3 py-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white text-[#8AA0B8]"><CloudOff /></span>
            <span className="min-w-0 flex-1">
              <span className="block text-[15px]">未开启云同步</span>
              <span className="mt-0.5 block text-[12px] text-[#8AA0B8]">将当前App上的录音文件备份至云端</span>
            </span>
            <button type="button" onClick={() => { session.cloudSync = true; setSync(true); notify("云同步已开启，演示不会上传文件"); }} className="h-8 shrink-0 rounded-full bg-[#3A8DFF] px-4 text-[13px] text-white">开启</button>
          </div>
        ) : null}
        {shown.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <FolderArt />
            <p className="mt-3 text-[14px] text-[#A0A4AA]">无数据</p>
          </div>
        ) : (
          <div className="mx-4 mt-3 flex flex-col gap-3">
            {shown.map((note) => (
              <article key={note.id} className="rounded-2xl bg-white px-4 py-4">
                <p className="text-[16px] font-medium">{note.title}</p>
                <p className="mt-1 text-[13px] leading-5 text-[#8A9098]">{note.body}</p>
              </article>
            ))}
          </div>
        )}
      </div>
      <button type="button" aria-label="录音" onClick={() => add("record", "录音", "演示录音已保存在本机，不会上传真实音频。")} className="absolute bottom-20 right-4 grid size-12 place-items-center rounded-full bg-[#3A8DFF] text-white shadow-lg">
        <Mic className="size-5" />
      </button>
      <div className="px-4 pb-4">
        <AskPill
          value={ask}
          placeholder="关于你的笔记，你想了解什…"
          onChange={setAsk}
          onSubmit={() => {
            if (!ask.trim()) { notify("先写下想了解的问题"); return; }
            notify(notes.length ? `当前有 ${notes.length} 个文件。演示不会分析真实录音。` : "还没有笔记文件。可以先录音或导入音频。");
            setAsk("");
          }}
        />
      </div>
    </div>
  );
}

function FeatureHead({ title, onClose, onMore, extra }: { title: string; onClose: () => void; onMore: () => void; extra?: ReactNode }) {
  return (
    <header className="flex items-center justify-between px-4 pt-4">
      <h1 className="text-[28px] font-bold">{title}</h1>
      <div className="flex items-center gap-2">
        {extra}
        <span className="flex h-9 items-center rounded-full border border-[#E8E8E8] bg-white pl-2">
          <button type="button" aria-label="更多" onClick={onMore} className="px-1 text-[16px] tracking-widest">···</button>
          <span className="mx-1 h-4 w-px bg-[#E6E6E6]" />
          <button type="button" aria-label="关闭" onClick={onClose} className="grid size-8 place-items-center"><X className="size-4" /></button>
        </span>
      </div>
    </header>
  );
}

function AskPill({ value, placeholder, onChange, onSubmit }: { value: string; placeholder: string; onChange: (value: string) => void; onSubmit: () => void }) {
  return (
    <form
      className="rounded-full bg-gradient-to-r from-[#7C5CFF] via-[#3AA0FF] to-[#2FE2A0] p-[1.5px]"
      onSubmit={(event) => { event.preventDefault(); onSubmit(); }}
    >
      <div className="flex h-11 items-center gap-2 rounded-full bg-white px-3">
        <SwirlMark className="size-6" />
        <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-[#C5C8CE]" />
        <button type="button" aria-label="语音" onClick={onSubmit} className="grid size-8 place-items-center"><Mic className="size-4 text-[#666]" /></button>
      </div>
    </form>
  );
}

function NoteAction({ icon, label, onClick }: { icon: ReactNode; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex h-24 flex-col items-start justify-between rounded-2xl bg-white px-3 py-3 text-left">
      {icon}
      <span className="text-[13px]">{label}</span>
    </button>
  );
}

function CloudOff() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
      <path d="M7 16h9a3.5 3.5 0 0 0 .4-7 5 5 0 0 0-9.5 1.2A3 3 0 0 0 7 16Z" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="m9 13 4 4m0-4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function LiveMark() {
  return (
    <svg viewBox="0 0 32 32" className="size-7" aria-hidden>
      <path d="M6 16c2-4 3-4 4 0s2 4 4 0 2-4 4 0 2 4 4 0 2-4 4 0" fill="none" stroke="#222" strokeWidth="1.6" strokeLinecap="round" />
      <text x="22" y="14" fontSize="9" fontWeight="700">A</text>
    </svg>
  );
}

function InterpretMark() {
  return (
    <svg viewBox="0 0 32 32" className="size-7" aria-hidden>
      <text x="4" y="18" fontSize="12" fontWeight="700">文</text>
      <text x="18" y="22" fontSize="12" fontWeight="700" fill="#3A8DFF">A</text>
    </svg>
  );
}

function ImportMark() {
  return (
    <svg viewBox="0 0 32 32" className="size-7" aria-hidden>
      <path d="M16 6v12M11 14l5 5 5-5" fill="none" stroke="#222" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 22h16" stroke="#3A8DFF" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function FolderArt() {
  return (
    <svg viewBox="0 0 120 90" className="mx-auto h-24" aria-hidden>
      <path d="M18 28h28l8 8h48a8 8 0 0 1 8 8v28a8 8 0 0 1-8 8H26a8 8 0 0 1-8-8V36a8 8 0 0 1 8-8Z" fill="#F4F6F8" stroke="#E4E7EE" />
      <path d="M22 40h70a6 6 0 0 1 6 6v24a6 6 0 0 1-6 6H28a6 6 0 0 1-6-6V40Z" fill="#fff" stroke="#E4E7EE" />
    </svg>
  );
}

function LivingRoom() {
  return (
    <div className="relative mx-auto h-48 w-[260px]">
      <svg viewBox="0 0 260 180" className="h-full w-full" aria-hidden>
        <path d="M40 150 130 110l90 40-90 36Z" fill="#F6E2CF" />
        <path d="M70 78h120v46H70Z" fill="#8FD0E8" />
        <path d="M78 118h104v16H78Z" fill="#F7F4EF" />
        <rect x="118" y="132" width="24" height="10" fill="#E7D3BE" />
        <path d="M150 128c18 8 36 6 48-4 4 10-2 22-18 28-16 4-34-2-42-12 2-6 6-10 12-12Z" fill="#D9DEE8" />
        <rect x="196" y="96" width="16" height="28" rx="3" fill="#7DCA8A" />
        <circle cx="204" cy="92" r="10" fill="#63B86E" />
      </svg>
      <span className="absolute left-2 top-4 grid size-12 rotate-[-8deg] place-items-center rounded-2xl bg-[#FF5A78] text-white shadow"><Zap className="size-6" fill="white" /></span>
      <span className="absolute bottom-6 right-1 grid size-12 place-items-center rounded-full bg-[#3DDC84] text-white shadow"><Leaf className="size-6" /></span>
    </div>
  );
}

function ClockEmpty() {
  return (
    <svg viewBox="0 0 200 110" className="mx-auto mt-2 h-28" aria-hidden>
      <path d="M20 28c8 6 14 4 18-2" fill="none" stroke="#E4E7EE" strokeWidth="3" strokeLinecap="round" />
      <path d="M150 24c10 8 18 6 24-4" fill="none" stroke="#E4E7EE" strokeWidth="3" strokeLinecap="round" />
      <circle cx="100" cy="62" r="28" fill="none" stroke="#E6E9F0" strokeWidth="8" />
      <path d="M100 62V46M100 62l12 8" stroke="#D5DAE3" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

const LANGS = ["中文（简体）", "英语", "日语", "韩语", "法语"];
const DEMO_LINES = [
  { zh: "你好", en: "Hello" },
  { zh: "打开门锁", en: "Unlock the door" },
  { zh: "今天天气怎么样", en: "How is the weather today" },
];

export function TranslateScreen() {
  const { data } = useApp();
  const { pop, push, notify } = useNav();
  const [view, setView] = useState<"home" | "live" | "dialog" | "all">("home");
  const [more, setMore] = useState(false);
  const [from, setFrom] = useState(LANGS[0]);
  const [to, setTo] = useState(LANGS[1]);
  const [picking, setPicking] = useState<"from" | "to" | null>(null);
  const [text, setText] = useState("");
  const [items, setItems] = useState(session.translations);
  const name = data.user?.nickname?.trim() || "我";
  const preview = translateDraft(text, from, to);

  function remember(kind: TransItem["kind"], source: string, result: string) {
    const clean = source.trim();
    const output = result.trim();
    if (!clean || !output) return;
    if (session.translations[0]?.source === clean && session.translations[0]?.kind === kind) return;
    const next = [{ id: `tr-${Date.now()}`, kind, source: clean, result: output }, ...session.translations];
    session.translations = next;
    setItems(next);
  }

  function choose(lang: string) {
    if (picking === "from") {
      if (lang === to) setTo(from);
      setFrom(lang);
    }
    if (picking === "to") {
      if (lang === from) setFrom(to);
      setTo(lang);
    }
    setPicking(null);
  }

  if (view === "live" || view === "dialog") {
    return (
      <InterpretScreen
        title={view === "live" ? "同声传译" : "对话翻译"}
        dialog={view === "dialog"}
        from={from}
        to={to}
        onBack={() => setView("home")}
        onSwap={() => { setFrom(to); setTo(from); }}
        onPick={setPicking}
        onDone={(source, result) => {
          remember(view === "live" ? "同声传译" : "对话翻译", source, result);
          setView("home");
          if (source) notify("已保存到历史记录");
        }}
        notify={notify}
        picking={picking}
        onChoose={choose}
        onClosePick={() => setPicking(null)}
      />
    );
  }

  return (
    <div className="relative flex h-full flex-col bg-[#F4F6FB] text-[#222]">
      <FeatureHead
        title="AI翻译"
        onClose={pop}
        onMore={() => setMore((open) => !open)}
        extra={<button type="button" aria-label="礼包" onClick={() => notify("会员礼包暂未开放")} className="grid size-9 place-items-center"><Gift className="size-5" /></button>}
      />
      {more ? (
        <div className="absolute right-4 top-16 z-20 w-36 overflow-hidden rounded-2xl bg-white py-1 shadow-xl">
          <button type="button" className="block w-full px-4 py-3 text-left text-[14px]" onClick={() => { session.translations = []; setItems([]); setMore(false); notify("历史记录已清空"); }}>清空记录</button>
          <button type="button" className="block w-full px-4 py-3 text-left text-[14px]" onClick={() => { setMore(false); push({ name: "feedback" }); }}>去反馈</button>
        </div>
      ) : null}
      {view === "all" ? (
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6">
          <button type="button" onClick={() => setView("home")} className="mb-3 text-[14px] text-[#3A8DFF]">返回</button>
          <h2 className="text-[18px] font-semibold">历史记录</h2>
          <HistoryList items={items} />
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6">
          <button type="button" onClick={() => push({ name: "profile" })} className="mt-5 flex w-full items-center justify-between px-1">
            <span className="text-[20px]">{name.slice(0, 1)}.</span>
            <ChevronRight className="size-5 text-[#C8C8C8]" />
          </button>
          <section className="relative mt-3 rounded-2xl bg-white px-4 py-3 shadow-[0_6px_18px_rgba(20,24,40,0.04)]">
            <div className="flex items-center">
              <button type="button" onClick={() => setPicking("from")} className="flex items-center gap-1 text-[15px]">{from}<ChevronDown className="size-4 text-[#666]" /></button>
              <button type="button" aria-label="交换语言" onClick={() => { setFrom(to); setTo(from); }} className="mx-auto grid h-7 w-10 place-items-center rounded-lg bg-[#EEF3FF] text-[#4C8DFF]">
                <SwapMark />
              </button>
              <button type="button" onClick={() => setPicking("to")} className="flex items-center gap-1 text-[15px]">{to}<ChevronDown className="size-4 text-[#666]" /></button>
            </div>
            <div className="mt-4 flex items-start gap-2">
              <textarea
                value={text}
                placeholder="请输入需要翻译的内容"
                onChange={(event) => setText(event.target.value)}
                onBlur={() => remember("文本", text, preview)}
                className="min-h-16 flex-1 resize-none bg-transparent text-[15px] outline-none placeholder:text-[#C5C8CE]"
              />
              <button
                type="button"
                aria-label="语音输入"
                onClick={() => {
                  if (!text.trim()) {
                    setText("打开门锁");
                    notify("演示不会使用麦克风");
                    return;
                  }
                  remember("文本", text, preview);
                  notify("已保存到历史记录");
                }}
                className="mt-1 text-[#4C8DFF]"
              >
                <WaveMark />
              </button>
            </div>
            {preview ? <p className="border-t border-[#F2F3F6] pt-3 text-[15px] leading-6">{preview}</p> : null}
            {picking ? <LangMenu onChoose={choose} onClose={() => setPicking(null)} /> : null}
          </section>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <button type="button" onClick={() => setView("live")} className="flex h-[72px] items-center gap-2 rounded-2xl bg-white px-3 text-left shadow-[0_6px_18px_rgba(20,24,40,0.04)]">
              <SimultaneousMark />
              <span className="text-[15px]">同声传译</span>
            </button>
            <button type="button" onClick={() => setView("dialog")} className="flex h-[72px] items-center gap-2 rounded-2xl bg-white px-3 text-left shadow-[0_6px_18px_rgba(20,24,40,0.04)]">
              <DialogMark />
              <span className="text-[15px]">对话翻译</span>
            </button>
          </div>
          <div className="mt-6 flex items-center justify-between px-1">
            <h2 className="text-[18px] font-semibold">历史记录</h2>
            <button type="button" onClick={() => setView("all")} className="flex items-center text-[14px] text-[#8A9098]">全部<ChevronRight className="size-4" /></button>
          </div>
          {items.length === 0 ? <PaperEmpty /> : <HistoryList items={items.slice(0, 3)} />}
        </div>
      )}
    </div>
  );
}

function InterpretScreen({
  title,
  dialog,
  from,
  to,
  onBack,
  onSwap,
  onPick,
  onDone,
  notify,
  picking,
  onChoose,
  onClosePick,
}: {
  title: string;
  dialog: boolean;
  from: string;
  to: string;
  onBack: () => void;
  onSwap: () => void;
  onPick: (side: "from" | "to") => void;
  onDone: (source: string, result: string) => void;
  notify: (message: string) => void;
  picking: "from" | "to" | null;
  onChoose: (lang: string) => void;
  onClosePick: () => void;
}) {
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [muted, setMuted] = useState(true);
  const [lines, setLines] = useState<{ zh: string; en: string }[]>([]);
  const secondsRef = useRef(0);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      secondsRef.current += 1;
      const next = secondsRef.current;
      setSeconds(next);
      if (next % 2 === 0) {
        const line = DEMO_LINES[(next / 2 - 1) % DEMO_LINES.length];
        setLines((list) => [...list, line]);
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [running]);

  function finish() {
    setRunning(false);
    const source = lines.map((line) => line.zh).join("\n");
    const result = lines.map((line) => line.en).join("\n");
    onDone(source, result);
  }

  const clock = [seconds / 3600, (seconds % 3600) / 60, seconds % 60].map((part) => String(Math.floor(part)).padStart(2, "0")).join(":");

  return (
    <div className="relative flex h-full flex-col bg-[#F4F6FB] text-[#222]">
      <header className="grid h-12 grid-cols-[40px_1fr_40px] items-center px-2">
        <button type="button" aria-label="返回" onClick={onBack} className="grid size-10 place-items-center text-[28px]">‹</button>
        <h1 className="text-center text-[17px] font-medium">{title}</h1>
        <span />
      </header>
      <div className="relative mx-4 flex min-h-0 flex-1 flex-col rounded-3xl bg-white px-4 py-4 shadow-[0_6px_18px_rgba(20,24,40,0.04)]">
        <div className="flex items-center gap-2 text-[15px]">
          <WaveMark />
          <span className="font-medium tabular-nums">{clock}</span>
        </div>
        <div className="flex min-h-0 flex-1 flex-col justify-center px-2">
          {lines.length === 0 ? (
            <p className="text-center text-[14px] leading-6 text-[#B0B4BA]">{dialog ? "点击开始后，双方轮流说话，内容会写在两边" : "请准确选择语言，音频将实时转写和翻译"}</p>
          ) : dialog ? (
            <div className="flex flex-col gap-3 overflow-y-auto">
              {lines.map((line, index) => (
                <p key={`${line.zh}-${index}`} className={index % 2 === 0 ? "max-w-[80%] rounded-2xl bg-[#F4F7FB] px-3 py-2 text-[14px]" : "max-w-[80%] self-end rounded-2xl bg-[#EEF3FF] px-3 py-2 text-right text-[14px]"}>
                  <span className="block text-[11px] text-[#A0A4AA]">{index % 2 === 0 ? "我" : "对方"}</span>
                  {index % 2 === 0 ? line.zh : line.en}
                </p>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-3 overflow-y-auto text-[15px] leading-6">
              {lines.map((line) => (
                <div key={line.zh + line.en}>
                  <p>{line.zh}</p>
                  <p className="text-[#8A9098]">{line.en}</p>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center justify-between pt-3 text-[14px]">
          <button type="button" onClick={() => onPick("from")} className="flex items-center gap-1">{from}</button>
          <button type="button" aria-label="交换语言" onClick={onSwap} className="text-[#8A9098]">→</button>
          <button type="button" onClick={() => onPick("to")} className="flex items-center gap-1">{to}<ChevronDown className="size-4" /></button>
          <button type="button" aria-label={muted ? "取消静音" : "静音"} aria-pressed={muted} onClick={() => { setMuted((value) => !value); notify(muted ? "已打开声音" : "已静音"); }} className="text-[#8A9098]">
            <SpeakerMark muted={muted} />
          </button>
        </div>
        {picking ? <LangMenu onChoose={onChoose} onClose={onClosePick} /> : null}
      </div>
      <div className="flex items-center justify-between px-6 py-5">
        <button type="button" aria-label="麦克风" onClick={() => notify("当前使用手机麦克风，演示不会录音")} className="grid w-12 place-items-center text-[#222]">
          <PhoneMark />
        </button>
        <button
          type="button"
          onClick={() => {
            setRunning((value) => !value);
            if (!running && lines.length === 0) notify("演示不会使用麦克风，将写入示例语句");
          }}
          className="h-12 min-w-[128px] whitespace-nowrap rounded-full border-2 border-[#F07A8A] bg-[#FFF6F7] px-8 text-[16px] text-[#F07A8A]"
        >
          {running ? "暂停" : "开始"}
        </button>
        <button type="button" onClick={finish} className="w-12 text-right text-[16px] text-[#3A8DFF]">完成</button>
      </div>
    </div>
  );
}

function translateDraft(text: string, from: string, to: string) {
  const hit = translateText(text);
  if (!hit.result) return "";
  const foreign = !to.startsWith("中文") && !to.startsWith("英语");
  if (foreign) return `${hit.result}（${to}草稿）`;
  if (to.startsWith("中文") && from.startsWith("中文")) return hit.result;
  return hit.result;
}

function LangMenu({ onChoose, onClose }: { onChoose: (lang: string) => void; onClose: () => void }) {
  return (
    <div className="absolute inset-x-4 top-16 z-10 rounded-2xl bg-white py-1 shadow-xl" onClick={(event) => event.stopPropagation()}>
      {LANGS.map((lang) => (
        <button key={lang} type="button" onClick={() => onChoose(lang)} className="block w-full px-4 py-3 text-left text-[15px]">{lang}</button>
      ))}
      <button type="button" onClick={onClose} className="block w-full px-4 py-3 text-left text-[14px] text-[#8A9098]">取消</button>
    </div>
  );
}

function HistoryList({ items }: { items: TransItem[] }) {
  if (items.length === 0) return <PaperEmpty />;
  return (
    <div className="mt-3 flex flex-col gap-3">
      {items.map((item) => (
        <article key={item.id} className="rounded-2xl bg-white px-4 py-3">
          <p className="text-[12px] text-[#A0A4AA]">{item.kind}</p>
          <p className="mt-1 whitespace-pre-line text-[15px]">{item.source}</p>
          <p className="mt-1 whitespace-pre-line text-[14px] leading-6 text-[#8A9098]">{item.result}</p>
        </article>
      ))}
    </div>
  );
}

function PaperEmpty() {
  return (
    <div className="px-6 py-10 text-center">
      <svg viewBox="0 0 120 90" className="mx-auto h-24" aria-hidden>
        <rect x="34" y="18" width="52" height="62" rx="6" fill="#F7F8FB" stroke="#E6E9F0" transform="rotate(-8 60 49)" />
        <rect x="30" y="16" width="58" height="64" rx="8" fill="#fff" stroke="#E4E7EE" />
        <path d="M42 34h34M42 44h28M42 54h22" stroke="#EEF0F4" strokeWidth="3" strokeLinecap="round" />
      </svg>
      <p className="mt-2 text-[14px] text-[#C0C4CC]">暂无数据</p>
    </div>
  );
}

function SwapMark() {
  return (
    <svg viewBox="0 0 24 16" className="h-3.5 w-5" aria-hidden>
      <path d="M7 3H2l3-3M17 13h5l-3 3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 3h14a3 3 0 0 1 3 3M21 13H7a3 3 0 0 1-3-3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function WaveMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
      <path d="M4 10v4M8 7v10M12 4v16M16 8v8M20 11v2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function SimultaneousMark() {
  return (
    <svg viewBox="0 0 32 32" className="size-8 text-[#5B7CFF]" aria-hidden>
      <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M6 22c1.2-3 3.4-4.5 6-4.5S16.8 19 18 22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M20 10c2 1.2 3 2.8 3 5s-1 3.8-3 5M23 8c2.6 1.8 4 4.2 4 7s-1.4 5.2-4 7" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function DialogMark() {
  return (
    <svg viewBox="0 0 32 32" className="size-8 text-[#8AA0B8]" aria-hidden>
      <rect x="4" y="7" width="16" height="12" rx="3" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 19v3l4-3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <rect x="13" y="13" width="15" height="11" rx="3" fill="#F4F7FB" stroke="currentColor" strokeWidth="1.6" />
      <path d="M18 17h6M18 20h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function SpeakerMark({ muted }: { muted: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
      <path d="M4 10h3l4-3v10l-4-3H4z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      {muted ? <path d="M16 9l5 6M21 9l-5 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /> : <path d="M16 9c2 1.4 2 4.6 0 6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />}
    </svg>
  );
}

function PhoneMark() {
  return (
    <svg viewBox="0 0 28 24" className="h-6 w-7" aria-hidden>
      <rect x="6" y="2" width="12" height="20" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M11 18h2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M20 8l3 2-3 2" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function AgentsScreen() {
  const { pop, push } = useNav();
  return (
    <Page title="更多 AI Agent" onBack={pop}>
      <Group>
        {AGENTS.map((agent) => (
          <button key={agent.id} type="button" onClick={() => push({ name: "agent", id: agent.id })} className="flex w-full items-center gap-3 bg-white px-4 py-4 text-left">
            <span className="min-w-0 flex-1">
              <span className="block text-[16px]">{agent.name}</span>
              <span className="mt-1 block text-[12px] text-[#888]">{agent.blurb}</span>
            </span>
            <ChevronRight className="size-4 text-[#CCC]" />
          </button>
        ))}
      </Group>
    </Page>
  );
}

export function AgentScreen({ id }: { id: string }) {
  const agent = AGENTS.find((item) => item.id === id) ?? AGENTS[0];
  const { pop } = useNav();
  const [text, setText] = useState("");
  const [answer, setAnswer] = useState("");
  return (
    <Page title={agent.name} onBack={pop}>
      <p className="text-[14px] leading-6 text-[#666]">{agent.blurb}</p>
      <div className="mt-4 flex gap-2">
        <TextInput value={text} placeholder={`问${agent.name}`} onChange={(event) => setText(event.target.value)} />
        <button type="button" className="grid size-11 place-items-center rounded-xl bg-[#222] text-white" onClick={() => setAnswer(replyTo(text || agent.name))} aria-label="发送">
          <Mic className="size-4" />
        </button>
      </div>
      {answer ? <p className="mt-4 rounded-2xl bg-white px-4 py-4 text-[15px] leading-7">{answer}</p> : null}
    </Page>
  );
}

export function OrdersScreen() {
  const { pop } = useNav();
  const [tab, setTab] = useState("全部");
  return (
    <Page title="我的订单" onBack={pop}>
      <div className="flex gap-4 text-[15px]">
        {["全部", "待支付", "已完成"].map((item) => (
          <button key={item} type="button" onClick={() => setTab(item)} className={tab === item ? "border-b-2 border-[#222] pb-1 font-medium" : "pb-1 text-[#888]"}>
            {item}
          </button>
        ))}
      </div>
      <div className="px-6 py-16 text-center">
        <p className="text-[16px]">暂无{tab === "全部" ? "" : tab}订单</p>
        <p className="mt-2 text-[13px] leading-5 text-[#999]">设备和服务的订单会在商城协议接入后出现在这里。</p>
      </div>
    </Page>
  );
}

export function NetworkScreen() {
  const { data } = useApp();
  const { pop, push } = useNav();
  const home = data.homes.find((item) => item.id === data.currentHomeId) ?? data.homes[0];
  const count = data.devices.filter((device) => device.homeId === home.id).length;
  return (
    <Page title="家庭网络" onBack={pop}>
      <article className="rounded-2xl bg-white px-4 py-4">
        <p className="text-[13px] text-[#888]">当前家庭</p>
        <p className="mt-1 text-[18px] font-medium">{home.name}</p>
        <p className="mt-3 text-[15px]">路由器 MGYF · 2.4GHz</p>
        <p className="mt-1 text-[13px] text-[#888]">已添加 {count} 台设备</p>
      </article>
      <div className="mt-4">
        <PrimaryButton onClick={() => push({ name: "add" })}>为设备配网</PrimaryButton>
      </div>
    </Page>
  );
}

export function WebAiScreen() {
  const { data } = useApp();
  const { pop, push, notify } = useNav();
  const home = data.homes.find((item) => item.id === data.currentHomeId);
  const links = [
    { label: "设备", detail: `${data.devices.length} 台`, go: () => push({ name: "add" }) },
    { label: "智能应用", detail: `${data.scenes.length} 个`, go: () => push({ name: "scene-list", kind: "tap" }) },
    { label: "家庭", detail: home?.name ?? "", go: () => push({ name: "family" }) },
  ];
  return (
    <Page title="名光 AI 网页版" onBack={pop}>
      <p className="text-[14px] leading-6 text-[#666]">网页版和手机看到的是同一套家庭。服务地址接入后，可以从这里打开浏览器控制台。</p>
      <div className="mt-4 overflow-hidden rounded-2xl bg-white">
        {links.map((item) => (
          <button key={item.label} type="button" onClick={item.go} className="flex w-full items-center justify-between border-b border-[#F4F4F4] px-4 py-4 text-left last:border-b-0">
            <span className="text-[16px]">{item.label}</span>
            <span className="text-[13px] text-[#888]">{item.detail}</span>
          </button>
        ))}
      </div>
      <div className="mt-4">
        <PrimaryButton onClick={() => notify("网页版地址会在服务接入后打开")}>打开网页版</PrimaryButton>
      </div>
    </Page>
  );
}

type CastTarget = { id: string; name: string; place: string; online: boolean };

export function CastScreen() {
  const { data } = useApp();
  const { pop, notify } = useNav();
  const [step, setStep] = useState<"intro" | "search" | "list" | "link" | "live">("intro");
  const [target, setTarget] = useState<CastTarget | null>(null);

  const receivers: CastTarget[] = [
    ...data.devices
      .filter((device) => device.homeId === data.currentHomeId && device.kind === "companion")
      .map((device) => ({
        id: device.id,
        name: device.name,
        place: data.homes.find((home) => home.id === device.homeId)?.rooms.find((room) => room.id === device.roomId)?.name ?? "家中",
        online: device.on,
      })),
    { id: "tv-living", name: "客厅电视", place: "客厅", online: true },
    { id: "tv-bed", name: "卧室投影", place: "主卧", online: false },
  ];

  useEffect(() => {
    if (step !== "search") return;
    const timer = window.setTimeout(() => setStep("list"), 1200);
    return () => window.clearTimeout(timer);
  }, [step]);

  useEffect(() => {
    if (step !== "link" || !target) return;
    const timer = window.setTimeout(() => setStep("live"), 900);
    return () => window.clearTimeout(timer);
  }, [step, target]);

  function choose(item: CastTarget) {
    if (!item.online) {
      notify(`${item.name}不在线，请先开机并连上家里的 Wi-Fi`);
      return;
    }
    setTarget(item);
    setStep("link");
  }

  return (
    <Page title="手机投屏" onBack={pop}>
      {step === "intro" ? (
        <div className="flex flex-col items-center pt-6 text-center">
          <CastArt />
          <p className="mt-6 text-[18px] font-medium">把手机画面投到家里的屏幕</p>
          <ol className="mt-4 space-y-2 text-left text-[14px] leading-6 text-[#555]">
            <li>1. 手机连上家里的 Wi-Fi，当前是 MGYF · 2.4GHz</li>
            <li>2. 打开电视、投影或名光陪伴设备</li>
            <li>3. 选择一台设备，开始投屏</li>
          </ol>
          <div className="mt-8 w-full">
            <PrimaryButton onClick={() => setStep("search")}>搜索可投屏设备</PrimaryButton>
          </div>
        </div>
      ) : null}

      {step === "search" ? (
        <div className="flex flex-col items-center pt-16">
          <div className="size-24 animate-pulse rounded-full border-4 border-[#E4D7FF] border-t-[#7C3AED]" />
          <p className="mt-6 text-[16px]">正在搜索同一 Wi-Fi 下的设备</p>
          <p className="mt-2 text-[13px] text-[#999]">请让手机和接收设备连着 MGYF</p>
        </div>
      ) : null}

      {step === "list" ? (
        <div>
          <p className="text-[14px] text-[#666]">找到 {receivers.length} 台可接收投屏的设备</p>
          <div className="mt-3 overflow-hidden rounded-2xl bg-white">
            {receivers.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => choose(item)}
                className="flex w-full items-center gap-3 border-b border-[#F4F4F4] px-4 py-4 text-left last:border-b-0"
              >
                <span className="grid size-10 place-items-center rounded-xl bg-[#F3E8FF] text-[13px] text-[#7C3AED]">投</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[16px]">{item.name}</span>
                  <span className="mt-0.5 block text-[12px] text-[#999]">{item.place}</span>
                </span>
                <span className={item.online ? "text-[13px] text-[#178A45]" : "text-[13px] text-[#999]"}>
                  {item.online ? "可连接" : "离线"}
                </span>
              </button>
            ))}
          </div>
          <button type="button" className="mt-4 h-11 w-full text-[14px] text-[#666]" onClick={() => setStep("search")}>
            重新搜索
          </button>
        </div>
      ) : null}

      {step === "link" && target ? (
        <div className="flex flex-col items-center pt-16 text-center">
          <div className="size-24 animate-pulse rounded-full border-4 border-[#FDECEA] border-t-[#FF581C]" />
          <p className="mt-6 text-[16px]">正在连接{target.name}</p>
          <p className="mt-2 text-[13px] text-[#999]">手机会把当前画面发送到这台设备</p>
        </div>
      ) : null}

      {step === "live" && target ? (
        <div className="flex flex-col items-center pt-4 text-center">
          <p className="text-[13px] text-[#178A45]">投屏中</p>
          <p className="mt-1 text-[20px] font-medium">{target.name}</p>
          <p className="mt-1 text-[13px] text-[#888]">{target.place} · MGYF</p>
          <div className="mt-6 w-[180px] rounded-[28px] border-4 border-[#222] bg-[#111] px-3 py-4 text-white shadow-lg">
            <p className="text-[12px] text-white/70">手机画面</p>
            <p className="mt-6 text-[15px]">名光智能</p>
            <p className="mt-2 text-[12px] text-white/60">正在投到{target.name}</p>
            <div className="mx-auto mt-6 h-1.5 w-16 rounded-full bg-white/30" />
          </div>
          <div className="mt-8 w-full">
            <PrimaryButton
              onClick={() => {
                notify(`已断开${target.name}`);
                setStep("list");
              }}
            >
              结束投屏
            </PrimaryButton>
          </div>
        </div>
      ) : null}
    </Page>
  );
}

function CastArt() {
  return (
    <svg viewBox="0 0 220 120" className="h-28 w-56" aria-hidden>
      <rect x="8" y="18" width="120" height="78" rx="10" fill="#1C1C1C" />
      <rect x="18" y="28" width="100" height="52" rx="4" fill="#7C3AED" />
      <text x="68" y="58" textAnchor="middle" fill="white" fontSize="12">手机</text>
      <rect x="138" y="10" width="74" height="96" rx="8" fill="#F3E8FF" stroke="#7C3AED" />
      <rect x="146" y="20" width="58" height="70" rx="4" fill="white" />
      <text x="175" y="58" textAnchor="middle" fill="#7C3AED" fontSize="11">屏幕</text>
      <path d="M128 56h12" stroke="#FF581C" strokeWidth="2" />
      <path d="M136 51l6 5-6 5" fill="none" stroke="#FF581C" strokeWidth="2" />
    </svg>
  );
}
