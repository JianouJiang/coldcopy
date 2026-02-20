# ColdCopy Deployment Guide

## Step 1: Create GitHub Repository

Since `gh` CLI needs authentication setup, create the repo manually:

1. Go to https://github.com/new
2. Repository name: `coldcopy`
3. Description: "AI-powered cold email sequence generator for B2B SaaS founders"
4. Visibility: Public
5. Do NOT initialize with README (we already have one)
6. Click "Create repository"

## Step 2: Push Code to GitHub

```bash
cd /home/jianoujiang/Desktop/proxima-auto-company/projects/coldcopy

# Add the remote (replace JianouJiang with your GitHub username if different)
git remote add origin https://github.com/JianouJiang/coldcopy.git

# Rename branch to main
git branch -M main

# Push to GitHub
git push -u origin main
```

## Step 3: Verify Deployment

Visit: https://github.com/JianouJiang/coldcopy

You should see:
- README.md with project description
- Landing page code in `frontend/src/pages/Landing.tsx`
- Design system in `frontend/src/index.css`
- Button component in `frontend/src/components/ui/button.tsx`

## Step 4: Local Development

To run the app locally:

```bash
cd /home/jianoujiang/Desktop/proxima-auto-company/projects/coldcopy/frontend
npm run dev
```

Open http://localhost:5173 to see the landing page.

## Next Steps

1. **Day 2-3:** DHH builds the input form and generate page
2. **Day 4:** DevOps deploys to Cloudflare Pages
3. **Day 5:** Stripe Payment Links integration
4. **Day 6:** QA testing
5. **Day 7:** Production launch

## GitHub CLI Setup (Optional)

To use `gh` CLI in future:

```bash
# Authenticate
gh auth login

# Follow prompts:
# - Choose GitHub.com
# - Choose HTTPS
# - Authenticate via web browser
# - Complete authentication in browser
```

Once authenticated, you can use:
```bash
gh repo create coldcopy --public --description "..." --source=. --push
```
