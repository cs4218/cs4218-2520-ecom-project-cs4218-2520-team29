// Dexter Wong Xing You A0255437Y


import { test, expect } from '@playwright/test';

const admin = {
  email: 'admin@gmail.com',
  password: 'Admin123!',
};

const uniqueProduct = () => `Pool Book ${Date.now()}`;

const loginAsAdmin = async (page) => {
  await page.goto('http://localhost:3000/login');
  await page.getByRole('textbox', { name: 'Enter Your Email' }).fill(admin.email);
  await page.getByRole('textbox', { name: 'Enter Your Password' }).fill(admin.password);
  await page.getByRole('button', { name: 'LOGIN' }).click();

  await expect(page.getByText('VIRTUAL VAULT')).toBeVisible();
};

const goToCreateProductPage = async (page) => {
  await page.goto('http://localhost:3000/dashboard/admin/create-product');
  await expect(page.getByRole('heading', { name: 'Create Product' })).toBeVisible();
};

const selectBookCategory = async (page) => {
  await page.locator('#rc_select_0').click();
  await page.getByText('Book').nth(1).click();
};

const selectShippingYes = async (page) => {
  await page.locator('#rc_select_1').click();
  await page.getByText('Yes').click();
};

test.describe('Admin Create Product UI Tests', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(60000);
    await loginAsAdmin(page);
    await goToCreateProductPage(page);
  });

  test('create product page loads with required elements', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Create Product' })).toBeVisible();
    await expect(page.locator('#rc_select_0')).toBeVisible();
    await expect(page.getByPlaceholder('write a name')).toBeVisible();
    await expect(page.getByPlaceholder('write a description')).toBeVisible();
    await expect(page.getByPlaceholder('write a Price')).toBeVisible();
    await expect(page.getByPlaceholder('write a quantity')).toBeVisible();
    await expect(page.locator('#rc_select_1')).toBeVisible();
    await expect(page.getByRole('button', { name: 'CREATE PRODUCT' })).toBeVisible();
  });

  test('admin can fill and submit the create product form', async ({ page }) => {
    const productName = uniqueProduct();

    await selectBookCategory(page);
    await page.getByPlaceholder('write a name').fill(productName);
    await page.getByPlaceholder('write a description').fill('Advanced billiard strategies');
    await page.getByPlaceholder('write a Price').fill('15.99');
    await page.getByPlaceholder('write a quantity').fill('1');
    await selectShippingYes(page);

    await page.getByRole('button', { name: 'CREATE PRODUCT' }).click();

    await page.waitForTimeout(1500);

    await expect(page.getByText('VIRTUAL VAULT')).toBeVisible();
  });

  test('admin can navigate from create product page to products page', async ({ page }) => {
    await page.getByRole('link', { name: 'Products' }).click();
    await page.waitForTimeout(1000);

    await expect(page.getByText('VIRTUAL VAULT')).toBeVisible();
  });

  test('admin can create a product and then open the products page', async ({ page }) => {
    const productName = uniqueProduct();

    await selectBookCategory(page);
    await page.getByPlaceholder('write a name').fill(productName);
    await page.getByPlaceholder('write a description').fill('Advanced billiard strategies');
    await page.getByPlaceholder('write a Price').fill('15.99');
    await page.getByPlaceholder('write a quantity').fill('1');
    await selectShippingYes(page);

    await page.getByRole('button', { name: 'CREATE PRODUCT' }).click();
    await page.waitForTimeout(1500);

    await page.getByRole('link', { name: 'Products' }).click();
    await page.waitForTimeout(1000);

    await expect(page.getByText('VIRTUAL VAULT')).toBeVisible();
  });
});