// Chia Jia Ye A0286580U
import JWT from "jsonwebtoken";
import { requireSignIn, isAdmin } from "./authMiddleware.js";
import userModel from "../models/userModel.js";

jest.mock("jsonwebtoken", () => ({
    verify: jest.fn(),
}));
jest.mock("../models/userModel", () => ({
    findById: jest.fn(),
}));

describe("authMiddleware", () => {
    let req, res, next;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, "log").mockImplementation(() => {});

        req = {
            headers: { authorization: "mockToken"},
            user: undefined,
        };

        res = {
            status: jest.fn(() => res),
            send: jest.fn(() => res),
        };

        next = jest.fn();
    });

    afterEach(() => {
        console.log.mockRestore();
    });

    describe("requireSignIn", () => {
        it("should verify token and call next on success", async () => {
            const decodedUser = { _id: "u1", role: 0 };
            JWT.verify.mockReturnValue(decodedUser);

            await requireSignIn(req, res, next);

            expect(JWT.verify).toHaveBeenCalledWith("mockToken", process.env.JWT_SECRET);
            expect(req.user).toEqual(decodedUser);
            expect(next).toHaveBeenCalled();
        });

        it("should call JWT.verify with undefined if authorization header is missing", async () => {
            req.headers.authorization = undefined;
            const error = new Error("jwt must be provided");
            JWT.verify.mockImplementation(() => { throw error; });

            await requireSignIn(req, res, next);

            expect(JWT.verify).toHaveBeenCalledWith(undefined, process.env.JWT_SECRET);
            expect(console.log).toHaveBeenCalledWith(error);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.send).toHaveBeenCalledWith({
                success: false,
                error: error,
                message: "Error in sign in verification",
            });
            expect(next).not.toHaveBeenCalled();
        });

        it("should log error and not call next if token verification fails", async () => {
            const error = new Error("Invalid token");
            JWT.verify.mockImplementation(() => { throw error; });

            await requireSignIn(req, res, next);

            expect(console.log).toHaveBeenCalledWith(error);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.send).toHaveBeenCalledWith({
                success: false,
                error: error,
                message: "Error in sign in verification",
            });
            expect(next).not.toHaveBeenCalled();
        });
    });

    describe("isAdmin", () => {
        it("should call next if user is admin", async () => {
            req.user = { _id: "adminId" };
            userModel.findById.mockResolvedValue({ role: 1 });

            await isAdmin(req, res, next);

            expect(userModel.findById).toHaveBeenCalledWith("adminId");
            expect(next).toHaveBeenCalledTimes(1);
            expect(res.status).not.toHaveBeenCalled();
            expect(res.send).not.toHaveBeenCalled();
        });

        it("should return 401 if user is not admin", async () => {
            req.user = { _id: "userId" };
            userModel.findById.mockResolvedValue({ role: 0 });

            await isAdmin(req, res, next);

            expect(userModel.findById).toHaveBeenCalledWith("userId");
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.send).toHaveBeenCalledWith({
                success: false,
                message: "Unauthorized Access",
            });
            expect(next).not.toHaveBeenCalled();
        });

        it("should return 401 is req.user is missing", async () => {
            req.user = undefined;
            await isAdmin(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.send).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: "Error in admin middleware",
                }),
            );
            expect(next).not.toHaveBeenCalled();
        });

        it("should return 401 with error message when findById throws", async () => {
            req.user = { _id: "userId" };
            const error = new Error("Database error");
            userModel.findById.mockRejectedValue(error);

            await isAdmin(req, res, next);

            expect(console.log).toHaveBeenCalledWith(error);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.send).toHaveBeenCalledWith({
                success: false,
                error: error,
                message: "Error in admin middleware",
            });
            expect(next).not.toHaveBeenCalled();
        });

        it("should return 401 when userModel.findById returns null", async () => {
            req.user = { _id: "someId" };
            userModel.findById.mockResolvedValue(null);

            await isAdmin(req, res, next);

            expect(userModel.findById).toHaveBeenCalledWith("someId");
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.send).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: "Error in admin middleware",
                })
            );
            expect(next).not.toHaveBeenCalled();
        });
    });
});
