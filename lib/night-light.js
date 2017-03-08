'use babel';

import config from './config.json';
import { CompositeDisposable } from 'atom';

function getNightThemes() {
  return [atom.config.get("night-light.Night.ui"), atom.config.get("night-light.Night.syntax")];
}
function getDayThemes() {
  return [atom.config.get("night-light.Day.ui"), atom.config.get("night-light.Day.syntax")];
}

function addAvailableThemes(config) {
  atom.themes.getLoadedThemeNames().map((theme) => {
    if(/.*-ui$/.test(theme)) {
      config.Night.properties.ui.enum.push(theme);
      config.Day.properties.ui.enum.push(theme);
    } else if (/.*syntax$/.test(theme)) {
      config.Night.properties.syntax.enum.push(theme);
      config.Day.properties.syntax.enum.push(theme);
    }
  });
  return config;
}

function setTheme(newTheme) {
  atom.config.set("core.themes", newTheme);
}

export default {

  config: addAvailableThemes(config),
  subscriptions: null,
  sunrise: null,
  sunset: null,
  night: false,

  activate(state) {
    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();
    // Register the toggle command
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'night-light:toggle': () => this.toggle()
    }));
    if(atom.config.get("night-light.Schedule.auto")) {
      // get sunrise/sunset values here
    } else {
      this.sunrise = atom.config.get("night-light.Schedule.end");
      this.sunset = atom.config.get("night-light.Schedule.start");
    }

    //TODO: set listeners for time and auto settings
    atom.config.observe('night-light.Schedule.start', (value) => {

    });
    atom.config.observe('night-light.Schedule.end', (value) => {

    });
    setInterval(this.tick, 60000)
  },

  deactivate() {
    this.subscriptions.dispose();
  },

  serialize() {
    return {
      "sunrise": this.sunrise,
      "sunset": this.sunset,
      "themes": {
        "night": getNightThemes(),
        "day": getDayThemes()
      }
    };
  },

  toggle() {
    this.night = !this.night;
    this.night ? setTheme(getNightThemes()) : setTheme(getDayThemes());
  },

  tick() {
    now = new Date()

  }
};
