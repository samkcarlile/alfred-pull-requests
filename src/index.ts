import alfy, { ScriptFilterItem } from 'alfy';
import { useCache } from './lib/cache.js';
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

const getPullRequests = useCache(_getPullRequests, {
  expires: 1000 * 60,
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
  repos.map(([owner, repo]) => getPullRequests({ owner, repo, state: 'all' }))
);

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
      uid: pr.node_id,
      title,
      subtitle: `${repo} – by ${author} – Updated ${relativeDate}`,
      arg: pr.html_url,
      icon: { path: getIconPath(pr.state) },
    };
  })
);

export {};
