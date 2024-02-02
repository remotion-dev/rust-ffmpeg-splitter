cd ffmpeg
git revert 7f4fed52165cbc1b2fcc9663fc053516ae77c760 --no-commit
git revert b92af7b64e7acd015aea3ae1da2228c5a7e677bf --no-commit
git revert 97c95961f0d78368d6318f02aeaeb2da5b8f1443 --no-commit
git revert d2e1389285eb31581b3370508ddaf226f79148fe --no-commit
git checkout . --ours
git add .
git revert e026e29460a2c43619b549c2d4fc40c29bbde1f8 --no-commit
git checkout . --ours
git add .
