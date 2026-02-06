document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("container");
  const selector = document.getElementById("selector");
  const installButton = document.getElementById("install");
  const connectionBadge = document.getElementById("connection");
  const toast = document.getElementById("toast");

  let currentPlayer = null;
  let loadSeq = 0;
  let deferredInstallPrompt = null;
  let toastTimer = null;
  let waitingForWorkerRefresh = false;

  function reportError(context, error, toastMessage = null) {
    if (error instanceof Error) {
      console.error(`${context}:`, error.message, error.stack);
    } else {
      console.error(`${context}:`, error);
    }

    if (toastMessage) showToast(toastMessage);
  }

  function isKnownGame(name) {
    return [...selector.options].some((option) => option.value === name);
  }

  function syncUrlWithSelection(name) {
    const url = new URL(window.location.href);
    url.searchParams.set("game", name);
    window.history.replaceState({}, "", url);
  }

  function getInitialSelection() {
    const preferred = new URLSearchParams(window.location.search).get("game");
    if (preferred && isKnownGame(preferred)) return preferred;
    return selector.value;
  }

  function setOnlineBadge() {
    const online = navigator.onLine;
    connectionBadge.textContent = online ? "Online" : "Offline";
    connectionBadge.classList.toggle("offline", !online);
  }

  function showToast(message, actionLabel, action, autoHide = true) {
    if (toastTimer) {
      clearTimeout(toastTimer);
      toastTimer = null;
    }
    toast.innerHTML = "";

    const text = document.createElement("span");
    text.textContent = message;
    toast.appendChild(text);

    if (actionLabel && typeof action === "function") {
      const button = document.createElement("button");
      button.textContent = actionLabel;
      button.addEventListener("click", () => {
        const shouldHide = action(button);
        if (shouldHide !== false) {
          toast.hidden = true;
        }
      });
      toast.appendChild(button);
    }

    toast.hidden = false;
    if (autoHide) {
      toastTimer = setTimeout(() => {
        toast.hidden = true;
      }, 7000);
    }
  }

  window.addEventListener("error", (event) => {
    const details = event.error ?? {
      message: event.message,
      file: event.filename,
      line: event.lineno,
      column: event.colno,
    };
    reportError("Unhandled error", details);
  });

  window.addEventListener("unhandledrejection", (event) => {
    reportError("Unhandled promise rejection", event.reason);
  });

  window.addEventListener("online", setOnlineBadge);
  window.addEventListener("offline", setOnlineBadge);

  function destroyPlayer() {
    if (!currentPlayer) return;

    try {
      currentPlayer.remove();
    } catch (error) {
      reportError("Failed to remove player", error);
    }
    currentPlayer = null;
  }

  function createAndMountPlayer() {
    const ruffle = window.RufflePlayer?.newest?.();
    if (!ruffle) throw new Error("Ruffle is not available");

    const player = ruffle.createPlayer();
    player.id = "player";
    player.style.width = "100%";
    player.style.height = "100%";

    container.innerHTML = "";
    container.appendChild(player);

    currentPlayer = player;
  }

  async function loadGame(name) {
    const path = `assets/swf/${name}.swf`;
    const mySeq = ++loadSeq;

    try {
      destroyPlayer();
      createAndMountPlayer();

      await new Promise((resolve) => requestAnimationFrame(resolve));

      await currentPlayer.ruffle().load(path);
    } catch (error) {
      reportError(
        `Failed to load game: ${path}`,
        error,
        "Could not load the game. Please try again."
      );
    } finally {
      if (mySeq !== loadSeq) return;
    }
  }

  selector.addEventListener("change", () => {
    syncUrlWithSelection(selector.value);
    loadGame(selector.value);
  });

  const initialSelection = getInitialSelection();
  selector.value = initialSelection;
  syncUrlWithSelection(initialSelection);
  setOnlineBadge();
  loadGame(initialSelection);

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    installButton.hidden = false;
  });

  installButton.addEventListener("click", async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    try {
      await deferredInstallPrompt.userChoice;
    } catch (error) {
      reportError("Install prompt failed", error, "Could not install the app.");
    } finally {
      deferredInstallPrompt = null;
      installButton.hidden = true;
    }
  });

  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    installButton.hidden = true;
    showToast("Flash Games installed.");
  });

  async function registerServiceWorker() {
    if (!("serviceWorker" in navigator) || !window.isSecureContext) return;

    try {
      const registration = await navigator.serviceWorker.register("./sw.js", { scope: "./" });

      const requestRefresh = () => {
        if (!registration.waiting) return;
        showToast("Update available.", "Reload", (button) => {
          const waiting = registration.waiting;
          if (!waiting) return true;

          button.disabled = true;
          button.textContent = "Updating...";
          waitingForWorkerRefresh = true;
          waiting.postMessage({ type: "SKIP_WAITING" });
          return false;
        }, false);
      };

      requestRefresh();

      registration.addEventListener("updatefound", () => {
        const incoming = registration.installing;
        if (!incoming) return;

        incoming.addEventListener("statechange", () => {
          if (incoming.state === "installed" && navigator.serviceWorker.controller) {
            requestRefresh();
          }
        });
      });

      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (!waitingForWorkerRefresh) return;
        window.location.reload();
      });
    } catch (error) {
      reportError(
        "Service worker registration failed",
        error,
        "Offline features are unavailable."
      );
    }
  }

  registerServiceWorker();
});
