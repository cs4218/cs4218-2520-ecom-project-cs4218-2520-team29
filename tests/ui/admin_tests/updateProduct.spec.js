// Dexter Wong Xing You A0255437Y

import { test, expect } from '@playwright/test';

const admin = {
  email: 'admin@gmail.com',
  password: 'Admin123!',
};

const ORIGINAL = {
  name: 'Novel',
  description: 'A bestselling novel',
  category: 'Book',
};

const UPDATED = {
  name: 'Novelupdated',
  description: 'A bestselling novel updated',
  category: 'Electronics',
};

// login helper
const loginAsAdmin = async (page) => {
  await page.goto('http://localhost:3000/login');

  await page.getByRole('textbox', { name: 'Enter Your Email' }).fill(admin.email);
  await page.getByRole('textbox', { name: 'Enter Your Password' }).fill(admin.password);
  await page.getByRole('button', { name: 'LOGIN' }).click();

  await expect(page.getByText('VIRTUAL VAULT')).toBeVisible();
};

// go to admin products
const goToAdminProducts = async (page) => {
  await page.goto('http://localhost:3000/dashboard/admin/products');
  await expect(page.getByText('All Products List')).toBeVisible();
};

// open Novel
const openNovel = async (page) => {
  await goToAdminProducts(page);
  await page.getByText('Novel').first().click();
  await expect(page.locator('body')).toContainText('Update Product');
};

// change category helper
const changeCategory = async (page, from, to) => {
  await page.getByTitle(from).click();
  await page.getByText(to).nth(1).click();
};

test.describe('Admin Update Product UI Tests', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('admin can update and revert Novel product', async ({ page }) => {

    await openNovel(page);

    await changeCategory(page, ORIGINAL.category, UPDATED.category);

    await page.getByPlaceholder('write a name').fill(UPDATED.name);
    await page.getByPlaceholder('write a description').fill(UPDATED.description);

    await page.getByRole('button', { name: 'UPDATE PRODUCT' }).click();
    await page.waitForTimeout(1500);


    await goToAdminProducts(page);
    await expect(page.locator('body')).toContainText(UPDATED.name);


    await openNovel(page);

    await changeCategory(page, UPDATED.category, ORIGINAL.category);

    await page.getByPlaceholder('write a name').fill(ORIGINAL.name);
    await page.getByPlaceholder('write a description').fill(ORIGINAL.description);

    await page.getByRole('button', { name: 'UPDATE PRODUCT' }).click();
    await page.waitForTimeout(1500);

    // verify revert
    await goToAdminProducts(page);
    await expect(page.locator('body')).toContainText(ORIGINAL.name);
  });
});