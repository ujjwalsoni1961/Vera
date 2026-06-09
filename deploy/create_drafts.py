"""Create the two Vercel drafts: (1) project + env vars, (2) inline-file deployment."""
import asyncio, json, os, subprocess, sys

sys.path.insert(0, "/work")
from sdk.tools.pd_vercel_token_auth import pd_vercel_token_auth_proxy_post

TEAM = "team_aHLZ3PPe1mhmYlBOguKS9ami"
REPO = "/work/repos/Vera"

MINIMAX_KEY = os.environ["MINIMAX_API_KEY"]
TARGETS = ["production", "preview", "development"]


def gather_files():
    out = subprocess.run(
        ["git", "ls-files"], cwd=REPO, capture_output=True, text=True, check=True
    )
    files = []
    for rel in out.stdout.splitlines():
        rel = rel.strip()
        if not rel:
            continue
        with open(os.path.join(REPO, rel), "r", encoding="utf-8") as f:
            files.append({"file": rel, "data": f.read()})
    return files


async def main():
    # 1) Project + env vars in one shot
    proj_body = {
        "name": "vera",
        "framework": "nextjs",
        "environmentVariables": [
            {"key": "MINIMAX_API_KEY", "value": MINIMAX_KEY, "type": "encrypted", "target": TARGETS},
            {"key": "MINIMAX_MODEL", "value": "MiniMax-M3", "type": "plain", "target": TARGETS},
            {"key": "MINIMAX_API_BASE", "value": "https://api.minimax.io/v1", "type": "plain", "target": TARGETS},
        ],
    }
    r1 = await pd_vercel_token_auth_proxy_post(
        url="https://api.vercel.com/v10/projects",
        query_params={"teamId": TEAM},
        json_body=proj_body,
    )
    print("PROJECT_DRAFT:", r1.get("content", ""))

    # 2) Deployment with inline files
    files = gather_files()
    deploy_body = {
        "name": "vera",
        "project": "vera",
        "target": "production",
        "files": files,
        "projectSettings": {"framework": "nextjs"},
    }
    r2 = await pd_vercel_token_auth_proxy_post(
        url="https://api.vercel.com/v13/deployments",
        query_params={"teamId": TEAM, "skipAutoDetectionConfirmation": "1"},
        json_body=deploy_body,
    )
    print("DEPLOY_DRAFT:", r2.get("content", ""))
    print("FILE_COUNT:", len(files))


asyncio.run(main())
