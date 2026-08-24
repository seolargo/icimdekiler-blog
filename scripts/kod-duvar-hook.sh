#!/usr/bin/env bash
# Stop hook: oturum biterken çalışma ağacında KOD değişikliği varsa "bitirmeden"
# anının duvarlarını hatırlatır. Değişiklik yoksa hiçbir şey yazmaz.
#
# Sessizlik kasıtlıdır: her oturumda konuşan bir hatırlatıcı gürültüye dönüşür ve
# BELGE-169'un uyarısına düşer — mekanik biçimde uygulanan inceleme değersizleşir.
set -uo pipefail

git rev-parse --is-inside-work-tree >/dev/null 2>&1 || exit 0

degisen=$(
  {
    git diff --name-only HEAD 2>/dev/null
    git ls-files --others --exclude-standard 2>/dev/null
  } | sort -u | grep -Ei '\.(ts|tsx|js|jsx|mjs|cjs|py|go|rs|java|kt|swift|rb|php|c|h|hpp|cpp|cs|sql|sh|vue|svelte)$'
)

[ -z "$degisen" ] && exit 0

n=$(printf '%s\n' "$degisen" | wc -l | tr -d ' ')
printf '{"systemMessage":"kod-duvarı — %s değişen kod dosyası. Bitirmeden önce: node /Users/omerfaruk/pdf-blog/scripts/kod-duvar.js --an B --diff"}\n' "$n"
