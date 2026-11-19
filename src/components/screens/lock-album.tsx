"use client";

import { useMemo, useState } from "react";
import { Bell, ChevronLeft, ChevronDown, Play, Search } from "lucide-react";
import type { Device, LockPanelState } from "@/lib/model";

type Area = "album" | "log";
type LogTab = "alarm" | "door";
type EventFilter = "全部事件" | "远程解锁" | "有人按门铃";

type Stamp = { key: string; hm: string; label: string };

type Row = {
  id: string;
  title: string;
  stamp: Stamp;
  event: Exclude<EventFilter, "全部事件"> | "其他";
  bucket: "alarm" | "door" | "clip";
  mine: boolean;
};

const EVENTS: EventFilter[] = ["全部事件", "远程解锁", "有人按门铃"];
const WEEK = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

function shanghaiParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const pick = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  return { y: pick("year"), m: pick("month"), d: pick("day") };
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function keyOf(y: number, m: number, d: number) {
  return `${y}-${pad(m)}-${pad(d)}`;
}

function parseStamp(time: string): Stamp {
  const today = shanghaiParts();
  const matched = time.match(/(?:(\d{4})[^\d]+)?(\d{1,2})[^\d]+(\d{1,2})[^\d]+(\d{1,2}):(\d{2})/);
  const y = matched?.[1] ? Number(matched[1]) : today.y;
  const m = matched ? Number(matched[2]) : today.m;
  const d = matched ? Number(matched[3]) : today.d;
  const hm = matched ? `${pad(Number(matched[4]))}:${matched[5]}` : time;
  const key = keyOf(y, m, d);
  const weekday = WEEK[new Date(`${key}T12:00:00+08:00`).getDay()] ?? "";
  const label = key === keyOf(today.y, today.m, today.d) ? "今天" : `${key}（${weekday}）`;
  return { key, hm, label };
}

function classify(text: string): Pick<Row, "event" | "bucket" | "mine"> | null {
  if (/门铃|逗留|告警/.test(text)) return { event: "有人按门铃", bucket: "alarm", mine: false };
  if (/开锁|解锁|上锁/.test(text)) {
    return { event: /上锁/.test(text) && !/开锁|解锁/.test(text) ? "其他" : "远程解锁", bucket: "door", mine: /长按|我触发/.test(text) };
  }
  return null;
}

