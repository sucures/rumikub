Analytics System — Technical Specification
Status: Future Feature (Not for current MVP)
Module: @rummikub/analytics
Author: LELC
Last Updated: 2026-01-14

Overview
This document describes the unified analytics system used to capture user events, gameplay telemetry, and business metrics.
The system supports multiple analytics providers simultaneously and includes a custom backend provider for internal auditing.

Objectives

Centralize event tracking across web, mobile, and game server

Send events to multiple providers (Mixpanel, Amplitude, Firebase)

Maintain a custom backend analytics pipeline

Enrich events with consistent metadata

Support game‑specific events (game start, game end, purchases)

Architecture
The core component is the AnalyticsTracker class located at:
packages/@rummikub/analytics/src/tracker.ts

Responsibilities:

Initialize analytics providers

Identify users

Enrich events with metadata

Dispatch events to all providers

Provide game‑specific tracking helpers

Providers
Supported providers include:

MixpanelProvider

AmplitudeProvider

FirebaseProvider

BackendProvider (custom)

Each provider implements:

identify(userId, traits)

track(event)

Event Enrichment
Every event automatically includes:

timestamp (ISO string)

userId

sessionId

platform

version (APP_VERSION)

This ensures consistency across all analytics destinations.

Game‑Specific Events

6.1 Game Start
trackGameStart(gameId, settings)
Includes:

gameMode

betAmount

timeLimit

playerCount

6.2 Game End
trackGameEnd(gameId, result)
Includes:

duration

winner

finalScores

totalMoves

6.3 Purchase
trackPurchase(item, paymentMethod)
Includes:

itemId

itemName

itemType

price

currency

paymentMethod

Risks & Considerations

GDPR and privacy compliance

Cost per event on external providers

High‑traffic batching requirements

Not required for the MVP

Implementation Status
Not implemented in the current MVP.
Planned for the “Analytics & Insights” milestone.

Decision
Keep this document as future architecture.
Do not integrate into the current MVP unless explicitly requested.