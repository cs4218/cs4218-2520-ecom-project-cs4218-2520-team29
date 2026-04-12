/**
 * Charles Lim Jun Wei, A0277527R
 * NFT - Stress Testing
 *
 * Browse and search endpoints (unauthenticated)
 *   GET /api/v1/category/get-category
 *   GET /api/v1/product/product-list/1
 *   GET /api/v1/product/search/:keyword
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import exec from 'k6/execution';
import { Rate, Trend } from 'k6/metrics';

const stage50  = { dur: new Trend('stage_50_duration',  true), err: new Rate('stage_50_errors'),  sla: new Rate('stage_50_sla')  };
const stage100 = { dur: new Trend('stage_100_duration', true), err: new Rate('stage_100_errors'), sla: new Rate('stage_100_sla') };
const stage200 = { dur: new Trend('stage_200_duration', true), err: new Rate('stage_200_errors'), sla: new Rate('stage_200_sla') };
const stage300 = { dur: new Trend('stage_300_duration', true), err: new Rate('stage_300_errors'), sla: new Rate('stage_300_sla') };
const stage400 = { dur: new Trend('stage_400_duration', true), err: new Rate('stage_400_errors'), sla: new Rate('stage_400_sla') };
const stage500 = { dur: new Trend('stage_500_duration', true), err: new Rate('stage_500_errors'), sla: new Rate('stage_500_sla') };
const recovery = { dur: new Trend('recovery_duration',  true), err: new Rate('recovery_errors'),  sla: new Rate('recovery_sla')  };

const functionalErrorRate  = new Rate('functional_error_rate');
const slaBreach            = new Rate('sla_breach_rate');
const categoryDuration     = new Trend('category_duration',     true);
const productListDuration  = new Trend('product_list_duration', true);
const searchDuration       = new Trend('search_duration',       true);

export const options = {
    stages: [
        { duration: '30s', target: 50  },
        { duration: '30s', target: 100 },
        { duration: '30s', target: 200 },
        { duration: '30s', target: 300 },
        { duration: '30s', target: 400 },
        { duration: '30s', target: 500 },
        { duration: '30s', target: 0   },
    ],
    thresholds: {
        http_req_failed:      ['rate<0.05'],
        functional_error_rate: ['rate<0.05'],
        sla_breach_rate:      ['rate<0.10'],
        category_duration:    ['p(95)<1000'],
        product_list_duration: ['p(95)<2000'],
        search_duration:      ['p(95)<2000'],
    },
};

// ─── Config ───────────────────────────────────────────────────────────────────

const BASE_URL      = 'http://localhost:6060';
const SLA_MS        = 2000;
const SALE_KEYWORDS = ['laptop', 'phone', 'headphones', 'keyboard', 'monitor'];

// ─── Stage bucket helper ──────────────────────────────────────────────────────

function getStageByElapsedTime() {
    const elapsedSec = exec.instance.currentTestRunDuration / 1000;

    if (elapsedSec <= 30)  return { label: '50 VUs',   metric: stage50  };
    if (elapsedSec <= 60)  return { label: '100 VUs',  metric: stage100 };
    if (elapsedSec <= 90)  return { label: '200 VUs',  metric: stage200 };
    if (elapsedSec <= 120) return { label: '300 VUs',  metric: stage300 };
    if (elapsedSec <= 150) return { label: '400 VUs',  metric: stage400 };
    if (elapsedSec <= 180) return { label: '500 VUs',  metric: stage500 };
    if (elapsedSec <= 210) return { label: 'Recovery', metric: recovery };

    return { label: 'ramp-down', metric: null };
}

function isJsonOk(res) {
    try {
        JSON.parse(res.body);
        return true;
    } catch {
        return false;
    }
}

function getBody(res) {
    try { return JSON.parse(res.body); }
    catch { return {}; }
}

export default function () {
    const stage = getStageByElapsedTime();
    let iterSuccess = true;
    let iterMaxDuration = 0;

    // Categories
    const catRes = http.get(`${BASE_URL}/api/v1/category/get-category`);
    categoryDuration.add(catRes.timings.duration);
    iterMaxDuration = Math.max(iterMaxDuration, catRes.timings.duration);

    const catOk = check(catRes, {
        'categories: status 200': (r) => r.status === 200,
        'categories: valid JSON':  (r) => isJsonOk(r),
        'categories: success flag': (r) => {
            const body = getBody(r);
            return body.success === true || Array.isArray(body.category);
        },
    });
    if (!catOk) iterSuccess = false;

    sleep(0.3);

    // Product Listing
    const listRes = http.get(`${BASE_URL}/api/v1/product/product-list/1`);
    productListDuration.add(listRes.timings.duration);
    iterMaxDuration = Math.max(iterMaxDuration, listRes.timings.duration);

    const listOk = check(listRes, {
        'product-list: status 200': (r) => r.status === 200,
        'product-list: valid JSON': (r) => isJsonOk(r),
        'product-list: has products': (r) => {
            const body = getBody(r);
            return Array.isArray(body.products) || Array.isArray(body);
        },
    });
    if (!listOk) iterSuccess = false;

    sleep(0.5);

    // ── 3. Search ─────────────────────────────────────────────────────────────
    const keyword = SALE_KEYWORDS[Math.floor(Math.random() * SALE_KEYWORDS.length)];
    const searchRes = http.get(`${BASE_URL}/api/v1/product/search/${keyword}`);
    searchDuration.add(searchRes.timings.duration);
    iterMaxDuration = Math.max(iterMaxDuration, searchRes.timings.duration);

    const searchOk = check(searchRes, {
        'search: status 200': (r) => r.status === 200,
        'search: valid JSON': (r) => isJsonOk(r),
        'search: has results': (r) => {
            try {
                const body = JSON.parse(r.body);
                return (
                    Array.isArray(body)           ||
                    Array.isArray(body.results)   ||
                    Array.isArray(body.products)  ||
                    Array.isArray(body.data)
                );
            } catch { return false; }
        },
    });
    if (!searchOk) iterSuccess = false;

    sleep(0.5);

    const slaBreached = iterMaxDuration >= SLA_MS;

    functionalErrorRate.add(!iterSuccess);
    slaBreach.add(slaBreached);

    if (stage.metric) {
        stage.metric.dur.add(iterMaxDuration);
        stage.metric.err.add(!iterSuccess);
        stage.metric.sla.add(slaBreached);
    }

    sleep(0.5);
}

export function handleSummary(data) {
    const summary = buildSummary(data);
    return {
        'results-browse.txt': summary,
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
        { label: '500 VUs',  p95Key: 'stage_500_duration', errKey: 'stage_500_errors', slaKey: 'stage_500_sla' },
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
        if (failureStage === 'not reached' && errVal !== undefined && errVal > 0.05) {
            failureStage = s.label;
        }
    }

    // Table structure generated by ChatGPT
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
            pad(s.label,           col1) +
            pad(p95(s.p95Key),     col2) +
            pad(errRate(s.errKey), col3) +
            pad(errRate(s.slaKey), col4) + '\n';
    }

    const endpointTable =
        pad('Endpoint',     20) + pad('p95 latency', 16) + '\n' +
        '-'.repeat(36)          + '\n' +
        pad('Categories',   20) + pad(p95('category_duration'),    16) + '\n' +
        pad('Product list', 20) + pad(p95('product_list_duration'), 16) + '\n' +
        pad('Search',       20) + pad(p95('search_duration'),       16) + '\n';

    return (
        '\nSTRESS TEST 2: BROWSE AND SEARCH (UNAUTHENTICATED)\n' +
        '====================================================\n' +
        'Total requests           : ' + count(m.http_reqs)            + '\n' +
        'HTTP failed requests     : ' + rate(m.http_req_failed)        + '\n' +
        'Functional error rate    : ' + rate(m.functional_error_rate)  + '\n' +
        'SLA breach rate (>2s)    : ' + rate(m.sla_breach_rate)        + '\n\n' +
        'Per-endpoint p95 (overall):\n' +
        endpointTable + '\n' +
        'Per-stage breakdown:\n' +
        table + '\n' +
        'Degradation starts at : ' + degradationStage + '  (SLA breach rate > 5%)\n' +
        'Failure starts at     : ' + failureStage     + '  (functional error rate > 5%)\n\n' +
        'Thresholds passed : ' + (allPassed ? 'YES ✓' : 'NO ✗') + '\n'
    );
}
