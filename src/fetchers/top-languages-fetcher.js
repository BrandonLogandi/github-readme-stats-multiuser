// @ts-check
import * as dotenv from "dotenv";
import { retryer } from "../common/retryer.js";
import {
  CustomError,
  logger,
  MissingParamError,
  request,
  wrapTextMultiline,
} from "../common/utils.js";

dotenv.config();

/**
 * Top languages fetcher object.
 *
 * @param {import('Axios').AxiosRequestHeaders} variables Fetcher variables.
 * @param {string} token GitHub token.
 * @returns {Promise<import('../common/types').StatsFetcherResponse>} Languages fetcher response.
 */
const fetcher = (variables, token) => {
  return request(
    {
      query: `
      query userInfo($login: String!) {
        user(login: $login) {
          # fetch only owner repos & not forks
          repositories(ownerAffiliations: OWNER, isFork: false, first: 100) {
            nodes {
              name
              languages(first: 10, orderBy: {field: SIZE, direction: DESC}) {
                edges {
                  size
                  node {
                    color
                    name
                  }
                }
              }
            }
          }
        }
      }
      `,
      variables,
    },
    {
      Authorization: `token ${token}`,
    },
  );
};

/**
 * Fetch top languages for the given usernames and consolidate them.
 *
 * @param {string} usernames GitHub usernames separated by commas.
 * @param {string[]} exclude_repo List of repositories to exclude.
 * @returns {Promise<import("./types").TopLangData>} Top languages data.
 */
async function fetchTopLanguages(usernames, exclude_repo = []) {
  if (!usernames) throw new MissingParamError(["usernames"]);

  const usernamesArray = usernames.split(",");
  let repoNodes = []; // Repo nodes of all users

  for (const username of usernamesArray) {
    const res = await retryer(fetcher, { login: username });

    if (res.data.errors) {
      logger.error(res.data.errors);
      throw Error(res.data.errors[0].message || "Could not fetch user");
    }

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
        "Something went while trying to retrieve the language data using the GraphQL API.",
        CustomError.GRAPHQL_ERROR,
      );
    }

    const userRepoNodes = res.data.data.user.repositories.nodes;

    if (repoNodes.length === 0) {
      repoNodes = userRepoNodes;
    } else {
      for (const node of userRepoNodes) {
        repoNodes.push(node);
      }
    }
  }

  let repoToHide = {};

  // populate repoToHide map for quick lookup
  // while filtering out
  if (exclude_repo) {
    exclude_repo.forEach((repoName) => {
      repoToHide[repoName] = true;
    });

    repoNodes = repoNodes
      .sort((a, b) => b.size - a.size)
      .filter((name) => !repoToHide[name.name]);

    repoNodes = repoNodes
      .filter((node) => node.languages.edges.length > 0)
      // flatten the list of language nodes
      .reduce((acc, curr) => curr.languages.edges.concat(acc), [])
      .reduce((acc, prev) => {
        // get the size of the language (bytes)
        let langSize = prev.size;

        // if we already have the language in the accumulator
        // & the current language name is same as previous name
        // add the size to the language size.
        if (
          acc[prev.node.name] &&
          prev.node.name === acc[prev.node.name].name
        ) {
          langSize = prev.size + acc[prev.node.name].size;
        }
        return {
          ...acc,
          [prev.node.name]: {
            name: prev.node.name,
            color: prev.node.color,
            size: langSize,
          },
        };
      }, {});
  }

  const topLangs = Object.keys(repoNodes)
    .sort((a, b) => repoNodes[b].size - repoNodes[a].size)
    .reduce((result, key) => {
      result[key] = repoNodes[key];
      return result;
    }, {});

  return topLangs;
}

export { fetchTopLanguages };
export default fetchTopLanguages;
