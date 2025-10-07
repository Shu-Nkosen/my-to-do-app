import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

const addTask = async (name) => {
  const input = screen.getByLabelText('新しいタスク');
  const addButton = screen.getByRole('button', { name: '追加' });
  await act(async () => {
    await userEvent.clear(input);
    await userEvent.type(input, name);
    await userEvent.click(addButton);
  });
};

test('タスクを追加できる', async () => {
  render(<App />);

  await addTask('ミーティングの準備');

  expect(await screen.findByText('ミーティングの準備')).toBeInTheDocument();
  expect(
    await screen.findByRole('button', { name: 'ミーティングの準備 を編集' }),
  ).toBeInTheDocument();
});

test('未完了タスクが完了済みタスクより上に並ぶ', async () => {
  render(<App />);

  await addTask('タスクA');
  await addTask('タスクB');

  const checkboxes = screen.getAllByRole('checkbox');
  await act(async () => {
    await userEvent.click(checkboxes[0]);
  });

  const listItems = screen.getAllByRole('listitem');
  expect(within(listItems[0]).getByText('タスクB')).toBeInTheDocument();
  expect(within(listItems[1]).getByText('タスクA')).toBeInTheDocument();
});

test('タスクを削除できる', async () => {
  render(<App />);

  await addTask('タスクC');

  const editButton = screen.getByRole('button', { name: 'タスクC を編集' });
  await act(async () => {
    await userEvent.click(editButton);
  });

  const deleteButton = await screen.findByRole('button', { name: '削除' });
  await act(async () => {
    await userEvent.click(deleteButton);
  });

  await waitFor(() => {
    expect(screen.queryByText('タスクC')).not.toBeInTheDocument();
  });
});
