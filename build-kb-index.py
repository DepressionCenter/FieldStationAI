#!/usr/bin/env python
"""
Summary: Crawls a website (or TDX KB portal) and produces a Field Station AI-compatible RAG index.json.

This file is part of Field Station AI
build-kb-index.py

Author(s): Gabriel Mongefranco.
Created: 2026-07-20
Notes: See README file for documentation and full license information.

Usage (edit USER CONFIG below, then just run):
    python build-kb-index.py

Or with CLI overrides:
    python build-kb-index.py --url "https://..." --out index.json --max-pages 500 --delay 0.5
"""

# Copyright © 2026 The Regents of the University of Michigan
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
# GNU General Public License for more details.
# You should have received a copy of the GNU General Public License along
# with this program. If not, see <https://www.gnu.org/licenses/>.

__author__ = "Gabriel Mongefranco, University of Michigan."
__copyright__ = "Copyright (C) 2026 The Regents of the University of Michigan"
__license__ = "GPLv3 or later"
__date__ = "2026-07-20"

# ===========================================================================
# USER CONFIG -- edit these; CLI args override at runtime
# ===========================================================================

# Seed URL to start crawling from
SEED_URL = "https://teamdynamix.umich.edu/TDClient/210/DepressionCenter/Home/"

# Output file path
OUT_PATH = "index.json"

# Max pages to crawl (safety ceiling)
MAX_PAGES = 10000

# Polite delay between requests in seconds (0 = no delay)
DELAY = 0.5

# ---------------------------------------------------------------------------
# INCLUDE_PATTERNS -- only crawl URLs matching at least one of these.
#
# Each entry is a regex string matched against the full URL (case-insensitive).
#
# Leave as [] for automatic defaults:
#   - TDX URLs (containing /TDClient/<digits>/<slug>/):
#       auto-restricts to that exact /TDClient/<digits>/<slug>/ prefix
#   - All other URLs:
#       auto-restricts to the same origin (scheme + host)
#
# Examples:
#   [r"/TDClient/210/DepressionCenter/"]   # explicit TDX prefix
#   [r"https://example\.com/docs/"]        # non-TDX subfolder
#   [r"/KB/", r"/Articles/"]              # multiple allowed subtrees
# ---------------------------------------------------------------------------
INCLUDE_PATTERNS = [
    #r"/TDClient/210/DepressionCenter/", # Depression Center Knowledge Base
    #r"depressioncenter\.org/research-services/", # Depression Center public site - research resources
    #r"depressioncenter\.org/outreach-education/", # Depression Center public site - outreach and education program and depression toolkit
    #r"code\.depressioncenter\.org", # Depression Center code repository hub
    #r"github\.com/depressioncenter/[A-Za-z0-9_.-]+(?:/|$)", # Depression Center GitHub org
    #r"github\.com/DepressionCenter/[A-Za-z0-9_.-]+(?:/|$)" # Depression Center GitHub org (case-sensitive)

    #r"github\.com/[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+(?:/|$)", # GitHub repo landing page and subpaths
    #r"gitlab\.com/[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+(?:/|$)", # GitLab repo landing page and subpaths
    # r"git\.[A-Za-z0-9_.-]+\.(?:com|edu|org|io)/[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+(?:/|$)", # Generic git host repo landing page and subpaths
    # r"(?:[A-Za-z0-9_.-]+\.)?github\.io(?:/|$)", # GitHub Pages site root and subpaths

]

# ---------------------------------------------------------------------------
# CRAWL_EXCLUDE_PATTERNS -- do not follow links matching any of these.
#
# Each entry is a regex string matched against the full URL (case-insensitive).
# Evaluated after the include check.
#
# The defaults below skip search, login, tag, and similar non-content pages.
# Add more as needed.
# ---------------------------------------------------------------------------
CRAWL_EXCLUDE_PATTERNS = [
    r"/Search[/?$]",
        r"/Login[/?$]",
        r"/Login\.aspx",
        r"/Tags[/?$]",
        r"/Print[/?$]",
        r"/PrintArticle\?ID=",
        r"\?print=",
        r"/Archive[/?$]",
        r"/FileOpen[/?$]",
        r"/FileDownload[/?$]",
        r"/pulse$",
        r"/tags$",
        r"/tagged$",
        # r"/CategoryID=",
        # r"/CategoryID/[0-9]+",
        r"/TagID=",
        r"/TagID/[0-9]+",
        # r"/Category/",
        r"&tab=",
        r"/tree/(?!main(?:[/?]|$))",
        r"/issues?[/?]",
        r"/projects?[/?]",
        r"/pulls?[/?]",
        r"/pushes?[/?]",
        r"/network[/?]",
        r"/commits?[/?]",
        r"/discussions?[/?]",
        r"/categories[/?]",
        r"/announcements?[/?]",
        r"/settings[/?]",
        r"/contribs?[/?]",
        r"/contributions?[/?]",
        r"/checks?[/?]",
        r"/comments?[/?]",
        r"/author[/?]",
        r"/profile[/?]"
]

