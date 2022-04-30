import { Octokit } from '@octokit/rest';
import fetch from 'node-fetch';

const config = {
	github_token: process.env.GITHUB_TOKEN,
	repo_owner: process.env.REPO_OWNER,
	repo: process.env.REPO,
	jira_username: process.env.JIRA_USERNAME,
	jira_password: process.env.JIRA_PASSWORD,
	jira_project_name: process.env.JIRA_PROJECT_NAME,
	concurrent_limit: process.env.CONCURRENT_LIMIT ?? 5,
};

async function getJiraTicket(name) {
	let data = config.jira_username + ':' + config.jira_password;
  let buff = new Buffer(data);
  let base64data = buff.toString('base64');
  return fetch(`https://${config.jira_project_name}.atlassian.net/rest/api/3/issue/${name}`, { method: 'GET', headers: { Authorization: `Basic ${base64data}` } }).then(r => r.json());
}

const octokit = new Octokit({
  auth: config.github_token,
});

const prs = await octokit.rest.pulls.list({
	owner: config.repo_owner,
	repo: config.repo,
});

async function getJiraTicketAndUpdatePr(pr) {
  const ticket = await getJiraTicket(pr.title);
  const type = ticket.fields?.issuetype?.name.toLowerCase() == 'bug' ? 'bug' : 'feature';
  const fixVersion = ticket.fields?.fixVersions[0]?.name;
  const labels = [type];
  if (fixVersion) labels.push(fixVersion);
  await octokit.rest.issues.addLabels({
    owner: config.repo_owner,
    repo: config.repo,
    issue_number: pr.id,
    labels: labels,
	});
}

const queue = [];

prs.data
	.map(row => {
		const title = row.title.split(/:| /)[0]?.trim().replace(/[^a-z^A-Z^0-9^\-]+/g, '');
		return {
			id: row.number,
			title
		};
	})
	.forEach(async pr => {
    if (queue.length > config.concurrent_limit) await queue.shift();
    queue.push((async () => {
    	try {
    		await getJiraTicketAndUpdatePr(pr)
    	} catch (error) {
    		console.log(error.message, error.stack);
    	}
    })());
	});