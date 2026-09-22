"""One-time, user-approved connection of Solaris to Vercel.

Uses the device authorization flow implemented by the open-source Vercel CLI.
No password is collected. Device codes and access/refresh tokens remain in this
runner's memory, are never committed or logged, and are revoked on completion.
Only the exact Solaris project below can be modified.

Primary references:
https://github.com/vercel/vercel/blob/main/packages/cli/src/util/oauth.ts
https://github.com/vercel/terraform-provider-vercel/blob/main/client/project.go
"""
import base64
import datetime as dt
import json
import os
import signal
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

PROJECT = 'prj_ukVJSEoM4nv5WaRQQbfjtaRsSElj'
TEAM = 'team_MqRTvNvoaArIVzGLcNA6OU4v'
NAME = 'solaris-imersivo'
REPOSITORY = 'FrancoEvora/explorer'
REPO_ID = '1305318784'
BRANCH = 'solaris-imersivo-mobile'
STATUS_PATH = '.ops/solaris-connection-status.json'
# Public OAuth client identifier from Vercel's open-source CLI, not a secret.
CLIENT_ID = 'cl_HYyOPBNtFMfHhaUn9L4QPfTZz6TP47bp'
GH_TOKEN = os.environ['GH_TOKEN']
USER_AGENT = 'Solaris-Project-Connection / GitHub-Actions / user-authorized'
ALLOWED_HOSTS = {'vercel.com', 'api.vercel.com', 'api.github.com', 'solaris-imersivo.vercel.app'}

class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None

OPENER = urllib.request.build_opener(NoRedirect())

def request(url, method='GET', data=None, token=None, form=False, allow_error=False):
    host = urllib.parse.urlparse(url)
    if host.scheme != 'https' or host.hostname not in ALLOWED_HOSTS:
        raise RuntimeError('Unexpected HTTP destination; request blocked.')
    headers = {'User-Agent': USER_AGENT, 'Accept': 'application/json'}
    if token:
        headers['Authorization'] = 'Bearer ' + token
    raw = None
    if data is not None:
        headers['Content-Type'] = 'application/x-www-form-urlencoded' if form else 'application/json'
        raw = (urllib.parse.urlencode(data) if form else json.dumps(data)).encode()
    try:
        with OPENER.open(urllib.request.Request(url, data=raw, headers=headers, method=method), timeout=30) as r:
            body = r.read()
            result = json.loads(body) if body else {}
            return result
    except urllib.error.HTTPError as exc:
        try:
            detail = json.loads(exc.read())
        except Exception:
            detail = {}
        if allow_error:
            return {'_http_status': exc.code, **detail}
        err = detail.get('error', {})
        code = err.get('code', 'request_failed') if isinstance(err, dict) else str(err)
        raise RuntimeError(f'{method} {host.path}: HTTP {exc.code} ({code})') from None


def utcnow():
    return dt.datetime.now(dt.timezone.utc).isoformat()


def publish_status(status, **fields):
    # Only explicitly public fields are accepted. Never accept arbitrary API responses.
    allowed = {'user_code', 'verification_url', 'expires_at', 'message', 'deployment_id', 'deployment_url'}
    if not set(fields).issubset(allowed):
        raise RuntimeError('Unsafe status field rejected.')
    value = {'status': status, 'project': NAME, 'repository': REPOSITORY, 'branch': BRANCH,
             'updated_at': utcnow(), 'run_url': f"https://github.com/{REPOSITORY}/actions/runs/{os.environ['GITHUB_RUN_ID']}", **fields}
    url = f'https://api.github.com/repos/{REPOSITORY}/contents/{STATUS_PATH}'
    for attempt in range(3):
        old = request(url + '?ref=' + BRANCH, token=GH_TOKEN, allow_error=True)
        payload = {'message': 'chore(solaris): connection status [skip ci]', 'branch': BRANCH,
                   'content': base64.b64encode((json.dumps(value, ensure_ascii=False, indent=2) + '\n').encode()).decode()}
        if 'sha' in old:
            payload['sha'] = old['sha']
        result = request(url, method='PUT', data=payload, token=GH_TOKEN, allow_error=True)
        if '_http_status' not in result:
            return
        if result['_http_status'] != 409 or attempt == 2:
            raise RuntimeError('Could not publish the non-secret connection status.')
        time.sleep(1)


