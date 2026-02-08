Crypto Integration — Off‑Chain + On‑Chain Architecture
Status: Future Feature (Not for current MVP)
Module: API Server + Smart Contracts
Author: Luis
Last Updated: 2026-01-14

Overview
This document describes a hybrid crypto integration system combining:

Off-chain signatures (EIP‑712) for game results

On-chain settlement via an escrow smart contract

The goal is to ensure secure, verifiable, and low-cost prize distribution for wagered matches.

Objectives

Prevent fraudulent prize claims

Minimize gas fees

Ensure cryptographic integrity of match results

Allow players to claim winnings independently

Support Polygon (chainId 137)

Architecture Summary

Off-Chain (API Server)

The server signs game results using EIP‑712 typed data

The signature acts as cryptographic proof of the match outcome

On-Chain (Smart Contract)

Players submit the signature to the escrow contract

The contract verifies the signature and releases funds

Core Components

CryptoService
Location: apps/api-server/src/modules/crypto/crypto.service.ts
Responsibilities:

Connect to blockchain provider

Manage signer wallet

Generate EIP‑712 signatures

Validate and forward prize claims

EIP‑712 Game Result Signature

Domain:

name: RummikubGame

version: 1

chainId: 137

verifyingContract: escrow contract address

Types:

gameId (bytes32)

winner (address)

loser (address)

amount (uint256)

timestamp (uint256)

Value includes:

hashed gameId

winner address

loser address

amount

timestamp

On-Chain Prize Claim
The player calls:
claimPrize(gameId, signature, gasLimit)

The contract:

Verifies signature

Confirms winner

Transfers funds

Security Considerations

Signer wallet must be stored securely

Replay protection via timestamp

Contract must validate gameId uniqueness

Gas limits must be controlled

Off‑chain server must not be compromised

Integration Points

Match result service

Game logic

Player wallet system

Escrow smart contract

Analytics (fraud detection)

Implementation Status
Not part of the current MVP.
Planned for the “Crypto Wagering” milestone.

Decision
Keep this document as future architecture.
Do not integrate into the current development plan unless explicitly requested.