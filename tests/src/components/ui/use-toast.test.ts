import { describe, it, expect } from 'vitest';
import { useToast, toast } from '../../../../src/components/ui/use-toast';
import {
  useToast as hookUseToast,
  toast as hookToast,
} from '../../../../src/hooks/use-toast';

describe('use-toast ui component exports', () => {
  it('should export useToast from hooks', () => {
    expect(useToast).toBe(hookUseToast);
  });

  it('should export toast from hooks', () => {
    expect(toast).toBe(hookToast);
  });
});