def vercel(path, token, method='GET', data=None):
    sep = '&' if '?' in path else '?'
    return request('https://api.vercel.com' + path + sep + 'teamId=' + TEAM, method, data, token)


def connect_and_publish(token):
    project_path = '/v9/projects/' + PROJECT
    project = vercel(project_path, token)
    if project.get('id') != PROJECT or project.get('name') != NAME or project.get('accountId') != TEAM:
        raise RuntimeError('The authorized account did not return the exact Solaris project. No changes made.')
    link = project.get('link') or {}
    if link and (link.get('type'), link.get('org'), link.get('repo')) != ('github', 'FrancoEvora', 'explorer'):
        raise RuntimeError('Solaris is linked to a different repository. Automatic replacement was blocked.')

    # Ignore every other branch, plus commits that change only the public status file.
    ignore = ('[ "$VERCEL_GIT_COMMIT_REF" = "solaris-imersivo-mobile" ] || exit 0; '
              'git rev-parse HEAD^ >/dev/null 2>&1 || exit 1; '
              "git diff --name-only HEAD^ HEAD | grep -qv '^\\.ops/solaris-connection-status\\.json$' && exit 1; exit 0")
    vercel(project_path, token, 'PATCH', {'framework': None, 'rootDirectory': None,
        'buildCommand': 'node .ops/build-solaris.mjs', 'installCommand': '',
        'outputDirectory': 'solaris-dist', 'commandForIgnoringBuildStep': ignore})
    if not link:
        vercel(project_path + '/link', token, 'POST', {'type': 'github', 'repo': REPOSITORY})
    vercel(project_path + '/branch', token, 'PATCH', {'branch': BRANCH})
    check = vercel(project_path, token)
    confirmed = check.get('link') or {}
    if (confirmed.get('type'), confirmed.get('org'), confirmed.get('repo'), confirmed.get('productionBranch')) != ('github', 'FrancoEvora', 'explorer', BRANCH):
        raise RuntimeError('Vercel did not confirm the requested repository and production branch.')
    print('Confirmed: Solaris is connected to FrancoEvora/explorer, production branch solaris-imersivo-mobile.', flush=True)

    # Pin the reviewed workflow/source commit, not a later status-only commit.
    deployment = vercel('/v13/deployments', token, 'POST', {
        'name': NAME, 'project': PROJECT, 'target': 'production',
        'gitSource': {'type': 'github', 'repoId': REPO_ID, 'ref': BRANCH, 'sha': os.environ['GITHUB_SHA']}
    })
    deployment_id = deployment.get('id')
    if not deployment_id:
        raise RuntimeError('Vercel did not return a deployment identifier.')
    print('Deployment started: ' + deployment_id, flush=True)
    for _ in range(90):
        deployment = vercel('/v13/deployments/' + deployment_id, token)
        state = deployment.get('readyState') or deployment.get('state')
        if state == 'READY':
            break
        if state in {'ERROR', 'CANCELED'}:
            raise RuntimeError('Vercel deployment ended in ' + state + ': ' + deployment_id)
        time.sleep(5)
    else:
        raise RuntimeError('Deployment is still pending: ' + deployment_id)

    # An anonymous HTTPS request must return the new page, not a login or the old site.
    public_url = 'https://solaris-imersivo.vercel.app'
    verified = False
    for _ in range(12):
        try:
            req = urllib.request.Request(public_url, headers={'User-Agent': USER_AGENT})
            with OPENER.open(req, timeout=20) as response:
                html = response.read().decode('utf-8')
                verified = response.status == 200 and '2026-09-22-web-1' in html and 'src="./masterplan.jpg"' in html
            if verified:
                with OPENER.open(public_url + '/masterplan.jpg', timeout=20) as image:
                    verified = image.status == 200 and len(image.read()) > 10000
            if verified:
                break
        except Exception:
            pass
        time.sleep(5)
    status = 'published_and_http_verified' if verified else 'connected_deployment_ready_public_access_not_verified'
    publish_status(status, deployment_id=deployment_id, deployment_url=public_url,
        message='Git connection and production branch confirmed. ' + ('Public HTML and image returned HTTP 200.' if verified else 'Deployment is READY; anonymous public access still needs verification.'))
    print(status, flush=True)


