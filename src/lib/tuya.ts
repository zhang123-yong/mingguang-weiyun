/**
 * 本地占位。涂鸦协议和 SDK 接入后，只替换这个文件里的实现。
 * 页面只调用这里的函数，不直接写死服务地址。
 */

export type MealResult = {
  name: string;
  kcal: number;
  protein: string;
  fat: string;
  carb: string;
};

export type EnergyRoom = {
  room: string;
  kwh: string;
  tip: string;
};

const PHRASES: { zh: string; en: string }[] = [
  { zh: "打开门锁", en: "Unlock the door" },
  { zh: "关闭灯光", en: "Turn off the lights" },
  { zh: "今天天气怎么样", en: "How is the weather today" },
  { zh: "帮我记一下", en: "Help me take a note" },
  { zh: "回家模式", en: "Home mode" },
];

export function recognizeMeal(): MealResult {
  return {
    name: "牛排沙拉",
    kcal: 680,
    protein: "42 g",
    fat: "38 g",
    carb: "31 g",
  };
}

export function translateText(text: string) {
  const value = text.trim();
  if (!value) return { from: "中文", to: "English", result: "" };
  const hit = PHRASES.find((item) => item.zh === value || item.en.toLowerCase() === value.toLowerCase());
  if (hit) {
    const toEnglish = hit.zh === value;
    return {
      from: toEnglish ? "中文" : "English",
      to: toEnglish ? "English" : "中文",
      result: toEnglish ? hit.en : hit.zh,
    };
  }
  const chinese = /[\u4e00-\u9fff]/.test(value);
  return {
    from: chinese ? "中文" : "English",
    to: chinese ? "English" : "中文",
    result: chinese ? `Please ${value}` : `请处理：${value}`,
  };
}

export function replyTo(text: string) {
  const value = text.trim();
  if (!value) return "可以说：添加门锁、创建回家场景，或者查看节能建议。";
  if (value.includes("门锁") || value.includes("锁")) return "可以在首页点「去添加」，选择智能门锁里的「门锁」，再按蓝牙或 Wi-Fi 配网。";
  if (value.includes("场景") || value.includes("自动")) return "到「智能」里点「自动化」或「手动执行」，就能创建应用。";
  if (value.includes("节能") || value.includes("电")) return "「发现」里的 AI 节能会按房间给出用电建议。还没接上电表时，先显示示例数据。";
  if (value.includes("翻译")) return "打开「发现」里的 AI 翻译，输入一句话就能试译。";
  return `已收到「${value}」。设备协议接入后，我会按家里的真实设备来执行。`;
}

export function energyRooms(deviceCount: number): EnergyRoom[] {
  if (deviceCount === 0) return [];
  return [
    { room: "客厅", kwh: "1.2 kWh", tip: "陪伴设备可在无人时关闭" },
    { room: "门口", kwh: "0.3 kWh", tip: "门锁待机正常" },
  ];
}
