/**
 * digest.job.test.js
 *
 * Tests for initDigestJobs — verifies digest jobs are registered as
 * UTC cron schedules with the expected patterns.
 */

jest.mock('node-cron', () => ({
    schedule: jest.fn(),
}));

const cron = require('node-cron');
const { initDigestJobs } = require('../../jobs/digest.job');

describe('initDigestJobs', () => {
    let savedNodeEnv;

    beforeEach(() => {
        savedNodeEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'staging';
        cron.schedule.mockClear();
    });

    afterEach(() => {
        process.env.NODE_ENV = savedNodeEnv;
    });

    it('registers 3 cron schedules', () => {
        initDigestJobs();
        expect(cron.schedule).toHaveBeenCalledTimes(3);
    });

    it('schedules each job in UTC', () => {
        initDigestJobs();
        cron.schedule.mock.calls.forEach(([, , options]) => {
            expect(options).toEqual({ timezone: 'UTC' });
        });
    });

    it('uses the expected cron patterns', () => {
        initDigestJobs();
        const patterns = cron.schedule.mock.calls.map(([pattern]) => pattern);
        expect(patterns).toEqual(
            expect.arrayContaining(['0 8 * * *', '0 18 * * 0', '0 9 * * *'])
        );
    });

    it('does not schedule jobs in the test environment', () => {
        process.env.NODE_ENV = 'test';
        initDigestJobs();
        expect(cron.schedule).not.toHaveBeenCalled();
    });
});
