/**
 * Charles Lim Jun Wei, A0277527R
 * NFT - Stress Testing
 *
 * Full flash sale user journey (end-to-end)
 *   Login (once per VU) → Browse → Search → View Product → View Orders
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

const loginStage50  = new Trend('login_stage_50_duration',  true);
const loginStage100 = new Trend('login_stage_100_duration', true);
const loginStage200 = new Trend('login_stage_200_duration', true);
const loginStage300 = new Trend('login_stage_300_duration', true);
const loginStage400 = new Trend('login_stage_400_duration', true);
const loginStage500 = new Trend('login_stage_500_duration', true);
const loginRecovery = new Trend('login_recovery_duration',  true);

const functionalErrorRate    = new Rate('functional_error_rate');
const slaBreachRate          = new Rate('sla_breach_rate');
const loginDuration          = new Trend('login_duration',          true);
const browsingDuration       = new Trend('browsing_duration',       true);
const searchDuration         = new Trend('search_duration',         true);
const productDetailDuration  = new Trend('product_detail_duration', true);
const ordersDuration         = new Trend('orders_duration',         true);

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
        http_req_failed:         ['rate<0.10'],
        functional_error_rate:   ['rate<0.10'],
        sla_breach_rate:         ['rate<0.20'],
        login_duration:          ['p(95)<5000'],
        browsing_duration:       ['p(95)<3000'],
        search_duration:         ['p(95)<3000'],
        product_detail_duration: ['p(95)<3000'],
        orders_duration:         ['p(95)<5000'],
    },
};

const BASE_URL      = 'http://localhost:6060';
const TEST_EMAIL    = 'test3@example.com';
const TEST_PASSWORD = 'Test3@ex';
const SLA_MS        = 5000;

const SALE_KEYWORDS = ['laptop', 'phone', 'headphones', 'keyboard', 'monitor'];
const PRODUCT_SLUGS = ['laptop', 'wireless-headphones', 'mechanical-keyboard'];

function getStageByElapsedTime() {
    const elapsedSec = exec.instance.currentTestRunDuration / 1000;

    if (elapsedSec <= 30)  return { label: '50 VUs',   metric: stage50,  loginTrend: loginStage50  };
    if (elapsedSec <= 60)  return { label: '100 VUs',  metric: stage100, loginTrend: loginStage100 };
    if (elapsedSec <= 90)  return { label: '200 VUs',  metric: stage200, loginTrend: loginStage200 };
    if (elapsedSec <= 120) return { label: '300 VUs',  metric: stage300, loginTrend: loginStage300 };
    if (elapsedSec <= 150) return { label: '400 VUs',  metric: stage400, loginTrend: loginStage400 };
    if (elapsedSec <= 180) return { label: '500 VUs',  metric: stage500, loginTrend: loginStage500 };
    if (elapsedSec <= 210) return { label: 'Recovery', metric: recovery, loginTrend: loginRecovery };

    return { label: 'ramp-down', metric: null, loginTrend: null };
}

function isJsonOk(res) {
    try { JSON.parse(res.body); return true; }
    catch { return false; }
}

function getBody(res) {
    try { return JSON.parse(res.body); }
    catch { return {}; }
}

let vuToken = null;

export default function () {
    const stage = getStageByElapsedTime();
    let iterSuccess = true;
    let iterMaxDuration = 0;

    // Login
    if (__ITER === 0) {
        const res = http.post(
            `${BASE_URL}/api/v1/auth/login`,
            JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
            { headers: { 'Content-Type': 'application/json' } }
        );

        loginDuration.add(res.timings.duration);
        if (stage.loginTrend) stage.loginTrend.add(res.timings.duration);

        const loginOk = check(res, {
            'login: status 200':    (r) => r.status === 200,
            'login: token received': (r) => {
                try {
                    const body = JSON.parse(r.body);
                    if (body.token) { vuToken = body.token; return true; }
                    return false;
                } catch { return false; }
            },
        });

        if (!loginOk) iterSuccess = false;
        iterMaxDuration = Math.max(iterMaxDuration, res.timings.duration);

        sleep(1);
    }

    // Product Listing
    const listRes = http.get(`${BASE_URL}/api/v1/product/product-list/1`);
    browsingDuration.add(listRes.timings.duration);
    iterMaxDuration = Math.max(iterMaxDuration, listRes.timings.duration);

    const listOk = check(listRes, {
        'browse: status 200':    (r) => r.status === 200,
        'browse: valid JSON':    (r) => isJsonOk(r),
        'browse: has products':  (r) => {
            const body = getBody(r);
            return Array.isArray(body.products) || Array.isArray(body);
        },
    });
    if (!listOk) iterSuccess = false;

    sleep(1);

    // Search
    const keyword   = SALE_KEYWORDS[Math.floor(Math.random() * SALE_KEYWORDS.length)];
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
                    Array.isArray(body)          ||
                    Array.isArray(body.results)  ||
                    Array.isArray(body.products) ||
                    Array.isArray(body.data)
                );
            } catch { return false; }
        },
    });
    if (!searchOk) iterSuccess = false;

    sleep(1);

    // Product details
    const slug      = PRODUCT_SLUGS[Math.floor(Math.random() * PRODUCT_SLUGS.length)];
    const detailRes = http.get(`${BASE_URL}/api/v1/product/get-product/${slug}`);
    productDetailDuration.add(detailRes.timings.duration);
    iterMaxDuration = Math.max(iterMaxDuration, detailRes.timings.duration);

    const detailOk = check(detailRes, {
        'product-detail: status 200':     (r) => r.status === 200,
        'product-detail: valid JSON':     (r) => isJsonOk(r),
        'product-detail: product exists': (r) => {
            const body = getBody(r);
            return body.product !== undefined;
        },
    });
    if (!detailOk) iterSuccess = false;

    if (detailRes.status === 200) {
        try {
            const product = JSON.parse(detailRes.body).product;
            if (product?._id && product?.category) {
                const relatedRes = http.get(
                    `${BASE_URL}/api/v1/product/related-product/${product._id}/${product.category._id || product.category}`
                );
                check(relatedRes, {
                    'related-products: status 200': (r) => r.status === 200,
                });
            }
        } catch { /* parse failed — already counted in detailOk */ }
    }

    sleep(2);

    // Orders
    if (vuToken) {
        const ordersRes = http.get(`${BASE_URL}/api/v1/auth/orders`, {
            headers: { Authorization: vuToken },
        });
        ordersDuration.add(ordersRes.timings.duration);
        iterMaxDuration = Math.max(iterMaxDuration, ordersRes.timings.duration);

        const ordersOk = check(ordersRes, {
            'orders: status 200':   (r) => r.status === 200,
            'orders: valid JSON':   (r) => isJsonOk(r),
            'orders: returns array': (r) => {
                try { return Array.isArray(JSON.parse(r.body)); }
                catch { return false; }
            },
        });
        if (!ordersOk) iterSuccess = false;
    }

    const slaBreached = iterMaxDuration >= SLA_MS;

    functionalErrorRate.add(!iterSuccess);
    slaBreachRate.add(slaBreached);

    if (stage.metric) {
        stage.metric.dur.add(iterMaxDuration);
        stage.metric.err.add(!iterSuccess);
        stage.metric.sla.add(slaBreached);
    }

    sleep(1);
}

