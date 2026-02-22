// Chia Jia Ye A0286580U
import bycrypt from "bcrypt";
import { hashPassword, comparePassword } from "./authHelper";

jest.mock("bcrypt", () => ({
    hash: jest.fn(),
    compare: jest.fn(),
}));

describe("authHelper", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("hashPassword", () => {
        it("should hash a valid password correctly", async () => {
            bycrypt.hash.mockResolvedValue("hashedPassword123");

            const result = await hashPassword("myPassword");

            expect(bycrypt.hash).toHaveBeenCalledWith("myPassword", 10);
            expect(result).toBe("hashedPassword123");
        });

        it("should hash an empty string password", async () => {
            bycrypt.hash.mockResolvedValue("hashedEmptyPassword");

            const result = await hashPassword("");

            expect(bycrypt.hash).toHaveBeenCalledWith("", 10);
            expect(result).toBe("hashedEmptyPassword");
        });

        it("should hash a long password", async () => {
            const longPassword = "a".repeat(100);
            bycrypt.hash.mockResolvedValue("hashedLongPassword");

            const result = await hashPassword(longPassword);

            expect(bycrypt.hash).toHaveBeenCalledWith(longPassword, 10);
            expect(result).toBe("hashedLongPassword");
        });

        it("should handle errors during hashing", async () => {
            const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
            const error = new Error("Hashing failed");
            bycrypt.hash.mockRejectedValue(error);

            const result = await hashPassword("password");

            expect(bycrypt.hash).toHaveBeenCalledWith("password", 10);
            expect(consoleSpy).toHaveBeenCalledWith(error);
            expect(result).toBeUndefined();

            consoleSpy.mockRestore();
        });
    });

    describe("comparePassword", () => {
        it("should return true for matching passwords", async () => {
            bycrypt.compare.mockResolvedValue(true);

            const result = await comparePassword("password", "hashedPassword");

            expect(bycrypt.compare).toHaveBeenCalledWith("password", "hashedPassword");
            expect(result).toBe(true);
        });

        it("should return false for non-matching passwords", async () => {
            bycrypt.compare.mockResolvedValue(false);

            const result = await comparePassword("wrongPassword", "hashedPassword");

            expect(bycrypt.compare).toHaveBeenCalledWith("wrongPassword", "hashedPassword");
            expect(result).toBe(false);
        });

        it("should handle errors during comparison", async () => {
            bycrypt.compare.mockRejectedValue(new Error("Comparison failed"));

            await expect(
                comparePassword("password", "hashedPassword")
            ).rejects.toThrow("Comparison failed");

            expect(bycrypt.compare).toHaveBeenCalledWith("password", "hashedPassword");
        });
    });
});