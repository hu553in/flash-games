interface RufflePlayerElement extends HTMLElement {
  ruffle: () => {
    load: (url: string) => Promise<void>;
    readonly readyState: 0 | 1 | 2;
  };
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
}

interface Window {
  RufflePlayer?: { newest: () => { createPlayer: () => RufflePlayerElement } };
}

interface WindowEventMap {
  beforeinstallprompt: BeforeInstallPromptEvent;
}
