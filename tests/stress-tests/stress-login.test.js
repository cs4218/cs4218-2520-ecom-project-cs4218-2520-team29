/**
 * Charles Lim Jun Wei, A0277527R
 * NFT - Stress Testing
 *
 * POST /api/v1/auth/login
**/

import http from 'k6/http';
import { check, sleep } from 'k6';
import exec from 'k6/execution';
import { Rate, Trend } from 'k6/metrics';

const stage50  = { dur: new Trend('stage_50_duration',  true), err: new Rate('stage_50_errors'),  sla: new Rate('stage_50_sla')  };
const stage100 = { dur: new Trend('stage_100_duration', true), err: new Rate('stage_100_errors'), sla: new Rate('stage_100_sla') };
const stage200 = { dur: new Trend('stage_200_duration', true), err: new Rate('stage_200_errors'), sla: new Rate('stage_200_sla') };
const stage300 = { dur: new Trend('stage_300_duration', true), err: new Rate('stage_300_errors'), sla: new Rate('stage_300_sla') };
const stage400 = { dur: new Trend('stage_400_duration', true), err: new Rate('stage_400_errors'), sla: new Rate('stage_400_sla') };

const recovery = { dur: new Trend('recovery_duration', true), err: new Rate('recovery_errors'), sla: new Rate('recovery_sla') };

const functionalErrorRate = new Rate('functional_error_rate');
const loginSlaBreachRate  = new Rate('login_sla_breach_rate');
const loginDuration       = new Trend('login_duration', true);

export const options = {
    stages: [
        { duration: '30s', target: 50  },
        { duration: '30s', target: 100 },
        { duration: '30s', target: 200 },
        { duration: '30s', target: 300 },
        { duration: '30s', target: 400 },
        { duration: '30s', target: 50  },
        { duration: '30s', target: 0   },
    ],
    thresholds: {
        http_req_failed:       ['rate<0.10'],
        functional_error_rate: ['rate<0.10'],
        login_sla_breach_rate: ['rate<0.20'],
        login_duration:        ['p(95)<5000'],
    },
};

const BASE_URL      = 'http://localhost:6060';
const TEST_EMAIL    = 'test3@example.com';
const TEST_PASSWORD = 'Test3@ex';
const SLA_MS        = 5000;

function getStageByElapsedTime() {
    const elapsedSec = exec.instance.currentTestRunDuration / 1000;

    if (elapsedSec <= 30)  return { label: '50 VUs',   metric: stage50  };
    if (elapsedSec <= 60)  return { label: '100 VUs',  metric: stage100 };
    if (elapsedSec <= 90)  return { label: '200 VUs',  metric: stage200 };
    if (elapsedSec <= 120) return { label: '300 VUs',  metric: stage300 };
    if (elapsedSec <= 150) return { label: '400 VUs',  metric: stage400 };
    if (elapsedSec <= 210) return { label: 'Recovery', metric: recovery };

    return { label: 'ramp-down', metric: null };
}

export default function () {
    const stage = getStageByElapsedTime();

    const res = http.post(
        `${BASE_URL}/api/v1/auth/login`,
        JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
        { headers: { 'Content-Type': 'application/json' } }
    );

    loginDuration.add(res.timings.duration);
    if (stage.metric) stage.metric.dur.add(res.timings.duration);

    // Functional correctness
    const functionalSuccess = check(res, {
        'login: status 200':    (r) => r.status === 200,
        'login: token received': (r) => {
            try { return !!JSON.parse(r.body).token; }
            catch { return false; }
        },
    });

    // SLA: was the response fast enough?
    const withinSla = res.timings.duration < SLA_MS;

    functionalErrorRate.add(!functionalSuccess);
    loginSlaBreachRate.add(!withinSla);

    if (stage.metric) {
        stage.metric.err.add(!functionalSuccess);
        stage.metric.sla.add(!withinSla);
    }

    sleep(1);
}

