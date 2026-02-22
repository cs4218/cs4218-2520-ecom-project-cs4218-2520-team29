// Dexter Wong Xing You, A0255437Y

import {
  createProductController,
  getProductController,
  getSingleProductController,
  deleteProductController,
  updateProductController,
  productFiltersController,
  productCountController,
  searchProductController,
  productPhotoController,
  productListController,
  realtedProductController,
  productCategoryController,
  braintreeTokenController,
  brainTreePaymentController,
} from "./productController.js";

import productModel from "../models/productModel.js";
import categoryModel from "../models/categoryModel.js";
import orderModel from "../models/orderModel.js";
import braintree from "braintree";

import fs from "fs";
import slugify from "slugify";


jest.mock("../models/productModel.js");
jest.mock("../models/categoryModel.js");
jest.mock("../models/orderModel.js");
jest.mock("braintree");
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
    // Dexter Wong Xing You, A0255437Y
    it("should return 500 if name missing", async () => {
      const req = { fields: {}, files: {} };
      const res = mockResponse();

      await createProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
    // Dexter Wong Xing You, A0255437Y
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
    // Dexter Wong Xing You, A0255437Y
    it("should attach photo data when photo provided", async () => {

        slugify.mockReturnValue("test-product");

        fs.readFileSync.mockReturnValue("binary-data");

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
            files: {
            photo: {
                size: 500000, // under 1MB
                path: "/fake/path",
                type: "image/png",
            },
            },
        };

        const res = mockResponse();

        await createProductController(req, res);

        expect(fs.readFileSync).toHaveBeenCalledWith("/fake/path");
        expect(saveMock).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(201);
        });

        // Dexter Wong Xing You, A0255437Y
        it("should execute catch block when error occurs", async () => {

            const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});

            // Force constructor to throw
            productModel.mockImplementation(() => {
                throw new Error("DB crash");
            });

            const req = {
                fields: {
                name: "Test",
                description: "desc",
                price: 100,
                category: "cat",
                quantity: 10,
                },
                files: {},
            };

            const res = mockResponse();

            await createProductController(req, res);

            expect(consoleSpy).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(500);

            consoleSpy.mockRestore();
            });

  });

  describe("getProductController", () => {
    // Dexter Wong Xing You, A0255437Y
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
    // Dexter Wong Xing You, A0255437Y
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
    // Dexter Wong Xing You, A0255437Y
    it("getSingleProductController should execute catch block", async () => {

        const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});

        productModel.findOne.mockImplementation(() => {
            throw new Error("DB fail");
        });

        const req = { params: { slug: "test" } };
        const res = mockResponse();

        await getSingleProductController(req, res);

        expect(consoleSpy).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(500);

        consoleSpy.mockRestore();
        });

  });

  describe("deleteProductController", () => {
    // Dexter Wong Xing You, A0255437Y
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
    // Dexter Wong Xing You, A0255437Y
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

  describe("updateProductController validation branches", () => {
    // Dexter Wong Xing You, A0255437Y
    it("should fail if description missing", async () => {
        const req = {
        params: { pid: "1" },
        fields: { name: "Test" }, // description missing
        files: {},
        };
        const res = mockResponse();

        await updateProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
    // Dexter Wong Xing You, A0255437Y
    it("should fail if price missing", async () => {
        const req = {
        params: { pid: "1" },
        fields: { name: "Test", description: "desc" }, // price missing
        files: {},
        };
        const res = mockResponse();

        await updateProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
    // Dexter Wong Xing You, A0255437Y
    it("should fail if category missing", async () => {
        const req = {
        params: { pid: "1" },
        fields: {
            name: "Test",
            description: "desc",
            price: 10,
        }, // category missing
        files: {},
        };
        const res = mockResponse();

        await updateProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
    // Dexter Wong Xing You, A0255437Y
    it("should fail if quantity missing", async () => {
        const req = {
        params: { pid: "1" },
        fields: {
            name: "Test",
            description: "desc",
            price: 10,
            category: "cat",
        }, // quantity missing
        files: {},
        };
        const res = mockResponse();

        await updateProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
    // Dexter Wong Xing You, A0255437Y
    it("should fail if photo too large", async () => {
        const req = {
        params: { pid: "1" },
        fields: {
            name: "Test",
            description: "desc",
            price: 10,
            category: "cat",
            quantity: 5,
        },
        files: {
            photo: { size: 2000000 },
        },
        };
        const res = mockResponse();

        await updateProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });

});

  describe("productFiltersController", () => {
    // Dexter Wong Xing You, A0255437Y
    it("should filter by category", async () => {

      productModel.find.mockResolvedValue([]);

      const req = { body: { checked: ["cat1"], radio: [] } };
      const res = mockResponse();

      await productFiltersController(req, res);

      expect(productModel.find).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    // Dexter Wong Xing You, A0255437Y
    it("should have empty filters", async () => {

        productModel.find.mockResolvedValue([]);

        const req = { body: { checked: [], radio: [] } };
        const res = mockResponse();

        await productFiltersController(req, res);

        expect(productModel.find).toHaveBeenCalledWith({});
    });


  });

  describe("productCountController", () => {
    // Dexter Wong Xing You, A0255437Y
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
    // Dexter Wong Xing You, A0255437Y
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


describe("Additional Product Controllers", () => {
  // Dexter Wong Xing You, A0255437Y
  it("should return product photo", async () => {

    productModel.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({
        photo: {
          data: "image-data",
          contentType: "image/png",
        },
      }),
    });

    const req = { params: { pid: "1" } };
    const res = mockResponse();

    await productPhotoController(req, res);

    expect(res.set).toHaveBeenCalledWith("Content-type", "image/png");
    expect(res.status).toHaveBeenCalledWith(200);
  });


  // Dexter Wong Xing You, A0255437Y
  it("should return paginated products", async () => {

    productModel.find.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      sort: jest.fn().mockResolvedValue([]),
    });

    const req = { params: { page: 1 } };
    const res = mockResponse();

    await productListController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });


  // Dexter Wong Xing You, A0255437Y
  it("should return related products", async () => {

    productModel.find.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      populate: jest.fn().mockResolvedValue([]),
    });

    const req = { params: { pid: "1", cid: "2" } };
    const res = mockResponse();

    await realtedProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });


  // Dexter Wong Xing You, A0255437Y
  it("should return products by category", async () => {

    categoryModel.findOne.mockResolvedValue({ _id: "cat1" });

    productModel.find.mockReturnValue({
      populate: jest.fn().mockResolvedValue([]),
    });

    const req = { params: { slug: "electronics" } };
    const res = mockResponse();

    await productCategoryController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });


  // Dexter Wong Xing You, A0255437Y
  it("should generate braintree token", async () => {

    braintree.BraintreeGateway.mockImplementation(() => ({
      clientToken: {
        generate: (obj, cb) => cb(null, { token: "abc123" }),
      },
    }));

    const req = {};
    const res = mockResponse();

    await braintreeTokenController(req, res);

    expect(res.send).toHaveBeenCalledWith({ token: "abc123" });
  });


  // Dexter Wong Xing You, A0255437Y
  it("should process payment successfully", async () => {

    braintree.BraintreeGateway.mockImplementation(() => ({
      transaction: {
        sale: (data, cb) =>
          cb(null, { success: true }),
      },
    }));

    orderModel.mockImplementation(() => ({
      save: jest.fn(),
    }));

    const req = {
      body: {
        nonce: "nonce123",
        cart: [{ price: 50 }],
      },
      user: { _id: "user1" },
    };

    const res = mockResponse();

    await brainTreePaymentController(req, res);

    expect(res.json).toHaveBeenCalledWith({ ok: true });
  });
  // Dexter Wong Xing You, A0255437Y
  it("should execute catch block", async () => {

        const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});

        productModel.findById.mockImplementation(() => {
            throw new Error("DB error");
        });

        const req = { params: { pid: "1" } };
        const res = mockResponse();

        await productPhotoController(req, res);

        expect(consoleSpy).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(500);

        consoleSpy.mockRestore();
        });

});

describe("createProductController validation branches", () => {
  // Dexter Wong Xing You, A0255437Y
  it("should fail if description missing", async () => {
    const req = {
      fields: { name: "Test" },
      files: {},
    };
    const res = mockResponse();
    await createProductController(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
  // Dexter Wong Xing You, A0255437Y
  it("should fail if price missing", async () => {
    const req = {
      fields: { name: "Test", description: "desc" },
      files: {},
    };
    const res = mockResponse();
    await createProductController(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
  // Dexter Wong Xing You, A0255437Y
  it("should fail if category missing", async () => {
    const req = {
      fields: { name: "Test", description: "desc", price: 10 },
      files: {},
    };
    const res = mockResponse();
    await createProductController(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
  // Dexter Wong Xing You, A0255437Y
  it("should fail if quantity missing", async () => {
    const req = {
      fields: { name: "Test", description: "desc", price: 10, category: "cat" },
      files: {},
    };
    const res = mockResponse();
    await createProductController(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
  // Dexter Wong Xing You, A0255437Y
  it("should fail if photo too large", async () => {
    const req = {
      fields: {
        name: "Test",
        description: "desc",
        price: 10,
        category: "cat",
        quantity: 1,
      },
      files: {
        photo: { size: 2000000 },
      },
    };
    const res = mockResponse();
    await createProductController(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

});

describe("Error handling branches", () => {
    
  // Dexter Wong Xing You, A0255437Y
  it("should run createProductController catch block", async () => {
    productModel.mockImplementation(() => {
      throw new Error("DB error");
    });

    const req = {
      fields: { name: "Test" },
      files: {},
    };
    const res = mockResponse();

    await createProductController(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  // Dexter Wong Xing You, A0255437Y
  it("should run getProductController catch block", async () => {
    productModel.find.mockImplementation(() => {
      throw new Error("DB fail");
    });

    const res = mockResponse();
    await getProductController({}, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

});

describe("productPhotoController", () => {

  // Dexter Wong Xing You, A0255437Y
  it("should have no photo branch", async () => {

    productModel.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({ photo: {} }),
    });

    const req = { params: { pid: "1" } };
    const res = mockResponse();

    await productPhotoController(req, res);
  });

});


describe("braintreeTokenController", () => {

  // Dexter Wong Xing You, A0255437Y
  it("should have error branch", async () => {

    braintree.BraintreeGateway.mockImplementation(() => ({
      clientToken: {
        generate: (obj, cb) => cb("error", null),
      },
    }));

    const res = mockResponse();
    await braintreeTokenController({}, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

});

describe("brainTreePaymentController", () => {

  // Dexter Wong Xing You, A0255437Y
  it("should visit failure branch", async () => {

    braintree.BraintreeGateway.mockImplementation(() => ({
      transaction: {
        sale: (data, cb) => cb("error", null),
      },
    }));

    const req = {
      body: { nonce: "1", cart: [{ price: 10 }] },
      user: { _id: "u1" },
    };

    const res = mockResponse();

    await brainTreePaymentController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

});