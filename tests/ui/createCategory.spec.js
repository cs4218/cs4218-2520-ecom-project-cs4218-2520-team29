// Dexter Wong Xing You A0255437Y

import { test, expect } from '@playwright/test';

const admin = {
  email: 'admin@gmail.com',
  password: 'Admin123!',
};

const uniqueCategory = () => `Category_${Date.now()}`;

const loginAsAdmin = async (page) => {
  await page.goto('http://localhost:3000/login');

  await page.getByRole('textbox', { name: 'Enter Your Email' }).fill(admin.email);
  await page.getByRole('textbox', { name: 'Enter Your Password' }).fill(admin.password);
  await page.getByRole('button', { name: 'LOGIN' }).click();

  await expect(page.getByText('VIRTUAL VAULT')).toBeVisible();
};

const goToCategoryPage = async (page) => {
  await page.goto('http://localhost:3000/dashboard/admin/create-category');
  await expect(page.getByText('Manage Category')).toBeVisible();
};

test.describe('Admin Create Category UI Tests', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(60000);
    await loginAsAdmin(page);
    await goToCategoryPage(page);
  });

  test('page loads with required elements', async ({ page }) => {
    await expect(page.getByText('Manage Category')).toBeVisible();
    await expect(page.getByPlaceholder('Enter new category')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Submit' })).toBeVisible();
  });

  test('admin can create a new category successfully', async ({ page }) => {
    const name = uniqueCategory();

    await page.getByPlaceholder('Enter new category').fill(name);
    await page.getByRole('button', { name: 'Submit' }).click();

    await expect(page.locator('table')).toContainText(name);
  });

  test('creating category with empty input should stay on category page', async ({ page }) => {
    await page.getByRole('button', { name: 'Submit' }).click();

    await expect(page).toHaveURL(/create-category/);
    await expect(page.getByText('Manage Category')).toBeVisible();
  });

  test('admin can edit an existing category', async ({ page }) => {
    const name = uniqueCategory();
    const updated = `${name}_Updated`;

    await page.getByPlaceholder('Enter new category').fill(name);
    await page.getByRole('button', { name: 'Submit' }).click();
    await expect(page.locator('table')).toContainText(name);

    await page.getByRole('button', { name: 'Edit' }).last().click();

    const dialogInput = page.getByRole('dialog').getByPlaceholder('Enter new category');
    await dialogInput.fill(updated);
    await page.getByRole('dialog').getByRole('button', { name: 'Submit' }).click();

    await expect(page.locator('table')).toContainText(updated);
  });

  test('admin can delete a category', async ({ page }) => {
    const name = uniqueCategory();

    await page.getByPlaceholder('Enter new category').fill(name);
    await page.getByRole('button', { name: 'Submit' }).click();

    const categoryRow = page.locator('tr', { hasText: name });
    await expect(categoryRow).toBeVisible();

    await categoryRow.getByRole('button', { name: 'Delete' }).click();

    await page.waitForTimeout(1000);

    await expect(page.locator('tr', { hasText: name })).toHaveCount(0);
  });

  test('edited category remains visible after update', async ({ page }) => {
    const name = uniqueCategory();
    const updated = `${name}_Final`;

    await page.getByPlaceholder('Enter new category').fill(name);
    await page.getByRole('button', { name: 'Submit' }).click();
    await expect(page.getByText(name).first()).toBeVisible();

    await page.getByRole('button', { name: 'Edit' }).last().click();

    const dialogInput = page.getByRole('dialog').getByPlaceholder('Enter new category');
    await dialogInput.fill(updated);

    await page
        .getByRole('dialog')
        .getByRole('button', { name: 'Submit' })
        .click();

    await expect(page.getByText(updated).first()).toBeVisible();
  });
});