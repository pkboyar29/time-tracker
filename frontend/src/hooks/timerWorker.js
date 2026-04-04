let intervalId;

onmessage = (ev) => {
  const data = ev.data;

  if (data.action == 'run') {
    clearInterval(intervalId);

    intervalId = setInterval(() => {
      const startTimestamp = data.startTimestamp;
      const nowTimestamp = Date.now();
      const newSpentMs = data.startSpentMs + (nowTimestamp - startTimestamp);

      postMessage(newSpentMs);
    }, 100);
  }

  if (data.action == 'pause') {
    clearInterval(intervalId);
  }
};
