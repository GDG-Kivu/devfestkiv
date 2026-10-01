# 🌟 DevFest Kivu — Application Web Officielle

[![Angular](https://img.shields.io/badge/Angular-20.3-DD0031?style=for-the-badge&logo=angular&logoColor=white)](https://angular.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

Bienvenue sur le dépôt officiel du site web et de la plateforme interactive **DevFest Kivu**, le plus grand rassemblement technologique de la région des Grands Lacs (Bukavu, RD Congo) organisé par la communauté **GDG Kivu**.

---

## 📑 Sommaire

- [✨ Fonctionnalités](#-fonctionnalités)
- [🏗️ Architecture du Projet](#️-architecture-du-projet)
- [💻 Pré-requis & Installation](#-pré-requis--installation)
- [🚀 Démarrage Rapide](#-démarrage-rapide)
- [⚙️ Configuration & Variables](#️-configuration--variables)
- [🔥 Données & Firestore](#-données--firestore)
- [📧 Configuration EmailJS (Contact & Newsletter)](#-configuration-emailjs-contact--newsletter)
- [🤝 Guide de Contribution & Tâches](#-guide-de-contribution--tâches)
- [📐 Bonnes Pratiques de Développement](#-bonnes-pratiques-de-développement)

---

## ✨ Fonctionnalités

### 🌐 Portail Public Événement (`/`)
- **Accueil & Présentation** : Compte à rebours, thématique, statistiques d'impact et sponsors.
- **Programme & Agenda (`/agenda`)** : Planning dynamique par jour et par format (Keynote, Talk, Workshop, etc.) avec favoris locaux.
- **Intervenants (`/speakers`)** : Profils des speakers, thématiques et réseaux sociaux.
- **Générateur de Badges DP (`/dp-generator`)** : Création de photo de profil et badge personnalisé téléchargeable et partageable sur les réseaux.
- **Partenaires & Sponsoring (`/sponsor`)** : Présentation des soutiens et formulaire d'intérêt.
- **FAQ interactive (`/qa`)** : Réponses aux questions fréquentes classées par catégories.
- **Contact & Newsletter (`/contact`)** : Envoi de messages et inscription newsletter via EmailJS.

### 🎤 Module Live Questions & Administration (`/live_q`)
- **Espace Questions (`/question-space`)** : Pose de questions en temps réel, anonymes ou authentifiées, et réactions par émojis flottants.
- **Mode Présentateur (`/presenter`)** : Projection plein écran des questions et diapositives pour la scène avec bulle interactive.
- **Télécommande Virtuelle (`/remote`)** : Contrôle distant des slides en direct.
- **Tableau de bord CMS Admin (`/live_q/admin`)** :
  - Gestion multi-éditions (activation de l'édition courante).
  - Gestion CRUD en temps réel : Speakers, Agenda, FAQ, Galerie/Albums, Partenaires, Configuration d'édition.
  - Gestion des rôles et modération des questions live.

---

## 🏗️ Architecture du Projet

Le projet suit une structure modulaire par domaine d'activité (*Feature-based*) :

```text
src/app/
├── config/                  # Configurations globales (event.config.ts, firebase.config.ts, emailjs.config.ts)
├── core/                    # Services transverses uniques
│   ├── auth/                # Authentification Firebase (Google Sign-In, Anonymous, Guards & Roles)
│   └── firestore/           # Service centralisé Firestore & Data Contracts (voir README dédié)
├── features/                # Domaines fonctionnels
│   ├── event/               # Site public du festival
│   │   ├── components/      # Galerie passée, etc.
│   │   ├── models/          # Modèles partagés (Speaker, AgendaItem, FaqItem, Partner, EventDocument)
│   │   ├── pages/           # Home, Agenda, Speakers, Sponsors, FAQ, DP Generator, Contact
│   │   └── services/        # EventConfigService, SpeakersService, ContactService
│   └── live-question/       # Module temps réel
│       ├── components/      # Composants de questions et navigation
│       ├── models/          # LiveQuestion, LiveSession, FloatingReaction
│       └── pages/           # Live Home, Question Space, Presentation, Remote, Admin (CMS, Settings, Sessions)
├── shared/                  # Éléments réutilisables (Navbar, Footer, Skeleton, Confirm Modal)
├── site/                    # Layout principal enveloppant le site public
├── app.config.ts            # Configuration Angular (Hydratation SSR, Preloading, Routes)
└── app.routes.ts            # Définition des routes avec lazy loading
```

---

## 💻 Pré-requis & Installation

- **Node.js** : version `20.x` ou `22.x` (LTS recommandée)
- **npm** : version `10.x` ou supérieure
- **Angular CLI** : version `20.x` (`npm install -g @angular/cli`)

### Installation des dépendances

```bash
git clone https://github.com/votre-orga/devfestkiv.git
cd devfestkiv
npm install
```

---

## 🚀 Démarrage Rapide

### Serveur de développement local

```bash
ng serve
# ou
npm start
```
Rendez-vous sur `http://localhost:4200/`. L'application se recharge automatiquement à chaque modification de fichier.

### Construction pour la production (avec SSR)

```bash
ng build
npm run serve:ssr:devfestkivu
```

---

## ⚙️ Configuration & Variables

### 1. Firebase Configuration
Le fichier `src/app/config/firebase.config.ts` contient la configuration publique du projet Firebase :

```typescript
export const FIREBASE_CONFIG = {
  projectId: 'devfest-kivu',
  appId: '...',
  storageBucket: '...',
  apiKey: '...',
  authDomain: '...',
  messagingSenderId: '...',
  measurementId: '...',
};
```

### 2. EmailJS Configuration
Le fichier `src/app/config/emailjs.config.ts` permet d'activer le formulaire de contact et la newsletter :

```typescript
export const EMAILJS_CONFIG = {
  serviceId: 'VOTRE_SERVICE_ID',
  publicKey: 'VOTRE_PUBLIC_KEY',
  templates: {
    contact: 'VOTRE_TEMPLATE_ID_CONTACT',
    newsletter: 'VOTRE_TEMPLATE_ID_NEWSLETTER',
  },
  recipientEmail: 'gdgkivu@gmail.com',
};
```

---

## 🔥 Données & Firestore

Toutes les interactions avec la base de données Firestore passent exclusivement par le service centralisé [`FirestoreService`](file:///d:/ccc/prod/company_dev/devfestkiv/src/app/core/firestore/firestore.service.ts).

Pour comprendre la structure des collections Firestore, la gestion des quotas de questions, les règles de sécurité et les modèles de données, **consultez la documentation dédiée : [Documentation Firestore](file:///d:/ccc/prod/company_dev/devfestkiv/src/app/core/firestore/README.md)**.

---

## 📧 Configuration EmailJS (Contact & Newsletter)

L'envoi des messages s'effectue côté client via `@emailjs/browser` sans nécessiter de backend dédié. Deux templates sont configurés :

1. **Formulaire de Contact (`/contact`)** : Transmet les demandes des visiteurs et sponsors vers l'email de l'organisation.
2. **Abonnement Newsletter (Footer)** : Notifie l'organisation d'une nouvelle inscription par email.

Consultez le guide détaillé étape par étape dans [github_tasks_backlog.md](file:///d:/ccc/prod/company_dev/devfestkiv/github_tasks_backlog.md).

---

## 🤝 Guide de Contribution & Tâches

Toutes les tâches à réaliser sont répertoriées dans le fichier **[`github_tasks_backlog.md`](file:///d:/ccc/prod/company_dev/devfestkiv/github_tasks_backlog.md)**.

### Workflow pour les contributeurs :
1. **Choisir une issue** dans le backlog GitHub ou [`github_tasks_backlog.md`](file:///d:/ccc/prod/company_dev/devfestkiv/github_tasks_backlog.md).
2. **Créer une branche dédiée** à partir de `main` :
   ```bash
   git checkout -b feature/issue-3-speakers-filters
   # ou
   git checkout -b fix/issue-2-dp-generator-limit
   ```
3. **Développer et tester localement** (`npm run build` et `ng test`).
4. **Soumettre une Pull Request (PR)** décrivant les modifications apportées et liant le numéro de l'issue (`Closes #3`).

---

## 📐 Bonnes Pratiques de Développement

Afin de maintenir une base de code propre et performante, merci de respecter scrupuleusement les règles suivantes :

### 🔴 Angular v20+
- **Standalone par défaut** : Ne **JAMAIS** ajouter `standalone: true` dans les décorateurs `@Component` ou `@Directive` (c'est le comportement par défaut d'Angular 20+).
- **Signals & Réactivité** : Privilégier les `signal()`, `computed()` et `effect()` pour la gestion de l'état local.
- **Contrôle de flux moderne** : Utiliser la syntaxe native `@if`, `@for`, `@switch` et **non** les anciennes directives structurelles `*ngIf` / `*ngFor`.
- **Injection de dépendances** : Utiliser la fonction `inject(ServiceName)` plutôt que l'injection par constructeur.
- **Gestion des événements d'hôte** : Ne **PAS** utiliser `@HostListener` ou `@HostBinding`. Déclarer les liaisons dans l'objet `host: { ... }` du composant.
- **Images optimisées** : Utiliser la directive `NgOptimizedImage` (`[ngSrc]`) pour les images statiques clés.

### 🎨 Styles & Tailwind CSS
- Utiliser les classes utilitaires de **Tailwind CSS v4**.
- Privilégier les liaisons de classes dynamiques `[class.ma-classe]="condition"` et `[style.mon-style]="valeur"` plutôt que `ngClass` / `ngStyle`.

---

## 📄 Licence

Ce projet est sous licence communautaire pour le **GDG Kivu / DevFest Kivu**. Tous droits réservés.
