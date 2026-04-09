import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from '@/components/ui/table';

describe('Table Components', () => {
  describe('Table', () => {
    it('renders Table correctly', () => {
      render(
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Header</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Cell</TableCell>
            </TableRow>
          </TableBody>
        </Table>,
      );

      expect(screen.getByText('Header')).toBeInTheDocument();
      expect(screen.getByText('Cell')).toBeInTheDocument();
    });

    it('applies default className to Table', () => {
      render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Content</TableCell>
            </TableRow>
          </TableBody>
        </Table>,
      );

      const table = screen.getByRole('table');
      expect(table).toHaveClass('w-full', 'caption-bottom', 'text-sm');
    });

    it('applies custom className to Table', () => {
      render(
        <Table className="custom-table">
          <TableBody>
            <TableRow>
              <TableCell>Content</TableCell>
            </TableRow>
          </TableBody>
        </Table>,
      );

      const table = screen.getByRole('table');
      expect(table).toHaveClass('custom-table');
    });

    it('forwards ref to Table element', () => {
      const ref = vi.fn();
      render(
        <Table ref={ref}>
          <TableBody>
            <TableRow>
              <TableCell>Content</TableCell>
            </TableRow>
          </TableBody>
        </Table>,
      );

      expect(ref).toHaveBeenCalledWith(expect.any(HTMLTableElement));
    });

    it('wraps table in overflow-auto div', () => {
      render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Content</TableCell>
            </TableRow>
          </TableBody>
        </Table>,
      );

      const wrapper = screen.getByRole('table').parentElement;
      expect(wrapper).toHaveClass('relative', 'w-full', 'overflow-auto');
    });

    it('passes through HTML attributes to Table', () => {
      render(
        <Table data-testid="table-test" id="main-table">
          <TableBody>
            <TableRow>
              <TableCell>Content</TableCell>
            </TableRow>
          </TableBody>
        </Table>,
      );

      const table = screen.getByTestId('table-test');
      expect(table).toHaveAttribute('id', 'main-table');
    });
  });

  describe('TableHeader', () => {
    it('renders TableHeader correctly', () => {
      render(
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Age</TableHead>
            </TableRow>
          </TableHeader>
        </Table>,
      );

      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Age')).toBeInTheDocument();
    });

    it('applies default className to TableHeader', () => {
      render(
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Header</TableHead>
            </TableRow>
          </TableHeader>
        </Table>,
      );

      const header = screen.getByRole('rowgroup');
      expect(header).toHaveClass('[&_tr]:border-b');
    });

    it('applies custom className to TableHeader', () => {
      render(
        <Table>
          <TableHeader className="custom-header">
            <TableRow>
              <TableHead>Header</TableHead>
            </TableRow>
          </TableHeader>
        </Table>,
      );

      const header = screen.getByRole('rowgroup');
      expect(header).toHaveClass('custom-header');
    });

    it('forwards ref to TableHeader element', () => {
      const ref = vi.fn();
      render(
        <Table>
          <TableHeader ref={ref}>
            <TableRow>
              <TableHead>Header</TableHead>
            </TableRow>
          </TableHeader>
        </Table>,
      );

      expect(ref).toHaveBeenCalledWith(expect.any(HTMLElement));
    });

    it('passes through HTML attributes to TableHeader', () => {
      render(
        <Table>
          <TableHeader data-testid="header-test" aria-label="Table Header">
            <TableRow>
              <TableHead>Header</TableHead>
            </TableRow>
          </TableHeader>
        </Table>,
      );

      const header = screen.getByTestId('header-test');
      expect(header).toHaveAttribute('aria-label', 'Table Header');
    });
  });

  describe('TableBody', () => {
    it('renders TableBody correctly', () => {
      render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Row 1</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Row 2</TableCell>
            </TableRow>
          </TableBody>
        </Table>,
      );

      expect(screen.getByText('Row 1')).toBeInTheDocument();
      expect(screen.getByText('Row 2')).toBeInTheDocument();
    });

    it('applies default className to TableBody', () => {
      render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Content</TableCell>
            </TableRow>
          </TableBody>
        </Table>,
      );

      const body = screen.getByRole('rowgroup');
      expect(body).toHaveClass('[&_tr:last-child]:border-0');
    });

    it('applies custom className to TableBody', () => {
      render(
        <Table>
          <TableBody className="custom-body">
            <TableRow>
              <TableCell>Content</TableCell>
            </TableRow>
          </TableBody>
        </Table>,
      );

      const body = screen.getByRole('rowgroup');
      expect(body).toHaveClass('custom-body');
    });

    it('forwards ref to TableBody element', () => {
      const ref = vi.fn();
      render(
        <Table>
          <TableBody ref={ref}>
            <TableRow>
              <TableCell>Content</TableCell>
            </TableRow>
          </TableBody>
        </Table>,
      );

      expect(ref).toHaveBeenCalledWith(expect.any(HTMLElement));
    });

    it('passes through HTML attributes to TableBody', () => {
      render(
        <Table>
          <TableBody data-testid="body-test" role="rowgroup">
            <TableRow>
              <TableCell>Content</TableCell>
            </TableRow>
          </TableBody>
        </Table>,
      );

      const body = screen.getByTestId('body-test');
      expect(body).toHaveAttribute('role', 'rowgroup');
    });
  });

  describe('TableFooter', () => {
    it('renders TableFooter correctly', () => {
      render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Data</TableCell>
            </TableRow>
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell>Total</TableCell>
            </TableRow>
          </TableFooter>
        </Table>,
      );

      expect(screen.getByText('Total')).toBeInTheDocument();
    });

    it('applies default className to TableFooter', () => {
      render(
        <Table>
          <TableFooter>
            <TableRow>
              <TableCell>Footer</TableCell>
            </TableRow>
          </TableFooter>
        </Table>,
      );

      const footer = screen.getByRole('rowgroup');
      expect(footer).toHaveClass('border-t', 'bg-muted/50', 'font-medium');
    });

    it('applies custom className to TableFooter', () => {
      render(
        <Table>
          <TableFooter className="custom-footer">
            <TableRow>
              <TableCell>Footer</TableCell>
            </TableRow>
          </TableFooter>
        </Table>,
      );

      const footer = screen.getByRole('rowgroup');
      expect(footer).toHaveClass('custom-footer');
    });

    it('forwards ref to TableFooter element', () => {
      const ref = vi.fn();
      render(
        <Table>
          <TableFooter ref={ref}>
            <TableRow>
              <TableCell>Footer</TableCell>
            </TableRow>
          </TableFooter>
        </Table>,
      );

      expect(ref).toHaveBeenCalledWith(expect.any(HTMLElement));
    });

    it('passes through HTML attributes to TableFooter', () => {
      render(
        <Table>
          <TableFooter data-testid="footer-test">
            <TableRow>
              <TableCell>Footer</TableCell>
            </TableRow>
          </TableFooter>
        </Table>,
      );

      const footer = screen.getByTestId('footer-test');
      expect(footer).toBeInTheDocument();
    });
  });

  describe('TableRow', () => {
    it('renders TableRow correctly', () => {
      render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Cell 1</TableCell>
              <TableCell>Cell 2</TableCell>
            </TableRow>
          </TableBody>
        </Table>,
      );

      expect(screen.getByText('Cell 1')).toBeInTheDocument();
      expect(screen.getByText('Cell 2')).toBeInTheDocument();
    });

    it('applies default className to TableRow', () => {
      render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Content</TableCell>
            </TableRow>
          </TableBody>
        </Table>,
      );

      const row = screen.getByRole('row');
      expect(row).toHaveClass(
        'border-b',
        'transition-colors',
        'hover:bg-muted/50',
      );
    });

    it('applies custom className to TableRow', () => {
      render(
        <Table>
          <TableBody>
            <TableRow className="custom-row">
              <TableCell>Content</TableCell>
            </TableRow>
          </TableBody>
        </Table>,
      );

      const row = screen.getByRole('row');
      expect(row).toHaveClass('custom-row');
    });

    it('applies selected state styles with data-state attribute', () => {
      render(
        <Table>
          <TableBody>
            <TableRow data-state="selected">
              <TableCell>Selected Row</TableCell>
            </TableRow>
          </TableBody>
        </Table>,
      );

      const row = screen.getByRole('row');
      expect(row).toHaveAttribute('data-state', 'selected');
      expect(row).toHaveClass('data-[state=selected]:bg-muted');
    });

    it('forwards ref to TableRow element', () => {
      const ref = vi.fn();
      render(
        <Table>
          <TableBody>
            <TableRow ref={ref}>
              <TableCell>Content</TableCell>
            </TableRow>
          </TableBody>
        </Table>,
      );

      expect(ref).toHaveBeenCalledWith(expect.any(HTMLTableRowElement));
    });

    it('passes through HTML attributes to TableRow', () => {
      render(
        <Table>
          <TableBody>
            <TableRow data-testid="row-test" id="row-1">
              <TableCell>Content</TableCell>
            </TableRow>
          </TableBody>
        </Table>,
      );

      const row = screen.getByTestId('row-test');
      expect(row).toHaveAttribute('id', 'row-1');
    });
  });

  describe('TableHead', () => {
    it('renders TableHead correctly', () => {
      render(
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
            </TableRow>
          </TableHeader>
        </Table>,
      );

      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
    });

    it('applies default className to TableHead', () => {
      render(
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Header</TableHead>
            </TableRow>
          </TableHeader>
        </Table>,
      );

      const head = screen.getByRole('columnheader');
      expect(head).toHaveClass(
        'h-12',
        'px-4',
        'text-left',
        'align-middle',
        'font-medium',
      );
      expect(head).toHaveClass('text-muted-foreground');
    });

    it('applies custom className to TableHead', () => {
      render(
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="custom-head">Header</TableHead>
            </TableRow>
          </TableHeader>
        </Table>,
      );

      const head = screen.getByRole('columnheader');
      expect(head).toHaveClass('custom-head');
    });

    it('forwards ref to TableHead element', () => {
      const ref = vi.fn();
      render(
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead ref={ref}>Header</TableHead>
            </TableRow>
          </TableHeader>
        </Table>,
      );

      expect(ref).toHaveBeenCalledWith(expect.any(HTMLTableCellElement));
    });

    it('passes through HTML attributes to TableHead', () => {
      render(
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead data-testid="head-test" scope="col">
                Header
              </TableHead>
            </TableRow>
          </TableHeader>
        </Table>,
      );

      const head = screen.getByTestId('head-test');
      expect(head).toHaveAttribute('scope', 'col');
    });

    it('applies pr-0 class when containing checkbox', () => {
      render(
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <input type="checkbox" role="checkbox" aria-label="Select" />
              </TableHead>
            </TableRow>
          </TableHeader>
        </Table>,
      );

      const head = screen.getByRole('columnheader');
      expect(head).toHaveClass('[&:has([role=checkbox])]:pr-0');
    });
  });

  describe('TableCell', () => {
    it('renders TableCell correctly', () => {
      render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>John Doe</TableCell>
              <TableCell>john@example.com</TableCell>
            </TableRow>
          </TableBody>
        </Table>,
      );

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
    });

    it('applies default className to TableCell', () => {
      render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Content</TableCell>
            </TableRow>
          </TableBody>
        </Table>,
      );

      const cell = screen.getByRole('cell');
      expect(cell).toHaveClass('p-4', 'align-middle');
    });

    it('applies custom className to TableCell', () => {
      render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell className="custom-cell">Content</TableCell>
            </TableRow>
          </TableBody>
        </Table>,
      );

      const cell = screen.getByRole('cell');
      expect(cell).toHaveClass('custom-cell');
    });

    it('forwards ref to TableCell element', () => {
      const ref = vi.fn();
      render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell ref={ref}>Content</TableCell>
            </TableRow>
          </TableBody>
        </Table>,
      );

      expect(ref).toHaveBeenCalledWith(expect.any(HTMLTableCellElement));
    });

    it('passes through HTML attributes to TableCell', () => {
      render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell data-testid="cell-test" colSpan={2}>
                Content
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>,
      );

      const cell = screen.getByTestId('cell-test');
      expect(cell).toHaveAttribute('colspan', '2');
    });

    it('applies pr-0 class when containing checkbox', () => {
      render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>
                <input
                  type="checkbox"
                  role="checkbox"
                  aria-label="Select row"
                />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>,
      );

      const cell = screen.getByRole('cell');
      expect(cell).toHaveClass('[&:has([role=checkbox])]:pr-0');
    });
  });

  describe('TableCaption', () => {
    it('renders TableCaption correctly', () => {
      render(
        <Table>
          <TableCaption>List of employees</TableCaption>
          <TableBody>
            <TableRow>
              <TableCell>John</TableCell>
            </TableRow>
          </TableBody>
        </Table>,
      );

      expect(screen.getByText('List of employees')).toBeInTheDocument();
    });

    it('applies default className to TableCaption', () => {
      render(
        <Table>
          <TableCaption>Employee Directory</TableCaption>
          <TableBody>
            <TableRow>
              <TableCell>Content</TableCell>
            </TableRow>
          </TableBody>
        </Table>,
      );

      const caption = screen.getByRole('caption');
      expect(caption).toHaveClass('mt-4', 'text-sm', 'text-muted-foreground');
    });

    it('applies custom className to TableCaption', () => {
      render(
        <Table>
          <TableCaption className="custom-caption">Caption Text</TableCaption>
          <TableBody>
            <TableRow>
              <TableCell>Content</TableCell>
            </TableRow>
          </TableBody>
        </Table>,
      );

      const caption = screen.getByRole('caption');
      expect(caption).toHaveClass('custom-caption');
    });

    it('forwards ref to TableCaption element', () => {
      const ref = vi.fn();
      render(
        <Table>
          <TableCaption ref={ref}>Caption</TableCaption>
          <TableBody>
            <TableRow>
              <TableCell>Content</TableCell>
            </TableRow>
          </TableBody>
        </Table>,
      );

      expect(ref).toHaveBeenCalledWith(expect.any(HTMLElement));
    });

    it('passes through HTML attributes to TableCaption', () => {
      render(
        <Table>
          <TableCaption data-testid="caption-test" id="main-caption">
            Caption Text
          </TableCaption>
          <TableBody>
            <TableRow>
              <TableCell>Content</TableCell>
            </TableRow>
          </TableBody>
        </Table>,
      );

      const caption = screen.getByTestId('caption-test');
      expect(caption).toHaveAttribute('id', 'main-caption');
    });
  });

  describe('Complete Table Integration', () => {
    it('renders a complete table structure', () => {
      render(
        <Table>
          <TableCaption>Employee Directory</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>John Doe</TableCell>
              <TableCell>john@example.com</TableCell>
              <TableCell>Developer</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Jane Smith</TableCell>
              <TableCell>jane@example.com</TableCell>
              <TableCell>Designer</TableCell>
            </TableRow>
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={2}>Total Employees</TableCell>
              <TableCell>2</TableCell>
            </TableRow>
          </TableFooter>
        </Table>,
      );

      // Verify caption
      expect(screen.getByRole('caption')).toHaveTextContent(
        'Employee Directory',
      );

      // Verify headers
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Role')).toBeInTheDocument();

      // Verify body content
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
      expect(screen.getByText('Developer')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('jane@example.com')).toBeInTheDocument();
      expect(screen.getByText('Designer')).toBeInTheDocument();

      // Verify footer
      expect(screen.getByText('Total Employees')).toBeInTheDocument();
    });

    it('handles empty table body', () => {
      render(
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Column</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>No data</TableCell>
            </TableRow>
          </TableBody>
        </Table>,
      );

      expect(screen.getByText('Column')).toBeInTheDocument();
      expect(screen.getByText('No data')).toBeInTheDocument();
    });

    it('supports multiple rows with different cell counts', () => {
      render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Cell 1</TableCell>
              <TableCell>Cell 2</TableCell>
            </TableRow>
            <TableRow>
              <TableCell colSpan={2}>Merged Cell</TableCell>
            </TableRow>
          </TableBody>
        </Table>,
      );

      expect(screen.getByText('Cell 1')).toBeInTheDocument();
      expect(screen.getByText('Cell 2')).toBeInTheDocument();
      expect(screen.getByText('Merged Cell')).toBeInTheDocument();
    });
  });
});
