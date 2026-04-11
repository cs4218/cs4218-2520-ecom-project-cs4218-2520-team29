// Chia Jia Ye A0286580U
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = 'http://localhost:6060/api/v1/auth';

export const options = {
  scenarios: {
    login_load: {
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

export default function () {
  const payload = JSON.stringify({
    email: 'test@gmail.com',
    password: 'Test123!',
  });

  const res = http.post(`${BASE_URL}/login`, payload, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  check(res, {
    'status is 200': (r) => r.status === 200,
    'login success flag is true': (r) => {
      try {
        return r.json('success') === true;
      } catch {
        return false;
      }
    },
    'has token': (r) => {
      try {
        return !!r.json('token');
      } catch {
        return false;
      }
    },
  });

  sleep(1);
}