import { Octokit, RestEndpointMethodTypes } from '@octokit/rest';
import { stopwatch } from './debug.js';

type ElementOf<T extends any[]> = T extends (infer E)[] ? E : T;
type Override<T, O> = Omit<T, keyof O> & O;

export type PullRequestData = ElementOf<
  RestEndpointMethodTypes['pulls']['list']['response']['data']
>;

export type PullRequest = Override<
  PullRequestData,
  {
    created_at: Date;
    updated_at: Date;
    merged_at: Date;
    closed_at: Date;
    state: 'open' | 'closed' | 'merged';
  }
>;

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
  userAgent: 'alfred-pull-requests',
});

type QueryOptions = {
  owner: string;
  repo: string;
  state?: 'all' | 'open' | 'closed';
  sort?: 'created' | 'updated';
  per_page?: number;
};

export async function getPullRequests({
  owner,
  repo,
  state = 'all',
  sort = 'created',
  per_page = 50,
}: QueryOptions) {
  let _ = stopwatch(
    `octokit.rest.pulls.list ${{ owner, repo, state, sort, per_page }}`
  );

  const { data, status } = await octokit.rest.pulls.list({
    owner,
    repo,
    state,
    per_page,
    sort,
    direction: 'desc',
  });
  _();

  if (status !== 200)
    throw new Error(`(${status}) error getting pull requests`);

  return data.map<PullRequest>((pr) => ({
    ...pr,
    created_at: new Date(pr.created_at),
    merged_at: pr.merged_at ? new Date(pr.merged_at) : undefined,
    updated_at: new Date(pr.updated_at),
    closed_at: pr.closed_at ? new Date(pr.closed_at) : undefined,
    state: pr.merged_at ? 'merged' : (pr.state as 'open' | 'closed'),
  }));
}

export const parsePullRequestUrl = (url: string) => {
  const [, , owner, repo, , id] = new URL(url).pathname.split('/');
  return { owner, repo, id };
};
