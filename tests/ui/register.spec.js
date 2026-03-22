// Chia Jia Ye A0286580U
import { test, expect } from '@playwright/test';

const uniqueId = () => `${Date.now()}_${Math.floor(Math.random() * 100000)}`;

const buildUser = () => {
  const id = uniqueId();
  return {
    name: `Test User ${id}`,
    email: `testuser_${id}@example.com`,
    password: 'Password@123',
    confirmPassword: 'Password@123',
    phone: '12345678',
    address: `123 Test Street ${id}`,
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

  // match the placeholder text exactly as it appears in the form.
  await page.getByPlaceholder('What is Your Favorite Sport').fill(user.answer);
};

test.describe('Register UI Tests', () => {
  test.beforeEach(async ({ page }) => {
    await clearLocalState(page);
  });

  test('user can register successfully and is redirected to login page', async ({ page }) => {
    const user = buildUser();

    await page.goto('/register');
    await fillRegisterForm(page, user);

    await page.getByRole('button', { name: 'REGISTER' }).click();

    await expect(page).toHaveURL(/\/login$/);
  });

  test('user cannot register when passwords do not match', async ({ page }) => {
    const user = buildUser();
    user.confirmPassword = 'DifferentPass@123';

    await page.goto('/register');
    await fillRegisterForm(page, user);

    await page.getByRole('button', { name: 'REGISTER' }).click();

    // should remain on register page because submission fails
    await expect(page).toHaveURL(/\/register$/);
  });

  test('user cannot register with a weak password', async ({ page }) => {
    const user = buildUser();
    user.password = '123';
    user.confirmPassword = '123';

    await page.goto('/register');
    await fillRegisterForm(page, user);

    await page.getByRole('button', { name: 'REGISTER' }).click();

    // browser HTML5 validation should block submission because of pattern mismatch.
    await expect(page).toHaveURL(/\/register$/);

    const validationMessage = await page
      .getByPlaceholder('Enter Your Password')
      .evaluate((el) => el.validationMessage);

    expect(validationMessage).not.toBe('');
  });

  test('user cannot register twice with the same email', async ({ page }) => {
    const user = buildUser();

    await page.goto('/register');
    await fillRegisterForm(page, user);
    await page.getByRole('button', { name: 'REGISTER' }).click();

    await expect(page).toHaveURL(/\/login$/);

    await page.goto('/register');
    await fillRegisterForm(page, user);
    await page.getByRole('button', { name: 'REGISTER' }).click();

    // duplicate registration should fail and remain on register page.
    await expect(page).toHaveURL(/\/register$/);
  });

  test('user cannot register with invalid email format', async ({ page }) => {
    const user = buildUser();
    user.email = 'not-an-email';

    await page.goto('/register');
    await fillRegisterForm(page, user);

    await page.getByRole('button', { name: 'REGISTER' }).click();

    await expect(page).toHaveURL(/\/register$/);

    const validationMessage = await page
      .getByPlaceholder('Enter Your Email')
      .evaluate((el) => el.validationMessage);

    expect(validationMessage).not.toBe('');
  });

  test('user cannot register when a required field is missing', async ({ page }) => {
    const user = buildUser();
    user.name = '';

    await page.goto('/register');
    await fillRegisterForm(page, user);

    await page.getByRole('button', { name: 'REGISTER' }).click();

    await expect(page).toHaveURL(/\/register$/);
  });
});