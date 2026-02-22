import { updateProfileController, getOrdersController, getAllOrdersController, orderStatusController } from "./authController";

import userModel from "../models/userModel.js";
import orderModel from "../models/orderModel.js";
import { hashPassword } from "../helpers/authHelper.js";

jest.mock("../models/userModel.js");
jest.mock("../models/orderModel.js");
jest.mock("../helpers/authHelper.js");

describe('Auth Controllers', () => {
    let req, res;

    beforeEach(() => {
        jest.clearAllMocks();

        req = {
            user: { _id: 'user123' },
            body: {},
            params: {},
        };

        res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
            json: jest.fn(),
        };
    });

    describe('updateProfileController', () => {
        test('should reject password shorter than 6 characters', async () => {
            req.body = {
                password: '12345',
            };

            userModel.findById.mockResolvedValue({ _id: 'user123' });

            await updateProfileController(req, res);

            expect(userModel.findById).toHaveBeenCalledWith('user123');
            expect(res.json).toHaveBeenCalledWith({
                error: "Passsword is required and 6 character long"
            });
            expect(hashPassword).not.toHaveBeenCalled();
            expect(userModel.findByIdAndUpdate).not.toHaveBeenCalled();
        });

        test('should accept password with exactly 6 characters', async () => {
            const existingUser = {
                _id: 'user123',
                name: 'old name',
                email: 'old@example.com',
                password: 'oldHashedPassword',
                phone: '123456789',
                address: 'old address',
            };

            const updatedUser = {
                _id: 'user123',
                name: 'old name',
                email: 'old@example.com',
                password: 'newHashedPassword',
                phone: '123456789',
                address: 'old address',
            };

            req.body = {
                password: '123456',
            };

            userModel.findById.mockResolvedValue(existingUser);
            hashPassword.mockResolvedValue('newHashedPassword');
            userModel.findByIdAndUpdate.mockResolvedValue(updatedUser);

            await updateProfileController(req, res);

            expect(userModel.findById).toHaveBeenCalledWith('user123');
            expect(hashPassword).toHaveBeenCalledWith('123456');
            expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
                'user123',
                {
                    name: 'old name',
                    password: 'newHashedPassword',
                    phone: '123456789',
                    address: 'old address',
                },
                { new: true }
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalledWith({
                success: true,
                message: 'Profile Updated SUccessfully',
                updatedUser,
            });
        });

        test('should not hash password if not provided', async () => {
            const existingUser = {
                _id: 'user123',
                name: 'old name',
                email: 'old@example.com',
                password: 'oldHashedPassword',
                phone: '123456789',
                address: 'old address',
            };

            req.body = {
                name: 'new name',
            };

            userModel.findById.mockResolvedValue(existingUser);
            userModel.findByIdAndUpdate.mockResolvedValue(existingUser);

            await updateProfileController(req, res);

            expect(userModel.findById).toHaveBeenCalledWith('user123');
            expect(hashPassword).not.toHaveBeenCalled();
            expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
                'user123', expect.objectContaining({
                    password: 'oldHashedPassword',
                }),
                { new: true }
            );
        });

        test('should handle errors during password hashing', async () => {
            const existingUser = {
                _id: 'user123',
                name: 'old name',
                email: 'old@example.com',
                password: 'oldHashedPassword',
                phone: '123456789',
                address: 'old address',
            };

            req.body = {
                password: 'validPassword',
            };

            const error = new Error('Hashing failed')

            userModel.findById.mockResolvedValue(existingUser);
            hashPassword.mockRejectedValue(error);

            await updateProfileController(req, res);

            expect(userModel.findById).toHaveBeenCalledWith('user123');
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.send).toHaveBeenCalledWith({
                success: false,
                message: "Error WHile Update profile",
                error,
            });
            expect(userModel.findByIdAndUpdate).not.toHaveBeenCalledWith();
        });

        test('should update user profile with all fields', async () => {
            const existingUser = {
                _id: 'user123',
                name: 'old name',
                email: 'old@example.com',
                password: 'oldHashedPassword',
                phone: '123456789',
                address: 'old address',
            };

            const updatedUser = {
                _id: 'user123',
                name: 'new name',
                email: 'new@example.com',
                password: 'newHashedPassword',
                phone: '987654321',
                address: 'new address',
            };

            req.body = {
                name: 'new name',
                email: 'new@example.com',
                password: 'validPassword',
                phone: '987654321',
                address: 'new address',
            };

            userModel.findById.mockResolvedValue(existingUser);
            hashPassword.mockResolvedValue('newHashedPassword');
            userModel.findByIdAndUpdate.mockResolvedValue(updatedUser);

            await updateProfileController(req, res);

            expect(userModel.findById).toHaveBeenCalledWith('user123');
            expect(hashPassword).toHaveBeenCalledWith('validPassword');
            expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
                'user123',
                {
                    name: 'new name',
                    password: 'newHashedPassword',
                    phone: '987654321',
                    address: 'new address',
                },
                { new: true }
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalledWith({
                success: true,
                message: 'Profile Updated SUccessfully',
                updatedUser,
            });
        });

        // The updated field can be any of the fields (name, phone) except email
        test('should update only address and keep other field unchanged', async () => {
            const existingUser = {
                _id: 'user123',
                name: 'old name',
                email: 'old@example.com',
                password: 'oldHashedPassword',
                phone: '123456789',
                address: 'old address',
            };

            req.body = {
                address: 'new address',
            }

            userModel.findById.mockResolvedValue(existingUser);
            userModel.findByIdAndUpdate.mockResolvedValue({
                ...existingUser,
                address: 'new address',
            })

            await updateProfileController(req, res);

            expect(userModel.findById).toHaveBeenCalledWith('user123');
            expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
                'user123',
                {
                    name: 'old name',
                    password: 'oldHashedPassword',
                    phone: '123456789',
                    address: 'new address',
                },
                { new: true }
            );
        });

        test('should handle error during profile updating', async () => {
            const error = new Error("Database error");
            userModel.findById.mockRejectedValue(error);

            await updateProfileController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.send).toHaveBeenCalledWith({
                success: false,
                message: "Error WHile Update profile",
                error,
            });
        });
    });

    describe('getOrdersController', () => {
        test('should get all orders for a specific user', async () => {
            const mockOrders = [
                {
                    _id: 'order1',
                    buyer: {
                        _id: 'user123',
                        name: 'testUser123',
                    },
                    products: [{ _id: 'product1', name: 'Product 1', description: 'Description 1', price: 100}],
                    status: 'pending',
                },
                {
                    _id: 'order2',
                    buyer: {
                        _id: 'user123',
                        name: 'testUser123',
                    },
                    products: [{ _id: 'product2', name: 'Product 2', description: 'Description 2', price: 200}],
                    status: 'shipped',
                }
            ];

            const secondPopulate = jest.fn().mockResolvedValue(mockOrders);
            const firstPopulate = jest.fn().mockReturnValue({ populate: secondPopulate });

            orderModel.find.mockReturnValue({ populate: firstPopulate });

            await getOrdersController(req, res);

            expect(orderModel.find).toHaveBeenCalledWith({ buyer: 'user123' });
            expect(firstPopulate).toHaveBeenCalledWith('products', '-photo');
            expect(secondPopulate).toHaveBeenCalledWith('buyer', 'name');
            expect(res.json).toHaveBeenCalledWith(mockOrders);
        });

        test('should return empty array if user has no orders', async () => {
            const mockOrders = [];

            const secondPopulate = jest.fn().mockResolvedValue(mockOrders);
            const firstPopulate = jest.fn().mockReturnValue({ populate: secondPopulate });

            orderModel.find.mockReturnValue({ populate: firstPopulate });

            await getOrdersController(req, res);

            expect(orderModel.find).toHaveBeenCalledWith({ buyer: 'user123' });
            expect(res.json).toHaveBeenCalledWith([]);
        });

        test('should handle errors when fetching orders', async () => {
            const error = new Error('Database error');

            const secondPopulate = jest.fn().mockRejectedValue(error);
            const firstPopulate = jest.fn().mockReturnValue({ populate: secondPopulate });

            orderModel.find.mockReturnValue({ populate: firstPopulate });

            await getOrdersController(req, res);

            expect(orderModel.find).toHaveBeenCalledWith({ buyer: 'user123' });
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.status).toHaveBeenCalledTimes(1);
            expect(res.send).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: "Error WHile Geting Orders",
                    error: expect.any(Error),
                })
            );
            expect(res.send).toHaveBeenCalledTimes(1);
            expect(res.json).not.toHaveBeenCalled();
        });
    });

    describe('getAllOrdersController', () => {
        test('should return all orders sorted by creation date', async () => {
            const mockOrders = [
                {
                    _id: 'order1',
                    buyer: {
                        _id: 'user123',
                        name: 'testUser123',
                    },
                    products: [{ _id: 'product1', name: 'Product 1', description: 'Description 1', price: 100}],
                    status: 'pending',
                    createdAt: new Date('2025-01-01')
                },
                {
                    _id: 'order2',
                    buyer: {
                        _id: 'user456',
                        name: 'testUser456',
                    },
                    products: [{ _id: 'product2', name: 'Product 2', description: 'Description 2', price: 200}],
                    status: 'pending',
                    createdAt: new Date('2025-02-02')
                },
                {
                    _id: 'order3',
                    buyer: {
                        _id: 'user123',
                        name: 'testUser123',
                    },
                    products: [{ _id: 'product2', name: 'Product 3', description: 'Description 3', price: 300}],
                    status: 'pending',
                    createdAt: new Date('2025-03-03')
                }
            ];

            const sort = jest.fn().mockResolvedValue(mockOrders);
            const secondPopulate = jest.fn().mockReturnValue({ sort : sort });
            const firstPopulate = jest.fn().mockReturnValue({ populate: secondPopulate });

            orderModel.find.mockReturnValue({ populate: firstPopulate });

            await getAllOrdersController(req, res);

            expect(firstPopulate).toHaveBeenCalledWith('products', '-photo');
            expect(secondPopulate).toHaveBeenCalledWith('buyer', 'name');
            expect(sort).toHaveBeenCalledWith({ createdAt: '-1' });
            expect(res.json).toHaveBeenCalledWith(mockOrders);
        });

        test('should return empty array if there are no orders', async () => {
            const mockOrders = [];

            const sort = jest.fn().mockResolvedValue(mockOrders);
            const secondPopulate = jest.fn().mockReturnValue({ sort });
            const firstPopulate = jest.fn().mockReturnValue({ populate: secondPopulate });

            orderModel.find.mockReturnValue({ populate: firstPopulate });

            await getAllOrdersController(req, res);

            expect(res.json).toHaveBeenCalledWith([]);
        });

        test('should handle errors when fetching all orders', async () => {
            const error = new Error('Database error');

            const sort = jest.fn().mockRejectedValue(error);
            const secondPopulate = jest.fn().mockReturnValue({ sort: sort });
            const firstPopulate = jest.fn().mockReturnValue({ populate: secondPopulate });

            orderModel.find.mockReturnValue({ populate: firstPopulate });

            await getAllOrdersController(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.status).toHaveBeenCalledTimes(1);
            expect(res.send).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: "Error WHile Geting Orders",
                    error: expect.any(Error),
                })
            );
            expect(res.send).toHaveBeenCalledTimes(1);
            expect(res.json).not.toHaveBeenCalled();
        });
    });
});
