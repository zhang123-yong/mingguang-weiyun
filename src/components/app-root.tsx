"use client";

import { useEffect, useRef, useState } from "react";
import { CoverScreen } from "@/components/cover-screen";
import { LoginScreen, OauthScreen, RegisterScreen } from "@/components/screens/auth";
import {
  AddDeviceScreen,
  DeviceInfoScreen,
  DeviceLogsScreen,
  DeviceScreen,
  DeviceSettingsScreen,
  DeviceShareScreen,
  GroupEditScreen,
  GroupScreen,
  LockAiScreen,
  LockLinkScreen,
  LockNoticesScreen,
  LockUsersScreen,
  LockVideoScreen,
  PairScreen,
  TempPassScreen,
} from "@/components/screens/devices";
import { MainScreen } from "@/components/screens/home";
import {
  AboutScreen,
  AccountScreen,
  FamilyScreen,
  FeedbackScreen,
  HelpArticle,
  HelpScreen,
  HomeDetailScreen,
  MembersScreen,
  MessageScreen,
  MessagesScreen,
  ProfileScreen,
  RoomsScreen,
  ScanScreen,
  SettingsScreen,
  VoiceBindScreen,
  VoiceScreen,
  WeatherScreen,
} from "@/components/screens/me";
import {
  AgentScreen,
  AgentsScreen,
  AssistantScreen,
  CalorieScreen,
  EnergyScreen,
  EnvironmentScreen,
  ExploreScreen,
  NetworkScreen,
  NotesScreen,
  OrdersScreen,
  PlusScreen,
  TemplateScreen,
  TranslateScreen,
  WebAiScreen,
  CastScreen,
} from "@/components/screens/features";
import { SceneEditor, SceneScreen } from "@/components/screens/scenes";
import { AppStateProvider, useApp } from "@/lib/app-state";
import { NavProvider, useNav, type Route, type TabId } from "@/lib/nav";

export function AppRoot() {
  return (
    <AppStateProvider>
      <Shell />
    </AppStateProvider>
  );
}

