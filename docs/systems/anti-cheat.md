Anti-Cheat System — Technical Specification
Status: Future Feature (Not for current MVP)
Module: Game Server
Author: Luis
Last Updated: 2026-01-14

Overview
This document defines the architecture and logic for a server-side Anti-Cheat System designed to detect abnormal behavior in online Rummikub matches. The system analyzes player actions, timing, patterns, and potential state manipulation.

Objectives

Detect cheating attempts in real time

Flag suspicious players for moderation

Prevent impossible or manipulated moves

Identify bot-like behavior

Maintain competitive integrity in ranked and wagered matches

Core Components
CheatDetector Class
Location: apps/game-server/src/anti-cheat/CheatDetector.ts
Responsibilities:

Track move history per player

Analyze timing between moves

Validate physical possibility of moves

Detect state manipulation

Identify bot-like patterns

Report suspicious players

Detection Techniques
Timing Analysis

Detects superhuman reaction times

Threshold: <100ms

Flag: SUSPICIOUS_SPEED

Severity: +20

Impossible Move Detection

Checks tile validity, board state, and rules

Flag: IMPOSSIBLE_MOVE

Severity: +100

Invalidates move

Pattern Analysis (Bot Detection)

Detects repetitive or statistically improbable patterns

Flag: BOT_PATTERN

Severity: +50

State Manipulation Detection

Detects illegal state changes

Flag: STATE_MANIPULATION

Severity: +100

Invalidates move

Suspicious Player Handling
If severity > 50:

Player added to suspicious list

Automatic report sent to moderation

Integration Points

Game Logic Service

Matchmaking (ranked mode)

Moderation Dashboard

Analytics System

Risks & Considerations

False positives for fast players

Requires accurate server timestamps

Needs rate limiting

Should not block gameplay unless severity is critical

Implementation Status
Not implemented in the current MVP. Planned for the “Security & Fair Play” milestone.

Decision
Keep this document as a future feature. Do not integrate into the current development plan unless explicitly requested.