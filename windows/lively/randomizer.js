"use strict";

// Each shuffled round includes every available theme. A round never starts
// with the theme that ended the previous one.
class ThemeRotation {
    constructor(themes, onChange, timers = {}) {
        this.themes = [...themes];
        this.onChange = onChange;
        this.now = timers.now || (() => performance.now());
        this.schedule = timers.setTimeout || ((callback, delay) => setTimeout(callback, delay));
        this.cancel = timers.clearTimeout || (timer => clearTimeout(timer));
        this.random = timers.random || Math.random;
        this.enabled = false;
        this.paused = false;
        this.current = null;
        this.intervalMs = 5 * 60000;
        this.remainingMs = this.intervalMs;
        this.bag = [];
        this.timer = null;
        this.due = null;
        this.timerEpoch = 0;
    }

    setCurrent(theme) {
        this.current = theme;
    }

    configure(enabled, minutes) {
        const number = Number(minutes);
        const interval = Math.round(Math.min(30, Math.max(1, Number.isFinite(number) ? number : 5))) * 60000;
        const wasEnabled = this.enabled;
        const changed = this.intervalMs !== interval;
        // Lively may replay unchanged properties while the desktop is active.
        // Keep the existing deadline rather than cancelling and rearming it.
        if (this.enabled === Boolean(enabled) && !changed) return;
        this.stop();
        this.enabled = Boolean(enabled);
        this.intervalMs = interval;
        if (!this.enabled) {
            this.bag = [];
            this.remainingMs = interval;
            return;
        }
        if (!wasEnabled || changed) this.remainingMs = interval;
        if (!wasEnabled) {
            this.bag = [];
            this.choose();
        }
        this.start();
    }

    setPaused(paused) {
        if (this.paused === Boolean(paused)) return;
        this.stop();
        this.paused = Boolean(paused);
        this.start();
    }

    choose() {
        if (!this.themes.length) return;
        if (!this.bag.length) {
            this.bag = [...this.themes];
            for (let i = this.bag.length - 1; i > 0; --i) {
                const j = Math.floor(this.random() * (i + 1));
                [this.bag[i], this.bag[j]] = [this.bag[j], this.bag[i]];
            }
            const last = this.bag.length - 1;
            if (last > 0 && this.bag[last] === this.current) {
                [this.bag[0], this.bag[last]] = [this.bag[last], this.bag[0]];
            }
        }
        this.current = this.bag.pop();
        this.onChange(this.current);
    }

    stop() {
        ++this.timerEpoch;
        if (this.timer === null) return;
        this.cancel(this.timer);
        this.remainingMs = Math.max(0, this.due - this.now());
        this.timer = null;
        this.due = null;
    }

    start() {
        if (!this.enabled || this.paused || this.timer !== null) return;
        this.due = this.now() + this.remainingMs;
        const epoch = ++this.timerEpoch;
        this.timer = this.schedule(() => {
            if (epoch !== this.timerEpoch || !this.enabled || this.paused) return;
            if (!this.checkDue()) {
                // A timer can fire slightly early; wait out its remaining time.
                this.stop();
                this.start();
            }
        }, this.remainingMs);
    }

    checkDue() {
        if (!this.enabled || this.paused || this.due === null || this.now() < this.due) return false;
        this.stop();
        this.remainingMs = this.intervalMs;
        this.choose();
        this.start();
        return true;
    }

    remaining() {
        return this.due === null ? this.remainingMs : Math.max(0, this.due - this.now());
    }
}
