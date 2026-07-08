#!/bin/bash
git add .
git commit -m "fix: resolve production build ts compilation error in UI.tsx"
git push origin main
rm git_helper.sh
