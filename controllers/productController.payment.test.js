// Charles Lim Jun Wei, A0277527R
// mock before importing controllers which will initialize gateway
jest.mock('braintree');
jest.mock('../models/orderModel.js');

const mockGateway = {
    clientToken: {
        generate: jest.fn(),
    },
    transaction: {
        sale: jest.fn(),
    },
};

const braintree = require('braintree');
braintree.BraintreeGateway = jest.fn().mockReturnValue(mockGateway);
braintree.Environment = { Sandbox: 'sandbox' };

const { brainTreePaymentController, braintreeTokenController } = require('./productController');
const orderModel = require('../models/orderModel.js').default;

describe('BrainTree Payment Controllers', () => {
    let req, res, consoleLogSpy;

    beforeEach(() => {
        jest.clearAllMocks();

        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

        req = {
            user: { _id: 'user123' },
            body: {},
        };

        res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
            json: jest.fn(),
        };
    });

    afterEach(() => {
        consoleLogSpy.mockRestore();
    });

    describe('braintreeTokenController', () => {
        // Charles Lim Jun Wei, A0277527R
        test('should generate and return client token successfully', async () => {
            const mockToken = {
                clientToken: 'abc123'
            };

            mockGateway.clientToken.generate.mockImplementation((options, callback) => {
                callback(null, mockToken);
            });

            await braintreeTokenController(req, res);

            expect(mockGateway.clientToken.generate).toHaveBeenCalledWith(
                {},
                expect.any(Function)
            );
            expect(res.send).toHaveBeenCalledWith(mockToken);
        });

        // Charles Lim Jun Wei, A0277527R
        test('should handle error when token generation fails', async () => {
            const mockError = new Error('Failed to generate client token');

            mockGateway.clientToken.generate.mockImplementation((options, callback) => {
                callback(mockError, null);
            });

            await braintreeTokenController(req, res);

            expect(mockGateway.clientToken.generate).toHaveBeenCalledWith(
                {},
                expect.any(Function)
            );
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith(mockError);
        });

        // Charles Lim Jun Wei, A0277527R
        test('should handle error in try-catch block', async () => {
            const mockError = new Error('Unexpected error');

            mockGateway.clientToken.generate.mockImplementation(() => {
                throw mockError;
            });

            await braintreeTokenController(req, res);

            expect(consoleLogSpy).toHaveBeenCalledWith(mockError);
        });
    });

    describe('brainTreePaymentController', () => {
        let mockSave;

        beforeEach(() => {
            mockSave = jest.fn().mockResolvedValue({ _id: 'order999' });
            orderModel.mockImplementation(() => ({
                save: mockSave,
            }));
        });

        // Charles Lim Jun Wei, A0277527R
        test('should process payment successfully and save order', async () => {
            const mockNonce = 'nonce';
            const mockCart = [ { price: 10 }, { price: 20 }, { price: 30 }];
            const mockTxnResult = {
                success: true,
                transaction: {
                    id: 'txn123',
                }
            };

            req.body = {
                nonce: mockNonce,
                cart: mockCart
            };

            mockGateway.transaction.sale.mockImplementation((options, callback) => {
                callback(null, mockTxnResult);
            });

            await brainTreePaymentController(req, res);

            expect(mockGateway.transaction.sale).toHaveBeenCalledWith(
                expect.objectContaining({
                    amount: 60,
                    paymentMethodNonce: mockNonce,
                    options: {
                        submitForSettlement: true,
                    },
                }),
                expect.any(Function),
            );
            expect(orderModel).toHaveBeenCalledWith(
                expect.objectContaining({
                    products: mockCart,
                    payment: mockTxnResult,
                    buyer: 'user123',
                }),
            );
            expect(mockSave).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith({ ok: true });
        });

        // Charles Lim Jun Wei, A0277527R
        test('should handle payment processing errors', async () => {
            const mockNonce = 'nonce';
            const mockCart = [{ price: 10 }];
            const mockError = new Error('Payment declined');

            const req = {
                user: {
                    _id: 'user123',
                },
                body: {
                    nonce: mockNonce,
                    cart: mockCart
                },
            };

            mockGateway.transaction.sale.mockImplementation((options, callback) => {
                callback(mockError, null);
            });

            await brainTreePaymentController(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith(mockError);
            expect(res.json).not.toHaveBeenCalled();
            expect(orderModel).not.toHaveBeenCalled();
        });

        // Charles Lim Jun Wei, A0277527R
        test('should handle error in try-catch blocks', async () => {
            const mockNonce = 'nonce';
            const mockCart = [{ price: 10 }];

            const req = {
                user: {
                    _id: 'user123',
                },
                body: {
                    nonce: mockNonce,
                    cart: mockCart
                },
            };

            const mockError = new Error('Unexpected error');

            mockGateway.transaction.sale.mockImplementation(() => {
                throw mockError;
            });

            await brainTreePaymentController(req, res);

            expect(consoleLogSpy).toHaveBeenCalledWith(mockError);
        });
    });
});
