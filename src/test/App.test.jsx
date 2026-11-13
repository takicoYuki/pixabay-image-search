import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App.jsx';
import { fakeFetcher, jsonResponse } from './fixtures.js';

async function searchFor(user, keyword) {
  await user.type(screen.getByRole('searchbox', { name: 'キーワード' }), keyword);
  await user.click(screen.getByRole('button', { name: '検索' }));
}

describe('App', () => {
  it('キーワードで検索して、結果を一覧表示する', async () => {
    const user = userEvent.setup();
    const fetcher = fakeFetcher(25);
    render(<App apiKey="KEY" fetcher={fetcher} />);

    await searchFor(user, '猫');

    expect(await screen.findByText('「猫」の検索結果: 25 件中 20 件を表示')).toBeInTheDocument();
    expect(within(screen.getByRole('list', { name: '検索結果' })).getAllByRole('img')).toHaveLength(20);
    expect(screen.getByRole('img', { name: '猫, 動物, 1' })).toHaveAttribute('src', 'https://cdn.example/web/1.jpg');
  });

  it('画像の種類を選んで検索できる', async () => {
    const user = userEvent.setup();
    const fetcher = fakeFetcher(1);
    render(<App apiKey="KEY" fetcher={fetcher} />);

    await user.selectOptions(screen.getByRole('combobox', { name: '画像の種類' }), 'イラスト');
    await searchFor(user, '花');

    await screen.findByText(/「花」の検索結果/);
    expect(new URL(fetcher.mock.calls[0][0]).searchParams.get('image_type')).toBe('illustration');
  });

  it('「もっと見る」で次のページを追加し、全件そろったらボタンを消す', async () => {
    const user = userEvent.setup();
    render(<App apiKey="KEY" fetcher={fakeFetcher(25)} />);
    await searchFor(user, '猫');

    await user.click(await screen.findByRole('button', { name: 'もっと見る' }));

    expect(await screen.findByText('「猫」の検索結果: 25 件中 25 件を表示')).toBeInTheDocument();
    expect(screen.getAllByRole('img')).toHaveLength(25);
    expect(screen.queryByRole('button', { name: 'もっと見る' })).not.toBeInTheDocument();
  });

  it('結果が 0 件ならその旨を表示する', async () => {
    const user = userEvent.setup();
    render(<App apiKey="KEY" fetcher={fakeFetcher(0)} />);
    await searchFor(user, 'zzzz');

    expect(await screen.findByText('「zzzz」に一致する画像は見つかりませんでした。')).toBeInTheDocument();
  });

  it('API がエラーを返したらメッセージを表示する', async () => {
    const user = userEvent.setup();
    render(<App apiKey="KEY" fetcher={async () => jsonResponse({}, 429)} />);
    await searchFor(user, '猫');

    expect(await screen.findByRole('alert')).toHaveTextContent('リクエストが多すぎます');
  });

  it('キーワードが空のときは検索ボタンを押せない', () => {
    render(<App apiKey="KEY" fetcher={vi.fn()} />);
    expect(screen.getByRole('button', { name: '検索' })).toBeDisabled();
  });

  it('画像をクリックすると拡大表示し、Esc で閉じる', async () => {
    const user = userEvent.setup();
    render(<App apiKey="KEY" fetcher={fakeFetcher(3)} />);
    await searchFor(user, '猫');

    await user.click(await screen.findByRole('img', { name: '猫, 動物, 2' }));
    const dialog = screen.getByRole('dialog', { name: '猫, 動物, 2' });
    expect(within(dialog).getByRole('img')).toHaveAttribute('src', 'https://cdn.example/large/2.jpg');
    expect(within(dialog).getByRole('link', { name: 'Pixabay で見る' })).toHaveAttribute('href', 'https://pixabay.com/photos/2/');

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('API キーが未設定なら、検索フォームの代わりに設定方法を表示する', () => {
    render(<App apiKey="" fetcher={vi.fn()} />);
    expect(screen.getByRole('alert')).toHaveTextContent('.env.local');
    expect(screen.queryByRole('search')).not.toBeInTheDocument();
  });
});
