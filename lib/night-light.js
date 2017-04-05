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

var sunrise = null;
var sunset = null;
var lat = null;
var lng = null;

export default {

  config: addAvailableThemes(require('./config.json')),
  subscriptions: null,
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
    setInterval(this.tick, 10000);
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
    // Returns a promise so updateSunriseSunset() will only run after updateLocation finishes
    return new Promise(function(resolve, reject) {
      var request = require('request');
      // If Auto-update location is true, then grab the updated location info
      if(atom.config.get('night-light.location.auto')) {
        request(MAPS_API, (error, response, body) => {
          if (!error && response.statusCode == 200) {
            json = JSON.parse(body);
            atom.config.set('night-light.location.lat', json.location.lat);
            atom.config.set('night-light.location.lng', json.location.lng);
            lat = json.location.lat;
            lng = json.location.lng;
            resolve(json.location);
          } else if (error) {
            atom.notifications.addWarning("#### night-light: There was an error with automatically updating your location :/\n\nChecking your internet connection usually fixes the problem.\n\n**No worries though!** In the meantime, we'll use the latitude/longitude you've specified in the Night-Light package settings.",
            {
              'detail': "Error Code: "+ error.code,
              'dismissable': true
            });
            // No worries, just use default sunrise/sunset
            lat = atom.config.get('night-light.location.lat');
            lng = atom.config.get('night-light.location.lng');
            resolve({lat: lat, lng:lng});
          }
        });
        } else {
          // No worries, just use default sunrise/sunset
          lat = atom.config.get('night-light.location.lat');
          lng = atom.config.get('night-light.location.lng');
          resolve({lat: lat, lng:lng});
        }
      });
  },

  updateSunriseSunsetTimes(location) {
    if(atom.config.get('night-light.schedule.auto')) {
      noonToday = new Date().setHours("12");
      console.log(noonToday);
      var SunCalc = require('suncalc');
      var solar = SunCalc.getTimes(noonToday,location.lat, location.lng);
      sunrise = solar.sunrise;
      sunset = solar.sunset;
      console.log(sunset);
      atom.config.set('night-light.schedule.end', String(solar.sunrise.getHours())+":"+String(solar.sunrise.getMinutes()));
      atom.config.set('night-light.schedule.start', String(solar.sunset.getHours())+":"+String(solar.sunset.getMinutes()));
    } else {
      var sunriseValues = atom.config.get('night-light.schedule.end').split(":");
      sunrise = new Date();
      sunrise.setHours(sunriseValues[0]);
      sunrise.setMinutes(sunriseValues[1]);

      var sunsetValues = atom.config.get('night-light.schedule.start').split(":");
      sunset = new Date();
      sunset.setHours(sunsetValues[0]);
      sunset.setMinutes(sunsetValues[1]);
    }
    return {sunrise: solar.sunrise, sunset: solar.sunset};

  },
  checkThemes(times){
    console.log(sunset);
    console.log(sunrise);
    console.log(now);
    // Check if we've passed either sunset or sunrise
    if (now >= times.sunset) {
      console.log("past sunset");
      this.night = true;
      setTheme(getNightThemes());
    } else if (now >= sunrise) {
      console.log("past sunrise");
      this.night = false;
      setTheme(getDayThemes());
    }
  },

  tick() {
    now = new Date();
    // Check if the day has changed since sun times last retrieved
    if ((now.getDate() != this.lastRefresh)) {
      console.log("refreshing");
      this.updateLocation().then(this.updateSunriseSunsetTimes).then(this.checkThemes);
      this.lastRefresh = now.getDate();
    } else {
      this.checkThemes({sunrise: atom.config.get('night-light.schedule.end'), sunset: atom.config.get('night-light.schedule.start')});
    }
  }
};
