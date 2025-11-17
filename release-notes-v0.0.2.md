v0.0.2

- Fix: Specialization rolls now include live specialization name and bonus when added/edited immediately before rolling (race condition fix).
- Fix: Debounced live-save (450ms) for specialization inputs and flush-on-roll to ensure values persist.
- Improvement: DOM fallback when actor data is stale so unsaved inputs are read for rolls.
- Cleanup: Removed duplicate specialization roll handling and debug logging.
- Feature: Live ability modifier preview while typing, with a 300ms debounced autosave to persist changes.
- Fix: Ensure ability objects exist for every configured ability so the Abilities table renders reliably.
