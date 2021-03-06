import alfy from 'alfy';
import { swrOptions, withSWR } from './lib/swr.js';
import {
  getPullRequests as _getPullRequests,
  parsePullRequestUrl,
  PullRequest,
} from './lib/github.js';
import {
  formatDateRelative,
  getIconPath,
  ordinalScale,
  reviveDateProperties,
} from './lib/util.js';

const getPullRequests = withSWR(_getPullRequests, {
  reviver: reviveDateProperties<PullRequest>([
    'updated_at',
    'created_at',
    'merged_at',
    'closed_at',
  ]),
});

const repos = process.env['REPOS']
  .split(',')
  .map((s) => s.trim())
  .map((s) => s.split('/'));

const pullRequestsByRepo = await Promise.all(
  repos.map(([owner, repo]) =>
    getPullRequests({
      owner,
      repo,
      state: 'all',
      per_page: 20,
      sort: (process.env['SORT'] ?? 'created_at').slice(-4) as
        | 'created'
        | 'updated',
    })
  )
);

let sortedPulls: PullRequest[] = pullRequestsByRepo.flat().sort((a, b) => {
  const dateProp: keyof PullRequest = (process.env['SORT'] ?? 'created_at') as
    | 'created_at'
    | 'updated_at';

  const stateScale = ordinalScale(['closed', 'merged', 'open']);
  const [aState, bState] = [a.state, b.state].map(stateScale);

  if (aState === bState) {
    return b[dateProp].getTime() - a[dateProp].getTime();
  } else {
    return bState > aState ? 1 : -1;
  }
});

const query = alfy.input?.toLowerCase().trim();
if (query && query.length) {
  // TODO: more sophisticated querying: identify tokens and match the to properties
  sortedPulls = [...sortedPulls].filter((pr) => {
    return [pr.body, pr.title]
      .filter(Boolean)
      .map((text) => text.toLowerCase().includes(query))
      .some((e) => e);
  });
}

alfy.output(
  sortedPulls.map((pr) => {
    const title = `(${pr.number}) ${pr.title}`;
    const relativeDate = formatDateRelative(pr.updated_at);
    const author = pr.user.login;
    const { repo } = parsePullRequestUrl(pr.url);

    return {
      uid: pr.node_id,
      title,
      subtitle: `${repo} • by ${author} • Updated ${relativeDate}`,
      arg: pr.html_url,
      icon: { path: getIconPath(pr.state) },
    };
  }),
  swrOptions()
);

export {};
