<!-- prev: ../index.md | next: problem-and-goals.md -->

# 1. Project Overview

This section describes the business purpose, users, scope, and functional requirements of PlusDateApp.

## Contents

- [Problem Statement & Goals](problem-and-goals.md)
- [Stakeholders & Users](stakeholders.md)
- [Scope](scope.md)
- [Features](features.md)

## Executive Summary

PlusDateApp is a dating product implemented as a Telegram Mini App. The application helps users create a profile, pass moderation, discover compatible profiles, swipe, match, chat, and optionally purchase premium access. The product is designed for mobile-first usage inside Telegram, which reduces registration friction and allows the system to use Telegram identity, bot notifications, and Telegram invoices. The result is a full-stack diploma project with a real backend domain model, a production-style frontend structure, database extensions for location and vector features, and containerized services for local or server deployment.

## Key Highlights

| Aspect | Description |
|--------|-------------|
| **Problem** | Dating products need a smooth profile, discovery, match, and communication flow, but building it safely requires authentication, moderation, media storage, search, payments, and real-time messaging. |
| **Solution** | A Telegram Mini App that combines onboarding, profile editing, swipe feed, matching, chat, premium subscriptions, and moderation in one application. |
| **Target Users** | Telegram users looking for dating, administrators/moderators, and project maintainers. |
| **Key Features** | Telegram login, onboarding, profile media upload, moderation, swipe feed, likes, matches, chat, premium, account deletion and restore. |
| **Tech Stack** | React 19, TypeScript, Vite, Laravel 12, PHP 8.2, PostgreSQL/PostGIS/pgvector, Redis, Reverb, MinIO, Docker. |
