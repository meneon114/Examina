let interval: any = null;

self.onmessage = (e: MessageEvent) => {
  if (e.data === "start") {
    if (interval) clearInterval(interval);
    interval = setInterval(() => {
      self.postMessage("tick");
    }, 1000);
  } else if (e.data === "stop") {
    if (interval) clearInterval(interval);
    interval = null;
  }
};

