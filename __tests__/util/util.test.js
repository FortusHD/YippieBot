/* eslint no-undef: 0*/

const util = require('../../src/util/util');

describe('formatDuration', () => {
    const testCases = [[120, '2:00'], [33, '0:33'], [1, '0:01'], [0, '0:00'], [333, '5:33']];

    test.each(testCases)('converts %i seconds to %s', (seconds, expected) => {
        expect(util.formatDuration(seconds)).toBe(expected);
    });
});

