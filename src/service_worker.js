class XdebugExtension {
    static DEFAULT_TRIGGER_VALUE = 'PHPSTORM';

    static iconMap = {
        0: { title: 'Disabled', image: 'img/disable16.png' },
        1: { title: 'Debugging', image: 'img/debug16.png' },
        2: { title: 'Profiling', image: 'img/profile16.png' },
        3: { title: 'Tracing', image: 'img/trace16.png' },
    }

    getSettings = async () => {
        return new Promise((resolve, reject) => {
            chrome.storage.local.get(
                {
                    xdebugDebugTrigger: this.DEFAULT_TRIGGER_VALUE,
                    xdebugTraceTrigger: this.DEFAULT_TRIGGER_VALUE,
                    xdebugProfileTrigger: this.DEFAULT_TRIGGER_VALUE,
                },
                (settings) => {
                    if (chrome.runtime.lastError) {
                        return reject(new Error(chrome.runtime.lastError));
                    }
                    resolve(settings);
                }
            );
        })
    }

    getTab = async () => {
        try {
            const [tab] = await chrome.tabs.query({
                active: true,
                lastFocusedWindow: true,
            });
            return tab;
        } catch (error) {
            console.error('Error getting active tab:', error);
            return null;
        }
    }

    updateIcon = (status, tabId) => {
        const iconInfo = this.iconMap[status] ?? this.iconMap[0];
        chrome.action.setTitle({ tabId, title: iconInfo.title });
        chrome.action.setIcon({ tabId, path: iconInfo.image });
    }

    handleTabUpdated = async (tabId, changeInfo, tab) => {
        if ((changeInfo?.status || tab?.status) !== 'complete') return;

        try {
            const {
                xdebugDebugTrigger,
                xdebugTraceTrigger,
                xdebugProfileTrigger,
            } = await this.getSettings();
            const response = await chrome.tabs.sendMessage(tabId, {
                cmd: 'getStatus',
                debugTrigger: xdebugDebugTrigger,
                traceTrigger: xdebugTraceTrigger,
                profileTrigger: xdebugProfileTrigger,
            });
            this.updateIcon(response?.status, tabId);
        } catch (error) {
            console.error('Error during tab update:', error);
        }
    }

    handleCommand = async (command) => {
        try {
            const tab = await this.getTab();
            if (!tab) return;

            const settings = await this.getSettings();
            const response = await chrome.tabs.sendMessage(tab.id, {
                cmd: 'getStatus',
                debugTrigger: settings.xdebugDebugTrigger,
                traceTrigger: settings.xdebugTraceTrigger,
                profileTrigger: settings.xdebugProfileTrigger,
            });

            let newState;
            switch (command) {
                case 'run-toggle-debug':
                    newState = response?.status === 1 ? 0 : 1;
                    break;
                case 'run-toggle-profile':
                    newState = response?.status === 2 ? 0 : 2;
                    break;
                case 'run-toggle-trace':
                    newState = response?.status === 3 ? 0 : 3;
                    break;
                default:
                    return; // Ignore unknown commands.
            }

            const setResponse = await chrome.tabs.sendMessage(tab.id, {
                cmd: 'setStatus',
                status: newState,
                debugTrigger: settings.xdebugDebugTrigger,
                traceTrigger: settings.xdebugTraceTrigger,
                profileTrigger: settings.xdebugProfileTrigger,
            });
            this.updateIcon(setResponse?.status, tab.id);
        } catch (error) {
            console.error('Error during command execution:', error);
        }
    }

    handleMessage = async (request, sender, sendResponse) => {
        if (request.cmd !== 'setStatus') return;

        try {
            const settings = await this.getSettings();
            const tab = await this.getTab();
            if (!tab) return;

            const response = await chrome.tabs.sendMessage(tab.id, {
                cmd: 'setStatus',
                status: request.status,
                debugTrigger: settings.xdebugDebugTrigger,
                traceTrigger: settings.xdebugTraceTrigger,
                profileTrigger: settings.xdebugProfileTrigger,
            });
            this.updateIcon(response?.status, tab.id);
        } catch (error) {
            console.error('Error during setStatus:', error);
        }
    }

    registerEventListeners = () => {
        chrome.tabs.onUpdated.addListener(this.handleTabUpdated);
        chrome.commands.onCommand.addListener(this.handleCommand);
        chrome.runtime.onMessage.addListener(this.handleMessage);
    };
}

// Instantiate and initialize the extension.
const xdebugExtension = new XdebugExtension();
xdebugExtension.registerEventListeners();
