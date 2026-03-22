// Charles Lim Jun Wei, A0277527R

/*
Integration testing for Orders and its related components.

It verifies the interaction between the Orders API endpoint, authentication middleware, Orders controllers logic,
and Orders database model when retrieving user-specific orders.

Incremental top-down approach is used:
(top) API endpoint -> middleware -> controller -> model -> DB (down)

The tests simulated an authenticated request which is processed by the middle to verify the JWT token and attach user
information to the request. The controller then queries the database for orders associated with the authenticated user
and returns the results.

The tests verify that authentication is correctly enforced, only the relevant user's orders are retrieved and the
response structure is correct. Unauthorized requests are also validated to ensure they are rejected before reaching
the controller.

Internal modules are kept real to preserve integration behaviour. Only JWT tokens are generated directly to simulate
authentication without invoking the full login workflow (since its being tested elsewhere).
 */

import request from "supertest";
import mongoose from "mongoose";
import JWT from "jsonwebtoken";
import { MongoMemoryServer } from "mongodb-memory-server";
import server from "../../server.js";
import orderModel from "../../models/orderModel";
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

// Creates a user in DB with a signed JWT
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

const fakeProductId = () => new mongoose.Types.ObjectId();

describe("GET /api/v1/auth/orders — getOrdersController", () => {
    // Charles Lim Jun Wei, A0277527R
    test("should return 200 and only the orders belonging to the authenticated buyer", async () => {
        const { user, token } = await createUserWithToken();
        const { user: otherUser } = await createUserWithToken({
            email: "other@test.com",
        });

        // one order for the tested user
        await orderModel.create({
            products: [fakeProductId()],
            payment: { method: "card" },
            buyer: user._id,
            status: "Not Process",
        });

        // one order for someone else
        await orderModel.create({
            products: [fakeProductId()],
            payment: { method: "card" },
            buyer: otherUser._id,
            status: "Processing",
        });

        const res = await request(server)
            .get("/api/v1/auth/orders")
            .set("Authorization", token);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body).toHaveLength(1);
        expect(res.body[0].buyer.name).toBe(user.name); // populate("buyer","name") worked
        expect(res.body[0].buyer._id).toBe(user._id.toString());
    });
    // Charles Lim Jun Wei, A0277527R
    test("should return an empty array when the authenticated user has no orders", async () => {
        const { token } = await createUserWithToken({ email: "noorders@test.com" });

        const res = await request(server)
            .get("/api/v1/auth/orders")
            .set("Authorization", token);

        expect(res.status).toBe(200);
        expect(res.body).toEqual([]);
    });
    // Charles Lim Jun Wei, A0277527R
    test("should return 401 when no token is provided", async () => {
        const res = await request(server).get("/api/v1/auth/orders");

        expect(res.status).toBe(401);
    });
    // Charles Lim Jun Wei, A0277527R
    test("should not expose the photo field on populated products", async () => {
        const { user, token } = await createUserWithToken({
            email: "nophoto@test.com",
        });
        await orderModel.create({
            products: [fakeProductId()],
            payment: {},
            buyer: user._id,
        });

        const res = await request(server)
            .get("/api/v1/auth/orders")
            .set("Authorization", token);

        expect(res.status).toBe(200);
        // Each product entry (if populated) must not carry a photo field
        res.body.forEach((order) => {
            order.products.forEach((p) => {
                if (p && typeof p === "object") {
                    expect(p).not.toHaveProperty("photo");
                }
            });
        });
    });
});

