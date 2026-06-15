import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Auth from './Auth';
import { AuthProvider } from '../context/AuthContext';

const mockLoginUser = vi.hoisted(() => vi.fn());
const mockRegisterUser = vi.hoisted(() => vi.fn());
const mockSocialLogin = vi.hoisted(() => vi.fn());
const mockSignInWithPopup = vi.hoisted(() => vi.fn());

// Network + Firebase are not available in the test environment, so stub them.
vi.mock('../lib/api', () => ({
  loginUser: mockLoginUser,
  registerUser: mockRegisterUser,
  socialLogin: mockSocialLogin,
}));

vi.mock('../lib/firebase', () => ({
  auth: {},
  googleProvider: {},
  githubProvider: {},
}));

vi.mock('firebase/auth', () => ({
  signInWithPopup: mockSignInWithPopup,
  signOut: vi.fn(),
}));

describe('Auth page', () => {
  beforeEach(() => {
    localStorage.clear();
    mockLoginUser.mockReset();
    mockRegisterUser.mockReset();
    mockSocialLogin.mockReset();
    mockSignInWithPopup.mockReset();
  });

  it('allows signup with UIU verification and shows verification state', async () => {
    const user = userEvent.setup();
    mockRegisterUser.mockResolvedValue({
      user: { id: 'u1', name: 'Sam Student', email: 'sam@gmail.com', role: 'user' },
      token: 'fake-token',
    });

    const { container } = render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/signup']}>
          <Routes>
            <Route path="/signup" element={<Auth />} />
            <Route path="/dashboard" element={<div>Dashboard Screen</div>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );

    await user.type(screen.getByLabelText('Full Name'), 'Sam Student');
    await user.type(screen.getByLabelText('Email Address'), 'sam@gmail.com');
    await user.type(screen.getByLabelText('UIU Email Address'), 'sam@uiu.ac.bd');
    await user.type(screen.getByLabelText('UIU ID Number'), 'UIU-12345');

    const fileInput = container.querySelector('#uiu-id-upload') as HTMLInputElement;
    await user.upload(
      fileInput,
      new File(['id-card'], 'id.png', { type: 'image/png' })
    );

    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.type(screen.getByLabelText('Confirm Password'), 'password123');

    await user.click(screen.getByRole('button', { name: /Create Account/i }));

    expect(
      await screen.findByRole('heading', { name: 'Verify your email' })
    ).toBeInTheDocument();
    expect(mockRegisterUser).toHaveBeenCalledTimes(1);
  });

  it('navigates to signup view when toggle button is clicked from login', async () => {
    const user = userEvent.setup();

    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route path="/login" element={<Auth />} />
            <Route path="/signup" element={<Auth />} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );

    await user.click(screen.getByRole('button', { name: 'Sign up' }));

    expect(
      await screen.findByRole('heading', { name: 'Join UniShare' })
    ).toBeInTheDocument();
  });

  it('supports continue with Google from login screen', async () => {
    const user = userEvent.setup();
    mockSignInWithPopup.mockResolvedValue({
      user: { getIdToken: () => Promise.resolve('google-id-token') },
    });
    mockSocialLogin.mockResolvedValue({
      user: { id: 'u1', name: 'Sam Student', email: 'sam@gmail.com', role: 'user' },
      token: 'fake-token',
    });

    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route path="/login" element={<Auth />} />
            <Route path="/dashboard" element={<div>Dashboard Screen</div>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );

    await user.click(screen.getByRole('button', { name: 'Continue with Google' }));

    expect(await screen.findByText('Dashboard Screen')).toBeInTheDocument();
    expect(mockSocialLogin).toHaveBeenCalledTimes(1);
  });
});