# ---------------------------------------------------------------------------
# INDEX_EXCLUDE_PATTERNS -- allow the page to be reached/crawled, but do not
# add its content to the generated index.
# ---------------------------------------------------------------------------
INDEX_EXCLUDE_PATTERNS = [
    r"/Search[/?$]",
    r"/Login[/?$]",
    r"/Login\.aspx",
    r"/Tags[/?$]",
    r"/Print[/?$]",
    r"/PrintArticle\?ID=",
    r"\?print=",
    r"/Archive[/?$]",
    r"/FileOpen[/?$]",
    r"/FileDownload[/?$]",
    r"/pulse$",
    r"/tags$",
    r"/tagged$",
    r"/CategoryID=",
    r"/CategoryID/[0-9]+",
    r"/TagID=",
    r"/TagID/[0-9]+",
    r"/Category/",
    r"&tab=",
    r"/tree/(?!main(?:[/?]|$))",
    r"/issues?[/?]",
    r"/projects?[/?]",
    r"/pulls?[/?]",
    r"/pushes?[/?]",
    r"/network[/?]",
    r"/commits?[/?]",
    r"/discussions?[/?]",
    r"/categories[/?]",
    r"/announcements?[/?]",
    r"/settings[/?]",
    r"/contribs?[/?]",
    r"/contributions?[/?]",
    r"/checks?[/?]",
    r"/comments?[/?]",
    r"/author[/?]",
    r"/profile[/?]"
]

# ===========================================================================
# END USER CONFIG
# ===========================================================================

import re
import sys
import subprocess


def _ensure(pkg, import_as=None, upgrade=False):
    try:
        if not upgrade:
            __import__(import_as or pkg)
            return
    except ImportError:
        pass
    args = [sys.executable, "-m", "pip", "install"]
    if upgrade:
        args.append("--upgrade")
    args.append(pkg)
    subprocess.check_call(args)


_ensure("typing_extensions", upgrade=True)
_ensure("requests")
_ensure("beautifulsoup4", "bs4")
_ensure("sentence_transformers", "sentence_transformers")
_ensure("numpy")

import argparse
import base64
import hashlib
import json
import os
import time
from collections import deque
from urllib.parse import urljoin, urlparse

import numpy as np
import requests
from bs4 import BeautifulSoup
from sentence_transformers import SentenceTransformer

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
EMBED_MODEL = "BAAI/bge-small-en-v1.5"
EMBED_MODEL_BROWSER_ID = "Xenova/bge-small-en-v1.5"
DIMS = 384
CHUNK_MAX_CHARS = 1200
CHUNK_MIN_CHARS = 60

# Local page cache -- add this directory to .gitignore. Speeds up repeat runs
# by skipping re-download of pages whose Last-Modified/ETag hasn't changed.
CACHE_DIR = ".kb_cache"
CACHE_META_PATH = os.path.join(CACHE_DIR, "meta.json")
CACHE_PAGES_DIR = os.path.join(CACHE_DIR, "pages")

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml",
    "Accept-Language": "en-US,en;q=0.9",
}
TDX_CONTENT_SELECTORS = [
    "#tdBodyContent",
    ".kb-article-body",
    ".td-page-body",
    "[data-region='article-body']",
    "#articleBody",
    ".article-content",
    "main",
]
STRIP_TAGS = [
    "script", "style", "noscript", "nav", "footer", "header",
    "aside", ".breadcrumb", ".td-utility-bar", ".td-nav", ".pager",
    ".pagination", "#tdBreadcrumb", "#tdNavigation", "#tdSideMenu",
    ".td-side-menu",
]
ASSET_RE = re.compile(
    r"\.(pdf|zip|png|jpg|jpeg|gif|svg|ico|css|js|xml|json)(\?|$)", re.I
)
GIT_HOST_RE = re.compile(
    r"^(?:github\.com|gitlab\.com|git\.[^.]+\.(?:com|edu|org|io)|(?:[^.]+\.)?github\.io)$",
    re.I,
)
GIT_REPO_ROOT_RE = re.compile(r"^/(?:[^/]+)/(?:[^/]+)$", re.I)
GIT_INDEXABLE_NAME_RE = re.compile(
    r"/(?:readme\.md|index\.html|index\.py|index\.lsp|index\.aspx|demo\.html|install\.md)$",
    re.I,
)


