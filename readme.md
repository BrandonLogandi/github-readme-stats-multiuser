<p align="center">
 <img width="100px" src="https://res.cloudinary.com/anuraghazra/image/upload/v1594908242/logo_ccswme.svg" align="center" alt="GitHub Readme Stats" />
 <h2 align="center">GitHub Readme Stats (Multiuser)</h2>
 <p align="center">Get dynamically generated GitHub stats from all of your accounts onto a single README card!</p>
</p>
  <p align="center">
    <a href="https://github.com/BrandonLogandi/github-readme-stats-multiuser/issues/new/choose">Report Bug</a>
    ·
    <a href="https://github.com/BrandonLogandi/github-readme-stats-multiuser/issues/new/choose">Request Feature</a>
    ·
    <a href="https://github.com/BrandonLogandi/github-readme-stats-multiuser/discussions">Ask Question</a>
  </p>
  <!-- <p align="center">
    <a href="/docs/readme_fr.md">Français </a>
    ·
    <a href="/docs/readme_cn.md">简体中文</a>
    ·
    <a href="/docs/readme_es.md">Español</a>
    ·
    <a href="/docs/readme_de.md">Deutsch</a>
    ·
    <a href="/docs/readme_ja.md">日本語</a>
    ·
    <a href="/docs/readme_pt-BR.md">Português Brasileiro</a>
    ·
    <a href="/docs/readme_it.md">Italiano</a>
    ·
    <a href="/docs/readme_kr.md">한국어</a>
    .
    <a href="/docs/readme_nl.md">Nederlands</a>
    .
    <a href="/docs/readme_np.md">नेपाली</a>
    .
    <a href="/docs/readme_tr.md">Türkçe</a>
  </p> -->
</p>

<p align="center">This is a fork of the original GitHub Readme Stats project that adds the ability to combine stats from multiple accounts into a single card. You can access the original project <a href="https://github.com/anuraghazra/github-readme-stats">here.</a></p>

# TLDR
- Replace `github-readme-stats.vercel.app` with `github-readme-stats-multiuser.vercel.app` in your README
- Change `?username=` to `?usernames=` in the URL parameters
- To add more than one account, simply separate their usernames with commas (without spaces)
  - `?usernames=username1,username2,username3`
- *???*
- Profit!

You may wish to [check the original projects documentation](https://github.com/anuraghazra/github-readme-stats#readme) to customize your cards even further.

> **Note**
> Only the Stats and Top Languages cards have been modified to support multiple users. The Extra Pins and Wakatime Stats cards work exactly the same as the original project.

# Why?
A lot of GitHub users (like me) have multiple accounts to work on different types of projects. For example, an user might have an account where they work on their academic/professional projects and another account to keep their smaller/personal projects.

This is where the problem arises: Their commits, stars, top languages and other contributions are always being split into individual, isolated accounts, and they could not be easily consolidated into a simple elegant solution (in this case, the GitHub Readme Stats' cards).

Sure, you could put multiple stats cards on your READMEs for each one of your accounts. However, that still presents some annoyances: 

- The stats will still be isolated from each other;
- The grade and top language systems will evaluate the stats individually, not as a whole;
- Having multiple cards could look clunky and may confuse your profile visitors.

This is where this project comes in handy: A single URL that displays the stats for all your accounts combined. This gives you and your profile visitors:
- Your TOTAL contributions to the entirety of GitHub;
- All languages you've used on all of your projects;
- The ability to see everything mentioned above in a small form factor.

Your README can easily go from this:
![old](https://user-images.githubusercontent.com/59068101/202905610-91386043-e25f-4073-aa62-a64e1f793256.png)
To this:
![new](https://user-images.githubusercontent.com/59068101/202905614-11cdea86-d3f2-4802-9e96-1ba201d35361.png)

To learn how to migrate from the original project to this one, check out the [TLDR](#TLDR) above. Otherwise, everything else from the original project (other parameters, themes, etc.) still applies here.

## Deploy on your own Vercel instance

#### [Check Out Step By Step Video Tutorial By @codeSTACKr](https://youtu.be/n6d4KHSKqGk?t=107)

> **Warning**
> If you are on the [hobby (i.e. free)](https://vercel.com/pricing) Vercel plan, please make sure you change the `maxDuration` parameter in the [vercel.json](https://github.com/BrandonLogandi/github-readme-stats-multiuser/blob/master/vercel.json) file from `30` to `10` (see [#1416](https://github.com/anuraghazra/github-readme-stats/issues/1416#issuecomment-950275476) for more information).

[![Deploy to Vercel](https://vercel.com/button)](https://vercel.com/import/project?template=https://github.com/BrandonLogandi/github-readme-stats-multiuser)

<details>
 <summary><b>:hammer_and_wrench: Step-by-step guide on setting up your own Vercel instance</b></summary>

1.  Go to [vercel.com](https://vercel.com/).
2.  Click on `Log in`.
    ![](https://files.catbox.moe/pcxk33.png)
3.  Sign in with GitHub by pressing `Continue with GitHub`.
    ![](https://files.catbox.moe/b9oxey.png)
4.  Sign in to GitHub and allow access to all repositories if prompted.
5.  Fork this repo.
6.  After forking the repo, open the [`vercel.json`](https://github.com/BrandonLogandi/github-readme-stats-multiuser/blob/master/vercel.json#L5) file and change the `maxDuration` field to `10` (if you are running the free tier).
7.  Go back to your [Vercel dashboard](https://vercel.com/dashboard).
8.  To import a project, click the `Add New...` button and select the `Project` option.
    ![](https://files.catbox.moe/3n76fh.png)
9.  Click the `Continue with GitHub` button, search for the required Git Repository and import it by clicking the `Import` button. Alternatively, you can import a Third-Party Git Repository using the `Import Third-Party Git Repository ->` link at the bottom of the page.
    ![](https://files.catbox.moe/mg5p04.png)
10. Create a personal access token (PAT) [here](https://github.com/settings/tokens/new) and enable the `repo` permissions (this allows access to see private repo stats).
11. Add the PAT as an environment variable named `PAT_1` (as shown).
    ![](https://files.catbox.moe/0yclio.png)
12. Click deploy, and you're good to go. See your domains to use the API!

</details>

### Keep your fork up to date

You can keep your fork, and thus your private Vercel instance up to date with the upstream using GitHubs' [Sync Fork button](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/working-with-forks/syncing-a-fork). You can also use the [pull](https://github.com/wei/pull) package created by [@wei](https://github.com/wei) to automate this process.

* * *

[![https://vercel.com?utm_source=github_readme_stats_team&utm_campaign=oss](./powered-by-vercel.svg)](https://vercel.com?utm_source=github_readme_stats_team&utm_campaign=oss)

All credits go to [Anurag Hazra](https://github.com/anuraghazra) and all of the [contributors](https://github.com/anuraghazra/github-readme-stats/graphs/contributors) of the original project. Thank you :heart:
