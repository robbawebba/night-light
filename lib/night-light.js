'use babel';

import { CompositeDisposable } from 'atom';

const MAPS_API = 'https://maps.googleapis.com/maps/api/browserlocation/json?browser=chromium&sensor=true'

function getNightThemes() {
  return [atom.config.get("night-light.night.ui"), atom.config.get("night-light.night.syntax")];
}
function getDayThemes() {
  return [atom.config.get("night-light.day.ui"), atom.config.get("night-light.day.syntax")];
}
function equal(theme1, theme2) {
  return (theme1[1] == theme2[1]) && (theme1[0] == theme2[0]);
}
// middleware for adding installed themes to package config dropdown menus
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
// Helper function for changing editor themes: uses format ["ui", "syntax"]
function setTheme(newTheme) {
  console.log("setTheme");
  atom.config.set('core.themes', newTheme);
}

/** CONFIG CALLBACK FUNCTIONS
* These callbacks will help keep the package and core theme settings consistent
*/
// callback for observing night-light.day
function packageDayThemesChange(newTheme) {
  console.log("packageDayThemesChange");
  var theme = [newTheme.ui, newTheme.syntax]
  if (!packageState.night) {
    if (packageState.manualNight) return;
    setTheme(theme);
  } else if (packageState.night && packageState.manualDay) {
      setTheme(theme);
  }
}
// callback for observing night-light.night
function packageNightThemesChange(newTheme) {
    console.log("packageNightThemesChange");
  var theme = [newTheme.ui, newTheme.syntax]
  if (packageState.night) {
    if (packageState.manualDay) return;
    setTheme(theme);
  } else if (!packageState.night && packageState.manualNight) {
    setTheme(theme);
  }
}

// callback for observing night-light.location
function locationChange({newValue: {auto,lat,lng}}) {
  if (!auto) {
    main.updateSunriseSunsetTimes({lat, lng}).then(main.checkThemes);
  } else if (auto) {
    main.updateLocation().then(main.updateSunriseSunsetTimes).then(main.checkThemes);
  }
}
// Package State
let packageState = {
  sunrise: null,
  sunset: null,
  lat: null,
  lng: null,
  night: false,
  manualNight: false,
  manualDay: false,
  lastRefresh: 0
}

// main module
export default {
  config: addAvailableThemes(require('./config.json')),
  subscriptions: null,

  activate(state) {
    console.log("State: ");
    console.log(state);
    if (state) {
      for (var key in state) {
        console.log(key)
        packageState[key] = state[key];
      }

    }
    console.log(packageState)
    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();
    // Register the toggle command
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'night-light:toggle': () => this.toggle()
    }),
      atom.config.observe('night-light.day', packageDayThemesChange),
      atom.config.observe('night-light.night', packageNightThemesChange),
      atom.config.onDidChange('night-light.location', locationChange)
    );

    this.tick = this.tick.bind(this);

    setTimeout(this.tick, 500); // for initialization
    setInterval(this.tick, 60000);
  },

  deactivate() {
    this.subscriptions.dispose();
  },

  serialize() {
    console.log("serializing...");
    var serialized = {
      sunrise,
      sunset,
      lat,
      lng,
      night,
      manualNight,
      manualDay,
      lastRefresh
    } = packageState
    console.log(serialized)
    return serialized;
  },
  // manually switch between appearances for different times of day
  toggle() {
    if (packageState.night) {
      packageState.manualDay = !packageState.manualDay;
      packageState.manualDay ? setTheme(getDayThemes()) : setTheme(getNightThemes());
    } else if (!packageState.night) {
      packageState.manualNight = !packageState.manualNight;
      packageState.manualNight ? setTheme(getNightThemes()) : setTheme(getDayThemes());
    }
  },
  // Check lat/lng or get the pre-configured coordinates
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
            packageState.lat = json.location.lat;
            packageState.lng = json.location.lng;
            resolve(json.location);
          } else if (error) {
            atom.notifications.addWarning("night-light: There was an error with automatically updating your location",
            {
              'detail': "Checking your internet connection usually fixes the problem.\n\nNo worries though! In the meantime, we'll use the latitude/longitude you've specified in the Night-Light package settings.",
              'description': "Error Code: "+ error.code,
              'dismissable': true
            });
            // No worries, just use default sunrise/sunset
            packageState.lat = atom.config.get('night-light.location.lat');
            packageState.lng = atom.config.get('night-light.location.lng');
            resolve({lat: packageState.lat, lng:packageState.lng});
          }
        });
        } else {
          // No worries, just use default sunrise/sunset
          packageState.lat = atom.config.get('night-light.location.lat');
          lng = atom.config.get('night-light.location.lng');
          resolve({lat: packageState.lat, lng:lng});
        }
      });
  },
  // Get sunrise and sunset times based on the given lat/lng
  updateSunriseSunsetTimes(location) {
    return new Promise(function(resolve, reject) {
      if(atom.config.get('night-light.schedule.auto')) {
        noonToday = new Date().setHours("12");
        var SunCalc = require('suncalc');
        var solar = SunCalc.getTimes(noonToday,location.lat, location.lng);
        packageState.sunrise = solar.sunrise;
        packageState.sunset = solar.sunset;
        atom.config.set('night-light.schedule.end', String(solar.sunrise.getHours())+":"+String(solar.sunrise.getMinutes()));
        atom.config.set('night-light.schedule.start', String(solar.sunset.getHours())+":"+String(solar.sunset.getMinutes()));
      } else {
        var sunriseValues = atom.config.get('night-light.schedule.end').split(":");
        packageState.sunrise = new Date();
        packageState.sunrise.setHours(sunriseValues[0]);
        packageState.sunrise.setMinutes(sunriseValues[1]);

        var sunsetValues = atom.config.get('night-light.schedule.start').split(":");
        packageState.sunset = new Date();
        packageState.sunset.setHours(sunsetValues[0]);
        packageState.sunset.setMinutes(sunsetValues[1]);
      }
      resolve({sunrise: solar.sunrise, sunset: solar.sunset});
    });
  },
  checkThemes(times){
    now = new Date();
    // Check if we've passed either sunset or sunrise
    if (now >= times.sunset || now < times.sunrise) {
      packageState.night = true;
      packageState.manualNight = false;
      if (packageState.manualDay) return;
      setTheme(getNightThemes());
    } else if (now >= times.sunrise) {
      packageState.night = false;
      packageState.manualDay = false;
      console.log(packageState.manualNight)
      if (packageState.manualNight) return;
      setTheme(getDayThemes());
    }
  },

  tick() {
    now = new Date();
    // Check if the day has changed since sun times last retrieved
    if ((now.getDate() != packageState.lastRefresh)) {
      this.updateLocation().then(this.updateSunriseSunsetTimes).then(this.checkThemes);
      packageState.lastRefresh = now.getDate();
    } else {
      this.checkThemes({sunrise, sunset} = packageState);
    }
  }
};
