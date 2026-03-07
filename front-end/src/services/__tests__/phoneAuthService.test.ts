import { authService } from '../authService';
import { apiClient } from '../api';

jest.mock('../api', () => ({
  apiClient: {
    post: jest.fn(),
  },
}));

const mockPost = apiClient.post as jest.Mock;

describe('authService - phone OTP', () => {
  beforeEach(() => jest.clearAllMocks());

  it('phoneOtpSend calls POST /auth/phone/send with phone', async () => {
    mockPost.mockResolvedValue({ data: { expiresIn: 300 } });
    const result = await authService.phoneOtpSend('+35988123456');
    expect(mockPost).toHaveBeenCalledWith('/auth/phone/send', { phone: '+35988123456' });
    expect(result.expiresIn).toBe(300);
  });

  it('phoneOtpVerify calls POST /auth/phone/verify with phone and code', async () => {
    mockPost.mockResolvedValue({
      data: {
        access_token: 'jwt123',
        refresh_token: 'refresh123',
        user: { id: 'u1', role: 'BUYER' },
      },
    });
    const result = await authService.phoneOtpVerify('+35988123456', '123456');
    expect(mockPost).toHaveBeenCalledWith('/auth/phone/verify', {
      phone: '+35988123456',
      code: '123456',
    });
    expect(result.access_token).toBe('jwt123');
    expect(result.user.role).toBe('BUYER');
  });

  it('phoneOtpSend propagates errors from apiClient', async () => {
    mockPost.mockRejectedValue(new Error('Network error'));
    await expect(authService.phoneOtpSend('+35988123456')).rejects.toThrow('Network error');
  });
});
