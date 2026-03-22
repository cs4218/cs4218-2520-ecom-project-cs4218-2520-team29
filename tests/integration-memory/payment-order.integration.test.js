// Charles Lim Jun Wei, A0277527R

/*
Integration testing for Payment -> Orders workflow (Success and failure paths).

It verifies the interaction between the BrainTree payment routes, authentication middleware, Payment controller logic,
mocked Braintree gateway, and Orders database model. The two controllers tested are brainTreePaymentController and
braintreeTokenController.

Top-down approach is used:
(top) API endpoint -> middleware -> payment controller -> payment gateway / Order model -> DB (down)

The tests simulate requests to the Braintree token and payment endpoints. For payment requests, the middleware
verifies the JWT token and attaches user information to the request. The controller then calculates the cart total,
invokes the Braintree gateway, and creates an order record in the database when payment succeeds.

The tests verify correct token generation behaviour, correct cart total submission, successful order creation on
payment success, no order creation on payment failure, proper rejection of unauthenticated requests, and correct
buyer association for orders created by different authenticated users.

Only the external Braintree service is mocked because it is a third-party network dependency.
*/

import request from "supertest";
import mongoose from "mongoose";
import JWT from "jsonwebtoken";
import { MongoMemoryServer } from "mongodb-memory-server";

const mockSale = jest.fn();
const mockGenerate = jest.fn();

beforeEach(() => {
    jest.clearAllMocks();
});

jest.mock("braintree", () => ({
    BraintreeGateway: jest.fn(() => ({
        transaction: { sale: mockSale },
        clientToken: { generate: mockGenerate },
    })),
    Environment: { Sandbox: "sandbox" },
}));

import server from "../../server.js";
import orderModel from "../../models/orderModel.js";
import userModel from "../../models/userModel.js";

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

afterEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        await collections[key].deleteMany({});
    }
    jest.clearAllMocks();
});


const createUserWithToken = async (overrides = {}) => {
    const user = await userModel.create({
        name: "Test User",
        email: `user_${Date.now()}_${Math.random()}@test.com`,
        password: "hashedpassword",
        phone: "12345678",
        address: "123 Test Street",
        answer: "test",
        role: 0,
        ...overrides,
    });
    const token = JWT.sign({ _id: user._id }, process.env.JWT_SECRET);
    return { user, token };
};

// A minimal cart
const makeCartItem = (overrides = {}) => ({
    _id: new mongoose.Types.ObjectId().toString(),
    name: "Test Product",
    price: 29.99,
    description: "A test product",
    ...overrides,
});

const successResult = {
    success: true,
    transaction: {
        id: "txn_test_123",
        amount: "29.99",
        status: "submitted_for_settlement",
    },
};

describe("GET /api/v1/product/braintree/token — braintreeTokenController", () => {
    // Charles Lim Jun Wei, A0277527R
    test("should return 200 and a clientToken when Braintree generates successfully", async () => {
        mockGenerate.mockImplementation((opts, cb) =>
            cb(null, { clientToken: "fake-client-token-abc" })
        );

        const res = await request(server).get("/api/v1/product/braintree/token");

        expect(res.status).toBe(200);
        expect(res.body.clientToken).toBe("fake-client-token-abc");
    });
    // Charles Lim Jun Wei, A0277527R
    test("should return 500 when Braintree token generation fails", async () => {
        mockGenerate.mockImplementation((opts, cb) =>
            cb({ message: "Gateway unavailable" }, null)
        );

        const res = await request(server).get("/api/v1/product/braintree/token");

        expect(res.status).toBe(500);
    });
});

