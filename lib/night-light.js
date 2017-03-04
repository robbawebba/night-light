'use babel';

import NightLightView from './night-light-view';
import { CompositeDisposable } from 'atom';

export default {

  nightLightView: null,
  modalPanel: null,
  subscriptions: null,

  activate(state) {
    this.nightLightView = new NightLightView(state.nightLightViewState);
    this.modalPanel = atom.workspace.addModalPanel({
      item: this.nightLightView.getElement(),
      visible: false
    });

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'night-light:toggle': () => this.toggle()
    }));
  },

  deactivate() {
    this.modalPanel.destroy();
    this.subscriptions.dispose();
    this.nightLightView.destroy();
  },

  serialize() {
    return {
      nightLightViewState: this.nightLightView.serialize()
    };
  },

  toggle() {
    console.log('NightLight was toggled!');
    return (
      this.modalPanel.isVisible() ?
      this.modalPanel.hide() :
      this.modalPanel.show()
    );
  }

};
