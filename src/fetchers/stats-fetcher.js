// @ts-check
import axios from "axios";
import githubUsernameRegex from "github-username-regex";
import { calculateRank } from "../calculateRank.js";
import { retryer } from "../common/retryer.js";
import {
  CustomError,
  logger,
  MissingParamError,
  request,
  wrapTextMultiline,
} from "../common/utils.js";

/**
 * Stats fetcher object.
 *
 * @param {import('axios').AxiosRequestHeaders} variables Fetcher variables.
 * @param {string} token GitHub token.
 * @returns {Promise<import('../common/types').StatsFetcherResponse>} Stats fetcher response.
 */
const fetcher = (variables, token) => {
  return request(
    {
      query: `
      query userInfo($login: String!) {
        user(login: $login) {
          name
          login
          contributionsCollection {
            totalCommitContributions
            restrictedContributionsCount
          }
          repositoriesContributedTo(contributionTypes: [COMMIT, ISSUE, PULL_REQUEST, REPOSITORY]) {
            totalCount
          }
          pullRequests {
            totalCount
          }
          openIssues: issues(states: OPEN) {
            totalCount
          }
          closedIssues: issues(states: CLOSED) {
            totalCount
          }
          followers {
            totalCount
          }
          repositories(ownerAffiliations: OWNER) {
            totalCount
          }
        }
      }
      `,
      variables,
    },
    {
      Authorization: `bearer ${token}`,
    },
  );
};

/**
 * Fetch first 100 repositories for a given username.
 *
 * @param {import('axios').AxiosRequestHeaders} variables Fetcher variables.
 * @param {string} token GitHub token.
 * @returns {Promise<import('../common/types').StatsFetcherResponse>} Repositories fetcher response.
 */
const repositoriesFetcher = (variables, token) => {
  return request(
    {
      query: `
      query userInfo($login: String!, $after: String) {
        user(login: $login) {
          repositories(first: 100, ownerAffiliations: OWNER, orderBy: {direction: DESC, field: STARGAZERS}, after: $after) {
            nodes {
              name
              stargazers {
                totalCount
              }
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      }
      `,
      variables,
    },
    {
      Authorization: `bearer ${token}`,
    },
  );
};

/**
 * Fetch all the commits for all the repositories of a given username.
 *
 * @param {*} username GitHub username.
 * @returns {Promise<number>} Total commits.
 *
 * @description Done like this because the GitHub API does not provide a way to fetch all the commits. See
 * #92#issuecomment-661026467 and #211 for more information.
 */
const totalCommitsFetcher = async (username) => {
  if (!githubUsernameRegex.test(username)) {
    logger.log("Invalid username");
    return 0;
  }

  // https://developer.github.com/v3/search/#search-commits
  const fetchTotalCommits = (variables, token) => {
    return axios({
      method: "get",
      url: `https://api.github.com/search/commits?q=author:${variables.login}`,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/vnd.github.cloak-preview",
        Authorization: `token ${token}`,
      },
    });
  };

  try {
    let res = await retryer(fetchTotalCommits, { login: username });
    let total_count = res.data.total_count;
    if (!!total_count && !isNaN(total_count)) {
      return total_count;
    }
  } catch (err) {
    logger.log(err);
  }
  // just return 0 if there is something wrong so that
  // we don't break the whole app
  return 0;
};

/**
 * Fetch all the stars for all the repositories of a given username.
 *
 * @param {string} username GitHub username.
 * @param {array} repoToHide Repositories to hide.
 * @returns {Promise<number>} Total stars.
 */
const totalStarsFetcher = async (username, repoToHide) => {
  let nodes = [];
  let hasNextPage = true;
  let endCursor = null;
  while (hasNextPage) {
    const variables = { login: username, first: 100, after: endCursor };
    let res = await retryer(repositoriesFetcher, variables);

    if (res.data.errors) {
      logger.error(res.data.errors);
      throw new CustomError(
        res.data.errors[0].message || "Could not fetch user",
        CustomError.USER_NOT_FOUND,
      );
    }

    const allNodes = res.data.data.user.repositories.nodes;
    const nodesWithStars = allNodes.filter(
      (node) => node.stargazers.totalCount !== 0,
    );
    nodes.push(...nodesWithStars);
    // hasNextPage =
    //   allNodes.length === nodesWithStars.length &&
    //   res.data.data.user.repositories.pageInfo.hasNextPage;
    hasNextPage = false; // NOTE: Temporarily disable fetching of multiple pages. Done because of #2130.
    endCursor = res.data.data.user.repositories.pageInfo.endCursor;
  }

  return nodes
    .filter((data) => !repoToHide[data.name])
    .reduce((prev, curr) => prev + curr.stargazers.totalCount, 0);
};

