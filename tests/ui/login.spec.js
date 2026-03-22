// Chia Jia Ye A0286580U
import { test, expect } from '@playwright/test';

const uniqueId = () => `${Date.now()}_${Math.floor(Math.random() * 100000)}`;

const buildUser = () => {
  const id = uniqueId();
  return {
    name: `Login User ${id}`,
    email: `loginuser_${id}@example.com`,
    password: 'Password@123',
    confirmPassword: 'Password@123',
    phone: '12345678',
    address: `123 Login Street ${id}`,
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

test.describe('Login UI Tests', () => {
  test.beforeEach(async ({ page }) => {
    await clearLocalState(page);
  });

  test('user can log in successfully with valid credentials', async ({ page }) => {
    const user = buildUser();

    await registerUserThroughUI(page, user);

    await fillLoginForm(page, user.email, user.password);
    await page.getByRole('button', { name: 'LOGIN' }).click();

    await expect(page).not.toHaveURL(/\/login$/);
  });

  test('user cannot log in with incorrect password', async ({ page }) => {
    const user = buildUser();

    await registerUserThroughUI(page, user);

    await fillLoginForm(page, user.email, 'WrongPassword@123');
    await page.getByRole('button', { name: 'LOGIN' }).click();

    await expect(page).toHaveURL(/\/login$/);
  });

  test('user cannot log in with an unregistered email', async ({ page }) => {
    const user = buildUser();

    await page.goto('/login');
    await fillLoginForm(page, user.email, user.password);
    await page.getByRole('button', { name: 'LOGIN' }).click();

    await expect(page).toHaveURL(/\/login$/);
  });

  test('user cannot log in when a required field is missing', async ({ page }) => {
    const user = buildUser();

    await page.goto('/login');
    await fillLoginForm(page, user.email, '');
    await page.getByRole('button', { name: 'LOGIN' }).click();

    await expect(page).toHaveURL(/\/login$/);

    const validationMessage = await page
      .getByPlaceholder('Enter Your Password')
      .evaluate((el) => el.validationMessage);

    expect(validationMessage).not.toBe('');
  });
});