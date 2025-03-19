class CookieManager {
    static DEFAULT_TRIGGER_VALUE = 'PHPSTORM'

    getCookie(name) {
        return document.cookie
            .split(';')
            .find(cookie => cookie.trim().startsWith(`${name}=`))
            ?.split('=')[1]
    }

    setCookie(name, value, days = 365) {
        document.cookie = `${name}=${value};expires=${new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString()};path=/`
    }

    getStatusMap(settings) {
        const { xdebugDebugTrigger, xdebugTraceTrigger, xdebugProfileTrigger } = settings;
        return {
            1: { name: 'XDEBUG_SESSION', trigger: xdebugDebugTrigger },
            2: { name: 'XDEBUG_PROFILE', trigger: xdebugProfileTrigger },
            3: { name: 'XDEBUG_TRACE', trigger: xdebugTraceTrigger },
        };
    }

    async fetchSettings() {
        return new Promise(resolve => {
            chrome.storage.local.get({
                xdebugDebugTrigger: xDebug.DEFAULT_TRIGGER_VALUE,
                xdebugTraceTrigger: xDebug.DEFAULT_TRIGGER_VALUE,
                xdebugProfileTrigger: xDebug.DEFAULT_TRIGGER_VALUE
            }, resolve);
        });
    }

    deleteCookie(name) {
        this.setCookie(name, '', -1);
    }

    async getCurrentStatus() {
        const settings = await this.fetchSettings();
        const statusMap = this.getStatusMap(settings);
        for (const [idx, { name, trigger }] of Object.entries(statusMap)) {
            if (this.getCookie(name) === trigger) {
                return +idx;
            }
        }
        return 0;
    }

    async setStatus(status) {
        const settings = await this.fetchSettings();
        const statusMap = this.getStatusMap(settings);
        for (const { name } of Object.values(statusMap)) {
            this.deleteCookie(name);
        }
        if (status && statusMap[status]) {
            const { name, trigger } = statusMap[status];
            this.setCookie(name, trigger);
        }
        return;
    }
}

// Listens for messages from the background script
chrome.runtime.onMessage.addListener(async (msg, _, res) => {
    switch (msg.cmd) {
        case 'getStatus':
            const status = await CookieManager.getCurrentStatus();
            res({ status })
            break;
        case 'setStatus':
            await CookieManager.setStatus(msg.status);
            res({ status: msg.status })
            break;
        default:
            res({ status: 0 });
            break;
    }
    return true;
});
