import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Pagination, PaginationBar } from './pagination';

const meta = {
  title: 'Components/Pagination',
  component: Pagination,
  args: { page: 1, pageCount: 12, onPageChange: () => undefined },
} satisfies Meta<typeof Pagination>;

export default meta;
type Story = StoryObj<typeof meta>;

function PaginationDemo({
  pageCount,
  initialPage,
}: {
  pageCount: number;
  initialPage: number;
}) {
  const [page, setPage] = useState(initialPage);
  return (
    <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />
  );
}

// Press Previous, Next or a page number: the window follows the current page.
export const Interactive: Story = {
  render: (args) => (
    <PaginationDemo pageCount={args.pageCount} initialPage={args.page} />
  ),
  args: { page: 6 },
};

export const FirstPage: Story = {};

export const LastPage: Story = { args: { page: 12 } };

export const FewPages: Story = { args: { page: 2, pageCount: 4 } };

export const SinglePage: Story = { args: { page: 1, pageCount: 1 } };

function BarDemo() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  return (
    <PaginationBar
      page={page}
      pageSize={pageSize}
      total={312}
      onPageChange={setPage}
      onPageSizeChange={(size) => {
        setPageSize(size);
        setPage(1);
      }}
    />
  );
}

// The footer of a data table: "Showing 1–25 of 312", a rows-per-page select and the page buttons.
export const WithRangeAndPageSize: Story = { render: () => <BarDemo /> };
