#!/usr/bin/env bash
# Start/stop the Astro dev server under a small supervisor that restarts it and logs exits.
# Usage: devserver.sh start [port] [db_path] | stop | status
PIDFILE=/tmp/astro-dev.pid
LOG=/tmp/astro-dev.log

stop() {
  # Purpose: stop the supervisor and the server (one process group), then wait for the DB lock to clear
  [ -f "$PIDFILE" ] || return 0
  kill -- -"$(cat "$PIDFILE")" 2>/dev/null
  rm -f "$PIDFILE"
  sleep 2
}

start() {
  # Purpose: start the supervisor detached in its own session; it reruns the server if it exits
  stop
  local port=${1:-4359} db=${2:-.db}
  : > "$LOG"
  setsid -f bash -c "
    echo \$\$ > $PIDFILE
    trap 'exit 0' TERM
    cd /workspace
    while true; do
      DB_PATH=$db bun run dev --port $port >> $LOG 2>&1 < /dev/null
      echo \"[supervisor] server exited with status \$? at \$(date -u +%T); restarting in 2s\" >> $LOG
      sleep 2
    done" > /dev/null 2>&1 < /dev/null
  for i in $(seq 1 20); do grep -aq 'Network' "$LOG" 2>/dev/null && break; sleep 1; done
  grep -a -E 'Local|Network|ERROR' "$LOG"
}

case "$1" in
  start) start "$2" "$3" ;;
  stop) stop; echo stopped ;;
  status) [ -f "$PIDFILE" ] && kill -0 "$(cat $PIDFILE)" 2>/dev/null && echo "running (pgid $(cat $PIDFILE))" || echo "not running"; tail -4 "$LOG" ;;
esac
