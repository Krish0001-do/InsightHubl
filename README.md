# InsightHub

A sleek *GitHub Profile Finder* that helps you explore a GitHub user’s profile, repositories, and key stats in one place — with search history, sharing, and a downloadable profile card.

 Project Info

-Name: InsightHub
-Type: Frontend (static web app)
-Owner/Author: Karan 
-Status: Active

Demo

-Local: Open `index.html` in any modern browser
-Share link format: `...?user=<github_username>`

 `

 Features

- Search any GitHub username and view profile details (name, bio, location, links, joined date)
- Repository listing with controls:
  - Sort (updated/pushed/created/name)
  - Search by repo name
  - Filter by language
  - Minimum stars
  - Exclude forks
  - Updated-after date filter
  - Load more repositories
- Quick insights panels (language stats, organizations, followers/following, gists, recent activity)
- Compare two users (type `user1, user2` or `user1 vs user2`)
- Theme toggle (dark/light)
- Search history chips + clear history
- Share link (copies a URL with `?user=`)
- Download card (exports the profile card)

 Tech Stack

- HTML + CSS + Vanilla JavaScript
- GitHub REST API
- `html2canvas` (for downloading the card)

 Run Locally

1. Download/clone this folder.
2. Open `index.html` in your browser.

That’s it — no build step.

### Optional (Recommended)

For a smoother dev experience, run it using a local server (avoids some browser restrictions and gives auto-reload).

- VS Code: install “Live Server” extension and click **Go Live**

## How To Use

- Type a GitHub username and click **Search**.
- For comparison, enter:
  - `torvalds, gaearon`  
  - or `torvalds vs gaearon`
- To share a profile, use **Copy Share Link** (it generates a link like `...?user=username`).

## Notes

- GitHub API has rate limits for unauthenticated requests. If you hit limits, try again later.
- Some fields may be empty depending on the user’s GitHub profile settings.

Project Structure


.
├── index.html
├── style.css
└── script.js

Roadmap (Optional)

- Add GitHub API auth support (token) to reduce rate-limit issues
- Improve error messaging for rate limits and invalid usernames

 Contributing

Contributions are welcome.

1. Fork the repo
2. Create a feature branch
3. Commit changes with clear messages
4. Open a pull request


