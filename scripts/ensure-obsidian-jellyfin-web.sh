#!/usr/bin/env bash
set -euo pipefail

SCRIPT_TAG='<script defer="defer" src="obsidian-xbox-nav.js"></script>'

usage() {
    cat <<'EOF'
Usage: ensure-obsidian-jellyfin-web.sh [--remove | -h | --help]

Idempotently installs/syncs obsidian-xbox-nav.js into Jellyfin Web and injects
its <script defer="defer" src="obsidian-xbox-nav.js"></script> tag immediately
before the final </body> in index.html.

Options:
  (none)       Install or repair obsidian-xbox-nav.js and index.html
  --remove     Back up index.html (if modified), strip the script tag, and
               remove obsidian-xbox-nav.js from the Jellyfin Web directory
  -h, --help   Show this help message and exit

Environment overrides:
  JELLYFIN_WEB_DIR     Target web directory (default: /usr/share/jellyfin/web)
  JELLYFIN_BACKUP_DIR  Backup directory (default: /var/backups/jellyfin)
  OBSIDIAN_XBOX_JS     Explicit path to obsidian-xbox-nav.js source file
EOF
}

MODE="install"
if [ $# -eq 1 ]; then
    case "$1" in
        --remove)
            MODE="remove"
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            printf 'Error: unknown option: %s\n\n' "$1" >&2
            usage >&2
            exit 2
            ;;
    esac
