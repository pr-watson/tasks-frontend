import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { init } from '../../../store';
import * as dispatcher from '../../../Utilities/Dispatcher';

import ActivityTable from '../ActivityTable';
import {
  availableTasksTableError,
  activityTableItems,
} from '../../../Utilities/hooks/useTableTools/Components/__tests__/TasksTable.fixtures';
import {
  log4j_task,
  log4j_task_jobs,
} from '../../CompletedTaskDetails/__tests__/__fixtures__/completedTasksDetails.fixtures';
import {
  executeTask,
  fetchExecutedTask,
  fetchExecutedTaskJobs,
  fetchExecutedTasks,
} from '../../../../api';

jest.mock('../../../../api');

describe('ActivityTable', () => {
  const store = init().getStore();
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render correctly', () => {
    fetchExecutedTasks.mockImplementation(async () => {
      return activityTableItems;
    });

    const { asFragment } = render(
      <MemoryRouter keyLength={0}>
        <ActivityTable />
      </MemoryRouter>
    );

    expect(asFragment()).toMatchSnapshot();
  });

  it('should render empty', async () => {
    fetchExecutedTasks.mockImplementation(async () => {
      return { data: [] };
    });

    render(
      <MemoryRouter keyLength={0}>
        <ActivityTable />
      </MemoryRouter>
    );

    await waitFor(() =>
      expect(screen.getByLabelText('empty-state')).toBeInTheDocument()
    );
  });

  it('should export', async () => {
    fetchExecutedTasks.mockImplementation(async () => {
      return activityTableItems;
    });

    const { asFragment } = render(
      <MemoryRouter keyLength={0}>
        <Provider store={store}>
          <ActivityTable />
        </Provider>
      </MemoryRouter>
    );

    await waitFor(() => userEvent.click(screen.getByLabelText('Export')));
    await waitFor(() => expect(asFragment()).toMatchSnapshot());
    await waitFor(() => userEvent.click(screen.getByText('Export to CSV')));
  });

  it('should add name filter', async () => {
    fetchExecutedTasks.mockImplementation(async () => {
      return activityTableItems;
    });

    render(
      <MemoryRouter keyLength={0}>
        <Provider store={store}>
          <ActivityTable />
        </Provider>
      </MemoryRouter>
    );

    await waitFor(() => expect(fetchExecutedTasks).toHaveBeenCalled());
    const input = screen.getByLabelText('text input');
    await waitFor(() => fireEvent.change(input, { target: { value: 'A' } }));
    expect(input.value).toBe('A');
  });

  it('should remove name filter', async () => {
    fetchExecutedTasks.mockImplementation(async () => {
      return activityTableItems;
    });

    render(
      <MemoryRouter keyLength={0}>
        <Provider store={store}>
          <ActivityTable />
        </Provider>
      </MemoryRouter>
    );

    await waitFor(() => expect(fetchExecutedTasks).toHaveBeenCalled());
    const input = screen.getByLabelText('text input');
    fireEvent.change(input, { target: { value: 'A' } });
    expect(input.value).toBe('A');
    await waitFor(() => userEvent.click(screen.getByLabelText('close')));
    expect(input.value).toBe('');
  });

  it('should filter by status completed', async () => {
    fetchExecutedTasks.mockImplementation(async () => {
      return activityTableItems;
    });

    render(
      <MemoryRouter keyLength={0}>
        <Provider store={store}>
          <ActivityTable />
        </Provider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(fetchExecutedTasks).toHaveBeenCalled();
      userEvent.click(screen.getByLabelText('Conditional filter'));
      userEvent.click(screen.getAllByText('Status')[0]);
      userEvent.click(screen.getByLabelText('Options menu'));
      userEvent.click(screen.getAllByText('Completed')[0]);
      expect(screen.getByText('taskA')).toBeInTheDocument();
      expect(screen.queryByText('taskB')).not.toBeInTheDocument();
    });
  });

  it('should filter by status running', async () => {
    fetchExecutedTasks.mockImplementation(async () => {
      return activityTableItems;
    });

    render(
      <MemoryRouter keyLength={0}>
        <Provider store={store}>
          <ActivityTable />
        </Provider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(fetchExecutedTasks).toHaveBeenCalled();
      userEvent.click(screen.getByLabelText('Conditional filter'));
      userEvent.click(screen.getAllByText('Status')[0]);
      userEvent.click(screen.getByLabelText('Options menu'));
      userEvent.click(screen.getAllByText('Running')[0]);
      expect(screen.getByText('taskB')).toBeInTheDocument();
      expect(screen.queryByText('taskA')).not.toBeInTheDocument();
    });
  });

  it('should not fetch task jobs if there are no task details on run this task again', async () => {
    fetchExecutedTasks.mockImplementation(async () => {
      return activityTableItems;
    });

    fetchExecutedTask.mockImplementation(async () => {
      return {};
    });

    render(
      <MemoryRouter keyLength={0}>
        <Provider store={store}>
          <ActivityTable />
        </Provider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(fetchExecutedTasks).toHaveBeenCalled();
      userEvent.click(screen.getAllByLabelText('Actions')[0]);
      userEvent.click(screen.getByText('Run this task again'));
      expect(fetchExecutedTask).toHaveBeenCalled();
      expect(fetchExecutedTaskJobs).not.toHaveBeenCalled();
    });
  });

  it('should run this task again', async () => {
    fetchExecutedTasks.mockImplementation(async () => {
      return activityTableItems;
    });

    fetchExecutedTask.mockImplementation(async () => {
      return log4j_task;
    });

    fetchExecutedTaskJobs.mockImplementation(async () => {
      return { data: log4j_task_jobs };
    });

    executeTask.mockImplementation(async () => {
      return { data: { id: 1 } };
    });

    render(
      <MemoryRouter keyLength={0}>
        <Provider store={store}>
          <ActivityTable />
        </Provider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(fetchExecutedTasks).toHaveBeenCalled();
      userEvent.click(screen.getAllByLabelText('Actions')[0]);
      userEvent.click(screen.getByText('Run this task again'));
      expect(fetchExecutedTask).toHaveBeenCalled();
      expect(fetchExecutedTaskJobs).toHaveBeenCalled();
      userEvent.click(screen.getByLabelText('log4j-submit-task-button'));
      expect(executeTask).toHaveBeenCalled();
    });
    expect(fetchExecutedTasks).toHaveBeenCalledTimes(2);
  });

  it('should set errors', async () => {
    fetchExecutedTasks.mockImplementation(async () => {
      return availableTasksTableError;
    });

    const notification = jest
      .spyOn(dispatcher, 'dispatchNotification')
      .mockImplementation();

    render(
      <MemoryRouter keyLength={0}>
        <Provider store={store}>
          <ActivityTable />
        </Provider>
      </MemoryRouter>
    );

    await waitFor(() => expect(notification).toHaveBeenCalled());
  });

  it('should open delete modal', async () => {
    fetchExecutedTasks.mockImplementation(async () => {
      return activityTableItems;
    });

    render(
      <MemoryRouter keyLength={0}>
        <Provider store={store}>
          <ActivityTable />
        </Provider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(fetchExecutedTasks).toHaveBeenCalled();
      userEvent.click(screen.getAllByLabelText('Actions')[1]);
      userEvent.click(screen.getByText('Delete'));
      userEvent.click(screen.getByLabelText('delete-task-button'));
    });
    expect(fetchExecutedTasks).toHaveBeenCalledTimes(2);
  });
});