export function handleSummary(data) {
    const summary = buildSummary(data);
    return {
        'results-login.txt': summary,
        stdout: summary,
    };
}

function buildSummary(data) {
    const m = data.metrics;

    const p95 = (metricName) => {
        const val = m[metricName]?.values?.['p(95)'];
        return val !== undefined ? `${val.toFixed(0)}ms` : 'N/A';
    };
    const errRate = (metricName) => {
        const val = m[metricName]?.values?.rate;
        return val !== undefined ? `${(val * 100).toFixed(1)}%` : 'N/A';
    };
    const rate = (metric) => {
        const val = metric?.values?.rate;
        return val !== undefined ? `${(val * 100).toFixed(2)}%` : 'N/A';
    };
    const count = (metric) => metric?.values?.count || 'N/A';

    const allPassed = Object.values(data.metrics)
        .flatMap((metric) => Object.values(metric.thresholds || {}))
        .every((t) => t.ok);

    const stages = [
        { label: '50 VUs',   p95Key: 'stage_50_duration',  errKey: 'stage_50_errors',  slaKey: 'stage_50_sla'  },
        { label: '100 VUs',  p95Key: 'stage_100_duration', errKey: 'stage_100_errors', slaKey: 'stage_100_sla' },
        { label: '200 VUs',  p95Key: 'stage_200_duration', errKey: 'stage_200_errors', slaKey: 'stage_200_sla' },
        { label: '300 VUs',  p95Key: 'stage_300_duration', errKey: 'stage_300_errors', slaKey: 'stage_300_sla' },
        { label: '400 VUs',  p95Key: 'stage_400_duration', errKey: 'stage_400_errors', slaKey: 'stage_400_sla' },
        { label: 'Recovery', p95Key: 'recovery_duration',  errKey: 'recovery_errors',  slaKey: 'recovery_sla'  },
    ];

    let degradationStage = 'not reached';
    let failureStage     = 'not reached';

    for (const s of stages) {
        if (s.label === 'Recovery') break;

        const slaVal = m[s.slaKey]?.values?.rate;
        const errVal = m[s.errKey]?.values?.rate;

        if (degradationStage === 'not reached' && slaVal !== undefined && slaVal > 0.05) {
            degradationStage = s.label;
        }
        if (failureStage === 'not reached' && errVal !== undefined && errVal > 0.10) {
            failureStage = s.label;
        }
    }

    // Table structure generated with ChatGPT
    const col1 = 14;
    const col2 = 16;
    const col3 = 16;
    const col4 = 16;
    const pad  = (str, len) => str.toString().padEnd(len);
    const divider = '-'.repeat(col1 + col2 + col3 + col4);

    let table =
        pad('Load',        col1) +
        pad('p95 latency', col2) +
        pad('func. error', col3) +
        pad('SLA breach',  col4) + '\n' +
        divider + '\n';

    for (const s of stages) {
        table +=
            pad(s.label,        col1) +
            pad(p95(s.p95Key),  col2) +
            pad(errRate(s.errKey), col3) +
            pad(errRate(s.slaKey), col4) + '\n';
    }

    return (
        '\nSTRESS TEST 1: LOGIN BREAKING POINT\n' +
        '=====================================\n' +
        'Total requests           : ' + count(m.http_reqs)            + '\n' +
        'HTTP failed requests     : ' + rate(m.http_req_failed)        + '\n' +
        'Functional error rate    : ' + rate(m.functional_error_rate)  + '\n' +
        'SLA breach rate (>5s)    : ' + rate(m.login_sla_breach_rate)  + '\n' +
        'Overall login p95        : ' + p95('login_duration')          + '\n\n' +
        'Per-stage breakdown:\n' +
        table + '\n' +
        'Degradation starts at : ' + degradationStage + '  (SLA breach rate > 5%)\n' +
        'Failure starts at     : ' + failureStage     + '  (functional error rate > 10%)\n\n' +
        'Thresholds passed : ' + (allPassed ? 'YES ✓' : 'NO ✗') + '\n'
    );
}
