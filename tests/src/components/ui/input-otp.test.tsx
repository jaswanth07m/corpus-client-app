import * as React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from '../../../../src/components/ui/input-otp';

// Mock lucide-react Dot purely to ensure it renders predictably without needing the full SVGs
vi.mock('lucide-react', () => ({
  Dot: () => <div data-testid="dot-icon">Dot</div>,
}));

class ResizeObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

if (!global.ResizeObserver) {
  global.ResizeObserver =
    ResizeObserverMock as unknown as typeof ResizeObserver;
}

if (!document.elementFromPoint) {
  document.elementFromPoint = vi.fn();
}

describe('InputOTP', () => {
  it('renders correctly with given slots', () => {
    render(
      <InputOTP maxLength={6}>
        <InputOTPGroup data-testid="input-otp-group">
          <InputOTPSlot index={0} data-testid="slot-0" />
          <InputOTPSlot index={1} data-testid="slot-1" />
        </InputOTPGroup>
        <InputOTPSeparator data-testid="separator" />
      </InputOTP>,
    );

    expect(screen.getByTestId('input-otp-group')).toBeInTheDocument();
    expect(screen.getByTestId('slot-0')).toBeInTheDocument();
    expect(screen.getByTestId('slot-1')).toBeInTheDocument();
    expect(screen.getByTestId('separator')).toBeInTheDocument();
    expect(screen.getByTestId('dot-icon')).toBeInTheDocument();
  });

  it('applies custom class names to InputOTP container and element', () => {
    render(
      <InputOTP
        maxLength={2}
        containerClassName="custom-container"
        className="custom-element"
      >
        <InputOTPGroup>
          <InputOTPSlot index={0} />
          <InputOTPSlot index={1} />
        </InputOTPGroup>
      </InputOTP>,
    );

    const container = document.querySelector('.custom-container');
    expect(container).toBeInTheDocument();

    const elementList = document.querySelectorAll('.custom-element');
    expect(elementList.length).toBeGreaterThan(0);
  });

  it('applies custom class name to InputOTPGroup', () => {
    render(
      <InputOTP maxLength={2}>
        <InputOTPGroup className="custom-group" data-testid="group">
          <InputOTPSlot index={0} />
        </InputOTPGroup>
      </InputOTP>,
    );

    expect(screen.getByTestId('group')).toHaveClass(
      'custom-group',
      'flex',
      'items-center',
    );
  });

  it('applies custom class name to InputOTPSlot', () => {
    render(
      <InputOTP maxLength={1}>
        <InputOTPGroup>
          <InputOTPSlot
            index={0}
            className="custom-slot"
            data-testid="slot-0"
          />
        </InputOTPGroup>
      </InputOTP>,
    );

    expect(screen.getByTestId('slot-0')).toHaveClass('custom-slot');
  });

  it('renders characters correctly as typed', async () => {
    const user = userEvent.setup();
    render(
      <InputOTP maxLength={3}>
        <InputOTPGroup>
          <InputOTPSlot index={0} data-testid="slot-0" />
          <InputOTPSlot index={1} data-testid="slot-1" />
          <InputOTPSlot index={2} data-testid="slot-2" />
        </InputOTPGroup>
      </InputOTP>,
    );

    const input = document.querySelector('input');
    expect(input).not.toBeNull();
    if (input) {
      await user.type(input, '12');
    }

    expect(screen.getByTestId('slot-0')).toHaveTextContent('1');
    expect(screen.getByTestId('slot-1')).toHaveTextContent('2');
    expect(screen.getByTestId('slot-2')).toHaveTextContent('');
  });

  it('forwards refs correctly', () => {
    const otpRef = React.createRef<React.ComponentRef<typeof InputOTP>>();
    const groupRef =
      React.createRef<React.ComponentRef<typeof InputOTPGroup>>();
    const slotRef = React.createRef<React.ComponentRef<typeof InputOTPSlot>>();
    const separatorRef =
      React.createRef<React.ComponentRef<typeof InputOTPSeparator>>();

    render(
      <InputOTP maxLength={2} ref={otpRef}>
        <InputOTPGroup ref={groupRef}>
          <InputOTPSlot index={0} ref={slotRef} />
        </InputOTPGroup>
        <InputOTPSeparator ref={separatorRef} />
      </InputOTP>,
    );

    expect(otpRef.current).not.toBeNull();
    expect(groupRef.current).not.toBeNull();
    expect(slotRef.current).not.toBeNull();
    expect(separatorRef.current).not.toBeNull();
  });
});
