// Charles Lim Jun Wei, A0277527R

/*
Integration test for Auth → Orders workflow.

Verifies that a user who authenticates through the real login endpoint receives a valid token, and that token is
accepted by the authentication middleware to access the Orders controller.

This covers the two components not exercised by the orders integration tests:
  - Login endpoint
  - Token generation logic inside the login controller

The orders integration tests bypass these by calling JWT.sign() directly.
This test closes that gap by using the real login flow end-to-end.
*/

import request from "supertest";
import mongoose from "mongoose";
import { hashPassword } from "../../helpers/authHelper.js";
import { MongoMemoryServer } from "mongodb-memory-server";
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
});

const TEST_PASSWORD = "password123";

const seedUser = async (overrides = {}) => {
    const hashed = await hashPassword(TEST_PASSWORD);
    const user = await userModel.create({
        name: "Test User",
        email: `user_${Date.now()}_${Math.random()}@test.com`,
        password: hashed,
        phone: "12345678",
        address: "123 Test Street",
        answer: "test",
        role: 0,
        ...overrides,
    });
    return user;
};

const fakeProductId = () => new mongoose.Types.ObjectId();

describe("Integration: Auth → Orders (login endpoint → token → getOrders)", () => {
    // Charles Lim Jun Wei, A0277527R
    test("token from login endpoint grants access to the Orders route", async () => {
        const user = await seedUser();

        // Step 1: login through the real endpoint. Tests the login controller and its token generation logic
        const loginRes = await request(server)
            .post("/api/v1/auth/login")
            .send({ email: user.email, password: TEST_PASSWORD });

        expect(loginRes.status).toBe(200);
        expect(loginRes.body.token).toBeDefined();

        const token = loginRes.body.token;

        // Step 2: seed an order for this user
        await orderModel.create({
            products: [fakeProductId()],
            payment: {},
            buyer: user._id,
            status: "Not Process",
        });

        // Step 3: use the login-issued token to access the Orders endpoint
        const ordersRes = await request(server)
            .get("/api/v1/auth/orders")
            .set("Authorization", token);

        expect(ordersRes.status).toBe(200);
        expect(Array.isArray(ordersRes.body)).toBe(true);
        expect(ordersRes.body).toHaveLength(1);
        expect(ordersRes.body[0].buyer._id).toBe(user._id.toString());
    });

    // Charles Lim Jun Wei, A0277527R
    test("wrong password at login does not produce a usable token", async () => {
        const user = await seedUser();

        const loginRes = await request(server)
            .post("/api/v1/auth/login")
            .send({ email: user.email, password: "wrongpassword" });

        expect(loginRes.status).not.toBe(200);
        expect(loginRes.body.token).toBeUndefined();
    });

    // Charles Lim Jun Wei, A0277527R
    test("unauthenticated request to Orders is rejected without a login token", async () => {
        const ordersRes = await request(server).get("/api/v1/auth/orders");

        expect(ordersRes.status).toBe(401);
    });
});
