import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
} from '@/components/ui/breadcrumb';

describe('Breadcrumb', () => {
  describe('Breadcrumb component', () => {
    it('should render nav element with breadcrumb aria-label', () => {
      render(<Breadcrumb>Home</Breadcrumb>);
      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
      expect(nav).toHaveAttribute('aria-label', 'breadcrumb');
      expect(nav).toHaveTextContent('Home');
    });

    it('should forward ref to nav element', () => {
      const ref = { current: null as HTMLElement | null };
      render(<Breadcrumb ref={ref}>Test</Breadcrumb>);
      expect(ref.current).toBeInTheDocument();
      expect(ref.current?.tagName).toBe('NAV');
    });

    it('should forward HTML attributes to nav element', () => {
      render(
        <Breadcrumb
          id="breadcrumb-nav"
          data-test="breadcrumb"
          className="custom"
        >
          Content
        </Breadcrumb>,
      );
      const nav = screen.getByRole('navigation');
      expect(nav).toHaveAttribute('id', 'breadcrumb-nav');
      expect(nav).toHaveAttribute('data-test', 'breadcrumb');
      expect(nav).toHaveClass('custom');
    });

    it('should render children content', () => {
      render(
        <Breadcrumb>
          <span>Child Content</span>
        </Breadcrumb>,
      );
      expect(screen.getByText('Child Content')).toBeInTheDocument();
    });
  });

  describe('BreadcrumbList component', () => {
    it('should render ol element with base classes', () => {
      render(<BreadcrumbList>Item</BreadcrumbList>);
      const list = screen.getByRole('list');
      expect(list).toBeInTheDocument();
      expect(list).toHaveClass('flex');
      expect(list).toHaveClass('flex-wrap');
      expect(list).toHaveClass('items-center');
      expect(list).toHaveClass('gap-1.5');
      expect(list).toHaveClass('break-words');
      expect(list).toHaveClass('text-sm');
      expect(list).toHaveClass('text-muted-foreground');
      expect(list).toHaveClass('sm:gap-2.5');
    });

    it('should merge custom className with base classes', () => {
      render(
        <BreadcrumbList className="custom-class another-class">
          Item
        </BreadcrumbList>,
      );
      const list = screen.getByRole('list');
      expect(list).toHaveClass('custom-class');
      expect(list).toHaveClass('another-class');
      expect(list).toHaveClass('flex');
    });

    it('should forward ref to ol element', () => {
      const ref = { current: null as HTMLOListElement | null };
      render(<BreadcrumbList ref={ref}>Test</BreadcrumbList>);
      expect(ref.current).toBeInTheDocument();
      expect(ref.current?.tagName).toBe('OL');
    });

    it('should forward HTML attributes to ol element', () => {
      render(
        <BreadcrumbList id="breadcrumb-list" data-test="list">
          Item
        </BreadcrumbList>,
      );
      const list = screen.getByRole('list');
      expect(list).toHaveAttribute('id', 'breadcrumb-list');
      expect(list).toHaveAttribute('data-test', 'list');
    });

    it('should render multiple children', () => {
      render(
        <BreadcrumbList>
          <li>First</li>
          <li>Second</li>
        </BreadcrumbList>,
      );
      expect(screen.getByText('First')).toBeInTheDocument();
      expect(screen.getByText('Second')).toBeInTheDocument();
    });
  });

  describe('BreadcrumbItem component', () => {
    it('should render li element with base classes', () => {
      render(<BreadcrumbItem>Item</BreadcrumbItem>);
      const item = screen.getByText('Item');
      expect(item).toBeInTheDocument();
      expect(item).toHaveClass('inline-flex');
      expect(item).toHaveClass('items-center');
      expect(item).toHaveClass('gap-1.5');
    });

    it('should merge custom className with base classes', () => {
      render(
        <BreadcrumbItem className="custom-item-class">Item</BreadcrumbItem>,
      );
      const item = screen.getByText('Item');
      expect(item).toHaveClass('custom-item-class');
      expect(item).toHaveClass('inline-flex');
    });

    it('should forward ref to li element', () => {
      const ref = { current: null as HTMLLIElement | null };
      render(<BreadcrumbItem ref={ref}>Test</BreadcrumbItem>);
      expect(ref.current).toBeInTheDocument();
      expect(ref.current?.tagName).toBe('LI');
    });

    it('should forward HTML attributes to li element', () => {
      render(
        <BreadcrumbItem id="breadcrumb-item" data-test="item">
          Item
        </BreadcrumbItem>,
      );
      const item = screen.getByText('Item');
      expect(item).toHaveAttribute('id', 'breadcrumb-item');
      expect(item).toHaveAttribute('data-test', 'item');
    });
  });

  describe('BreadcrumbLink component', () => {
    it('should render a element by default', () => {
      const { container } = render(<BreadcrumbLink>Link</BreadcrumbLink>);
      const link = container.querySelector('a');
      expect(link).toBeInTheDocument();
      expect(link?.tagName).toBe('A');
    });

    it('should have base transition-colors class', () => {
      const { container } = render(<BreadcrumbLink>Link</BreadcrumbLink>);
      const link = container.querySelector('a');
      expect(link).toHaveClass('transition-colors');
      expect(link).toHaveClass('hover:text-foreground');
    });

    it('should merge custom className with base classes', () => {
      const { container } = render(
        <BreadcrumbLink className="custom-link-class">Link</BreadcrumbLink>,
      );
      const link = container.querySelector('a');
      expect(link).toHaveClass('custom-link-class');
      expect(link).toHaveClass('transition-colors');
    });

    it('should forward ref to a element', () => {
      const ref = { current: null as HTMLAnchorElement | null };
      render(<BreadcrumbLink ref={ref}>Test</BreadcrumbLink>);
      expect(ref.current).toBeInTheDocument();
      expect(ref.current?.tagName).toBe('A');
    });

    it('should forward HTML attributes to a element', () => {
      render(
        <BreadcrumbLink href="/home" data-test="link">
          Link
        </BreadcrumbLink>,
      );
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/home');
      expect(link).toHaveAttribute('data-test', 'link');
    });

    it('should render Slot component when asChild is true', () => {
      render(
        <BreadcrumbLink asChild>
          <button>Button Link</button>
        </BreadcrumbLink>,
      );
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('transition-colors');
      expect(button).toHaveClass('hover:text-foreground');
    });

    it('should merge className when asChild is true', () => {
      render(
        <BreadcrumbLink asChild className="aschild-class">
          <button>Button Link</button>
        </BreadcrumbLink>,
      );
      const button = screen.getByRole('button');
      expect(button).toHaveClass('aschild-class');
      expect(button).toHaveClass('transition-colors');
    });

    it('should forward ref to Slot child when asChild is true', () => {
      const ref = { current: null as HTMLElement | null };
      render(
        <BreadcrumbLink asChild ref={ref}>
          <button>Button</button>
        </BreadcrumbLink>,
      );
      expect(ref.current).toBeInTheDocument();
      expect(ref.current?.tagName).toBe('BUTTON');
    });
  });

  describe('BreadcrumbPage component', () => {
    it('should render span element', () => {
      render(<BreadcrumbPage>Page</BreadcrumbPage>);
      const span = screen.getByText('Page');
      expect(span).toBeInTheDocument();
      expect(span.tagName).toBe('SPAN');
    });

    it('should have role link attribute', () => {
      render(<BreadcrumbPage>Page</BreadcrumbPage>);
      const span = screen.getByText('Page');
      expect(span).toHaveAttribute('role', 'link');
    });

    it('should have aria-disabled true', () => {
      render(<BreadcrumbPage>Page</BreadcrumbPage>);
      const span = screen.getByText('Page');
      expect(span).toHaveAttribute('aria-disabled', 'true');
    });

    it('should have aria-current page', () => {
      render(<BreadcrumbPage>Page</BreadcrumbPage>);
      const span = screen.getByText('Page');
      expect(span).toHaveAttribute('aria-current', 'page');
    });

    it('should have base classes', () => {
      render(<BreadcrumbPage>Page</BreadcrumbPage>);
      const span = screen.getByText('Page');
      expect(span).toHaveClass('font-normal');
      expect(span).toHaveClass('text-foreground');
    });

    it('should merge custom className with base classes', () => {
      render(
        <BreadcrumbPage className="custom-page-class">Page</BreadcrumbPage>,
      );
      const span = screen.getByText('Page');
      expect(span).toHaveClass('custom-page-class');
      expect(span).toHaveClass('font-normal');
    });

    it('should forward ref to span element', () => {
      const ref = { current: null as HTMLSpanElement | null };
      render(<BreadcrumbPage ref={ref}>Test</BreadcrumbPage>);
      expect(ref.current).toBeInTheDocument();
      expect(ref.current?.tagName).toBe('SPAN');
    });

    it('should forward HTML attributes to span element', () => {
      render(
        <BreadcrumbPage id="breadcrumb-page" data-test="page">
          Page
        </BreadcrumbPage>,
      );
      const span = screen.getByText('Page');
      expect(span).toHaveAttribute('id', 'breadcrumb-page');
      expect(span).toHaveAttribute('data-test', 'page');
    });
  });

  describe('BreadcrumbSeparator component', () => {
    it('should render li element with presentation role', () => {
      render(<BreadcrumbSeparator />);
      const li = screen.getByRole('presentation', { hidden: true });
      expect(li).toBeInTheDocument();
      expect(li.tagName).toBe('LI');
    });

    it('should have aria-hidden true', () => {
      render(<BreadcrumbSeparator />);
      const li = screen.getByRole('presentation', { hidden: true });
      expect(li).toHaveAttribute('aria-hidden', 'true');
    });

    it('should have base class for svg sizing', () => {
      render(<BreadcrumbSeparator />);
      const li = screen.getByRole('presentation', { hidden: true });
      expect(li).toHaveClass('[&>svg]:size-3.5');
    });

    it('should render ChevronRight icon by default', () => {
      render(<BreadcrumbSeparator />);
      const li = screen.getByRole('presentation', { hidden: true });
      const svg = li.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should render custom children instead of ChevronRight', () => {
      render(<BreadcrumbSeparator>/</BreadcrumbSeparator>);
      const li = screen.getByRole('presentation', { hidden: true });
      expect(li).toHaveTextContent('/');
      expect(li).not.toHaveTextContent('ChevronRight');
    });

    it('should merge custom className with base classes', () => {
      render(<BreadcrumbSeparator className="custom-separator" />);
      const li = screen.getByRole('presentation', { hidden: true });
      expect(li).toHaveClass('custom-separator');
      expect(li).toHaveClass('[&>svg]:size-3.5');
    });

    it('should forward HTML attributes to li element', () => {
      render(<BreadcrumbSeparator data-test="separator" id="sep" />);
      const li = screen.getByRole('presentation', { hidden: true });
      expect(li).toHaveAttribute('data-test', 'separator');
      expect(li).toHaveAttribute('id', 'sep');
    });
  });

  describe('BreadcrumbEllipsis component', () => {
    it('should render span element with presentation role', () => {
      render(<BreadcrumbEllipsis />);
      const span = screen.getByRole('presentation', { hidden: true });
      expect(span).toBeInTheDocument();
      expect(span.tagName).toBe('SPAN');
    });

    it('should have aria-hidden true', () => {
      render(<BreadcrumbEllipsis />);
      const span = screen.getByRole('presentation', { hidden: true });
      expect(span).toHaveAttribute('aria-hidden', 'true');
    });

    it('should have base classes', () => {
      render(<BreadcrumbEllipsis />);
      const span = screen.getByRole('presentation', { hidden: true });
      expect(span).toHaveClass('flex');
      expect(span).toHaveClass('h-9');
      expect(span).toHaveClass('w-9');
      expect(span).toHaveClass('items-center');
      expect(span).toHaveClass('justify-center');
    });

    it('should render MoreHorizontal icon', () => {
      render(<BreadcrumbEllipsis />);
      const span = screen.getByRole('presentation', { hidden: true });
      const svg = span.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveClass('h-4');
      expect(svg).toHaveClass('w-4');
    });

    it('should render sr-only span with More text', () => {
      render(<BreadcrumbEllipsis />);
      const srOnly = screen.getByText('More');
      expect(srOnly).toBeInTheDocument();
      expect(srOnly).toHaveClass('sr-only');
    });

    it('should merge custom className with base classes', () => {
      render(<BreadcrumbEllipsis className="custom-ellipsis" />);
      const span = screen.getByRole('presentation', { hidden: true });
      expect(span).toHaveClass('custom-ellipsis');
      expect(span).toHaveClass('flex');
    });

    it('should forward HTML attributes to span element', () => {
      render(<BreadcrumbEllipsis data-test="ellipsis" id="ellip" />);
      const span = screen.getByRole('presentation', { hidden: true });
      expect(span).toHaveAttribute('data-test', 'ellipsis');
      expect(span).toHaveAttribute('id', 'ellip');
    });
  });

  describe('Breadcrumb components integration', () => {
    it('should render complete breadcrumb structure', () => {
      render(
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/products">Products</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Current</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>,
      );

      expect(screen.getByRole('navigation')).toBeInTheDocument();
      expect(screen.getByRole('list')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
      expect(
        screen.getByRole('link', { name: 'Products' }),
      ).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Current' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Current' })).toHaveAttribute(
        'aria-current',
        'page',
      );
      expect(screen.getByRole('link', { name: 'Current' })).toHaveAttribute(
        'aria-disabled',
        'true',
      );
    });

    it('should render breadcrumb with ellipsis', () => {
      render(
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbEllipsis />
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Current</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>,
      );

      expect(screen.getByRole('navigation')).toBeInTheDocument();
      expect(screen.getByText('More')).toBeInTheDocument();
      const presentationElements = screen.getAllByRole('presentation', {
        hidden: true,
      });
      expect(presentationElements.length).toBeGreaterThan(0);
    });

    it('should render breadcrumb with custom separator', () => {
      render(
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>→</BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbPage>Page</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>,
      );

      const separator = screen.getByRole('presentation', { hidden: true });
      expect(separator).toHaveTextContent('→');
    });

    it('should render breadcrumb with asChild link', () => {
      render(
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <a href="/home" data-custom="value">
                  Home
                </a>
              </BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>,
      );

      const link = screen.getByRole('link', { name: 'Home' });
      expect(link).toHaveAttribute('href', '/home');
      expect(link).toHaveAttribute('data-custom', 'value');
      expect(link).toHaveClass('transition-colors');
    });
  });
});
