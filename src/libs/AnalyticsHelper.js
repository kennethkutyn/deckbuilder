import ReactGA from "react-ga";

ReactGA.initialize("UA-146656690-1");
export default class AnalyticsHelper {
  track(deck) {
    window["optimizely"] = window["optimizely"] || [];
    window["optimizely"].push({
      type: "event",
      eventName: deck.title
    });

    ReactGA.event({
      category: "Deck Section",
      action: "included",
      label: deck.title
    });

    window.FS.event('Deck Included', {
      deck: deck.title
    }
    )


  }

  trackState(stateName) {
    window["optimizely"] = window["optimizely"] || [];
    window["optimizely"].push({
      type: "event",
      eventName: stateName
    });

    ReactGA.event({
      category: "state",
      action: "update",
      label: stateName
    });
  }
}
