'use babel';

import { CompositeDisposable } from 'atom';

// Theme helpers
function getNightThemes() {
  return [atom.config.get("night-light.night.ui"), atom.config.get("night-light.night.syntax")];
}
function getDayThemes() {
  return [atom.config.get("night-light.day.ui"), atom.config.get("night-light.day.syntax")];
}
function equal(theme1, theme2) {
  return (theme1[1] == theme2[1]) && (theme1[0] == theme2[0]);
}
// Middleware function for adding installed themes to package config dropdown menus
function addAvailableThemes(config) {
  atom.themes.getLoadedThemes().map(({bundledPackage,name, metadata: {theme} }) => {
    if(bundledPackage){ // if it's a default theme,
      return // don't add to config (it's already there
    }
    if(theme === 'ui') { // Sort loaded UI Themes
      config.night.properties.ui.enum.push(name);
      config.day.properties.ui.enum.push(name);
    } else if (theme === 'syntax') { // Sord loaded syntax themes
      config.night.properties.syntax.enum.push(name);
      config.day.properties.syntax.enum.push(name);
    }
  });
  return config;
}
// Helper function for changing editor themes: uses format ["ui", "syntax"]
function setTheme(newTheme) {
  atom.config.set('core.themes', newTheme);
}

// Config callback functions
// These callbacks will help keep the package and core theme settings consistent
// callback for observing night-light.day
function packageDayThemesChange(newTheme) {
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
    main.updateLocationAndCheckThemes();
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
let main = {
  config: addAvailableThemes(require('./config.js')),
  subscriptions: null,

  activate(state) {
    if (state) { // Handle state from previous session
      for (var key in state) {
        if(key === 'dayThemes') {
          atom.config.set('night-light.day.ui',state.dayThemes[0])
          atom.config.set('night-light.day.syntax',state.dayThemes[1])
        } else if(key === 'nightThemes') {
          atom.config.set('night-light.night.ui',state.nightThemes[0])
          atom.config.set('night-light.night.syntax',state.nightThemes[1])
        } else {
          packageState[key] = state[key];
        }
      }
    }
    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();
    // Register the toggle command and config observations
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'night-light:toggle': () => this.toggle()
    }),
      atom.config.observe('night-light.day', packageDayThemesChange),
      atom.config.observe('night-light.night', packageNightThemesChange),
      atom.config.onDidChange('night-light.location', locationChange)
    );

    this.tick = this.tick.bind(this);
    this.geoSuccess = this.geoSuccess.bind(this);
    this.geoError = this.geoError.bind(this);

    const now = new Date()
    setTimeout(this.tick, 2000); // for initialization
    setInterval(this.tick, 10000);
  },

  deactivate() {
    this.subscriptions.dispose();
  },

  serialize() {
    const {
      sunrise,
      sunset,
      lat,
      lng,
      night,
      manualNight,
      manualDay,
      lastRefresh,
  } = packageState;
    const serialized = {sunset, sunrise, lat, lng, manualDay, manualNight, night, lastRefresh};
    serialized.dayThemes = getDayThemes(); // Add themes to serialized state
    serialized.nightThemes = getNightThemes();
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

  // update lat/lng or get the pre-configured coordinates
  updateLocationAndCheckThemes() {
      if (navigator.geolocation && atom.config.get('night-light.location.auto')) {
          navigator.geolocation.getCurrentPosition(this.geoSuccess, this.geoError)
      } else {
          geoError();
      }
  },

  geoSuccess(position) {
      const {latitude: lat, longitude: lng} = position.coords;
      atom.config.set('night-light.location.lat', json.location.lat);
      atom.config.set('night-light.location.lng', json.location.lng);
      packageState.lat = lat;
      packageState.lng = lng;
      this.updateSunriseSunsetTimes({lat, lng}).then(this.checkThemes);
  },
  geoError(error) {
      packageState.lat = atom.config.get('night-light.location.lat');
      packageState.lng = atom.config.get('night-light.location.lng');
      this.updateSunriseSunsetTimes({lat: packageState.lat, lng:packageState.lng}).then(this.checkThemes);
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
  // Checks whether the themes are set appropriately for the given times.
  checkThemes(times){
    const now = new Date();
    // Check if we've passed either sunset or sunrise
    if (now >= times.sunset || now < times.sunrise) {
      packageState.night = true;
      packageState.manualNight = false;
      if (packageState.manualDay) return;
      setTheme(getNightThemes());
    } else if (now >= times.sunrise) {
      packageState.night = false;
      packageState.manualDay = false;
      if (packageState.manualNight) return;
      setTheme(getDayThemes());
    }
  },

  // Main interval function that sets everything in motion
  tick() {
    const now = new Date();
    // Check if the day has changed since sun times last retrieved
    if ((now.getDate() != packageState.lastRefresh)) {
      this.updateLocationAndCheckThemes();
      packageState.lastRefresh = now.getDate();
    } else {
      this.checkThemes({sunrise, sunset} = packageState);
    }
  }
};

export default main;
