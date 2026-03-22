// Chia Jia Ye A0286580U
import { test, expect } from '@playwright/test';

const uniqueId = () => `${Date.now()}_${Math.floor(Math.random() * 100000)}`;

const buildUser = () => {
  const id = uniqueId();
  return {
    name: `Flow User ${id}`,
    email: `flowuser_${id}@example.com`,
    password: 'Password@123',
    confirmPassword: 'Password@123',
    phone: '12345678',
    address: `123 Flow Street ${id}`,
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

const fillLoginForm = async (page, user) => {
  await page.getByPlaceholder('Enter Your Email').fill(user.email);
  await page.getByPlaceholder('Enter Your Password').fill(user.password);
};

test.describe('Authentication End-to-End Flow', () => {
  test.beforeEach(async ({ page }) => {
    await clearLocalState(page);
  });

  test('user can register, get redirected to login, and then log in successfully', async ({ page }) => {
    const user = buildUser();

    await page.goto('/register');
    await fillRegisterForm(page, user);

    await page.getByRole('button', { name: 'REGISTER' }).click();

    await expect(page).toHaveURL(/\/login$/);

    await fillLoginForm(page, user);
    await page.getByRole('button', { name: 'LOGIN' }).click();

    await expect(page).not.toHaveURL(/\/login$/);
  });

  test('user cannot log in before registering, but can log in after registering', async ({ page }) => {
    const user = buildUser();

    await page.goto('/login');
    await fillLoginForm(page, user);
    await page.getByRole('button', { name: 'LOGIN' }).click();

    await expect(page).toHaveURL(/\/login$/);

    await page.goto('/register');
    await fillRegisterForm(page, user);
    await page.getByRole('button', { name: 'REGISTER' }).click();

    await expect(page).toHaveURL(/\/login$/);

    await fillLoginForm(page, user);
    await page.getByRole('button', { name: 'LOGIN' }).click();

    await expect(page).not.toHaveURL(/\/login$/);
  });
});