/**
 * Combines and formats the given usernames adding commas and an ampersand if needed.
 *
 * @param {string[]} names The names to combine
 * @returns {Promise<string>} The names combined into a single string
 */
const combineNames = async (names) => {
  if (names.length === 1) {
    return names[0];
  }

  let finalNames = "";

  for (const name of names) {
    if (names.indexOf(name) === 0) {
      finalNames += name;
    } else if (names.indexOf(name) === names.length - 1) {
      finalNames += " & " + name;
    } else {
      finalNames += ", " + name;
    }
  }

  return finalNames;
};

/**
 * Fetch stats for the given usernames.
 *
 * @param {string} usernames GitHub usernames separated by commas.
 * @param {boolean} count_private Include private contributions.
 * @param {boolean} include_all_commits Include all commits.
 * @returns {Promise<import("./types").StatsData>} Stats data.
 */
const fetchStats = async (
  usernames,
  count_private = false,
  include_all_commits = false,
  exclude_repo = [],
) => {
  if (!usernames) throw new MissingParamError(["usernames"]);

  const stats = {
    name: "",
    totalPRs: 0,
    totalCommits: 0,
    totalIssues: 0,
    totalStars: 0,
    totalRepos: 0,
    totalFollowers: 0,
    contributedTo: 0,
    rank: { level: "C", score: 0 },
  };

  const usernamesArray = usernames.split(",");
  const names = [];

  for (const username of usernamesArray) {
    let res = await retryer(fetcher, { login: username });

    // Catch GraphQL errors.
    if (res.data.errors) {
      logger.error(res.data.errors);
      if (res.data.errors[0].type === "NOT_FOUND") {
        throw new CustomError(
          res.data.errors[0].message || "Could not fetch user.",
          CustomError.USER_NOT_FOUND,
        );
      }
      if (res.data.errors[0].message) {
        throw new CustomError(
          wrapTextMultiline(res.data.errors[0].message, 90, 1)[0],
          res.statusText,
        );
      }
      throw new CustomError(
        "Something went while trying to retrieve the stats data using the GraphQL API.",
        CustomError.GRAPHQL_ERROR,
      );
    }

    const user = res.data.data.user;

    // populate repoToHide map for quick lookup
    // while filtering out
    let repoToHide = {};
    if (exclude_repo) {
      exclude_repo.forEach((repoName) => {
        repoToHide[repoName] = true;
      });
    }

    names.push(user.name || user.login);

    stats.totalIssues +=
      user.openIssues.totalCount + user.closedIssues.totalCount;

    // if include_all_commits then just get that,
    // if not, include normal commits only
    if (include_all_commits) {
      stats.totalCommits += await totalCommitsFetcher(username);
    } else {
      stats.totalCommits +=
        user.contributionsCollection.totalCommitContributions;
    }

    // if count_private then add private commits to totalCommits so far.
    if (count_private) {
      stats.totalCommits +=
        user.contributionsCollection.restrictedContributionsCount;
    }

    stats.totalPRs += user.pullRequests.totalCount;
    stats.contributedTo += user.repositoriesContributedTo.totalCount;

    // Retrieve stars while filtering out repositories to be hidden
    stats.totalStars += await totalStarsFetcher(username, repoToHide);

    // Retrieve total number of repositories
    stats.totalRepos += user.repositories.totalCount;

    // Retrieve total number of followers
    stats.totalFollowers += user.followers.totalCount;
  }

  stats.name = await combineNames(names);

  stats.rank = calculateRank({
    totalCommits: stats.totalCommits,
    totalRepos: stats.totalRepos,
    followers: stats.totalFollowers,
    contributions: stats.contributedTo,
    stargazers: stats.totalStars,
    prs: stats.totalPRs,
    issues: stats.totalIssues,
  });

  return stats;
};

export { fetchStats };
export default fetchStats;
