/**
 * digest.job.test.js
 *
 * Tests for initDigestJobs — verifies queue and worker names are valid
 * (no colons, which BullMQ v5 forbids as they clash with Redis key separators).
 */

jest.mock('bullmq', () => {
    const QueueMock = jest.fn().mockImplementation((name) => ({
        name,
        upsertJobScheduler: jest.fn().mockResolvedValue(undefined),
    }));
    const WorkerMock = jest.fn();
    return { Queue: QueueMock, Worker: WorkerMock };
});

const { initDigestJobs } = require('../../jobs/digest.job');

describe('initDigestJobs', () => {
    let savedNodeEnv;

    beforeEach(() => {
        savedNodeEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'staging';
        process.env.REDIS_URL = 'redis://localhost:6379';
        const { Queue, Worker } = require('bullmq');
        Queue.mockClear();
        Worker.mockClear();
    });

    afterEach(() => {
        process.env.NODE_ENV = savedNodeEnv;
        delete process.env.REDIS_URL;
    });

    it('registers 3 queues with no colons in their names', async () => {
        const { Queue } = require('bullmq');
        await initDigestJobs();
        const names = Queue.mock.calls.map(([name]) => name);
        expect(names).toHaveLength(3);
        names.forEach(name => expect(name).not.toMatch(/:/));
    });

    it('registers 3 workers with no colons in their names', async () => {
        const { Worker } = require('bullmq');
        await initDigestJobs();
        const names = Worker.mock.calls.map(([name]) => name);
        expect(names).toHaveLength(3);
        names.forEach(name => expect(name).not.toMatch(/:/));
    });

    it('uses the expected hyphenated queue names', async () => {
        const { Queue, Worker } = require('bullmq');
        await initDigestJobs();
        const queueNames  = Queue.mock.calls.map(([name]) => name).sort();
        const workerNames = Worker.mock.calls.map(([name]) => name).sort();
        const expected = ['digest-deletion-warn', 'digest-smart-daily', 'digest-weekly-summary'];
        expect(queueNames).toEqual(expected);
        expect(workerNames).toEqual(expected);
    });

    it('skips queue creation when REDIS_URL is not set', async () => {
        delete process.env.REDIS_URL;
        const { Queue } = require('bullmq');
        await initDigestJobs();
        expect(Queue).not.toHaveBeenCalled();
    });
});
