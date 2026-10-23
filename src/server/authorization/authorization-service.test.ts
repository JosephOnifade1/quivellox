import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  resolveUserWorkspace,
  getAuthContext,
  requireAuthContext,
  verifyWorkspaceAccess,
  verifyDocumentAccess,
  verifyConversationAccess,
} from './authorization-service';
import * as supabaseServer from '@/lib/supabase/server';

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(),
}));

describe('Authorization Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('resolveUserWorkspace', () => {
    it('returns null when Supabase client is not configured', async () => {
      vi.mocked(supabaseServer.createServerSupabaseClient).mockResolvedValue(null as any);
      const res = await resolveUserWorkspace('user-1');
      expect(res).toBeNull();
    });

    it('resolves owned workspace with isOwner=true', async () => {
      const mockSupabase = {
        from: vi.fn().mockImplementation((table: string) => {
          if (table === 'workspaces') {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              limit: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: { id: 'ws-owned-1' },
                error: null,
              }),
            };
          }
          return {};
        }),
      };
      vi.mocked(supabaseServer.createServerSupabaseClient).mockResolvedValue(mockSupabase as any);

      const res = await resolveUserWorkspace('user-1');
      expect(res).toEqual({ workspaceId: 'ws-owned-1', isOwner: true });
    });

    it('resolves member workspace when user is not owner', async () => {
      const mockSupabase = {
        from: vi.fn().mockImplementation((table: string) => {
          if (table === 'workspaces') {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              limit: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116' },
              }),
            };
          }
          if (table === 'workspace_members') {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              limit: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: { workspace_id: 'ws-member-1' },
                error: null,
              }),
            };
          }
          return {};
        }),
      };
      vi.mocked(supabaseServer.createServerSupabaseClient).mockResolvedValue(mockSupabase as any);

      const res = await resolveUserWorkspace('user-2');
      expect(res).toEqual({ workspaceId: 'ws-member-1', isOwner: false });
    });

    it('returns null when user has neither owned nor member workspace', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      };
      vi.mocked(supabaseServer.createServerSupabaseClient).mockResolvedValue(mockSupabase as any);

      const res = await resolveUserWorkspace('user-unassigned');
      expect(res).toBeNull();
    });
  });

  describe('requireAuthContext', () => {
    it('returns 403 response if user has no workspace', async () => {
      vi.mocked(supabaseServer.createServerSupabaseClient).mockResolvedValue(null as any);
      const { ctx, errorResponse } = await requireAuthContext('user-no-ws');
      expect(ctx).toBeNull();
      expect(errorResponse).not.toBeNull();
      expect(errorResponse?.status).toBe(403);
    });

    it('returns context when workspace is found', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { id: 'ws-123' },
            error: null,
          }),
        }),
      };
      vi.mocked(supabaseServer.createServerSupabaseClient).mockResolvedValue(mockSupabase as any);

      const { ctx, errorResponse } = await requireAuthContext('user-1');
      expect(errorResponse).toBeNull();
      expect(ctx).toEqual({
        userId: 'user-1',
        workspaceId: 'ws-123',
        isOwner: true,
      });
    });
  });

  describe('verifyWorkspaceAccess', () => {
    it('rejects missing user or workspace ID', async () => {
      expect(await verifyWorkspaceAccess('', 'ws-1')).toBe(false);
      expect(await verifyWorkspaceAccess('u-1', '')).toBe(false);
    });

    it('verifies owner access', async () => {
      const mockSupabase = {
        from: vi.fn().mockImplementation((table: string) => ({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: table === 'workspaces' ? { id: 'ws-1' } : null,
          }),
        })),
      };
      vi.mocked(supabaseServer.createServerSupabaseClient).mockResolvedValue(mockSupabase as any);

      const hasAccess = await verifyWorkspaceAccess('user-1', 'ws-1');
      expect(hasAccess).toBe(true);
    });

    it('verifies member access when not owner', async () => {
      const mockSupabase = {
        from: vi.fn().mockImplementation((table: string) => ({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: table === 'workspace_members' ? { id: 'mem-1' } : null,
          }),
        })),
      };
      vi.mocked(supabaseServer.createServerSupabaseClient).mockResolvedValue(mockSupabase as any);

      const hasAccess = await verifyWorkspaceAccess('user-2', 'ws-1');
      expect(hasAccess).toBe(true);
    });

    it('rejects access when user is neither owner nor member', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null }),
        }),
      };
      vi.mocked(supabaseServer.createServerSupabaseClient).mockResolvedValue(mockSupabase as any);

      const hasAccess = await verifyWorkspaceAccess('user-intruder', 'ws-1');
      expect(hasAccess).toBe(false);
    });
  });

  describe('verifyDocumentAccess', () => {
    it('returns false if document does not exist', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null }),
        }),
      };
      vi.mocked(supabaseServer.createServerSupabaseClient).mockResolvedValue(mockSupabase as any);

      const hasAccess = await verifyDocumentAccess('user-1', 'doc-missing');
      expect(hasAccess).toBe(false);
    });

    it('returns true if document exists and user has workspace access', async () => {
      const mockSupabase = {
        from: vi.fn().mockImplementation((table: string) => ({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: table === 'documents' ? { id: 'doc-1', workspace_id: 'ws-1' } : { id: 'ws-1' },
          }),
        })),
      };
      vi.mocked(supabaseServer.createServerSupabaseClient).mockResolvedValue(mockSupabase as any);

      const hasAccess = await verifyDocumentAccess('user-1', 'doc-1');
      expect(hasAccess).toBe(true);
    });
  });

  describe('verifyConversationAccess', () => {
    it('rejects conversation belonging to another user', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: { id: 'conv-1', user_id: 'other-user', workspace_id: 'ws-1' },
          }),
        }),
      };
      vi.mocked(supabaseServer.createServerSupabaseClient).mockResolvedValue(mockSupabase as any);

      const hasAccess = await verifyConversationAccess('user-1', 'conv-1');
      expect(hasAccess).toBe(false);
    });

    it('allows conversation belonging to the user and their workspace', async () => {
      const mockSupabase = {
        from: vi.fn().mockImplementation((table: string) => ({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: table === 'conversations'
              ? { id: 'conv-1', user_id: 'user-1', workspace_id: 'ws-1' }
              : { id: 'ws-1' },
          }),
        })),
      };
      vi.mocked(supabaseServer.createServerSupabaseClient).mockResolvedValue(mockSupabase as any);

      const hasAccess = await verifyConversationAccess('user-1', 'conv-1');
      expect(hasAccess).toBe(true);
    });
  });
});
