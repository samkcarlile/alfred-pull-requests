import alfy from 'alfy';
import { formatDateRelative, getIconPath, ordinalScale } from './lib/util.js';
import {
  getPullRequests,
  parsePullRequestUrl,
  PullRequest,
} from './lib/github.js';

const repos = process.env['REPOS']
  .split(',')
  .map((s) => s.trim())
  .map((s) => s.split('/'));

const pullRequestsByRepo = await Promise.all(
  repos.map(([owner, repo]) => getPullRequests({ owner, repo, state: 'all' }))
);

const orderBy = (process.env['SORT'] ?? 'created') as 'created' | 'updated';
const sortFn: (a: PullRequest, b: PullRequest) => number =
  orderBy === 'created'
    ? (a, b) => b.created_at.getTime() - a.created_at.getTime()
    : (a, b) => b.updated_at.getTime() - a.updated_at.getTime();

let filteredPulls: PullRequest[] = pullRequestsByRepo.flat().sort((a, b) => {
  const dateProp: keyof PullRequest = (process.env['SORT'] ?? 'created_at') as
    | 'created_at'
    | 'updated_at';

  const stateScale = ordinalScale(['closed', 'merged', 'open']);
  const [aState, bState] = [a.state, b.state].map(stateScale);

  if (aState === bState) {
    return b[dateProp].getTime() - a[dateProp].getTime();
  } else {
    return bState - aState;
  }
});

alfy.output(
  filteredPulls.map((pr) => {
    const title = `(${pr.number}) ${pr.title}`;
    const relativeDate = formatDateRelative(pr.updated_at);
    const author = pr.user.login;
    const { repo } = parsePullRequestUrl(pr.url);

    return {
      title,
      subtitle: `${repo} – by ${author} – Updated ${relativeDate}`,
      arg: pr.html_url,
      icon: { path: getIconPath(pr.state) },
    };
  })
);

export {};
