// Chia Jia Ye A0286580U
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = 'http://localhost:6060/api/v1/auth';
const EMAIL = 'test@gmail.com';
const PASSWORD = 'Test123!';

export const options = {
  scenarios: {
    orders_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 20 },
        { duration: '3m', target: 20 },
        { duration: '1m', target: 0 },
      ],
      gracefulRampDown: '30s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<500'],
    checks: ['rate>0.99'],
  },
};

export function setup() {
  const loginRes = http.post(
    `${BASE_URL}/login`,
    JSON.stringify({
      email: EMAIL,
      password: PASSWORD,
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );

  const ok =
    loginRes.status === 200 &&
    loginRes.json('success') === true &&
    !!loginRes.json('token');

  if (!ok) {
    throw new Error(
      `Setup login failed. Status: ${loginRes.status}, Body: ${loginRes.body}`
    );
  }

  return {
    token: loginRes.json('token'),
  };
}

export default function (data) {
  const res = http.get(`${BASE_URL}/orders`, {
    headers: {
      Authorization: data.token,
    },
  });

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response body exists': (r) => !!r.body,
  });

  sleep(1);
}