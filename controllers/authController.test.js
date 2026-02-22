import {
  registerController,
  loginController,
  forgotPasswordController,
  testController,
} from "./authController.js";
import userModel from "../models/userModel.js";
import { hashPassword, comparePassword } from "../helpers/authHelper.js";
import JWT from "jsonwebtoken";

jest.mock("../models/userModel.js");
jest.mock("../helpers/authHelper.js");
jest.mock("jsonwebtoken");

describe("authController", () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      body: {},
      params: {},
      user: { _id: "user123" },
    };

    res = {
      status: jest.fn(() => res),
      send: jest.fn(() => res),
      json: jest.fn(() => res),
    };
  });

  // Register Controller
  describe("registerController", () => {
    it("should return error if name is missing", async () => {
      req.body = {};

      await registerController(req, res);

      expect(res.send).toHaveBeenCalledWith({
        message: "Name is Required",
      });
    });

    it("should return error if user already exists", async () => {
      req.body = {
        name: "John",
        email: "john@test.com",
        password: "123456",
        phone: "123",
        address: "abc",
        answer: "blue",
      };

      userModel.findOne.mockResolvedValue({ _id: "existingUser" });

      await registerController(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Already Register please login",
      });
    });

    it("should register user successfully", async () => {
      req.body = {
        name: "John",
        email: "john@test.com",
        password: "123456",
        phone: "123",
        address: "abc",
        answer: "blue",
      };

      userModel.findOne.mockResolvedValue(null);
      hashPassword.mockResolvedValue("hashed123");

      userModel.mockImplementation(() => ({
        save: jest.fn().mockResolvedValue({ _id: "newUser" }),
      }));

      await registerController(req, res);

      expect(hashPassword).toHaveBeenCalledWith("123456");
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "User Register Successfully",
        })
      );
    });
  });

  // Login Controller
  describe("loginController", () => {
    it("should return error if email or password missing", async () => {
      req.body = {};

      await loginController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return 404 if user not found", async () => {
      req.body = { email: "a@test.com", password: "123456" };

      userModel.findOne.mockResolvedValue(null);

      await loginController(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("should return 401 if password does not match", async () => {
      req.body = { email: "a@test.com", password: "123456" };

      userModel.findOne.mockResolvedValue({
        _id: "user1",
        password: "hashed",
      });

      comparePassword.mockResolvedValue(false);

      await loginController(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("should login successfully and return token", async () => {
      req.body = { email: "a@test.com", password: "123456" };

      userModel.findOne.mockResolvedValue({
        _id: "user1",
        name: "John",
        email: "a@test.com",
        phone: "123",
        address: "abc",
        role: 0,
        password: "hashed",
      });

      comparePassword.mockResolvedValue(true);
      JWT.sign.mockReturnValue("mockToken");

      await loginController(req, res);

      expect(JWT.sign).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          token: "mockToken",
        })
      );
    });
  });

  // Forgot Password Controller
  describe("forgotPasswordController", () => {
    it("should return error if email missing", async () => {
      req.body = {};

      await forgotPasswordController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return 404 if user not found", async () => {
      req.body = {
        email: "a@test.com",
        answer: "blue",
        newPassword: "123456",
      };

      userModel.findOne.mockResolvedValue(null);

      await forgotPasswordController(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("should reset password successfully", async () => {
      req.body = {
        email: "a@test.com",
        answer: "blue",
        newPassword: "123456",
      };

      userModel.findOne.mockResolvedValue({ _id: "user1" });
      hashPassword.mockResolvedValue("hashedNew");

      userModel.findByIdAndUpdate.mockResolvedValue({});

      await forgotPasswordController(req, res);

      expect(hashPassword).toHaveBeenCalledWith("123456");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "Password Reset Successfully",
      });
    });
  });

  // Test Controller
  describe("testController", () => {
    it("should return protected route message", () => {
      testController(req, res);

      expect(res.send).toHaveBeenCalledWith("Protected Routes");
    });
  });
});