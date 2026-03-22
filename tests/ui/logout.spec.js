// Chia Jia Ye A0286580U
import { test, expect } from '@playwright/test';

const uniqueId = () => `${Date.now()}_${Math.floor(Math.random() * 100000)}`;

const buildUser = () => {
  const id = uniqueId();
  return {
    name: `Logout User ${id}`,
    email: `logoutuser_${id}@example.com`,
    password: 'Password@123',
    confirmPassword: 'Password@123',
    phone: '12345678',
    address: `123 Logout Street ${id}`,
    dob: '2004-01-01',
    answer: 'Soccer',
  };
};

const clearLocalState = async (page) => {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
};

const fillRegisterForm = async (page, user) => {
  await page.getByPlaceholder('Enter Your Name').fill(user.name);
  await page.getByPlaceholder('Enter Your Email').fill(user.email);
  await page.getByPlaceholder('Enter Your Password').fill(user.password);
  await page.getByPlaceholder('Confirm Password').fill(user.confirmPassword);
  await page.getByPlaceholder('Enter Your Phone').fill(user.phone);
  await page.getByPlaceholder('Enter Your Address').fill(user.address);
  await page.locator('input[type="date"]').fill(user.dob);
  await page.getByPlaceholder('What is Your Favorite Sport').fill(user.answer);
};

const fillLoginForm = async (page, email, password) => {
  await page.getByPlaceholder('Enter Your Email').fill(email);
  await page.getByPlaceholder('Enter Your Password').fill(password);
};

const registerUserThroughUI = async (page, user) => {
  await page.goto('/register');
  await fillRegisterForm(page, user);
  await page.getByRole('button', { name: 'REGISTER' }).click();
  await expect(page).toHaveURL(/\/login$/);
};

const loginUserThroughUI = async (page, user) => {
  await page.goto('/login');
  await fillLoginForm(page, user.email, user.password);
  await page.getByRole('button', { name: 'LOGIN' }).click();
  await expect(page).not.toHaveURL(/\/login$/);
};

const logoutFromHeader = async (page) => {
  await page.locator('.nav-link.dropdown-toggle').last().click();
  await expect(page.getByRole('link', { name: 'Logout' })).toBeVisible();
  await page.getByRole('link', { name: 'Logout' }).click();
};

test.describe('Logout UI Tests', () => {
  test.beforeEach(async ({ page }) => {
    await clearLocalState(page);
  });

  test('logged-in user can logout successfully and is redirected to login page', async ({ page }) => {
    const user = buildUser();

    await registerUserThroughUI(page, user);
    await loginUserThroughUI(page, user);

    await logoutFromHeader(page, user);

    await expect(page).toHaveURL(/\/login$/);
  });

  test('navbar shows Register and Login links again after logout', async ({ page }) => {
    const user = buildUser();

    await registerUserThroughUI(page, user);
    await loginUserThroughUI(page, user);

    await logoutFromHeader(page, user);

    await expect(page.getByRole('link', { name: 'Register' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Login' })).toBeVisible();
  });

  test('user cannot continue accessing profile page after logout', async ({ page }) => {
    const user = buildUser();

    await registerUserThroughUI(page, user);
    await loginUserThroughUI(page, user);

    await page.goto('/dashboard/user/profile');
    await expect(page).toHaveURL(/\/dashboard\/user\/profile$/);

    await logoutFromHeader(page, user);

    await page.goto('/dashboard/user/profile');

    await expect(page).not.toHaveURL(/\/dashboard\/user\/profile$/);
  });

  test('logout clears auth data from localStorage', async ({ page }) => {
    const user = buildUser();

    await registerUserThroughUI(page, user);
    await loginUserThroughUI(page, user);

    await logoutFromHeader(page, user);

    const authValue = await page.evaluate(() => localStorage.getItem('auth'));
    expect(authValue).toBeNull();
  });
});