// Chia Jia Ye A0286580U
import React from "react";
import { render, act, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import axios from "axios";
import { AuthProvider, useAuth } from "./auth";
import { describe } from "node:test";

jest.mock("axios");

const MOCK_AUTH_DATA = {
    user: {
        _id: "1",
        name: "John Doe",
        email: "johndoe@email.com",
        phone: "1234",
        address: "1234",
        role: 0
    },
    token: "token123",
};

// Test component to read auth values from context
const TestComponent = ({ onReady }) => {
    const [auth, setAuth] = useAuth();

    React.useEffect(() => {
        if (onReady) {
            onReady({ auth, setAuth });
        }
    }, [auth, setAuth, onReady]);

    return (
        <div>
            <div data-testid="user-name">{auth?.user?.name || "No user"}</div>
            <div data-testid="user-email">{auth?.user?.email || "No email"}</div>
            <div data-testid="token">{auth?.token || "No token"}</div>
        </div>
    );
};

describe("AuthContext", () => {
    let mockLocalStorage;

    beforeEach(() => {
        jest.clearAllMocks();

        mockLocalStorage = {
            getItem: jest.fn(),
            setItem: jest.fn(),
            removeItem: jest.fn(),
            clear: jest.fn(),
        };

        Object.defineProperty(window, "localStorage", {
            value: mockLocalStorage,
            writable: true,
        });

        // Ensure axios.defaults exist and reset the header store each test
        axios.defaults = axios.defaults || {};
        axios.defaults.headers = axios.defaults.headers || {};
        axios.defaults.headers.common = {};
    });

    describe("AuthProvider", () => {
        it("should initialise with default auth state", () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            render(
                <AuthProvider>
                    <TestComponent />
                </AuthProvider>
            );

            expect(screen.getByTestId("user-name")).toHaveTextContent("No user");
            expect(screen.getByTestId("user-email")).toHaveTextContent("No email");
            expect(screen.getByTestId("token")).toHaveTextContent("No token");
        });

        it("should load auth state from localStorage on mount", async () => {
            mockLocalStorage.getItem.mockReturnValue(JSON.stringify(MOCK_AUTH_DATA));

            render(
                <AuthProvider>
                    <TestComponent />
                </AuthProvider>
            );

            await waitFor(() => {
                expect(mockLocalStorage.getItem).toHaveBeenCalledWith("auth");
            });
        });

        it("should load auth from localStorage when available", async () => {
            mockLocalStorage.getItem.mockReturnValue(JSON.stringify(MOCK_AUTH_DATA));

            render(
                <AuthProvider>
                    <TestComponent />
                </AuthProvider>
            );

            await waitFor(() => {
                expect(screen.getByTestId("user-name")).toHaveTextContent(MOCK_AUTH_DATA.user.name);
                expect(screen.getByTestId("user-email")).toHaveTextContent(MOCK_AUTH_DATA.user.email);
                expect(screen.getByTestId("token")).toHaveTextContent(MOCK_AUTH_DATA.token);
            });
        });

        it("should set axios Authorization header to current token", async () => {
            mockLocalStorage.getItem.mockReturnValue(JSON.stringify(MOCK_AUTH_DATA));

            render(
                <AuthProvider>
                    <TestComponent />
                </AuthProvider>
            );

            await waitFor(() => {
                expect(axios.defaults.headers.common["Authorization"]).toBe(
                    MOCK_AUTH_DATA.token
                );
            });
        });
    });

    describe("useAuth", () => {
        it("should provide [auth, setAuth]", async () => {
            mockLocalStorage.getItem.mockReturnValue(null);
            let ctx;

            render(
                <AuthProvider>
                    <TestComponent onReady={(c) => (ctx = c)} />
                </AuthProvider>
            );

            await waitFor(() => {
                expect(ctx).toBeDefined();
            });

            expect(ctx.auth).toEqual({ user: null, token: "" });
            expect(typeof ctx.setAuth).toBe("function");
        });

        it("should update auth state when setAuth is called", async () => {
            mockLocalStorage.getItem.mockReturnValue(null);
            let ctx;

            render(
                <AuthProvider>
                    <TestComponent onReady={(c) => (ctx = c)} />
                </AuthProvider>
            );

            await waitFor(() => {
                expect(ctx).toBeDefined();
            });

            act(() => {
                ctx.setAuth(MOCK_AUTH_DATA);
            });

            await waitFor(() => {
                expect(screen.getByTestId("user-name")).toHaveTextContent(MOCK_AUTH_DATA.user.name);
                expect(screen.getByTestId("user-email")).toHaveTextContent(MOCK_AUTH_DATA.user.email);
                expect(screen.getByTestId("token")).toHaveTextContent(MOCK_AUTH_DATA.token);
            });
        });
    });

    describe("localStorage integration", () => {
        it("should not load auth when localStorage is empty", async () => {
            mockLocalStorage.getItem.mockReturnValue("");

            render(
                <AuthProvider>
                    <TestComponent />
                </AuthProvider>
            );

            // No auth loaded, should show defaults
            expect(screen.getByTestId("user-name")).toHaveTextContent("No user");
            expect(screen.getByTestId("token")).toHaveTextContent("No token");
        });

        it("should not load auth when localStorage returns null", async () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            render(
                <AuthProvider>
                    <TestComponent />
                </AuthProvider>
            );

            expect(screen.getByTestId("user-name")).toHaveTextContent("No user");
            expect(screen.getByTestId("token")).toHaveTextContent("No token");
        });
    });
});