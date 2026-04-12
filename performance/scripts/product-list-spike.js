// Dexter Wong Xing You, A0255437Y
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = 'http://localhost:6060/api/v1/product';

export const options = {
  scenarios: {
    product_list_spike: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 5 },   // baseline
        { duration: '10s', target: 80 },  // sudden spike
        { duration: '30s', target: 80 },  // hold spike
        { duration: '10s', target: 5 },   // recovery
        { duration: '30s', target: 5 },   // post-spike observation
        { duration: '10s', target: 0 },   // ramp down
      ],
      gracefulRampDown: '5s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<2000'],
    checks: ['rate>0.95'],
  },
};

export default function () {
  const res = http.get(`${BASE_URL}/product-list/1`);

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response body exists': (r) => !!r.body,
  });

  sleep(1);
}