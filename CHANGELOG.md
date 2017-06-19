## 1.0.3 - 19 June 2017 
This update addresses a number of bugs with the previous release. Sorry about that! As always, feel free to report an issue if you notice something wrong. Thanks! :smile:

###### Bug Fixes
* Fixed an issue where some themes (such as base16) were missing from the package settings (PR [#12](https://github.com/robbawebba/night-light/pull/12))
* Fixed a bug where `main` was undefined in `locationChange()` (PR [#12](https://github.com/robbawebba/night-light/pull/12))
* Converted `config.json` to a commonJS module in `config.js` (PR [#12](https://github.com/robbawebba/night-light/pull/12))

## 1.0.2 - 15 June 2017 
Although I haven't heard from any users on this issue, I noticed with my last update that the package settings had reset to their default values after updating. I didn't anticipate this being an issue since the user's custom settings (Day and Night themes being the most important) are stored in their `config.cson` file. So this prompted me to add serialization to the package so certain data persists across Atom sessions. If anyone notices something funky with this update, could you please create an issue on the repository? Thanks! :smile:
###### Features 
* Adds package serialization to persist important data across sessions. (PRs [#8](https://github.com/robbawebba/night-light/pull/8) and [#10](https://github.com/robbawebba/night-light/pull/10))
* Removes the alert for any ENOENT errors since they were a little excessive. (PR [#9](https://github.com/robbawebba/night-light/pull/9))

###### Bug Fixes
* Package now observes any changes to the package location settings and updates themes accordingly. (PR [#6](https://github.com/robbawebba/night-light/pull/6))

## 1.0.1 - 1 May 2017 - First Patch!
This patch, although small, will hopefully improve the use of the package settings! It's been awhile since the release of this package, so I thought it would be a good time to release a patch :smile:
###### Bug Fixes
* Changes to the nighttime and daytime themes in package settings now update the editor themes accordingly (See PR [#5](https://github.com/robbawebba/night-light/pull/5))

###### Miscellaneous
* Update `README.md`
* Update `package.json` with new keywords

## 1.0.0 - 6 April 2017 - First public release!
###### Features
* **:round_pushpin: Automatic or manual location updating**

  Let Night Light automatically determine your location for you, or provide a custom latitude and longitude to determine sunrise and sunset times.
* **:alarm_clock: Automatic or custom scheduling**

  Let Night Light automatically switch themes for you at sunrise and sunset each day, or provide your own times to switch themes.

* **:sunny: Customizable UI and syntax themes for day and night**

  Customize your daytime and nighttime appearances based on your installed UI and syntax themes.

* **:computer: Manually switch between day and night modes**

  Use `Ctrl + Alt + m` to manually toggle between nighttime and daytime themes at your leisure, or create your own keybinding in your keymap.

###### Bug Fixes
* None (yet :wink:)