# ---------------------------------------------------------------------------
# URL scope helpers
# ---------------------------------------------------------------------------

def derive_auto_prefix(seed_url):
    """
    TDX URL -> /TDClient/<digits>/<slug>/ prefix scoped to its origin.
    Anything else -> same origin only.
    """
    parsed = urlparse(seed_url)
    origin = f"{parsed.scheme}://{parsed.netloc}"
    m = re.search(r"(/TDClient/\d+/[^/]+/)", seed_url)
    if m:
        return origin + m.group(1)
    return origin


def compile_patterns(patterns):
    compiled = []
    for p in patterns:
        # If the pattern contains no regex special chars beyond what a plain
        # substring would have, re.escape is unnecessary -- but compile as-is
        # so users can write either plain substrings or real regexes.
        compiled.append(re.compile(p, re.IGNORECASE))
    return compiled


def get_origin(url):
    parsed = urlparse(url)
    return f"{parsed.scheme}://{parsed.netloc}"


def is_git_host_url(url):
    host = urlparse(url).netloc.lower()
    return bool(GIT_HOST_RE.match(host))


def is_git_indexable_url(url):
    parsed = urlparse(url)
    host = parsed.netloc.lower()
    path = parsed.path.rstrip("/").lower()

    if not is_git_host_url(url):
        return False

    # Git repo landing pages: https://github.com/<user>/<repo>
    if GIT_REPO_ROOT_RE.match(path):
        return True

    # Explicit indexable content leaf names
    if GIT_INDEXABLE_NAME_RE.search(path):
        return True

    return False


def in_scope(url, auto_prefix, origin, include_res, crawl_exclude_res):
    # Default rule: keep the crawl within the seed origin unless an explicit
    # include pattern opts into a different host (e.g. GitHub/GitLab repo pages).
    if not url.startswith(origin):
        if not include_res or not any(r.search(url) for r in include_res):
            return False

    # Skip binary assets
    if ASSET_RE.search(url):
        return False

    # Include check
    if include_res:
        if not any(r.search(url) for r in include_res):
            return False
    else:
        # Auto default: must start with derived prefix
        if not url.startswith(auto_prefix):
            return False

    # Crawl exclude check (after include, so excludes win)
    if any(r.search(url) for r in crawl_exclude_res):
        return False

    return True


def normalise(url):
    """Strip fragment and trailing slash for dedup."""
    return url.split("#")[0].strip().rstrip("/")


# ---------------------------------------------------------------------------
# Local page cache
# ---------------------------------------------------------------------------

