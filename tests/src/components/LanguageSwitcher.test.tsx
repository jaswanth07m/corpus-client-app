import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { vi } from 'vitest';

let mockedLanguage = 'en';
const mockChangeLanguage = vi.fn();

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      language: mockedLanguage,
      changeLanguage: mockChangeLanguage,
    },
  }),
}));

vi.mock('@/i18n', () => ({
  SUPPORTED_LANGUAGES: [
    { code: 'en', name: 'English', native: 'English' },
    { code: 'te', name: 'Telugu', native: 'తెలుగు' },
    { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
  ],
}));

vi.mock('@/components/ui/dropdown-menu', async () => {
  const React = await import('react');
  return {
    DropdownMenu: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
    DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => (
      <>{children}</>
    ),
    DropdownMenuContent: ({
      children,
    }: {
      children: React.ReactNode;
      align?: string;
      className?: string;
    }) => <div data-testid="language-menu">{children}</div>,
    DropdownMenuItem: ({
      children,
      onClick,
      className,
    }: {
      children: React.ReactNode;
      onClick?: () => void;
      className?: string;
    }) => (
      <button type="button" onClick={onClick} className={className}>
        {children}
      </button>
    ),
  };
});

import { LanguageSwitcher } from '@/components/LanguageSwitcher';

describe('LanguageSwitcher', () => {
  beforeEach(() => {
    mockedLanguage = 'en';
    mockChangeLanguage.mockClear();
  });

  it('renders the language switcher button with accessible label', () => {
    render(<LanguageSwitcher />);

    const button = document.querySelector(
      '#tour-language-switcher',
    ) as HTMLButtonElement | null;
    expect(button).toBeInTheDocument();

    // Translation key is rendered because `t` is mocked to return the key.
    expect(screen.getByText('common.change.language')).toBeInTheDocument();
  });

  it('renders a menu item for each supported language', () => {
    render(<LanguageSwitcher />);

    const menu = screen.getByTestId('language-menu');
    expect(within(menu).getByText('English')).toBeInTheDocument();
    expect(within(menu).getByText('తెలుగు')).toBeInTheDocument();
    expect(within(menu).getByText('हिन्दी')).toBeInTheDocument();
  });

  it('highlights the current language and shows a checkmark', () => {
    mockedLanguage = 'te';
    render(<LanguageSwitcher />);

    const menu = screen.getByTestId('language-menu');
    const teluguLabel = within(menu).getByText('తెలుగు');
    const teluguItem = teluguLabel.closest('button');
    expect(teluguItem).toBeInTheDocument();
    expect(teluguItem).toHaveClass('bg-gray-100');
    expect(teluguItem).toHaveClass('font-medium');
    expect(
      within(teluguItem as HTMLElement).getByText('✓'),
    ).toBeInTheDocument();
  });

  it('calls i18n.changeLanguage when a language is selected', () => {
    render(<LanguageSwitcher />);

    const menu = screen.getByTestId('language-menu');
    const hindiLabel = within(menu).getByText('हिन्दी');
    const hindiItem = hindiLabel.closest('button');
    expect(hindiItem).toBeInTheDocument();

    fireEvent.click(hindiItem as HTMLElement);
    expect(mockChangeLanguage).toHaveBeenCalledTimes(1);
    expect(mockChangeLanguage).toHaveBeenCalledWith('hi');
  });
});
