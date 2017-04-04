'use babel';

import { CompositeDisposable } from 'atom';

const MAPS_API = 'https://maps.googleapis.com/maps/api/browserlocation/json?browser=chromium&sensor=true'

function getNightThemes() {
  return [atom.config.get("night-light.night.ui"), atom.config.get("night-light.night.syntax")];
}
function getDayThemes() {
  return [atom.config.get("night-light.day.ui"), atom.config.get("night-light.day.syntax")];
}

function addAvailableThemes(config) {
  atom.themes.getLoadedThemeNames().map((theme) => {
    if(/.*-ui$/.test(theme)) {
      config.night.properties.ui.enum.push(theme);
      config.day.properties.ui.enum.push(theme);
    } else if (/.*syntax$/.test(theme)) {
      config.night.properties.syntax.enum.push(theme);
      config.day.properties.syntax.enum.push(theme);
    }
  });
  return config;
}

function setTheme(newTheme) {
  atom.config.set("core.themes", newTheme);
}

export default {

  config: addAvailableThemes(require('./config.json')),
  subscriptions: null,
  sunrise: null,
  sunset: null,
  lat: null,
  long: null,
  night: false,
  lastRefresh: 0,

  activate(state) {
    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();
    // Register the toggle command
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'night-light:toggle': () => this.toggle()
    }));

    this.tick = this.tick.bind(this);
    setTimeout(this.tick, 500); // for initialization
    setInterval(this.tick, 60000);
  },

  deactivate() {
    this.subscriptions.dispose();
  },

  serialize() {
    return;
  },

  toggle() {
    this.night = !this.night;
    this.night ? setTheme(getNightThemes()) : setTheme(getDayThemes());
  },

  updateLocation() {
    return new Promise(function(resolve, reject) {
      var request = require('request');
      // If Auto-update location is true, then grab the updated location info
      if(atom.config.get('night-light.location.auto')) {
        request(MAPS_API, (error, response, body) => {
          if (!error && response.statusCode == 200) {
            json = JSON.parse(body);
            console.log(body);
            atom.config.set('night-light.location.lat', json.location.lat);
            atom.config.set('night-light.location.lng', json.location.lng);
            this.lat = json.location.lat;
            this.lng = json.location.lng;
            console.log(this.lat);
            console.log(this.lng);
            console.log("resolving");
            resolve(json.location);
          } else {
            // No worries, just use default sunrise/sunset
            this.lat = atom.config.get('night-light.location.lat');
            this.lng = atom.config.get('night-light.location.lng');
            if(error) {
              atom.notifications.addWarning("#### night-light: There was an error with automatically updating your location :/\n\nChecking your internet connection usually fixes the problem.\n\n**No worries though!** In the meantime, we'll use the latitude/longitude you've specified in the Night-Light package settings.",
              {
                'detail': "Error Code: "+ error.code,
                'dismissable': true
              });
              reject(Error(error));
            }
          }
        });
      }
    });
},

  updateSunriseSunset(location) {
    if(atom.config.get('night-light.schedule.auto')) {
      noonToday = new Date().setHours("12");
      console.log("now: ");
      console.log(noonToday);
      var SunCalc = require('suncalc');
      var solar = SunCalc.getTimes(noonToday,location.lat, location.lng);
      this.sunrise = solar.sunrise;
      console.log(solar);
      console.log(solar.sunrise);
      this.sunset = solar.sunset;
      atom.config.set('night-light.schedule.end', this.sunrise);
      atom.config.set('night-light.schedule.start', this.sunset);
    } else {
      var sunriseValues = atom.config.get('night-light.schedule.end').split(":");
      this.sunrise = new Date();
      this.sunrise.setHours(sunriseValues[0]);
      this.sunrise.setMinutes(sunriseValues[1]);

      var sunsetValues = atom.config.get('night-light.schedule.start').split(":");
      this.sunset = new Date();
      this.sunset.setHours(sunsetValues[0]);
      this.sunset.setMinutes(sunsetValues[1]);
    }

  },
  tick() {
    console.log('tick!');
    // Get the current date and time
    now = new Date();
    console.log(now.getDate());
    console.log(this.lastRefresh);
    // Check if the day has changed since sun times last retrieved
    if (now.getDate() != this.lastRefresh) {
      console.log("Day changed!");
      this.updateLocation().then(this.updateSunriseSunset);
      this.lastRefresh = now.getDate();
    } else {
      console.log("Day is still the same");
    }
    console.log(now);
    console.log(this.sunrise);
    console.log(this.sunset);

    // Check if we've passed either sunset or sunrise
    if (now >= this.sunset) {
      this.night = true;
      setTheme(getNightThemes());
    } else if (now >= this.sunrise) {
      this.night = false;
      setTheme(getDayThemes());
    }
  }
};
