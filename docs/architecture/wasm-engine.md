WASM Game Engine (Rust + TypeScript) — Technical Specification
Status: Future Integration (Not for current MVP)
Module: @rummikub/game-engine
Author: Luis
Last Updated: 2026-01-14

Overview
This document describes the hybrid game engine built using Rust compiled to WebAssembly, with a TypeScript wrapper for integration with the frontend and game server.
The engine provides high‑performance validation, AI logic, and full board evaluation.

Objectives

Provide a deterministic, high‑performance game engine

Use Rust for core logic and WebAssembly for execution speed

Expose a TypeScript wrapper for easy integration

Support AI difficulty levels

Provide fallback JavaScript validation if WASM fails

Rust Engine Architecture
Location: packages/@rummikub/game-engine/rust/src/

Core files:

lib.rs  — Entry point

board.rs  — Board state

tile.rs  — Tile definition

validation.rs  — Move validation

solver.rs  — AI solver

scoring.rs  — Scoring system

tests/ — Rust unit tests

Key features:

Validate groups (same number, different colors)

Validate runs (consecutive numbers, same color)

Validate entire board state

AI move calculation

WebAssembly Bindings
Location: packages/@rummikub/game-engine/wasm/

Includes:

pkg/ — Compiled WASM output

build.sh  — Build script

TypeScript Wrapper
Location: packages/@rummikub/game-engine/typescript/src/engine.ts

Responsibilities:

Initialize WASM module

Create WASM engine instance

Expose validateBoard()

Provide JS fallback validation

Initialization:

init() loads WASM

new WasmEngine(4) creates engine for 4 players

Board Validation
validateBoard()

Calls WASM function validate_board()

Returns true/false

validateBoardJS()

Fallback implementation

Uses isValidGroup() and isValidRun()

Risks & Considerations

WASM requires async initialization

Bundler must support WASM imports

Fallback JS logic is slower

Not required for the MVP

Implementation Status
Pending integration in the “Game Engine WASM Upgrade” milestone.

Decision
Keep this document as future architecture.
Do not integrate into the current MVP unless explicitly requested.