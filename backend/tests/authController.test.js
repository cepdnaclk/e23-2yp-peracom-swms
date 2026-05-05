import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registerUser, loginUser, logoutUser, getMe } from '../controllers/authController.js';
import { supabase, supabaseAdmin } from '../config/supabaseClient.js';

vi.mock('../config/supabaseClient.js', () => {
  const createSupabaseAdminMock = () => {
    const inFn = vi.fn();
    const singleFn = vi.fn();
    const eqFn = vi.fn(() => ({ in: inFn, single: singleFn }));
    const selectFn = vi.fn(() => ({ eq: eqFn }));
    const upsertFn = vi.fn();
    const fromFn = vi.fn(() => ({ select: selectFn, upsert: upsertFn }));
    return {
      auth: {
        admin: {
          listUsers: vi.fn(),
        },
      },
      from: fromFn,
      _mocks: { inFn, singleFn, eqFn, selectFn, upsertFn, fromFn },
    };
  };

  return {
    supabase: {
      auth: {
        signUp: vi.fn(),
        signInWithPassword: vi.fn(),
        signOut: vi.fn(),
      },
    },
    supabaseAdmin: createSupabaseAdminMock(), // This becomes the imported supabaseAdmin
  };
});

// Mock Express request and response objects
const mockRequest = (body, user) => ({
  body,
  user,
});

const mockResponse = () => {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

describe('Auth Controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it('should register a new user successfully', async () => {
    const req = mockRequest({
      email: 'test@example.com',
      password: 'password123',
      metadata: { full_name: 'Test User', role: 'student' },
    });
    const res = mockResponse();

    // Use the imported supabaseAdmin here
    supabaseAdmin.auth.admin.listUsers.mockResolvedValue({ data: { users: [] }, error: null });
    supabaseAdmin._mocks.inFn.mockResolvedValue({ data: [], error: null });
    supabase.auth.signUp.mockResolvedValue({
      data: {
        user: {
          id: '123',
          email: 'test@example.com',
          user_metadata: { full_name: 'Test User', role: 'student' },
        },
      },
      error: null,
    });
    supabaseAdmin._mocks.upsertFn.mockResolvedValue({ error: null });

    await registerUser(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Registration successful! Please check your email to verify your account.',
      })
    );
  });
  it('should return 400 if the user email already exists', async () => {
    const req = mockRequest({
      email: 'already_exists@example.com',
      password: 'password123',
    });
    const res = mockResponse();

    // 1. Setup the mock to return a user that MATCHES the email in the request
    supabaseAdmin.auth.admin.listUsers.mockResolvedValue({ 
      data: { 
        users: [
          { 
            id: 'existing-id-456', 
            email: 'already_exists@example.com' // Crucial: must match req.body.email
          }
        ] 
      }, 
      error: null 
    });

    // 2. We also need to mock the profile check (inFn) just in case your code checks the profiles table too
    supabaseAdmin._mocks.inFn.mockResolvedValue({ data: [], error: null });

    await registerUser(req, res);

    // 3. Assertions
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ 
        error: 'This email is already registered. Please check your email for a confirmation link or log in.' 
      })
    );
    
    // 4. Verify safety: signUp should NEVER be called if the user exists
    expect(supabase.auth.signUp).not.toHaveBeenCalled();
  });

  

  it('should login a user successfully', async () => {
    const req = mockRequest({ email: 'test@example.com', password: 'password123' });
    const res = mockResponse();

    supabase.auth.signInWithPassword.mockResolvedValue({
      data: {
        user: { id: '123', email_confirmed_at: new Date().toISOString() },
        session: { access_token: 'fake-token', refresh_token: 'fake-refresh-token' },
      },
      error: null,
    });
    supabaseAdmin._mocks.singleFn.mockResolvedValue({
      data: { status: 'approved', role: 'student', full_name: 'Test User', email: 'test@example.com' },
      error: null,
    });

    await loginUser(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Login successful.',
        token: 'fake-token',
      })
    );
  });

  it('should logout a user successfully', async () => {
    const req = mockRequest();
    const res = mockResponse();

    supabase.auth.signOut.mockResolvedValue({ error: null });

    await logoutUser(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'Logged out successfully.' });
  });

  it('should get the current user profile', async () => {
    const req = mockRequest(null, { id: '123' });
    const res = mockResponse();

    const profile = { id: '123', email: 'test@example.com', full_name: 'Test User', role: 'student' };
    supabaseAdmin._mocks.singleFn.mockResolvedValue({ data: profile, error: null });

    await getMe(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ user: profile });
  });
});