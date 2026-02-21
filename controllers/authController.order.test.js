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
});
