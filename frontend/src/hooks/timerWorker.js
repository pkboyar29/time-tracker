let intervalId;

onmessage = (ev) => {
  const data = ev.data;

  if (data.action == 'run') {
    clearInterval(intervalId);

    intervalId = setInterval(() => {
      const startTimestampSeconds = Math.floor(data.startTimestamp / 1000);
      const nowTimestampSeconds = Math.floor(Date.now() / 1000);

      const newSpentSeconds =
        data.startSpentSeconds + (nowTimestampSeconds - startTimestampSeconds);

      postMessage(newSpentSeconds);
    }, 1000);
  }

  if (data.action == 'pause') {
    clearInterval(intervalId);
  }
};
