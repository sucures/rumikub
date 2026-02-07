Feature Flags System (Unleash) — Technical Specification
Status: Future Feature (Not for current MVP)
Module: API Server
Author: Luis
Last Updated: 2026-01-14

Overview
This document describes the feature flag system used to enable or disable functionalities dynamically without deploying new code.
The system is based on Unleash, a self‑hosted feature flag platform.

Objectives

Gradually roll out new features

Enable A/B testing

Restrict features by user, region, or environment

Disable unstable features instantly

Avoid redeployments for configuration changes

Architecture
The API server initializes an Unleash client with:

Server URL

API key

App name

Environment metadata

Feature evaluation is done server‑side to ensure consistency and security.

Feature Definitions
Available feature flags include:

CRYPTO_PAYMENTS

NEW_MATCHMAKING

TOURNAMENT_V2

AI_EXPERT_MODE

SEASONAL_EVENTS

NFT_MARKETPLACE

These flags represent future features and experimental systems.

Helper Function: isFeatureEnabled
The API exposes a helper:

isFeatureEnabled(feature, userId)

It evaluates the feature using:

userId

environment (NODE_ENV)

custom properties

This allows per‑user targeting.

Use Cases

Enable new matchmaking algorithm for 10% of users

Activate seasonal events only in December

Allow crypto payments only for beta testers

Test new AI difficulty mode with selected players

Risks & Considerations

Requires a running Unleash server

API key must be protected

Feature flags must not block critical flows if Unleash is down

Not required for the MVP

Implementation Status
Not implemented in the current MVP.
Planned for the “Progressive Rollouts” milestone.

Decision
Keep this document as future architecture.
Do not integrate into the current MVP unless explicitly requested.