def main():
    if os.environ.get('GITHUB_REPOSITORY') != REPOSITORY or os.environ.get('GITHUB_REF_NAME') != BRANCH:
        raise RuntimeError('Unexpected repository or branch. Operation blocked.')
    if not Path('solaris-dist/masterplan.jpg').exists():
        raise RuntimeError('Validated static build is missing. Operation blocked.')
    metadata = request('https://vercel.com/.well-known/openid-configuration')
    if metadata.get('issuer', '').rstrip('/') != 'https://vercel.com':
        raise RuntimeError('OAuth issuer verification failed.')
    for name in ('device_authorization_endpoint', 'token_endpoint', 'revocation_endpoint'):
        endpoint = urllib.parse.urlparse(metadata[name])
        if endpoint.scheme != 'https' or endpoint.hostname not in {'vercel.com', 'api.vercel.com'}:
            raise RuntimeError('Unexpected OAuth endpoint.')
    auth = request(metadata['device_authorization_endpoint'], 'POST',
                   {'client_id': CLIENT_ID, 'scope': 'openid offline_access'}, form=True)
    verification = urllib.parse.urlparse(auth['verification_uri_complete'])
    if verification.scheme != 'https' or verification.hostname != 'vercel.com':
        raise RuntimeError('Unexpected authorization page.')
    query = urllib.parse.parse_qsl(verification.query)
    query.append(('team_id', TEAM))
    verification_url = urllib.parse.urlunparse(verification._replace(query=urllib.parse.urlencode(query)))
    expires = min(int(auth['expires_in']), 1200)
    expires_at = (dt.datetime.now(dt.timezone.utc) + dt.timedelta(seconds=expires)).isoformat()
    publish_status('waiting_for_vercel_authorization', user_code=auth['user_code'],
                   verification_url=verification_url, expires_at=expires_at,
                   message='Approve this one-time Vercel CLI authorization. Only the Solaris project will be changed; tokens are revoked afterward.')
    print('Official Vercel authorization requested. Waiting for the project owner.', flush=True)
    deadline = time.monotonic() + expires
    interval = max(int(auth.get('interval', 5)), 5)
    tokens = None
    try:
        while time.monotonic() < deadline:
            time.sleep(interval)
            result = request(metadata['token_endpoint'], 'POST', {
                'client_id': CLIENT_ID, 'grant_type': 'urn:ietf:params:oauth:grant-type:device_code',
                'device_code': auth['device_code']}, form=True, allow_error=True)
            if result.get('access_token'):
                tokens = result
                break
            error = result.get('error')
            if error == 'authorization_pending':
                continue
            if error == 'slow_down':
                interval += 5
                continue
            raise RuntimeError('Vercel authorization was not completed: ' + str(error))
        if tokens is None:
            raise RuntimeError('The one-time authorization link expired before approval.')
        connect_and_publish(tokens['access_token'])
    except Exception as exc:
        # Error messages contain operation codes only, never token responses.
        publish_status('not_completed', message=str(exc)[:450])
        raise
    finally:
        if tokens:
            for key in ('refresh_token', 'access_token'):
                if tokens.get(key):
                    try:
                        request(metadata['revocation_endpoint'], 'POST', {'client_id': CLIENT_ID, 'token': tokens[key]}, form=True)
                    except Exception:
                        print('Warning: token revocation request was not confirmed; the runner retains no credential files.', flush=True)
            tokens.clear()


def terminate(signum, frame):
    raise RuntimeError('Connection job interrupted.')

if __name__ == '__main__':
    signal.signal(signal.SIGTERM, terminate)
    try:
        main()
    except Exception as exc:
        print('Solaris connection stopped: ' + str(exc), flush=True)
        raise SystemExit(1)
