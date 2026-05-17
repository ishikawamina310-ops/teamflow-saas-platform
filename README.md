# TeamFlow

TeamFlow は、Next.js・NestJS・PostgreSQL・Docker・AWS を用いて構築した、マルチテナント対応の SaaS 型チームコラボレーションプラットフォームです。

Production-ready なクラウドネイティブアーキテクチャを想定し、拡張性・保守性・運用性を重視して設計しています。

🇺🇸 English README: [README.en.md](./README.en.md)

---

# 概要

TeamFlow は、チームコラボレーション・タスク管理・ワークスペース管理を目的としたフルスタック SaaS アプリケーションです。

モダンな Web アーキテクチャとエンタープライズレベルの開発構成を意識して実装しています。

主な特徴:

- マルチテナント SaaS アーキテクチャ
- RBAC ベースの認可システム
- ワークスペース管理
- プロジェクト / タスク管理
- REST API 構成
- Docker ベース開発環境
- CI/CD 対応構成
- AWS クラウドインフラ設計

---

# 技術スタック

## Frontend

- Next.js (App Router)
- TypeScript
- TailwindCSS
- React Query
- Zustand
- shadcn/ui

## Backend

- NestJS
- PostgreSQL
- Prisma ORM
- JWT Authentication
- Zod Validation

## Infrastructure

- Docker
- GitHub Actions
- AWS ECS/Fargate
- Amazon RDS
- Amazon S3
- CloudFront

---

# 主な機能

## 認証機能

- JWT 認証
- Refresh Token
- パスワードハッシュ化
- セッション管理

---

## ワークスペース管理

- ワークスペース単位のマルチテナント構成
- メンバー招待機能
- ワークスペース切り替え
- 権限管理

---

## RBAC 認可

- ADMIN / MEMBER ロール
- Route Protection
- ワークスペース単位の認可制御
- Role Guard

---

## API ドキュメント

Swagger API ドキュメントを提供しています。

```bash
http://localhost:4000/api/docs