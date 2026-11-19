"use client";

import { createContext, useContext, type ReactNode } from "react";

export type TabId = "home" | "smart" | "discover" | "me";

export type Route =
  | { name: "cover" }
  | { name: "login" }
  | { name: "register" }
  | { name: "oauth"; provider: "qq" | "wechat" }
  | { name: "tabs" }
  | { name: "add" }
  | { name: "pair"; productId: string }
  | { name: "device"; id: string }
  | { name: "device-settings"; id: string }
  | { name: "device-info"; id: string }
  | { name: "device-share"; id: string }
  | { name: "device-logs"; id: string }
  | { name: "lock-users"; id: string }
  | { name: "temp-pass"; id: string }
  | { name: "lock-video"; id: string }
  | { name: "lock-ai"; id: string }
  | { name: "lock-link"; id: string }
  | { name: "lock-notices"; id: string }
  | { name: "group-edit"; deviceId?: string }
  | { name: "group"; id: string }
  | { name: "scene-edit"; kind: "tap" | "auto"; id?: string; initialName?: string; initialWhen?: string }
  | { name: "scene-list"; kind: "tap" | "auto" }
  | { name: "scene-create" }
  | { name: "valve-plan" }
  | { name: "smart-create"; prompt?: string }
  | { name: "smart-apps" }
  | { name: "plus" }
  | { name: "calorie" }
  | { name: "assistant"; voice?: boolean }
  | { name: "explore" }
  | { name: "environment" }
  | { name: "templates" }
  | { name: "energy" }
  | { name: "notes" }
  | { name: "translate" }
  | { name: "agents" }
  | { name: "agent"; id: string }
  | { name: "orders" }
  | { name: "network" }
  | { name: "web-ai" }
  | { name: "family" }
  | { name: "home-detail"; id: string }
  | { name: "rooms"; homeId: string }
  | { name: "members"; homeId: string }
  | { name: "messages" }
  | { name: "alarm" }
  | { name: "lock-service" }
  | { name: "message"; id: string }
  | { name: "settings" }
  | { name: "account" }
  | { name: "about" }
  | { name: "help" }
  | { name: "help-article"; id: string }
  | { name: "profile" }
  | { name: "scan" }
  | { name: "voice" }
  | { name: "voice-bind"; service: string }
  | { name: "weather" }
  | { name: "feedback" }
  | { name: "cast" };

export type NavValue = {
  tab: TabId;
  setTab: (tab: TabId) => void;
  push: (route: Route) => void;
  pop: () => void;
  reset: (route: Route) => void;
  notify: (message: string) => void;
};

const NavContext = createContext<NavValue | null>(null);

export function NavProvider({
  value,
  children,
}: {
  value: NavValue;
  children: ReactNode;
}) {
  return <NavContext.Provider value={value}>{children}</NavContext.Provider>;
}

export function useNav() {
  const value = useContext(NavContext);
  if (!value) throw new Error("useNav 必须在 NavProvider 内使用");
  return value;
}
