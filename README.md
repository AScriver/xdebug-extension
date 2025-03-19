## Installation

### Chromium (Chrome, Brave, Edge, etc...)

From source

1) Clone the `xdebug-extension` repository
2) Go to `chrome://extensions/`
3) Turn on "Developer Mode"
4) Choose "Load unpacked extension"
5) select the `src` directory inside the `xdebug-extension` directory you downloaded in step one.

### Firefox

From source

1) Clone the `xdebug-extension` repository
2) Run the build file: `.\build.ps1`
3) Navigate to `about:debugging#/runtime/this-firefox`
4) Choose "Load Temporary Add-on…"
5) Select the `xdebug-extension@[version].xpi` file in the `xdebug-extension/build` directory.

## Usage

Once installed, you can:

- Toggle the popup with (default: <kbd>Alt</kbd>+<kbd>X</kbd>) or by clicking the extension icon.
- Toggle debugging with a shortcut (default: <kbd>Alt</kbd>+<kbd>C</kbd>) or from the popup menu.
- Toggle profiling with a shortcut (default: <kbd>Alt</kbd>+<kbd>V</kbd>) or from the popup menu.
- Toggle tracing with a shortcut (default: <kbd>Alt</kbd>+<kbd>B</kbd>) or from the popup menu.
- Click the extension icon to open the popup menu and select a debugging state: Debug, Profile, Trace, or Disable.
- Clink the "options" link in the popup to configure the IDE key, profile trigger, and trace trigger. Alternatively, right click the extension icon and choose "Options".

### Custom shortcuts

#### Chrome

1) shortcuts can be configured via `chrome://extensions/shortcuts`

#### FireFox

1) Click the menu button
2) Click Add-ons and themes
3) Select Extensions.
4) Click the Tools for all add-ons cogwheel.
5) Click `Manage Extension Shortcuts` in the menu.

#### Edge

1) shortcuts can be configured via `edge://extensions/shortcuts`