describe("POST /api/v1/product/braintree/payment — brainTreePaymentController", () => {
    // Charles Lim Jun Wei, A0277527R
    test("should return 200, save order to DB, and set buyer correctly on success", async () => {
        const { user, token } = await createUserWithToken();
        const cartItems = [makeCartItem({ price: 10 }), makeCartItem({ price: 20 })];

        mockSale.mockImplementation((opts, cb) => cb(null, successResult));

        const res = await request(server)
            .post("/api/v1/product/braintree/payment")
            .set("Authorization", token)
            .send({ nonce: "fake-nonce", cart: cartItems });

        expect(res.status).toBe(200);
        expect(res.body.ok).toBe(true);

        const orders = await orderModel.find({});
        expect(orders).toHaveLength(1);

        const savedOrder = orders[0];
        // Buyer is set to the authenticated user
        expect(savedOrder.buyer.toString()).toBe(user._id.toString());
        // Products array matches cart length
        expect(savedOrder.products).toHaveLength(cartItems.length);
        // Payment result
        expect(savedOrder.payment).toBeDefined();
        expect(savedOrder.payment.transaction.id).toBe("txn_test_123");
        // Status
        expect(savedOrder.status).toBe("Not Process");
    });
    // Charles Lim Jun Wei, A0277527R
    test("should charge the correct total amount to Braintree", async () => {
        const { token } = await createUserWithToken({ email: "total@test.com" });
        const cartItems = [
            makeCartItem({ price: 15.5 }),
            makeCartItem({ price: 4.5 }),
        ];

        mockSale.mockImplementation((opts, cb) => cb(null, successResult));

        await request(server)
            .post("/api/v1/product/braintree/payment")
            .set("Authorization", token)
            .send({ nonce: "fake-nonce", cart: cartItems });

        const saleArgs = mockSale.mock.calls[0][0];
        expect(saleArgs.amount).toBe(20);
        expect(saleArgs.options.submitForSettlement).toBe(true);
    });
    // Charles Lim Jun Wei, A0277527R
    test("should return 500 and NOT save any order when Braintree transaction fails", async () => {
        const { token } = await createUserWithToken({ email: "fail@test.com" });
        const cartItems = [makeCartItem({ price: 10 })];

        mockSale.mockImplementation((opts, cb) =>
            cb({ message: "Insufficient funds" }, null)
        );

        const res = await request(server)
            .post("/api/v1/product/braintree/payment")
            .set("Authorization", token)
            .send({ nonce: "bad-nonce", cart: cartItems });

        expect(res.status).toBe(500);

        const orderCount = await orderModel.countDocuments();
        expect(orderCount).toBe(0);
    });
    // Charles Lim Jun Wei, A0277527R
    test("should return 500 and NOT save any order when Braintree result is falsy", async () => {
        const { token } = await createUserWithToken({ email: "falsy@test.com" });

        mockSale.mockImplementation((opts, cb) => cb(null, null));

        const res = await request(server)
            .post("/api/v1/product/braintree/payment")
            .set("Authorization", token)
            .send({ nonce: "fake-nonce", cart: [makeCartItem()] });

        expect(res.status).toBe(500);
        expect(await orderModel.countDocuments()).toBe(0);
    });
    // Charles Lim Jun Wei, A0277527R
    test("should return 401 and NOT save any order when no auth token is provided", async () => {
        const res = await request(server)
            .post("/api/v1/product/braintree/payment")
            .send({ nonce: "fake-nonce", cart: [makeCartItem()] });

        expect(res.status).toBe(401);

        expect(mockSale).not.toHaveBeenCalled();

        // No order saved
        expect(await orderModel.countDocuments()).toBe(0);
    });
    // Charles Lim Jun Wei, A0277527R
    test("should return 401 and NOT save any order when token is invalid", async () => {
        const res = await request(server)
            .post("/api/v1/product/braintree/payment")
            .set("Authorization", "invalid.token.here")
            .send({ nonce: "fake-nonce", cart: [makeCartItem()] });

        expect(res.status).toBe(401);
        expect(mockSale).not.toHaveBeenCalled();
        expect(await orderModel.countDocuments()).toBe(0);
    });
    // Charles Lim Jun Wei, A0277527R
    test("should save separate orders for separate authenticated users", async () => {
        const { user: userA, token: tokenA } = await createUserWithToken({
            email: "usera@test.com",
        });
        const { user: userB, token: tokenB } = await createUserWithToken({
            email: "userb@test.com",
        });

        mockSale.mockImplementation((opts, cb) => cb(null, successResult));

        await request(server)
            .post("/api/v1/product/braintree/payment")
            .set("Authorization", tokenA)
            .send({ nonce: "nonce-a", cart: [makeCartItem({ price: 5 })] });

        await request(server)
            .post("/api/v1/product/braintree/payment")
            .set("Authorization", tokenB)
            .send({ nonce: "nonce-b", cart: [makeCartItem({ price: 10 })] });

        const orders = await orderModel.find({}).sort({ createdAt: 1 });
        expect(orders).toHaveLength(2);
        expect(orders[0].buyer.toString()).toBe(userA._id.toString());
        expect(orders[1].buyer.toString()).toBe(userB._id.toString());
    });
});
