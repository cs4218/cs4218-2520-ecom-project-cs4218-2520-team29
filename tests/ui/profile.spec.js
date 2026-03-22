// Chia Jia Ye A0286580U
import { test, expect } from '@playwright/test';

const uniqueId = () => `${Date.now()}_${Math.floor(Math.random() * 100000)}`;

const buildUser = () => {
  const id = uniqueId();
  return {
    name: `Profile User ${id}`,
    email: `profileuser_${id}@example.com`,
    password: 'Password@123',
    confirmPassword: 'Password@123',
    phone: '12345678',
    address: `123 Profile Street ${id}`,
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

test.describe('Profile UI Tests', () => {
  test.beforeEach(async ({ page }) => {
    await clearLocalState(page);
  });

  test('logged-in user can access the profile page', async ({ page }) => {
    const user = buildUser();

    await registerUserThroughUI(page, user);
    await loginUserThroughUI(page, user);

    await page.goto('/dashboard/user/profile');

    await expect(page).toHaveURL(/\/dashboard\/user\/profile$/);
    await expect(page.getByRole('heading', { name: 'USER PROFILE' })).toBeVisible();
  });

  test('profile form is pre-filled with logged-in user data', async ({ page }) => {
    const user = buildUser();

    await registerUserThroughUI(page, user);
    await loginUserThroughUI(page, user);

    await page.goto('/dashboard/user/profile');

    await expect(page.getByPlaceholder('Enter Your Name')).toHaveValue(user.name);
    await expect(page.getByPlaceholder('Enter Your Phone')).toHaveValue(user.phone);
    await expect(page.getByPlaceholder('Enter Your Address')).toHaveValue(user.address);

    const emailInput = page.getByPlaceholder('Enter Your Email ');
    await expect(emailInput).toHaveValue(user.email);
    await expect(emailInput).toBeDisabled();
  });

  test('user can update profile details successfully', async ({ page }) => {
    const user = buildUser();

    await registerUserThroughUI(page, user);
    await loginUserThroughUI(page, user);

    await page.goto('/dashboard/user/profile');

    const updatedName = `Updated ${user.name}`;
    const updatedPhone = '87654321';
    const updatedAddress = `Updated ${user.address}`;

    await page.getByPlaceholder('Enter Your Name').fill(updatedName);
    await page.getByPlaceholder('Enter Your Phone').fill(updatedPhone);
    await page.getByPlaceholder('Enter Your Address').fill(updatedAddress);

    await page.getByRole('button', { name: 'UPDATE' }).click();

    await expect(page.getByPlaceholder('Enter Your Name')).toHaveValue(updatedName);
    await expect(page.getByPlaceholder('Enter Your Phone')).toHaveValue(updatedPhone);
    await expect(page.getByPlaceholder('Enter Your Address')).toHaveValue(updatedAddress);
  });

  test('email field remains disabled on profile page', async ({ page }) => {
    const user = buildUser();

    await registerUserThroughUI(page, user);
    await loginUserThroughUI(page, user);

    await page.goto('/dashboard/user/profile');

    await expect(page.getByPlaceholder('Enter Your Email ')).toBeDisabled();
  });
});