/* ============================================================
   THE DAILIES — 7-SEGMENT COUNTDOWN CLOCK
   A DIY tech clock component with CSS-rendered LED segments
   ============================================================ */

class SegmentClock {
    /* Which of the 7 segments (a–g) are ON for each digit 0–9
       Segment layout:
        aaaa
       f    b
       f    b
        gggg
       e    c
       e    c
        dddd                                                    */
    static SEGMENTS = {
        0: [1, 1, 1, 1, 1, 1, 0],
        1: [0, 1, 1, 0, 0, 0, 0],
        2: [1, 1, 0, 1, 1, 0, 1],
        3: [1, 1, 1, 1, 0, 0, 1],
        4: [0, 1, 1, 0, 0, 1, 1],
        5: [1, 0, 1, 1, 0, 1, 1],
        6: [1, 0, 1, 1, 1, 1, 1],
        7: [1, 1, 1, 0, 0, 0, 0],
        8: [1, 1, 1, 1, 1, 1, 1],
        9: [1, 1, 1, 1, 0, 1, 1],
    };

    static SEG_NAMES = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];

    /* h = horizontal segment, v = vertical segment */
    static SEG_TYPES = {
        a: 'h', b: 'v', c: 'v', d: 'h', e: 'v', f: 'v', g: 'h',
    };

    constructor(containerEl) {
        this.container = containerEl;
        this.digits = [];
        this.colons = [];
        this.blinkState = true;
        this.lastDate = new Date().getDate();
        this.build();
        this.start();
    }

    build() {
        const clockCase = document.createElement('div');
        clockCase.className = 'clock-case';

        /* "NEXT RESET" label etched on the clock face */
        const label = document.createElement('div');
        label.className = 'clock-label';
        label.textContent = 'RESET';
        clockCase.appendChild(label);

        /* Display row: HH : MM : SS */
        const display = document.createElement('div');
        display.className = 'clock-display';

        this.digits.push(this.createDigit(display));
        this.digits.push(this.createDigit(display));
        this.colons.push(this.createColon(display));
        this.digits.push(this.createDigit(display));
        this.digits.push(this.createDigit(display));
        this.colons.push(this.createColon(display));
        this.digits.push(this.createDigit(display));
        this.digits.push(this.createDigit(display));

        clockCase.appendChild(display);
        this.container.appendChild(clockCase);
    }

    createDigit(parent) {
        const digit = document.createElement('div');
        digit.className = 'clock-digit';

        const segs = {};
        for (const name of SegmentClock.SEG_NAMES) {
            const seg = document.createElement('span');
            seg.className = `seg seg-${SegmentClock.SEG_TYPES[name]} seg-${name} off`;
            digit.appendChild(seg);
            segs[name] = seg;
        }

        parent.appendChild(digit);
        return segs;
    }

    createColon(parent) {
        const colon = document.createElement('div');
        colon.className = 'clock-colon';

        for (let i = 0; i < 2; i++) {
            const dot = document.createElement('span');
            dot.className = 'clock-colon-dot';
            colon.appendChild(dot);
        }

        parent.appendChild(colon);
        return colon;
    }

    setDigitValue(digitSegs, value) {
        const pattern = SegmentClock.SEGMENTS[value];
        SegmentClock.SEG_NAMES.forEach((name, i) => {
            const seg = digitSegs[name];
            if (pattern[i]) {
                seg.classList.remove('off');
                seg.classList.add('on');
            } else {
                seg.classList.remove('on');
                seg.classList.add('off');
            }
        });
    }

    update() {
        const now = new Date();

        /* Detect day change → fire reset event */
        const currentDate = now.getDate();
        if (currentDate !== this.lastDate) {
            this.lastDate = currentDate;
            window.dispatchEvent(new CustomEvent('dailyreset'));
        }

        /* Time remaining until next midnight */
        const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        const diff = tomorrow - now;

        const h = String(Math.floor(diff / 3600000)).padStart(2, '0');
        const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
        const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');

        this.setDigitValue(this.digits[0], parseInt(h[0]));
        this.setDigitValue(this.digits[1], parseInt(h[1]));
        this.setDigitValue(this.digits[2], parseInt(m[0]));
        this.setDigitValue(this.digits[3], parseInt(m[1]));
        this.setDigitValue(this.digits[4], parseInt(s[0]));
        this.setDigitValue(this.digits[5], parseInt(s[1]));

        /* Blink the colons every second */
        this.blinkState = !this.blinkState;
        this.colons.forEach(colon => {
            colon.classList.toggle('blink-off', this.blinkState);
        });
    }

    start() {
        this.update();
        setInterval(() => this.update(), 1000);
    }
}