describe("GET /api/v1/auth/all-orders — getAllOrdersController", () => {
    // Charles Lim Jun Wei, A0277527R
    test("should return 200 and all orders for an admin user, sorted newest first", async () => {
        const { token: adminToken } = await createUserWithToken({
            email: "admin@test.com",
            role: 1,
        });
        const { user: buyer } = await createUserWithToken({
            email: "buyer@test.com",
        });

        const first = await orderModel.create({
            products: [fakeProductId()],
            payment: {},
            buyer: buyer._id,
            status: "Not Process",
        });
        // Small delay to ensure different createdAt timestamps and have it sorted deterministically
        await new Promise((r) => setTimeout(r, 20));
        const second = await orderModel.create({
            products: [fakeProductId()],
            payment: {},
            buyer: buyer._id,
            status: "Processing",
        });

        const res = await request(server)
            .get("/api/v1/auth/all-orders")
            .set("Authorization", adminToken);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body).toHaveLength(2);

        expect(res.body[0]._id).toBe(second._id.toString());
        expect(res.body[1]._id).toBe(first._id.toString());
    });
    // Charles Lim Jun Wei, A0277527R
    test("should return 401 for a non-admin user", async () => {
        const { token } = await createUserWithToken({ email: "regular@test.com" });

        const res = await request(server)
            .get("/api/v1/auth/all-orders")
            .set("Authorization", token);

        expect(res.status).toBe(401);
    });
    // Charles Lim Jun Wei, A0277527R
    test("should return 401 when no token is provided", async () => {
        const res = await request(server).get("/api/v1/auth/all-orders");

        expect(res.status).toBe(401);
    });
    // Charles Lim Jun Wei, A0277527R
    test("should return an empty array when there are no orders in the DB", async () => {
        const { token: adminToken } = await createUserWithToken({
            email: "admin2@test.com",
            role: 1,
        });

        const res = await request(server)
            .get("/api/v1/auth/all-orders")
            .set("Authorization", adminToken);

        expect(res.status).toBe(200);
        expect(res.body).toEqual([]);
    });
    // Charles Lim Jun Wei, A0277527R
    test("should populate buyer name and exclude product photo for all orders", async () => {
        const { token: adminToken } = await createUserWithToken({
            email: "admin3@test.com",
            role: 1,
        });
        const { user: buyer } = await createUserWithToken({
            email: "buyerpop@test.com",
        });

        await orderModel.create({
            products: [fakeProductId()],
            payment: {},
            buyer: buyer._id,
        });

        const res = await request(server)
            .get("/api/v1/auth/all-orders")
            .set("Authorization", adminToken);

        expect(res.status).toBe(200);
        expect(res.body[0].buyer.name).toBe(buyer.name);
        res.body[0].products.forEach((p) => {
            if (p && typeof p === "object") {
                expect(p).not.toHaveProperty("photo");
            }
        });
    });
});

describe("PUT /api/v1/auth/order-status/:orderId — orderStatusController", () => {
    // Charles Lim Jun Wei, A0277527R
    test("should update the order status and return the updated order for admin", async () => {
        const { token: adminToken } = await createUserWithToken({
            email: "admin4@test.com",
            role: 1,
        });
        const { user: buyer } = await createUserWithToken({
            email: "buyerstatus@test.com",
        });

        const order = await orderModel.create({
            products: [fakeProductId()],
            payment: {},
            buyer: buyer._id,
            status: "Not Process",
        });

        const res = await request(server)
            .put(`/api/v1/auth/order-status/${order._id}`)
            .set("Authorization", adminToken)
            .send({ status: "Processing" });

        expect(res.status).toBe(200);
        expect(res.body.status).toBe("Processing");
        expect(res.body._id).toBe(order._id.toString());

        const updated = await orderModel.findById(order._id);
        expect(updated.status).toBe("Processing");
    });
    // Charles Lim Jun Wei, A0277527R
    test("should return 401 when a non-admin tries to update order status", async () => {
        const { token } = await createUserWithToken({
            email: "regularstatus@test.com",
        });
        const order = await orderModel.create({
            products: [fakeProductId()],
            payment: {},
            buyer: new mongoose.Types.ObjectId(),
            status: "Not Process",
        });

        const res = await request(server)
            .put(`/api/v1/auth/order-status/${order._id}`)
            .set("Authorization", token)
            .send({ status: "Shipped" });

        expect(res.status).toBe(401);
    });
    // Charles Lim Jun Wei, A0277527R
    test("should return 401 when no token is provided", async () => {
        const orderId = new mongoose.Types.ObjectId();
        const res = await request(server)
            .put(`/api/v1/auth/order-status/${orderId}`)
            .send({ status: "Shipped" });

        expect(res.status).toBe(401);
    });
});
