/// <reference lib="webworker" />
/* eslint-disable no-restricted-globals */
const sw = /** @type {ServiceWorkerGlobalScope} */ (/** @type {unknown} */ (self));

sw.addEventListener("push", (event) => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    sw.registration.showNotification(data.title || "Notification", {
      body: data.body || "",
      icon: "/favicon.ico",
      data: { url: data.url || "/" },
    })
  );
});

sw.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(sw.clients.openWindow(url));
});
