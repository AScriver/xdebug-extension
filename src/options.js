class OptionsManager {
    static DEFAULT_TRIGGER_VALUE = 'PHPSTORM'

    constructor() {
        this.cacheElements();
        this.bindEvents();
    }

    // Class field declarations using arrow functions automatically bind "this"
    cacheElements = () => {
        this.optionsForm = document.querySelector('form');
        this.debugTriggerInput = document.getElementById('debugtrigger');
        this.traceTriggerInput = document.getElementById('tracetrigger');
        this.profileTriggerInput = document.getElementById('profiletrigger');
        this.helpDiv = document.getElementById('help');
        this.resetButton = document.querySelector('button[type="reset"]');
        this.submitButton = document.querySelector('button[type="submit"]');
    };

    bindEvents = () => {
        this.resetButton?.addEventListener('click', this.handleReset);
        this.submitButton?.addEventListener('click', this.handleSubmit);
    };

    handleReset = (event) => {
        event.preventDefault();
        this.debugTriggerInput.value = '';
        this.traceTriggerInput.value = '';
        this.profileTriggerInput.value = '';
    };

    handleSubmit = (event) => {
        event.preventDefault();
        chrome.storage.local.set({
            xdebugDebugTrigger: this.debugTriggerInput.value,
            xdebugTraceTrigger: this.traceTriggerInput.value,
            xdebugProfileTrigger: this.profileTriggerInput.value
        }, () => {
            this.optionsForm.classList.add('success');
            setTimeout(() => this.optionsForm.classList.remove('success'), 1500);
        });
    };

    loadSettings = async () => {
        try {
            const settings = await new Promise(resolve => {
                chrome.storage.local.get({
                    xdebugDebugTrigger: OptionsManager.DEFAULT_TRIGGER_VALUE,
                    xdebugTraceTrigger: null,
                    xdebugProfileTrigger: null,
                }, resolve);
            });
            this.debugTriggerInput.value = settings.xdebugDebugTrigger;
            this.traceTriggerInput.value = settings.xdebugTraceTrigger;
            this.profileTriggerInput.value = settings.xdebugProfileTrigger;
        } catch (err) {
            console.error('Error loading settings:', err);
        }
    };

    loadCommands = async () => {
        try {
            const commands = await new Promise(resolve => {
                chrome.commands.getAll(resolve);
            });
            // Clear existing command paragraphs using a for loop
            const paragraphs = this.helpDiv.querySelectorAll('p');
            for (let i = 0; i < paragraphs.length; i++) {
                paragraphs[i].remove();
            }

            if (!commands || commands.length === 0) {
                const p = document.createElement('p');
                p.textContent = 'No shortcuts defined';
                this.helpDiv.appendChild(p);
                return;
            }

            for (let i = 0; i < commands.length; i++) {
                const { shortcut, description } = commands[i];
                if (!shortcut) continue; // Skip commands without a shortcut

                const parts = shortcut.split('+');
                const p = document.createElement('p');

                for (let j = 0; j < parts.length; j++) {
                    const kbd = document.createElement('kbd');
                    kbd.textContent = parts[j];
                    p.appendChild(kbd);
                    if (j < parts.length - 1) {
                        p.appendChild(document.createTextNode(' + '));
                    }
                }

                const desc = description || chrome.i18n.getMessage("options_execute_action") || '';
                p.appendChild(document.createTextNode(' ' + desc));
                this.helpDiv.appendChild(p);
            }
        } catch (err) {
            console.error('Error loading commands:', err);
        }
    };

}

document.addEventListener('DOMContentLoaded', () => {
    const optionsManager = new OptionsManager();
    optionsManager.loadSettings();
    optionsManager.loadCommands();

});
