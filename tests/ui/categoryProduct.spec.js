// Charles Lim Jun Wei, A0277527R

const { test, expect } = require('@playwright/test');

test.describe('CategoryProduct', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => {
            localStorage.clear();
            sessionStorage.clear();
        });
    });

    test('All Categories page loads and displays category links', async ({ page }) => {
        await page.getByRole('link', { name: 'Categories' }).click();
        await page.getByRole('link', { name: 'All Categories' }).click();

        await expect(page).toHaveURL(/\/categories$/);
        await expect(page.getByRole('link', { name: 'Electronics' })).toBeVisible();
        await expect(page.getByRole('link', { name: 'Book' })).toBeVisible();
        await expect(page.getByRole('link', { name: 'Clothing' })).toBeVisible();
    });

    test('Selecting a category navigates to /category/:slug', async ({ page }) => {
        await page.getByRole('link', { name: 'Categories' }).click();
        await page.getByRole('link', { name: 'Electronics' }).click();

        await expect(page).toHaveURL(/\/category\/electronics$/);
        await expect(page.getByText(/Category - Electronics/i)).toBeVisible();
    });

    test('Category page displays category info and product cards', async ({ page }) => {
        await page.getByRole('link', { name: 'Categories' }).click();
        await page.getByRole('link', { name: 'Electronics' }).click();

        await expect(page.getByText(/Category - Electronics/i)).toBeVisible();
        await expect(page.getByText(/\d+\s+result found/i)).toBeVisible();

        const cards = page.locator('.card');
        await expect(cards.first()).toBeVisible();
        await expect(page.getByRole('button', { name: 'More Details' }).first()).toBeVisible();
    });

    test('CategoryProduct Display: each product card shows image, name, description, and price', async ({ page }) => {
        await page.getByRole('link', { name: 'Categories' }).click();
        await page.getByRole('link', { name: 'Electronics' }).click();

        const firstCard = page.locator('.card').first();
        const titles = firstCard.locator('.card-title');

        await expect(firstCard).toBeVisible();

        await expect(firstCard.locator('img')).toBeVisible();

        await expect(titles.first()).toBeVisible();

        await expect(titles.nth(1)).toBeVisible();
        await expect(titles.nth(1)).toContainText('$');

        await expect(firstCard.locator('.card-text')).toBeVisible();
    });

    test('Clicking More Details navigates to product details page', async ({ page }) => {
        await page.getByRole('link', { name: 'Categories' }).click();
        await page.getByRole('link', { name: 'Electronics' }).click();

        await page.getByRole('button', { name: 'More Details' }).first().click();

        await expect(page).toHaveURL(/\/product\//);
        await expect(page.getByRole('heading', { name: 'Product Details' })).toBeVisible();
    });

    test('Direct access to category route works', async ({ page }) => {
        await page.goto('/category/electronics');

        await expect(page.getByText(/Category - Electronics/i)).toBeVisible();
        await expect(page.locator('.card').first()).toBeVisible();
    });
});
