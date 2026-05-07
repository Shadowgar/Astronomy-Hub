import hashlib
from pathlib import Path

import requests


URL = (
    "https://stellarium.sfo2.cdn.digitaloceanspaces.com/"
    "swe-data-packs/extended/2020-03-11/"
    "extended_2020-03-11_42143e86/"
    "dso/properties"
)

OUTPUT = Path("properties.dat")

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/134.0.0.0 Safari/537.36"
    ),
    "Accept": "application/octet-stream, */*",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    "Referer": "https://stellarium-web.org/",
    "Origin": "https://stellarium-web.org",
    "Connection": "keep-alive",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "cross-site",
    "Cache-Control": "no-cache",
    "Pragma": "no-cache",
}


def main():
    print("Downloading:")
    print(URL)
    print()

    session = requests.Session()

    try:
        response = session.get(
            URL,
            headers=HEADERS,
            timeout=120,
            stream=True,
            allow_redirects=True,
        )
    except Exception as exc:
        print("Request failed before receiving an HTTP response.")
        print(exc)
        return

    print("Status:", response.status_code)
    print("Content-Type:", response.headers.get("content-type"))
    print("Content-Length:", response.headers.get("content-length"))
    print("Location:", response.headers.get("location"))  # in case of redirect
    print()

    if response.status_code == 403:
        print("Still getting 403. The CDN is quite strict.")
        print("Try these additional steps:")
        print("1. Open https://stellarium-web.org/ in Chrome")
        print("2. Open DevTools (F12) → Network tab")
        print("3. Enable Deep Sky Objects if not already")
        print("4. Find the request to 'properties' and copy all Request Headers")
        print("5. Paste them into the HEADERS dict above")
        return

    if response.status_code == 404:
        print("404 Not Found - path may be outdated.")
        return

    response.raise_for_status()

    sha256 = hashlib.sha256()
    total = 0

    with OUTPUT.open("wb") as f:
        for chunk in response.iter_content(chunk_size=1024 * 1024):
            if chunk:
                f.write(chunk)
                sha256.update(chunk)
                total += len(chunk)

    print(f"Saved: {OUTPUT.resolve()}")
    print(f"Bytes: {total:,}")
    print(f"SHA256: {sha256.hexdigest()}")


if __name__ == "__main__":
    main()