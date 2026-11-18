"use client";

import { useState } from "react";
import { ChevronRight, Mic } from "lucide-react";
import { Group, Page, PrimaryButton, TextInput } from "@/components/chrome";
import { useApp } from "@/lib/app-state";
import { useNav } from "@/lib/nav";
import { energyRooms, recognizeMeal, replyTo, translateText } from "@/lib/tuya";

const session = {
  notes: [] as { id: string; title: string; body: string }[],
  messages: [] as { role: "user" | "assistant"; text: string }[],
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

export function EnergyScreen() {
  const { data } = useApp();
  const { pop, push } = useNav();
  const count = data.devices.filter((device) => device.homeId === data.currentHomeId).length;
  const rooms = energyRooms(count);
  return (
    <Page title="AI 节能" onBack={pop}>
      <p className="text-[14px] leading-6 text-[#666]">了解家庭智能设备的能耗状况，获取节能建议。</p>
      {rooms.length === 0 ? (
        <div className="mt-8 text-center">
          <p className="text-[16px]">还没有可统计的设备</p>
          <div className="mx-auto mt-4 w-40">
            <PrimaryButton onClick={() => push({ name: "add" })}>去添加</PrimaryButton>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          {rooms.map((room) => (
            <article key={room.room} className="rounded-2xl bg-white px-4 py-4">
              <div className="flex items-center justify-between">
                <p className="text-[16px] font-medium">{room.room}</p>
                <p className="text-[14px] text-[#FF581C]">{room.kwh}</p>
              </div>
              <p className="mt-2 text-[13px] text-[#888]">{room.tip}</p>
            </article>
          ))}
        </div>
      )}
    </Page>
  );
}

export function NotesScreen() {
  const { pop, notify } = useNav();
  const [notes, setNotes] = useState(session.notes);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  return (
    <Page title="AI 笔记" onBack={pop}>
      <p className="mb-3 text-[14px] text-[#666]">录音转写接入后可以语音记。现在先写下文字，一键保存在本机这次使用里。</p>
      <div className="rounded-2xl bg-white px-4 py-4">
        <TextInput value={title} placeholder="标题" onChange={(event) => setTitle(event.target.value)} />
        <textarea
          value={body}
          placeholder="写一点内容"
          onChange={(event) => setBody(event.target.value)}
          className="mt-3 h-24 w-full resize-none rounded-xl border border-[#E8E8E8] px-3 py-2 text-[15px] outline-none"
        />
        <div className="mt-3">
          <PrimaryButton
            onClick={() => {
              if (!title.trim() && !body.trim()) {
                notify("先写标题或内容");
                return;
              }
              const next = [{ id: `${Date.now()}`, title: title.trim() || "未命名笔记", body: body.trim() }, ...notes];
              session.notes = next;
              setNotes(next);
              setTitle("");
              setBody("");
              notify("笔记已保存");
            }}
          >
            保存笔记
          </PrimaryButton>
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-3">
        {notes.map((note) => (
          <article key={note.id} className="rounded-2xl bg-white px-4 py-4">
            <p className="text-[16px] font-medium">{note.title}</p>
            {note.body ? <p className="mt-1 text-[14px] leading-6 text-[#666]">{note.body}</p> : null}
          </article>
        ))}
      </div>
    </Page>
  );
}

export function TranslateScreen() {
  const { pop } = useNav();
  const [text, setText] = useState("");
  const [result, setResult] = useState<{ from: string; to: string; result: string } | null>(null);
  return (
    <Page title="AI 翻译" onBack={pop}>
      <p className="text-[14px] text-[#666]">AI 大模型驱动，准确又自然。常用短句已可试译，其余句子会给出本地草稿。</p>
      <textarea
        value={text}
        placeholder="输入要翻译的话，例如：打开门锁"
        onChange={(event) => setText(event.target.value)}
        className="mt-3 h-28 w-full resize-none rounded-2xl border border-[#E8E8E8] bg-white px-4 py-3 text-[15px] outline-none"
      />
      <div className="mt-3">
        <PrimaryButton onClick={() => setResult(translateText(text))}>翻译</PrimaryButton>
      </div>
      {result?.result ? (
        <article className="mt-4 rounded-2xl bg-white px-4 py-4">
          <p className="text-[12px] text-[#999]">{result.from} → {result.to}</p>
          <p className="mt-2 text-[16px] leading-7">{result.result}</p>
        </article>
      ) : null}
    </Page>
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
