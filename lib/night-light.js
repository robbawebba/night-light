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

export default {

  config: addAvailableThemes(config),
  subscriptions: null,
  sunrise: null,
  sunset: null,

  activate(state) {
    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'night-light:toggle': () => this.toggle()
    }));
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
    console.log('NightLight was toggled!');

  },
};