function Shell() {
  const { data, ready, setAgreed } = useApp();
  const [stack, setStack] = useState<Route[]>([{ name: "cover" }]);
  const [tab, setTab] = useState<TabId>("home");
  const [toast, setToast] = useState<string | null>(null);
  const timer = useRef<number | null>(null);
  const restored = useRef(false);

  useEffect(() => {
    if (!ready || restored.current) return;
    restored.current = true;
    if (data.user) setStack([{ name: "tabs" }]);
  }, [ready, data.user]);

  useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  function notify(message: string) {
    setToast(message);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setToast(null), 2200);
  }

  const nav = {
    tab,
    setTab,
    push: (route: Route) => setStack((current) => [...current, route]),
    pop: () => setStack((current) => (current.length > 1 ? current.slice(0, -1) : current)),
    reset: (route: Route) => setStack([route]),
    notify,
  };

  const route = stack[stack.length - 1] ?? { name: "cover" as const };

  return (
    <NavProvider value={nav}>
      <div className="min-h-dvh bg-white text-[#222] sm:flex sm:items-center sm:justify-center sm:bg-[#E7E9EE] sm:p-6">
        <div className="relative mx-auto flex h-dvh w-full max-w-[420px] flex-col overflow-hidden bg-white sm:h-[min(844px,calc(100dvh-48px))] sm:rounded-[32px] sm:shadow-[0_24px_70px_rgba(20,24,40,0.16)]">
          {ready ? <Screen route={route} agreed={data.agreed} onAgreedChange={setAgreed} /> : <div className="h-full bg-white" />}
          {toast ? (
            <div className="pointer-events-none absolute inset-x-0 bottom-6 z-40 flex justify-center px-6">
              <p role="status" className="rounded-full bg-black/75 px-4 py-2 text-center text-[13px] text-white">
                {toast}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </NavProvider>
  );
}

function Screen({
  route,
  agreed,
  onAgreedChange,
}: {
  route: Route;
  agreed: boolean;
  onAgreedChange: (value: boolean) => void;
}) {
  const { push } = useNav();
  switch (route.name) {
    case "cover":
      return (
        <CoverScreen
          agreed={agreed}
          onAgreedChange={onAgreedChange}
          onContinue={(action) => {
            if (action === "login") push({ name: "login" });
            else if (action === "register") push({ name: "register" });
            else push({ name: "oauth", provider: action });
          }}
        />
      );
    case "login":
      return <LoginScreen />;
    case "register":
      return <RegisterScreen />;
    case "oauth":
      return <OauthScreen provider={route.provider} />;
    case "tabs":
      return <MainScreen />;
    case "add":
      return <AddDeviceScreen />;
    case "pair":
      return <PairScreen productId={route.productId} />;
    case "device":
      return <DeviceScreen id={route.id} />;
    case "device-settings":
      return <DeviceSettingsScreen id={route.id} />;
    case "device-info":
      return <DeviceInfoScreen id={route.id} />;
    case "device-share":
      return <DeviceShareScreen id={route.id} />;
    case "device-logs":
      return <DeviceLogsScreen id={route.id} />;
    case "lock-users":
      return <LockUsersScreen id={route.id} />;
    case "temp-pass":
      return <TempPassScreen id={route.id} />;
    case "lock-video":
      return <LockVideoScreen id={route.id} />;
    case "lock-ai":
      return <LockAiScreen id={route.id} />;
    case "lock-link":
      return <LockLinkScreen id={route.id} />;
    case "lock-notices":
      return <LockNoticesScreen id={route.id} />;
    case "group-edit":
      return <GroupEditScreen deviceId={route.deviceId} />;
    case "group":
      return <GroupScreen id={route.id} />;
    case "scene-edit":
      return <SceneEditor kind={route.kind} id={route.id} initialName={route.initialName} initialWhen={route.initialWhen} />;
    case "scene-list":
      return <SceneScreen fixedKind={route.kind} />;
    case "plus":
      return <PlusScreen />;
    case "calorie":
      return <CalorieScreen />;
    case "assistant":
      return <AssistantScreen voice={route.voice} />;
    case "explore":
      return <ExploreScreen />;
    case "environment":
      return <EnvironmentScreen />;
    case "templates":
      return <TemplateScreen />;
    case "energy":
      return <EnergyScreen />;
    case "notes":
      return <NotesScreen />;
    case "translate":
      return <TranslateScreen />;
    case "agents":
      return <AgentsScreen />;
    case "agent":
      return <AgentScreen id={route.id} />;
    case "orders":
      return <OrdersScreen />;
    case "network":
      return <NetworkScreen />;
    case "web-ai":
      return <WebAiScreen />;
    case "family":
      return <FamilyScreen />;
    case "home-detail":
      return <HomeDetailScreen id={route.id} />;
    case "rooms":
      return <RoomsScreen homeId={route.homeId} />;
    case "members":
      return <MembersScreen homeId={route.homeId} />;
    case "messages":
      return <MessagesScreen />;
    case "message":
      return <MessageScreen id={route.id} />;
    case "settings":
      return <SettingsScreen />;
    case "account":
      return <AccountScreen />;
    case "about":
      return <AboutScreen />;
    case "help":
      return <HelpScreen />;
    case "help-article":
      return <HelpArticle id={route.id} />;
    case "profile":
      return <ProfileScreen />;
    case "scan":
      return <ScanScreen />;
    case "voice":
      return <VoiceScreen />;
    case "voice-bind":
      return <VoiceBindScreen service={route.service} />;
    case "weather":
      return <WeatherScreen />;
    case "feedback":
      return <FeedbackScreen />;
    case "cast":
      return <CastScreen />;
    default:
      return null;
  }
}
