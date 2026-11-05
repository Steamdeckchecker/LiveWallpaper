const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const Rotation = vm.runInNewContext(fs.readFileSync(path.join(__dirname, 'randomizer.js'), 'utf8') + '\nThemeRotation;');

function fixture() {
    let now = 0, handle = 0;
    const pending = new Map(), chosen = [];
    const rotation = new Rotation(['a', 'b', 'c'], value => chosen.push(value), {
        now: () => now,
        setTimeout: (callback, delay) => { pending.set(++handle, {callback, delay}); return handle; },
        clearTimeout: id => pending.delete(id),
        random: () => 0.4
    });
    return {rotation, pending, chosen, at: value => { now = value; }};
}

{
    const f = fixture();
    f.rotation.configure(true, 1);
    const [handle, old] = [...f.pending][0];
    f.at(30000);
    f.rotation.configure(true, 1);
    assert.equal(f.pending.has(handle), true, 'Unchanged properties must retain the scheduled timer');
    assert.equal(f.rotation.remaining(), 30000);
    f.at(59999);
    assert.equal(f.rotation.checkDue(), false);
    f.at(60000);
    assert.equal(f.rotation.checkDue(), true, 'Animation watchdog must advance when a long timer is delayed');
    assert.equal(f.chosen.length, 2);
    assert.notEqual(f.chosen[0], f.chosen[1]);
    old.callback();
    assert.equal(f.chosen.length, 2, 'Late, cancelled callback must not cause a second switch');
    assert.equal(f.rotation.remaining(), 60000);
}
{
    const f = fixture();
    f.rotation.configure(true, 1);
    const early = [...f.pending.values()][0];
    f.at(59999);
    early.callback();
    assert.equal(f.chosen.length, 1);
    assert.equal([...f.pending.values()][0].delay, 1);
    f.at(60000);
    [...f.pending.values()][0].callback();
    assert.equal(f.chosen.length, 2, 'Early timer must wait only for the remaining millisecond');
}
{
    const f = fixture();
    f.rotation.configure(true, 1);
    const stale = [...f.pending.values()][0];
    f.at(20000);
    f.rotation.setPaused(true);
    assert.equal(f.rotation.remaining(), 40000);
    f.at(120000);
    assert.equal(f.rotation.checkDue(), false);
    stale.callback();
    assert.equal(f.chosen.length, 1);
    f.rotation.setPaused(false);
    f.at(159999);
    assert.equal(f.rotation.checkDue(), false);
    f.at(160000);
    assert.equal(f.rotation.checkDue(), true, 'Resume must preserve the remaining active time');
    f.rotation.configure(false, 1);
    f.at(900000);
    assert.equal(f.rotation.checkDue(), false);
}
{
    const f = fixture();
    f.rotation.configure(true, 1);
    f.at(10000);
    f.rotation.configure(true, 30);
    assert.equal(f.rotation.remaining(), 1800000);
    for (let i = 1; i < 15; ++i) {
        f.at(10000 + i * 1800000);
        assert.equal(f.rotation.checkDue(), true);
    }
    assert.ok(f.chosen.every((value, i) => !i || value !== f.chosen[i - 1]));
    for (let offset = 0; offset < f.chosen.length - 2; offset += 3) {
        assert.equal(new Set(f.chosen.slice(offset, offset + 3)).size, 3);
    }
}
console.log('PASS: delayed and early timers, unchanged settings, stale callbacks, remaining pause time and shuffle coverage');
