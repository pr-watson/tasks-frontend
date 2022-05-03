import { act, renderHook } from '@testing-library/react-hooks';
import usePaginate from '../usePaginate';
import items from './__fixtures__/items.fixtures';

describe('usePaginate', () => {
  it('returns a paginate configuration', () => {
    const { result } = renderHook(() => usePaginate());
    expect(result).toMatchSnapshot();
  });

  it('returns a paginate configuration', () => {
    const { result } = renderHook(() => usePaginate());

    act(() => {
      result.current.setPage(2);
    });

    expect(result.current.toolbarProps.pagination.page).toBe(2);
  });

  it('returns a paginate configuration', () => {
    const { result } = renderHook(() => usePaginate({ perPage: 5 }));

    act(() => {
      result.current.setPage(1);
    });

    const paginatedItems = result.current.paginator(items);

    expect(paginatedItems).toMatchSnapshot();
    expect(paginatedItems.length).toBe(2);
    expect(paginatedItems[1]).toBe(items[1]);
  });
});