export function handleSummary(data) {
    const summary = buildSummary(data);
    return {
        'results-journey.txt': summary,
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
        { label: '50 VUs',   p95Key: 'stage_50_duration',  errKey: 'stage_50_errors',  slaKey: 'stage_50_sla',  loginKey: 'login_stage_50_duration'  },
        { label: '100 VUs',  p95Key: 'stage_100_duration', errKey: 'stage_100_errors', slaKey: 'stage_100_sla', loginKey: 'login_stage_100_duration' },
        { label: '200 VUs',  p95Key: 'stage_200_duration', errKey: 'stage_200_errors', slaKey: 'stage_200_sla', loginKey: 'login_stage_200_duration' },
        { label: '300 VUs',  p95Key: 'stage_300_duration', errKey: 'stage_300_errors', slaKey: 'stage_300_sla', loginKey: 'login_stage_300_duration' },
        { label: '400 VUs',  p95Key: 'stage_400_duration', errKey: 'stage_400_errors', slaKey: 'stage_400_sla', loginKey: 'login_stage_400_duration' },
        { label: 'Recovery', p95Key: 'recovery_duration',  errKey: 'recovery_errors',  slaKey: 'recovery_sla',  loginKey: 'login_recovery_duration'  },
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

    const col1 = 14;
    const col2 = 16;
    const col3 = 16;
    const col4 = 16;
    const col5 = 16;
    const pad  = (str, len) => str.toString().padEnd(len);
    const divider = '-'.repeat(col1 + col2 + col3 + col4 + col5);

    let stageTable =
        pad('Load',        col1) +
        pad('p95 latency', col2) +
        pad('login p95',   col3) +
        pad('func. error', col4) +
        pad('SLA breach',  col5) + '\n' +
        divider + '\n';

    for (const s of stages) {
        stageTable +=
            pad(s.label,           col1) +
            pad(p95(s.p95Key),     col2) +
            pad(p95(s.loginKey),   col3) +
            pad(errRate(s.errKey), col4) +
            pad(errRate(s.slaKey), col5) + '\n';
    }

    const stepTable =
        pad('Step',                          32) + pad('p95 latency', 16) + '\n' +
        '-'.repeat(48) + '\n' +
        pad('1. Login (once per VU)',         32) + pad(p95('login_duration'),          16) + '\n' +
        pad('2. Browse product list',         32) + pad(p95('browsing_duration'),       16) + '\n' +
        pad('3. Search',                      32) + pad(p95('search_duration'),         16) + '\n' +
        pad('4. Product detail',              32) + pad(p95('product_detail_duration'), 16) + '\n' +
        pad('5. Orders confirmation',         32) + pad(p95('orders_duration'),         16) + '\n';

    return (
        '\nSTRESS TEST 3: FLASH SALE USER JOURNEY\n' +
        '========================================\n' +
        'Total requests           : ' + count(m.http_reqs)           + '\n' +
        'HTTP failed requests     : ' + rate(m.http_req_failed)       + '\n' +
        'Functional error rate    : ' + rate(m.functional_error_rate) + '\n' +
        'SLA breach rate (>5s)    : ' + rate(m.sla_breach_rate)       + '\n\n' +
        'Per-step p95 (overall):\n' +
        stepTable + '\n' +
        'Per-stage breakdown:\n' +
        stageTable + '\n' +
        'Degradation starts at : ' + degradationStage + '  (SLA breach rate > 5%)\n' +
        'Failure starts at     : ' + failureStage     + '  (functional error rate > 10%)\n\n' +
        'Thresholds passed : ' + (allPassed ? 'YES ✓' : 'NO ✗') + '\n'
    );
}