elif [ $# -gt 1 ]; then
    printf 'Error: unexpected arguments: %s\n\n' "$*" >&2
    usage >&2
    exit 2
fi

WEB_DIR="${JELLYFIN_WEB_DIR:-/usr/share/jellyfin/web}"
BACKUP_DIR="${JELLYFIN_BACKUP_DIR:-/var/backups/jellyfin}"
SCRIPT_DIR="$(CDPATH='' cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"

if [ -n "${OBSIDIAN_XBOX_JS:-}" ]; then
    SRC_JS="$OBSIDIAN_XBOX_JS"
elif [ -f /etc/jellyfin/obsidian-xbox-nav.js ]; then
    SRC_JS="/etc/jellyfin/obsidian-xbox-nav.js"
else
    SRC_JS="$SCRIPT_DIR/obsidian-xbox-nav.js"
fi

TMP_JS=""
TMP_HTML=""

cleanup() {
    if [ -n "${TMP_JS:-}" ] && [ -e "$TMP_JS" ]; then
        rm -f "$TMP_JS"
    fi
    if [ -n "${TMP_HTML:-}" ] && [ -e "$TMP_HTML" ]; then
        rm -f "$TMP_HTML"
    fi
}
trap cleanup EXIT

backup_index_html() {
    local prefix="$1"
    if [ "$(id -u)" -eq 0 ]; then
        install -d -m 0755 -o root -g root "$BACKUP_DIR"
    else
        mkdir -p "$BACKUP_DIR"
    fi

    local ts target suffix
    ts="$(date +%Y%m%d%H%M%S)"
    target="$BACKUP_DIR/${prefix}-${ts}"
    if [ -e "$target" ]; then
        suffix=1
        while [ -e "${target}.${suffix}" ]; do
            suffix=$((suffix + 1))
        done
        target="${target}.${suffix}"
    fi
    cp -p "$WEB_DIR/index.html" "$target"
}

inject_script_tag() {
    local in_file="$1"
    local out_file="$2"

    if command -v perl >/dev/null 2>&1; then
        perl -e '
            use strict;
            use warnings;
            my ($in, $out, $tag) = @ARGV;
            open my $fh, "<:raw", $in or die "open $in: $!\n";
            local $/;
            my $data = <$fh>;
            close $fh;
            my $pos = rindex(lc($data), "</body>");
            exit 10 if $pos < 0;
            substr($data, $pos, 0, $tag);
            open my $oh, ">:raw", $out or die "open $out: $!\n";
            print {$oh} $data or die "write $out: $!\n";
            close $oh or die "close $out: $!\n";
        ' "$in_file" "$out_file" "$SCRIPT_TAG"
    elif command -v python3 >/dev/null 2>&1; then
        python3 - "$in_file" "$out_file" "$SCRIPT_TAG" <<'PYEOF'
import pathlib, sys

src = pathlib.Path(sys.argv[1]).read_bytes()
tag = sys.argv[3].encode("utf-8")
idx = src.lower().rfind(b"</body>")
if idx < 0:
    sys.exit(10)
pathlib.Path(sys.argv[2]).write_bytes(src[:idx] + tag + src[idx:])
PYEOF
    elif command -v node >/dev/null 2>&1; then
        node - "$in_file" "$out_file" "$SCRIPT_TAG" <<'NODEEOF'
const fs = require('node:fs');
const [inFile, outFile, tag] = process.argv.slice(2);
const src = fs.readFileSync(inFile);
const lower = Buffer.from(src);
for (let i = 0; i < lower.length; i++) {
  if (lower[i] >= 65 && lower[i] <= 90) {
    lower[i] += 32;
  }
}
const idx = lower.lastIndexOf(Buffer.from('</body>'));
if (idx < 0) process.exit(10);
const out = Buffer.concat([src.subarray(0, idx), Buffer.from(tag, 'utf8'), src.subarray(idx)]);
fs.writeFileSync(outFile, out);
NODEEOF
    else
        printf 'Error: perl, python3, or node is required to edit index.html\n' >&2
        return 1
    fi
}

strip_script_tag() {
    local in_file="$1"
    local out_file="$2"

    if command -v perl >/dev/null 2>&1; then
        perl -e '
            use strict;
            use warnings;
            my ($in, $out) = @ARGV;
            open my $fh, "<:raw", $in or die "open $in: $!\n";
            local $/;
            my $data = <$fh>;
            close $fh;
            $data =~ s/<script[^>]*src=["\x27]obsidian-xbox-nav\.js["\x27][^>]*><\/script>//gi;
            open my $oh, ">:raw", $out or die "open $out: $!\n";
            print {$oh} $data or die "write $out: $!\n";
            close $oh or die "close $out: $!\n";
        ' "$in_file" "$out_file"
    elif command -v python3 >/dev/null 2>&1; then
        python3 - "$in_file" "$out_file" <<'PYEOF'
import pathlib, re, sys

src = pathlib.Path(sys.argv[1]).read_bytes()
out = re.sub(
    rb"""<script[^>]*src=["']obsidian-xbox-nav\.js["'][^>]*></script>""",
    b"",
    src,
    flags=re.IGNORECASE,
)
pathlib.Path(sys.argv[2]).write_bytes(out)
PYEOF
    elif command -v node >/dev/null 2>&1; then
        node - "$in_file" "$out_file" <<'NODEEOF'
const fs = require('node:fs');
const [inFile, outFile] = process.argv.slice(2);
const src = fs.readFileSync(inFile);
const outStr = src
  .toString('latin1')
  .replace(/<script[^>]*src=["']obsidian-xbox-nav\.js["'][^>]*><\/script>/gi, '');
fs.writeFileSync(outFile, Buffer.from(outStr, 'latin1'));
NODEEOF
    else
        printf 'Error: perl, python3, or node is required to edit index.html\n' >&2
        return 1
    fi
}

if [ "$MODE" = "remove" ]; then
    if [ -f "$WEB_DIR/index.html" ] && grep -qF 'obsidian-xbox-nav.js' "$WEB_DIR/index.html"; then
        backup_index_html "index.html.pre-obsidian-remove"
        TMP_HTML="$(mktemp "$WEB_DIR/.index.html.tmp.XXXXXX")"
        strip_script_tag "$WEB_DIR/index.html" "$TMP_HTML"
        chmod 0644 "$TMP_HTML"
        if [ "$(id -u)" -eq 0 ]; then
            chown root:root "$TMP_HTML"
        fi
        mv -f "$TMP_HTML" "$WEB_DIR/index.html"
        TMP_HTML=""
    fi
    rm -f "$WEB_DIR/obsidian-xbox-nav.js"
    exit 0
fi

if [ ! -f "$WEB_DIR/index.html" ] || [ ! -f "$SRC_JS" ]; then
    exit 0
fi

if [ ! -f "$WEB_DIR/obsidian-xbox-nav.js" ] || ! cmp -s "$SRC_JS" "$WEB_DIR/obsidian-xbox-nav.js"; then
    TMP_JS="$(mktemp "$WEB_DIR/.obsidian-xbox-nav.js.tmp.XXXXXX")"
    cp "$SRC_JS" "$TMP_JS"
    chmod 0644 "$TMP_JS"
    if [ "$(id -u)" -eq 0 ]; then
        chown root:root "$TMP_JS"
    fi
    mv -f "$TMP_JS" "$WEB_DIR/obsidian-xbox-nav.js"
    TMP_JS=""
fi

if ! grep -qF 'obsidian-xbox-nav.js' "$WEB_DIR/index.html" && grep -qi '</body>' "$WEB_DIR/index.html"; then
    backup_index_html "index.html.pre-obsidian"
    TMP_HTML="$(mktemp "$WEB_DIR/.index.html.tmp.XXXXXX")"
    inject_script_tag "$WEB_DIR/index.html" "$TMP_HTML"
    chmod 0644 "$TMP_HTML"
    if [ "$(id -u)" -eq 0 ]; then
        chown root:root "$TMP_HTML"
    fi
    mv -f "$TMP_HTML" "$WEB_DIR/index.html"
    TMP_HTML=""
fi
