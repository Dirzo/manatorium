// ===== Public builds (the website and the phone app): no playtest capture =====
// Playtest recording (click log, microphone clips, the "Logging playtest" badge, N-key notes) only runs inside
// the Claude artifact, where the shared playtest log lives. Everywhere else it is switched off before boot.
if (!(window.claude && window.claude.use)) {
  REC.init = function () { };
  REC.startMic = function () { this.asked = true; this.state = 'off'; };
  REC.flush = function () { };
  NOTES.open = function () { };
  UI.recBadge = function () { const b = $('recBadge'); if (b) b.hidden = true; };
}
