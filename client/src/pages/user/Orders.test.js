// Charles Lim Jun Wei, A0277527R
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import axios from 'axios';
import Orders from './Orders';
import { useAuth } from '../../context/auth';

jest.mock('axios');
jest.mock('../../context/auth');
jest.mock('../../components/UserMenu', () => {
    return function UserMenu() {
        return <div data-testid="user-menu">User Menu</div>;
    };
});
jest.mock('../../components/Layout', () => {
    return function Layout({ children, title }) {
        return (
            <div data-testid="layout" data-title={title}>
                {children}
            </div>
        );
    };
});
jest.mock('moment', () => {
    const actualMoment = jest.requireActual('moment');
    return jest.fn((date) => actualMoment(date));
});

describe('Orders Component', () => {
    let mockAuth;

    beforeEach(() => {
        jest.clearAllMocks();

        mockAuth = {
            token: 'test-token',
            user: {
                _id: 'user123',
                name: 'Test User',
            },
        };

        useAuth.mockReturnValue([mockAuth, jest.fn()]);
    });

    const renderOrders = () => {
        return render(
            <MemoryRouter>
                <Orders />
            </MemoryRouter>
        );
    };

    describe('Component Rendering', () => {
        // Charles Lim Jun Wei, A0277527R
        test('should render layout with correct title', () => {
            axios.get.mockResolvedValue({ data: [] });

            renderOrders();

            const layout = screen.getByTestId('layout');
            expect(layout).toHaveAttribute('data-title', 'Your Orders');
        });

        // Charles Lim Jun Wei, A0277527R
        test('should render UserMenu component', () => {
            axios.get.mockResolvedValue({ data: [] });

            renderOrders();

            expect(screen.getByTestId('user-menu')).toBeInTheDocument();
        });

        // Charles Lim Jun Wei, A0277527R
        test('should render "All Orders" heading', () => {
            axios.get.mockResolvedValue({ data: [] });

            renderOrders();

            expect(screen.getByRole('heading', { name: /all orders/i })).toBeInTheDocument();
        });
    });

    describe('Data Fetching', () => {
        // Charles Lim Jun Wei, A0277527R
        test('should fetch orders when auth token exists', async () => {
            const mockOrders = [
                {
                    _id: 'order1',
                    status: 'Processing',
                    buyer: { _id: 'user123', name: 'John Doe' },
                    createAt: new Date('2025-01-01'),
                    payment: { success: true },
                    products: [],
                },
            ];

            axios.get.mockResolvedValue({ data: mockOrders });

            renderOrders();

            await waitFor(() => {
                expect(axios.get).toHaveBeenCalledWith('/api/v1/auth/orders');
            });
        });

        // Charles Lim Jun Wei, A0277527R
        test('should not fetch orders when auth token is missing', () => {
            useAuth.mockReturnValue([{ token: null }, jest.fn()]);

            renderOrders();

            expect(axios.get).not.toHaveBeenCalled();
        });

        // Charles Lim Jun Wei, A0277527R
        test('should handle API errors gracefully', async () => {
            const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
            const mockError = new Error('Network error');

            axios.get.mockRejectedValue(mockError);

            renderOrders();

            await waitFor(() => {
                expect(consoleLogSpy).toHaveBeenCalledWith(mockError);
            });

            consoleLogSpy.mockRestore();
        });
    });

    describe('Orders Display', () => {
        // Charles Lim Jun Wei, A0277527R
        test('should display multiple orders', async () => {
            const mockOrders = [
                {
                    _id: 'order1',
                    status: 'Processing',
                    buyer: { _id: 'user123', name: 'John Doe' },
                    createAt: new Date('2024-01-15'),
                    payment: { success: true },
                    products: [],
                },
                {
                    _id: 'order2',
                    status: 'Shipped',
                    buyer: { _id: 'user456', name: 'Jane Smith' },
                    createAt: new Date('2024-01-20'),
                    payment: { success: false },
                    products: [],
                },
            ];

            axios.get.mockResolvedValue({ data: mockOrders });

            renderOrders();

            await waitFor(() => {
                expect(screen.getByText('Processing')).toBeInTheDocument();
                expect(screen.getByText('Shipped')).toBeInTheDocument();
                expect(screen.getByText('John Doe')).toBeInTheDocument();
                expect(screen.getByText('Jane Smith')).toBeInTheDocument();
            });
        });

        // Charles Lim Jun Wei, A0277527R
        test('should display payment failed status', async () => {
            const mockOrders = [
                {
                    _id: 'order1',
                    status: 'Processing',
                    buyer: { name: 'John Doe' },
                    createAt: new Date(),
                    payment: { success: false },
                    products: [],
                },
            ];

            axios.get.mockResolvedValue({ data: mockOrders });

            renderOrders();

            await waitFor(() => {
                expect(screen.getByText('Failed')).toBeInTheDocument();
            });
        });
    });

    describe('Products Display', () => {
        // Charles Lim Jun Wei, A0277527R
        test('should display multiple products in an order', async () => {
            const mockOrders = [
                {
                    _id: 'order1',
                    status: 'Processing',
                    buyer: { name: 'John Doe' },
                    createAt: new Date(),
                    payment: { success: true },
                    products: [
                        {
                            _id: 'product1',
                            name: 'Laptop',
                            description: 'High performance laptop',
                            price: 999,
                        },
                        {
                            _id: 'product2',
                            name: 'Mouse',
                            description: 'Wireless gaming mouse',
                            price: 29,
                        },
                    ],
                },
            ];

            axios.get.mockResolvedValue({ data: mockOrders });

            renderOrders();

            await waitFor(() => {
                expect(screen.getByText('Laptop')).toBeInTheDocument();
                expect(screen.getByText('Mouse')).toBeInTheDocument();
                expect(screen.getByText(/Price : 999/)).toBeInTheDocument();
                expect(screen.getByText(/Price : 29/)).toBeInTheDocument();
            });
        });

        // Charles Lim Jun Wei, A0277527R
        test('should display product images with correct src', async () => {
            const mockOrders = [
                {
                    _id: 'order1',
                    status: 'Processing',
                    buyer: { name: 'John Doe' },
                    createAt: new Date(),
                    payment: { success: true },
                    products: [
                        {
                            _id: 'product123',
                            name: 'Laptop',
                            description: 'Gaming laptop',
                            price: 999,
                        },
                    ],
                },
            ];

            axios.get.mockResolvedValue({ data: mockOrders });

            renderOrders();

            await waitFor(() => {
                const img = screen.getByAltText('Laptop');
                expect(img).toHaveAttribute('src', '/api/v1/product/product-photo/product123');
            });
        });
    });

    describe('Empty State', () => {
        // Charles Lim Jun Wei, A0277527R
        test('should handle empty orders array', async () => {
            axios.get.mockResolvedValue({ data: [] });

            renderOrders();

            await waitFor(() => {
                expect(screen.getByRole('heading', { name: /all orders/i })).toBeInTheDocument();
            });

            expect(screen.queryByRole('table')).not.toBeInTheDocument();
        });
    });
});