function yesterdayKey() {
  const today = shanghaiParts();
  const date = new Date(`${keyOf(today.y, today.m, today.d)}T12:00:00+08:00`);
  date.setUTCDate(date.getUTCDate() - 1);
  return keyOf(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
}

function matchesQuery(row: Row, keyword: string) {
  if (!keyword) return true;
  if (keyword === "昨天") return row.stamp.key === yesterdayKey();
  if (keyword === "今天") return row.stamp.label === "今天";
  return `${row.title}${row.stamp.hm}${row.stamp.label}${row.stamp.key}`.includes(keyword);
}

function monthCells(y: number, m: number) {
  const first = new Date(`${keyOf(y, m, 1)}T12:00:00+08:00`).getDay();
  const count = new Date(y, m, 0).getDate();
  const cells: Array<number | null> = [...Array(first).fill(null)];
  for (let day = 1; day <= count; day += 1) cells.push(day);
  while (cells.length % 7) cells.push(null);
  return cells;
}

function ClipFace() {
  return (
    <span className="relative block aspect-[4/3] overflow-hidden rounded-lg bg-[#D7DDE3]">
      <span className="absolute inset-x-4 top-4 h-8 rounded bg-white/70" />
      <span className="absolute bottom-3 left-3 right-3 h-10 rounded bg-[#C5CED6]" />
      <span className="absolute left-1/2 top-1/2 grid size-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-black/45 text-white">
        <Play className="size-4 fill-white" />
      </span>
    </span>
  );
}

export function LockAlbum({
  device,
  panel,
  onBack,
  onCloud,
  notify,
}: {
  device: Device;
  panel: LockPanelState;
  onBack: () => void;
  onCloud: () => void;
  notify: (message: string) => void;
}) {
  const today = shanghaiParts();
  const [area, setArea] = useState<Area>("album");
  const [logTab, setLogTab] = useState<LogTab>("alarm");
  const [event, setEvent] = useState<EventFilter>("全部事件");
  const [day, setDay] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [localOnly, setLocalOnly] = useState(false);
  const [menu, setMenu] = useState<"date" | "event" | null>(null);
  const [cursor, setCursor] = useState({ y: today.y, m: today.m });

  const rows = useMemo<Row[]>(() => {
    const fromLogs = device.logs.flatMap((item) => {
      const kind = classify(item.text);
      return kind ? [{ id: item.id, title: item.text, stamp: parseStamp(item.time), ...kind }] : [];
    });
    const fromClips = panel.album.map((clip) => ({
      id: clip.id,
      title: "本地录像",
      stamp: parseStamp(clip.time),
      event: "其他" as const,
      bucket: "clip" as const,
      mine: false,
    }));
    return [...fromClips, ...fromLogs];
  }, [device.logs, panel.album]);

  const marked = useMemo(() => new Set(rows.map((row) => row.stamp.key)), [rows]);
  const keyword = query.trim();
  const albumRows = rows.filter((row) => {
    if (localOnly && row.bucket !== "clip") return false;
    if (event !== "全部事件" && row.event !== event) return false;
    if (day && row.stamp.key !== day) return false;
    return matchesQuery(row, keyword);
  });
  const logRows = rows.filter((row) => row.bucket === logTab && (!day || row.stamp.key === day));
  const groups = logRows.reduce<Array<{ label: string; items: Row[] }>>((list, row) => {
    const last = list[list.length - 1];
    if (!last || last.label !== row.stamp.label) list.push({ label: row.stamp.label, items: [row] });
    else last.items.push(row);
    return list;
  }, []);

  function noVideo() {
    notify("这是演示记录，没有视频画面");
  }

  function shiftMonth(step: number) {
    setCursor((current) => {
      const next = current.m + step;
      if (next < 1) return { y: current.y - 1, m: 12 };
      if (next > 12) return { y: current.y + 1, m: 1 };
      return { y: current.y, m: next };
    });
  }

  return (
    <section className="flex min-h-full flex-col bg-[#F7F8FA]">
      <header className="flex h-12 items-center bg-white px-2">
        <button type="button" aria-label="返回" onClick={onBack} className="grid size-10 place-items-center">
          <ChevronLeft className="size-6" />
        </button>
        <div className="flex flex-1 justify-center gap-8 pr-10 text-[17px]">
          {(["album", "log"] as const).map((id) => (
            <button key={id} type="button" onClick={() => { setArea(id); setMenu(null); }} className={area === id ? "font-medium text-[#12c4a0]" : "text-[#222]"}>
              {id === "album" ? "相册" : "日志"}
            </button>
          ))}
        </div>
      </header>

      {area === "album" ? (
        <>
          <div className="flex items-center gap-2 bg-white px-4 pb-3">
            <button type="button" className="flex items-center gap-1 text-[14px]" onClick={() => setMenu(menu === "date" ? null : "date")}>
              {day ? `${Number(day.slice(5, 7))}月${Number(day.slice(8))}日` : "全部日期"}
              <ChevronDown className={`size-4 ${menu === "date" ? "rotate-180" : ""}`} />
            </button>
            <span className="text-[#DDD]">|</span>
            <button type="button" className={`flex items-center gap-1 text-[14px] ${event !== "全部事件" ? "text-[#12c4a0]" : ""}`} onClick={() => setMenu(menu === "event" ? null : "event")}>
              {event}
              <ChevronDown className={`size-4 ${menu === "event" ? "rotate-180" : ""}`} />
            </button>
            <button
              type="button"
              className="ml-auto h-8 rounded-full bg-[#12c4a0] px-3 text-[13px] text-white"
              onClick={() => {
                setLocalOnly((value) => !value);
                setMenu(null);
                notify(localOnly ? "已显示全部相册" : "只看本地录像");
              }}
            >
              {localOnly ? "查看全部" : "查看本地相册"}
            </button>
          </div>
          <div className="bg-white px-4 pb-3">
            <label className="flex h-10 items-center gap-2 rounded-full border border-[#D9C7FF] px-3 text-[13px] text-[#B0B4BA]">
              <Search className="size-4 text-[#8B6CFF]" />
              <input
                value={query}
                onChange={(input) => setQuery(input.target.value)}
                placeholder="智能搜索包裹、告警、昨天…"
                className="min-w-0 flex-1 bg-transparent text-[#222] outline-none placeholder:text-[#B0B4BA]"
              />
            </label>
          </div>
          <div className="relative min-h-0 flex-1">
            <div className={`grid grid-cols-2 gap-3 px-4 py-3 ${menu ? "opacity-40" : ""}`}>
              {albumRows.length === 0 ? (
                <p className="col-span-2 py-10 text-center text-[14px] text-[#98A0AA]">
                  {localOnly ? "本地相册还没有录像。在视频监控里停止录像后会出现在这里。" : "没有符合条件的记录"}
                </p>
              ) : albumRows.map((row) => (
                <div key={row.id} className="text-left">
                  <button type="button" onClick={noVideo} className="block w-full text-left">
                    <ClipFace />
                    <span className="mt-2 block text-[12px] text-[#666]">{row.stamp.key.slice(5)} {row.stamp.hm}</span>
                    <span className="mt-1 block text-[15px]">{row.title}</span>
                  </button>
                  <button type="button" onClick={() => notify("演示不会分析真实画面")} className="mt-1 rounded bg-[#F4F0FF] px-1.5 py-0.5 text-[11px] text-[#7C5CFF]">
                    AI 摘要
                  </button>
                </div>
              ))}
            </div>
            {menu === "date" ? (
              <div className="absolute inset-x-0 top-0 bg-white px-4 pb-4 shadow">
                <div className="flex items-center justify-center gap-8 py-2">
                  <button type="button" aria-label="上个月" onClick={() => shiftMonth(-1)}>‹</button>
                  <b>{cursor.y}-{pad(cursor.m)}</b>
                  <button type="button" aria-label="下个月" onClick={() => shiftMonth(1)}>›</button>
                </div>
                <div className="grid grid-cols-7 text-center text-[12px] text-[#98A0AA]">
                  {WEEK.map((name) => <span key={name} className="py-2">{name.slice(1)}</span>)}
                </div>
                <div className="grid grid-cols-7 text-center text-[15px]">
                  {monthCells(cursor.y, cursor.m).map((value, index) => {
                    if (!value) return <span key={`empty-${index}`} />;
                    const cellKey = keyOf(cursor.y, cursor.m, value);
                    const selected = day === cellKey;
                    return (
                      <button
                        key={cellKey}
                        type="button"
                        onClick={() => {
                          setDay(selected ? null : cellKey);
                          setMenu(null);
                        }}
                        className="relative grid h-10 place-items-center"
                      >
                        <span className={`grid size-8 place-items-center rounded-full ${selected ? "bg-[#12c4a0] text-white" : ""}`}>{value}</span>
                        {marked.has(cellKey) ? <i className={`absolute bottom-1 size-1 rounded-full ${selected ? "bg-white" : "bg-[#12c4a0]"}`} /> : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
            {menu === "event" ? (
              <div className="absolute inset-x-0 top-0 bg-white px-5 py-2 shadow">
                {EVENTS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => { setEvent(item); setMenu(null); }}
                    className={`block w-full py-3 text-left text-[16px] ${event === item ? "text-[#12c4a0]" : ""}`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <div className="bg-white px-4 pb-4 pt-2">
            <p className="text-center text-[12px] leading-5 text-[#98A0AA]">免费 3 天滚动视频存储将于 2027年6月30日结束。如需继续使用云存储服务，可按需付费开通。</p>
            <button type="button" onClick={onCloud} className="mt-3 h-11 w-full rounded-full bg-[#12c4a0] text-[16px] text-white">开通云存储服务</button>
          </div>
        </>
      ) : (
        <div className="min-h-0 flex-1">
          <div className="flex bg-white text-[16px]">
            {([["alarm", "告警消息"], ["door", "开门记录"]] as const).map(([id, label]) => (
              <button key={id} type="button" onClick={() => setLogTab(id)} className="flex-1 py-3">
                <span className={logTab === id ? "border-b-2 border-[#12c4a0] pb-2 text-[#222]" : "text-[#666]"}>{label}</span>
              </button>
            ))}
          </div>
          {groups.length === 0 ? <p className="px-4 py-10 text-center text-[14px] text-[#98A0AA]">{logTab === "alarm" ? "没有告警消息" : "没有开门记录"}</p> : null}
          {groups.map((group) => (
            <div key={group.label}>
              <p className="px-4 py-2 text-[13px] text-[#98A0AA]">{group.label}</p>
              <div className="bg-white">
                {group.items.map((row) => (
                  <button key={row.id} type="button" onClick={noVideo} className="flex w-full items-center gap-3 border-b border-[#F4F5F7] px-4 py-3 text-left last:border-b-0">
                    {logTab === "alarm" ? <Bell className="size-5 shrink-0 text-[#98A0AA]" /> : null}
                    <span className="min-w-0 flex-1">
                      <span className="block text-[16px]">{row.mine ? `我触发 ${row.title}` : row.title}</span>
                      {row.mine ? <span className="mt-1 block text-[14px] text-[#12c4a0]">查看</span> : null}
                      <span className="mt-1 block text-[12px] text-[#98A0AA]">{row.stamp.hm}</span>
                    </span>
                    {logTab === "alarm" || row.event === "远程解锁" ? (
                      <span className="grid h-12 w-16 shrink-0 place-items-center rounded bg-[#E6E9ED] text-[#98A0AA]">
                        <Play className="size-4" />
                      </span>
                    ) : null}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
