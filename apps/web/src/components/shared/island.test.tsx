import { QueryClient, QueryClientProvider, useSuspenseQuery } from '@tanstack/react-query';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ApiError } from '@/lib/api/client';
import { renderWithIntl } from '@/test/render-with-intl';

import { Island } from './island';

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

function Content({ fetcher }: { fetcher: () => Promise<string> }) {
  const { data } = useSuspenseQuery({ queryKey: ['island-test'], queryFn: fetcher, retry: false });
  return <p>{data}</p>;
}

describe('Island', () => {
  it('shows the skeleton, then the content', async () => {
    const client = new QueryClient();
    renderWithIntl(
      <QueryClientProvider client={client}>
        <Island fallback={<p>loading…</p>}>
          <Content fetcher={async () => 'hello'} />
        </Island>
      </QueryClientProvider>,
    );
    expect(screen.getByText('loading…')).toBeInTheDocument();
    expect(await screen.findByText('hello')).toBeInTheDocument();
  });

  it('keeps a failure inside, says why in the page language, and retries only itself', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    let calls = 0;
    const fetcher = async () => {
      calls += 1;
      if (calls === 1) throw new ApiError(503, 'UNAVAILABLE', 'ECONNREFUSED 127.0.0.1:1337');
      return 'recovered';
    };
    renderWithIntl(
      <QueryClientProvider client={client}>
        <p>static shell stays</p>
        <Island fallback={<p>loading…</p>}>
          <Content fetcher={fetcher} />
        </Island>
      </QueryClientProvider>,
      { locale: 'fr' },
    );
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Le serveur de contenu est indisponible.');
    expect(alert).not.toHaveTextContent('ECONNREFUSED');
    expect(screen.getByText('static shell stays')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Réessayer' }));
    expect(await screen.findByText('recovered')).toBeInTheDocument();
    expect(calls).toBe(2);
  });
});
