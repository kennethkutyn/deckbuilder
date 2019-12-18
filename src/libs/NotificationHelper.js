export default class NotificationHelper {
  constructor() {
    this.permission = Notification.permission;
  }

  granted() {
    return this.permission === "granted";
  }

  blocked() {
    return this.permission !== "granted" && this.permission !== "default";
  }

  request() {
    return new Promise((resolve, reject) => {
      let permission = Notification.permission;

      if (permission === "default") {
        // Ask the customer to allow notifications
        Notification.requestPermission(permission => {
          this.permission = permission;
          resolve(this.granted());
        });
      }
    });
  }

  notify(title, body, iconURL, openURL) {
    if (this.granted()) {
      // Send the notification
      let notif = new Notification(title, {
        body: body,
        icon: iconURL
      });
      notif.onclick = function() {
        window.open(openURL);
      };
    }
  }
}
