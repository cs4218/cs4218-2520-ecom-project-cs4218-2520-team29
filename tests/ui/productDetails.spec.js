// Charles Lim Jun Wei, A0277527R

const { test, expect } = require('@playwright/test');

test.describe('Product Details Page', () => {
    const PRODUCT_SLUG = 'laptop';
    const NO_RELATED_PRODUCT = 'unique-product';

    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => {
            localStorage.clear();
            sessionStorage.clear();
        });
    });

    test('Displays product information when product details page loads', async ({ page }) => {
        await page.goto(`/product/${PRODUCT_SLUG}`);

        await expect(page).toHaveURL(new RegExp(`/product/${PRODUCT_SLUG}$`));
        await expect(page.getByRole('heading', { name: 'Product Details' })).toBeVisible();

        await expect(page.locator('.product-details img')).toBeVisible();
        await expect(page.getByText(/Name :/i)).toBeVisible();
        await expect(page.getByText(/Description :/i)).toBeVisible();
        await expect(page.getByText(/Price :/i)).toBeVisible();
        await expect(page.getByText(/Category :/i)).toBeVisible();
    });

    test('Shows an active Add to Cart button on the product page', async ({ page }) => {
        await page.goto(`/product/${PRODUCT_SLUG}`);

        const addButton = page.getByRole('button', { name: 'ADD TO CART' });

        await expect(addButton).toBeVisible();
        await expect(addButton).toBeEnabled();
    });

    test('Updates cart indicator after adding a product to cart', async ({ page }) => {
        await page.goto(`/product/${PRODUCT_SLUG}`);

        await page.getByRole('button', { name: 'ADD TO CART' }).click();

        await expect(page.getByTitle('1')).toBeVisible();
    });

    test('Displays the Similar Products section on the page', async ({ page }) => {
        await page.goto(`/product/${PRODUCT_SLUG}`);

        await expect(page.getByRole('heading', { name: /Similar Products/i })).toBeVisible();
    });

    test('Navigates to another product when selecting a related item', async ({ page }) => {
        await page.goto(`/product/${PRODUCT_SLUG}`);

        const relatedButtons = page.getByRole('button', { name: 'More Details' });
        const buttonCount = await relatedButtons.count();

        if (buttonCount > 0) {
            await expect(relatedButtons.first()).toBeVisible();

            await relatedButtons.first().click();

            await expect(page).toHaveURL(/\/product\//);
            await expect(page.getByRole('heading', { name: 'Product Details' })).toBeVisible();
        } else {
            await expect(page.getByText('No Similar Products found')).toBeVisible();
        }
    });

    test('Shows empty state message when no related products are available', async ({ page }) => {
        await page.goto(`/product/${NO_RELATED_PRODUCT}`);

        await expect(page).toHaveURL(new RegExp(`/product/${NO_RELATED_PRODUCT}$`));
        await expect(page.getByRole('heading', { name: 'Product Details' })).toBeVisible();
        await expect(page.getByText('No Similar Products found')).toBeVisible();
    });

    test('Allows direct navigation to product page via URL', async ({ page }) => {
        await page.goto(`/product/${PRODUCT_SLUG}`);

        await expect(page.locator('body')).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Product Details' })).toBeVisible();
    });
});
