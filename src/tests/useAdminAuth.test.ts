import { renderHook } from '@testing-library/react-hooks';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { auth, functions } from '@/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';

// Mock Firebase modules
jest.mock('@/firebase/config', () => ({
  auth: {},
  functions: {},
}));

jest.mock('firebase/auth', () => ({
  onAuthStateChanged: jest.fn(),
}));

jest.mock('firebase/functions', () => ({
  httpsCallable: jest.fn(),
}));

describe('useAdminAuth', () => {
  const mockOnAuthStateChanged = onAuthStateChanged as jest.Mock;
  const mockHttpsCallable = httpsCallable as jest.Mock;

  beforeEach(() => {
    // Reset mocks before each test
    mockOnAuthStateChanged.mockClear();
    mockHttpsCallable.mockClear();
    
    // Mock window.location.href
    delete (window as any).location;
    window.location = { href: '' } as any;
  });

  test('should return true for an admin user', async () => {
    const mockUser = { uid: 'admin-uid' };
    const mockAdminCheck = jest.fn().mockResolvedValue({ data: { isAdmin: true } });
    mockHttpsCallable.mockReturnValue(mockAdminCheck);

    let authCallback: (user: any) => void = () => {};
    mockOnAuthStateChanged.mockImplementation((auth, callback) => {
      authCallback = callback;
      return jest.fn(); // Unsubscribe function
    });

    const { result, waitForNextUpdate } = renderHook(() => useAdminAuth());

    authCallback(mockUser);

    await waitForNextUpdate();

    expect(result.current).toBe(true);
    expect(window.location.href).not.toBe('/auth?returnTo=/admin');
  });

  test('should return false and redirect for a non-admin user', async () => {
    const mockUser = { uid: 'non-admin-uid' };
    const mockAdminCheck = jest.fn().mockResolvedValue({ data: { isAdmin: false } });
    mockHttpsCallable.mockReturnValue(mockAdminCheck);

    let authCallback: (user: any) => void = () => {};
    mockOnAuthStateChanged.mockImplementation((auth, callback) => {
      authCallback = callback;
      return jest.fn(); // Unsubscribe function
    });

    const { result, waitForNextUpdate } = renderHook(() => useAdminAuth());

    authCallback(mockUser);

    await waitForNextUpdate();

    expect(result.current).toBe(false);
    expect(window.location.href).toBe('/auth?returnTo=/admin');
  });

  test('should return false and redirect for no user', async () => {
    let authCallback: (user: any) => void = () => {};
    mockOnAuthStateChanged.mockImplementation((auth, callback) => {
      authCallback = callback;
      return jest.fn(); // Unsubscribe function
    });

    const { result, waitForNextUpdate } = renderHook(() => useAdminAuth());

    authCallback(null);

    await waitForNextUpdate();

    expect(result.current).toBe(false);
    expect(window.location.href).toBe('/auth?returnTo=/admin');
  });
});
