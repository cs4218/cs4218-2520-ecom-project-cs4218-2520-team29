import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import axios from 'axios';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import '@testing-library/jest-dom/extend-expect';
import toast from 'react-hot-toast';
import Login from './Login';

// Mocking axios.post
jest.mock('axios');
jest.mock('react-hot-toast');

jest.mock('../../context/auth', () => ({
    useAuth: jest.fn(() => [null, jest.fn()]) // Mock useAuth hook to return null state and a mock function for setAuth
}));

jest.mock('../../context/cart', () => ({
    useCart: jest.fn(() => [null, jest.fn()]) // Mock useCart hook to return null state and a mock function
}));
    
jest.mock('../../context/search', () => ({
    useSearch: jest.fn(() => [{ keyword: '' }, jest.fn()]) // Mock useSearch hook to return null state and a mock function
}));  

jest.mock("../../hooks/useCategory", () => jest.fn(() => []));

const mockNavigate = jest.fn();
let mockLocationState = null;
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ state: mockLocationState }),
}));


Object.defineProperty(window, 'localStorage', {
  value: {
    setItem: jest.fn(),
    getItem: jest.fn(),
    removeItem: jest.fn(),
  },
  writable: true,
});

window.matchMedia = window.matchMedia || function() {
    return {
      matches: false,
      addListener: function() {},
      removeListener: function() {},
    };
  };  

describe('Login Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockLocationState = null; // reset location state before each test
    });

    it('renders login form', () => {
        render(
          <MemoryRouter initialEntries={['/login']}>
            <Routes>
              <Route path="/login" element={<Login />} />
            </Routes>
          </MemoryRouter>
        );
    
        expect(screen.getByText('LOGIN FORM')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Enter Your Email')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Enter Your Password')).toBeInTheDocument();
    });

    it('inputs should be initially empty', () => {
      render(
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route path="/login" element={<Login />} />
          </Routes>
        </MemoryRouter>
      );
    
      expect(screen.getByText('LOGIN FORM')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter Your Email').value).toBe('');
      expect(screen.getByPlaceholderText('Enter Your Password').value).toBe('');
    });
    
    it('should allow typing email and password', () => {
      render(
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route path="/login" element={<Login />} />
          </Routes>
        </MemoryRouter>
      );
        
      fireEvent.change(screen.getByPlaceholderText('Enter Your Email'),
        { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByPlaceholderText('Enter Your Password'),
        { target: { value: 'password123' } });

      expect(screen.getByPlaceholderText('Enter Your Email').value)
        .toBe('test@example.com');
      expect(screen.getByPlaceholderText('Enter Your Password').value)
        .toBe('password123');
    });
      
    it('should login the user successfully', async () => {
      axios.post.mockResolvedValueOnce({
          data: {
              success: true,
              user: { id: 1, name: 'John Doe', email: 'test@example.com' },
              token: 'mockToken'
          }
      });

      render(
        <MemoryRouter initialEntries={['/login']}>
            <Routes>
                <Route path="/login" element={<Login />} />
            </Routes>
        </MemoryRouter>
      );

      fireEvent.change(screen.getByPlaceholderText('Enter Your Email'), {
        target: { value: 'test@example.com' }
      });
      fireEvent.change(screen.getByPlaceholderText('Enter Your Password'), {
        target: { value: 'password123' }
      });
      fireEvent.click(screen.getByText('LOGIN'));

      await waitFor(() => expect(axios.post).toHaveBeenCalled());
      expect(toast.success).toHaveBeenCalledWith(undefined, {
          duration: 5000,
          icon: '🙏',
          style: {
              background: 'green',
              color: 'white'
          }
      });
    });

    // Chia Jia Ye A0286580U
    it('should store auth in localStorage and navigate on successful login', async () => {
      axios.post.mockResolvedValueOnce({
        data: {
          success: true,
          message: "Login successful",
          user: { id: 1, name: 'John Doe', email: 'test@example.com' },
          token: 'mockToken'
        }
      });

      render(
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route path="/login" element={<Login />} />
          </Routes>
        </MemoryRouter>
      );

      fireEvent.change(screen.getByPlaceholderText('Enter Your Email'), {
        target: { value: 'test@example.com' }
      });
      fireEvent.change(screen.getByPlaceholderText('Enter Your Password'), {
        target: { value: 'password123' }
      });
      fireEvent.click(screen.getByText('LOGIN'));

      await waitFor(() => { expect(axios.post).toHaveBeenCalled();});

      expect(localStorage.setItem).toHaveBeenCalledWith(
        "auth",
        JSON.stringify({
          success: true,
          message: "Login successful",
          user: { id: 1, name: 'John Doe', email: 'test@example.com' },
          token: 'mockToken'
        })
      );
      expect(mockNavigate).toHaveBeenCalledWith("/");
    });

    // Chia Jia Ye A0286580U
    it('should navigate to location.state when provided', async () => {
      mockLocationState = "/dashboard"; // set location state for this test

      axios.post.mockResolvedValueOnce({
        data: {
          success: true,
          message: "Login successful",
          user: { id: 1, name: 'John Doe', email: 'test@example.com' },
          token: 'mockToken'
        }
      });

      render(
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route path="/login" element={<Login />} />
          </Routes>
        </MemoryRouter>
      );

      fireEvent.change(screen.getByPlaceholderText('Enter Your Email'), {
        target: { value: 'test@example.com' }
      });
      fireEvent.change(screen.getByPlaceholderText('Enter Your Password'), {
        target: { value: 'password123' }
      });
      fireEvent.click(screen.getByText('LOGIN'));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
      });
    });

    // Chia Jia Ye A0286580U
    it('should navigate to forgot password page when button clicked', async () => {
      render(
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route path="/login" element={<Login />} />
          </Routes>
        </MemoryRouter>
      );

      fireEvent.click(screen.getByText('Forgot Password'));

      expect(mockNavigate).toHaveBeenCalledWith('/forgot-password');
    });

    it('should display error message on failed login', async () => {
        axios.post.mockRejectedValueOnce({ message: 'Invalid credentials' });

        render(
            <MemoryRouter initialEntries={['/login']}>
                <Routes>
                    <Route path="/login" element={<Login />} />
                </Routes>
            </MemoryRouter>
        );

        fireEvent.change(screen.getByPlaceholderText('Enter Your Email'), {
          target: { value: 'test@example.com' }
        });
        fireEvent.change(screen.getByPlaceholderText('Enter Your Password'), {
          target: { value: 'password123' }
        });
        fireEvent.click(screen.getByText('LOGIN'));

        await waitFor(() => expect(axios.post).toHaveBeenCalled());
        expect(toast.error).toHaveBeenCalledWith('Something went wrong');
    });

    // Chia Jia Ye A0286580U
    it('should show error toast when login success is false', async () => {
      axios.post.mockResolvedValueOnce({
        data: {
          success: false,
          message: "Invalid credentials"
        }
      });

      render(
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route path="/login" element={<Login />} />
          </Routes>
        </MemoryRouter>
      );

      fireEvent.change(screen.getByPlaceholderText('Enter Your Email'), {
        target: { value: 'test@example.com' }
      });
      fireEvent.change(screen.getByPlaceholderText('Enter Your Password'), {
        target: { value: 'password123' }
      });
      fireEvent.click(screen.getByText('LOGIN'));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Invalid credentials");
      });
    });
});
