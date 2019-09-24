import ReactGA from 'react-ga';

ReactGA.initialize("UA-146656690-1", { debug: true });
export default class AnalyticsHelper {

  track(deck) {
    window['optimizely'] = window['optimizely'] || [];
    window['optimizely'].push({
      type: "event",
      eventName: deck.title
    });
    
  	ReactGA.event({
  	  category: 'Deck Section',
  	  action: 'included',
  	  label: deck.title
  	});
  
  }

  trackState(stateName) {
    
    ReactGA.event({
      category: 'state',
      action: 'update',
      label: stateName
    });
  
  }
}