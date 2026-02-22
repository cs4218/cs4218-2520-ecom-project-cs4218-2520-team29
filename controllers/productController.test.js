// Dexter Wong Xing You, A0255437Y

import {
  createProductController,
  getProductController,
  getSingleProductController,
  deleteProductController,
  updateProductController,
  productFiltersController,
  productCountController,
  productListController,
  searchProductController,
} from "./productController.js";

import productModel from "../models/productModel.js";
import categoryModel from "../models/categoryModel.js";
import fs from "fs";
import slugify from "slugify";


jest.mock("../models/productModel.js");
jest.mock("../models/categoryModel.js");
jest.mock("fs");
jest.mock("slugify");

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnThis();
  res.send = jest.fn().mockReturnThis();
  res.json = jest.fn().mockReturnThis();
  res.set = jest.fn().mockReturnThis();
  return res;
};

describe("Product Controller (ESM)", () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createProductController", () => {

    it("should return 500 if name missing", async () => {
      const req = { fields: {}, files: {} };
      const res = mockResponse();

      await createProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });

    it("should create product successfully", async () => {

      slugify.mockReturnValue("test-product");

      const saveMock = jest.fn();

      productModel.mockImplementation(() => ({
        save: saveMock,
        photo: {},
      }));

      const req = {
        fields: {
          name: "Test",
          description: "desc",
          price: 100,
          category: "cat",
          quantity: 10,
          shipping: true,
        },
        files: {},
      };

      const res = mockResponse();

      await createProductController(req, res);

      expect(saveMock).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
    });

  });

  describe("getProductController", () => {

    it("should return products successfully", async () => {

      productModel.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([{ name: "P1" }]),
      });

      const res = mockResponse();

      await getProductController({}, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

  });

  describe("getSingleProductController", () => {

    it("should fetch single product", async () => {

      productModel.findOne.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue({ name: "Single" }),
      });

      const req = { params: { slug: "test" } };
      const res = mockResponse();

      await getSingleProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

  });

  describe("deleteProductController", () => {

    it("should delete product", async () => {

      productModel.findByIdAndDelete.mockReturnValue({
        select: jest.fn(),
      });

      const req = { params: { pid: "123" } };
      const res = mockResponse();

      await deleteProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

  });

  describe("updateProductController", () => {

    it("should update successfully", async () => {

      slugify.mockReturnValue("updated");

      productModel.findByIdAndUpdate.mockResolvedValue({
        save: jest.fn(),
        photo: {},
      });

      const req = {
        params: { pid: "123" },
        fields: {
          name: "Updated",
          description: "desc",
          price: 100,
          category: "cat",
          quantity: 5,
        },
        files: {},
      };

      const res = mockResponse();

      await updateProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
    });

  });

  describe("productFiltersController", () => {

    it("should filter by category", async () => {

      productModel.find.mockResolvedValue([]);

      const req = { body: { checked: ["cat1"], radio: [] } };
      const res = mockResponse();

      await productFiltersController(req, res);

      expect(productModel.find).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

  });

  describe("productCountController", () => {

    it("should return total count", async () => {

      productModel.find.mockReturnValue({
        estimatedDocumentCount: jest.fn().mockResolvedValue(10),
      });

      const res = mockResponse();

      await productCountController({}, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

  });

  describe("searchProductController", () => {

    it("should search products", async () => {

      productModel.find.mockReturnValue({
        select: jest.fn().mockResolvedValue([]),
      });

      const req = { params: { keyword: "phone" } };
      const res = mockResponse();

      await searchProductController(req, res);

      expect(res.json).toHaveBeenCalled();
    });

  });

});