def load_cache_meta():
    if os.path.exists(CACHE_META_PATH):
        try:
            with open(CACHE_META_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except (OSError, ValueError):
            return {}
    return {}


def save_cache_meta(cache_meta):
    os.makedirs(CACHE_DIR, exist_ok=True)
    with open(CACHE_META_PATH, "w", encoding="utf-8") as f:
        json.dump(cache_meta, f)


def cache_page_path(url):
    h = hashlib.sha1(url.encode("utf-8")).hexdigest()
    return os.path.join(CACHE_PAGES_DIR, h + ".html")


# ---------------------------------------------------------------------------
# Fetch + parse
# ---------------------------------------------------------------------------

def fetch(session, url, cache_meta):
    entry = cache_meta.get(url)
    if entry:
        try:
            head = session.head(url, headers=HEADERS, timeout=15, allow_redirects=True)
            last_mod = head.headers.get("Last-Modified")
            etag = head.headers.get("ETag")
            unchanged = head.status_code == 200 and (
                (last_mod and entry.get("last_modified") == last_mod)
                or (etag and entry.get("etag") == etag)
            )
            if unchanged:
                try:
                    with open(cache_page_path(url), "r", encoding="utf-8") as f:
                        html = f.read()
                    print("       (cached, not modified)")
                    return BeautifulSoup(html, "html.parser")
                except OSError:
                    pass  # cache file missing/corrupt -- fall through to a full GET
        except Exception:
            pass  # HEAD unsupported/failed -- fall through to a full GET

    try:
        r = session.get(url, headers=HEADERS, timeout=15)
        r.raise_for_status()
        if "text/html" not in r.headers.get("content-type", ""):
            return None
        os.makedirs(CACHE_PAGES_DIR, exist_ok=True)
        with open(cache_page_path(url), "w", encoding="utf-8") as f:
            f.write(r.text)
        cache_meta[url] = {
            "etag": r.headers.get("ETag"),
            "last_modified": r.headers.get("Last-Modified"),
            "fetched_at": time.time(),
        }
        save_cache_meta(cache_meta)
        return BeautifulSoup(r.text, "html.parser")
    except Exception as e:
        print(f"  SKIP {url} -- {e}")
        return None


def normalise_page_title(title, url=None):
    if url and "teamdynamix." in url.lower():
        for prefix in ("Article - ", "Question Detail - "):
            title = title.removeprefix(prefix)
    return title


def get_title(soup, url=None):
    t = soup.find("title")
    if t:
        title = re.sub(r"\s*[|]\s*.+$", "", t.get_text(" ", strip=True))
        return normalise_page_title(title, url)
    h1 = soup.find("h1")
    if h1:
        title = h1.get_text(" ", strip=True)
        return normalise_page_title(title, url)
    return "Untitled"


def extract_content(soup, url=None):
    if url and "teamdynamix." in url.lower():
        for sel in ("#divMainContent", "#questionsContent"):
            node = soup.select_one(sel)
            if node:
                for noise in STRIP_TAGS:
                    for el in node.select(noise):
                        el.decompose()
                if node.get_text(" ", strip=True):
                    return node
        return None

    if is_git_host_url(url or ""):
        if not is_git_indexable_url(url):
            return None
        for sel in (".markdown-body", "#readme", ".js-readme-container", "article", "main", "body"):
            node = soup.select_one(sel)
            if node:
                for noise in STRIP_TAGS:
                    for el in node.select(noise):
                        el.decompose()
                if node.get_text(" ", strip=True):
                    return node
        return None

    for sel in TDX_CONTENT_SELECTORS:
        node = soup.select_one(sel)
        if node:
            for noise in STRIP_TAGS:
                for el in node.select(noise):
                    el.decompose()
            return node
    return None


def extract_links(soup, base_url):
    links = []
    for a in soup.find_all("a", href=True):
        href = normalise(urljoin(base_url, a["href"]))
        if href:
            links.append(href)
    return links


# ---------------------------------------------------------------------------
# Chunking
# ---------------------------------------------------------------------------

def split_into_chunks(title, node, url):
    chunks = []

    def _make(heading, text):
        text = re.sub(r"\n{3,}", "\n\n", text).strip()
        if len(text) < CHUNK_MIN_CHARS:
            return
        while len(text) > CHUNK_MAX_CHARS:
            cut = text.rfind("\n", 0, CHUNK_MAX_CHARS)
            if cut < CHUNK_MIN_CHARS:
                cut = CHUNK_MAX_CHARS
            chunks.append({"t": heading, "x": text[:cut], "u": url})
            text = text[cut:].strip()
        if text:
            chunks.append({"t": heading, "x": text, "u": url})

    headings = node.find_all(["h2", "h3"])
    if headings:
        before = []
        for el in node.children:
            if hasattr(el, "name") and el.name in ("h2", "h3"):
                break
            if hasattr(el, "get_text"):
                before.append(el.get_text(" ", strip=True))
        _make(title, " ".join(before))
        for h in headings:
            section_title = f"{title} -- {h.get_text(' ', strip=True)}"
            parts = []
            for sib in h.next_siblings:
                if hasattr(sib, "name") and sib.name in ("h2", "h3"):
                    break
                if hasattr(sib, "get_text"):
                    parts.append(sib.get_text(" ", strip=True))
            _make(section_title, " ".join(parts))
    else:
        text = node.get_text("\n", strip=True)
        _make(title, text)

    return chunks


# ---------------------------------------------------------------------------
# Embedding
# ---------------------------------------------------------------------------

def embed_chunks(chunks):
    print(f"\nLoading embedding model: {EMBED_MODEL}")
    model = SentenceTransformer(EMBED_MODEL)
    texts = [c["x"] for c in chunks]
    print(f"Embedding {len(texts)} chunks...")
    vecs = model.encode(texts, normalize_embeddings=True,
                        batch_size=64, show_progress_bar=True)
    return vecs.astype(np.float32)


# ---------------------------------------------------------------------------
# Crawl
# ---------------------------------------------------------------------------

def crawl(seed_url, max_pages, delay, include_res, crawl_exclude_res, index_exclude_res):
    auto_prefix = derive_auto_prefix(seed_url)
    origin = get_origin(seed_url)
    seed_norm = normalise(seed_url)

    print(f"Seed:         {seed_url}")
    print(f"Auto prefix:  {auto_prefix}")
    if include_res:
        print(f"Include pats: {[r.pattern for r in include_res]}")
    else:
        print(f"Include pats: (auto -- prefix only)")
    print(f"Crawl exclude pats: {[r.pattern for r in crawl_exclude_res]}")
    print(f"Index exclude pats: {[r.pattern for r in index_exclude_res]}")
    print()

    session = requests.Session()
    cache_meta = load_cache_meta()
    visited = set()
    queued = {seed_norm}   # dedup before download
    queue = deque([seed_norm])
    all_chunks = []
    site_name = "Knowledge Base"

    while queue and len(visited) < max_pages:
        url = queue.popleft()
        if url in visited:
            continue
        visited.add(url)

        print(f"[{len(visited):4d}] {url}")
        soup = fetch(session, url, cache_meta)
        if soup is None:
            continue

        if len(visited) == 1:
            site_name = get_title(soup, url)

        # Enqueue new in-scope links, deduped before download
        for link in extract_links(soup, url):
            if link not in visited and link not in queued:
                if in_scope(link, auto_prefix, origin, include_res, crawl_exclude_res):
                    queued.add(link)
                    queue.append(link)

        # Index exclusion only prevents indexing, not crawling.
        if any(r.search(url) for r in index_exclude_res):
            if delay > 0:
                time.sleep(delay)
            continue

        content = extract_content(soup, url)
        if content is None:
            continue

        title = get_title(soup, url)
        chunks = split_into_chunks(title, content, url)
        if chunks:
            print(f"       +{len(chunks)} chunk(s): {title[:70]}")
            all_chunks.extend(chunks)

        if delay > 0:
            time.sleep(delay)

    print(f"\nCrawled {len(visited)} pages, produced {len(all_chunks)} chunks.")
    return all_chunks, site_name


# ---------------------------------------------------------------------------
# Build index
# ---------------------------------------------------------------------------

def build_index(chunks, site_name, out_path):
    if not chunks:
        print("No chunks -- nothing to write.")
        return

    vecs = embed_chunks(chunks)
    assert vecs.shape == (len(chunks), DIMS), f"Shape mismatch: {vecs.shape}"

    b64 = base64.b64encode(vecs.tobytes()).decode("ascii")
    index = {
        "_license": (
            "This file is part of Field Station AI. Copyright © 2026 The Regents "
            "of the University of Michigan. This program is free software: you can "
            "redistribute it and/or modify it under the terms of the GNU General "
            "Public License as published by the Free Software Foundation, either "
            "version 3 of the License, or (at your option) any later version. This "
            "program is distributed in the hope that it will be useful, but WITHOUT "
            "ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or "
            "FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License "
            "for more details. You should have received a copy of the GNU General "
            "Public License along with this program. If not, see "
            "https://www.gnu.org/licenses/."
        ),
        "v": 1,
        "model": EMBED_MODEL_BROWSER_ID,
        "dims": DIMS,
        "site": site_name,
        "vecs": b64,
        "chunks": chunks,
    }

    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(index, f, ensure_ascii=False, separators=(",", ":"))

    size_mb = len(vecs.tobytes()) / 1024 / 1024
    print(f"\nWrote: {out_path}")
    print(f"  chunks : {len(chunks)}")
    print(f"  vecs   : {size_mb:.2f} MB float32")
    print(f"  site   : {site_name}")


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="Build Field Station AI RAG index from a website or TDX KB portal"
    )
    parser.add_argument("--url", default=SEED_URL)
    parser.add_argument("--out", default=OUT_PATH)
    parser.add_argument("--max-pages", type=int, default=MAX_PAGES)
    parser.add_argument("--delay", type=float, default=DELAY)
    args = parser.parse_args()

    include_res = compile_patterns(INCLUDE_PATTERNS)
    crawl_exclude_res = compile_patterns(CRAWL_EXCLUDE_PATTERNS)
    index_exclude_res = compile_patterns(INDEX_EXCLUDE_PATTERNS)

    chunks, site_name = crawl(args.url, args.max_pages, args.delay,
                              include_res, crawl_exclude_res, index_exclude_res)
    build_index(chunks, site_name, args.out)


if __name__ == "__main__":
    main()