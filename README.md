# Night Light
## Heliocentrism where it matters most.
Night Light automatically updates your Atom themes with each sunrise and sunset to help reduce eyestrain while you're hard at work!
![night-light](https://cloud.githubusercontent.com/assets/10067384/24683545/bed6aec4-196d-11e7-9d89-0182b7e73a7a.png)

## Features
#### :round_pushpin: Automatic or manual location updating
* Let Night Light automatically determine your location for you, or provide a custom latitude and longitude to determine sunrise and sunset times.

#### :alarm_clock: Automatic or custom scheduling
* Let Night Light automatically switch themes for you at sunrise and sunset each day, or provide your own times to switch themes.

#### :sunny: Customizable UI and syntax themes for day and night
* Customize your daytime and nighttime appearances based on your installed UI and syntax themes.

#### :computer: Manually switch between themes
* Use `Ctrl + Alt + m` to manually toggle between nighttime and daytime themes at your leisure, or create your own keybinding in your keymap.

## Installing Night Light
* From the command line: `apm install night-light`.
* From inside Atom: Go to `File > Settings > Install`, type "night-light" into the search box, and click install!

## Development
#### Quick and dirty setup

`apm develop night-light`

This will clone the night-light repository to `~/github` unless you set the `ATOM_REPOS_HOME` environment variable to a different path.

#### I've already forked it!

If you've already forked the repo and cloned it somewhere else, you'll want to use `apm link --dev` within the package directory, followed by `apm install` to get dependencies.

#### Workflow
Feel free to fork this project and clone your fork for developing! **Hint**: Add the original repo as a remote to pull upstream changes:
```
git remote add upstream https://github.com/robbawebba/night-light.git
git pull upstream develop
```

After pulling upstream changes, run `apm update` and `atom --dev` to start working in dev mode.

To start hacking, create a new branch for your work then submit a Pull Request when done or when you want some feedback! Thank you in advance for your work! It's greatly appreciated :)
