# 🔥 Firestore Data Contract & Architecture

Ce document définit le contrat de données, l'arborescence des collections Cloud Firestore, les règles de sécurité et les bonnes pratiques pour l'ensemble du projet DevFest Kivu.

Le projet utilise **Firestore Native (Standard edition)** avec persistance locale multi-onglets.

---

## 🗂️ Arborescence des Collections Firestore

Toutes les données associées à une édition du festival sont cloisonnées sous le document racine `events/{editionId}`. Aucun document lié à une édition spécifique ne doit être créé à la racine.

| Chemin Firestore | Description & Rôle | Visibilité & Droits d'accès |
| :--- | :--- | :--- |
| `events/{editionId}` | Configuration générale de l'édition (dates, lieu, thème, registrationUrl, quota `maxQuestionsPerUser`, galerie, albums, dpTemplate) | Lecture publique ; Écriture réservée aux Admins |
| `events/{editionId}/speakers/{speakerId}` | Profils des intervenants de l'édition (`Speaker`) | Lecture publique si `status == 'published'` ; Écriture Admin |
| `events/{editionId}/agenda/{agendaItemId}` | Créneaux et planning du festival (`AgendaItem`) | Lecture publique si `isPublished == true` ; Écriture Admin |
| `events/{editionId}/faq/{faqId}` | Questions et réponses fréquentes (`FaqItem`) | Lecture publique si `isPublished == true` ; Écriture Admin |
| `events/{editionId}/partners/{partnerId}` | Partenaires et sponsors (`EventPartner`) | Lecture publique si `isPublished == true` ; Écriture Admin |
| `events/{editionId}/news/{articleId}` | Articles et annonces officielles (`NewsArticle`) | Lecture publique si `status == 'published'` ; Écriture Admin |
| `events/{editionId}/sessions/{sessionId}` | Sessions pour les questions en direct (`LiveSession`) | Lecture publique des sessions actives (`isActive == true`) ; Écriture Admin |
| `events/{editionId}/sessions/{sessionId}/questions/{questionId}` | Questions posées par les participants en direct (`LiveQuestion`) | Lecture pour session active ; Création authentifiée (avec UID correspondant) ; Modération Admin |
| `events/{editionId}/questionQuotas/{uid}` | Compteur atomique de questions posées par participant | Lecture de son propre quota ; Écriture via transaction atomique lors de la création d'une question |
| `events/{editionId}/remote/{controllerId}` | État de la télécommande pour les présentateurs | Lecture authentifiée ; Écriture Admin/Présentateur |
| `events/{editionId}/emojis/{reactionId}` | Réactions en temps réel par émojis flottants | Lecture/Création authentifiée ; Écriture Admin |
| `users/{uid}` | Profils utilisateurs et rôles (`invite` ou `admin`) | Lecture par l'utilisateur connecté ou Admin ; Écriture client refusée |
| `siteSettings/global` | Paramètres globaux, notamment `currentEditionId` | Lecture publique ; Écriture Admin |

> **⚠️ Règle importante pour les Partenaires/Sponsors** : Ne créez pas de collection `sponsors` distincte. Tous les sponsors sont des partenaires (`EventPartner`) dans la sous-collection `partners` avec un champ `role` décrivant leur niveau (ex: *Platinum Sponsor*, *Community Partner*, etc.).

---

## 📦 Modèles de Données TypeScript

Les modèles de données partagés sont situés dans [`src/app/features/event/models/`](file:///d:/ccc/prod/company_dev/devfestkiv/src/app/features/event/models/) et [`src/app/features/live-question/models/`](file:///d:/ccc/prod/company_dev/devfestkiv/src/app/features/live-question/models/) :

1. **`EventDocument`** (`event.model.ts`) : Contrat racine de l'édition. Contient `editionId`, `edition`, `year`, `name`, `theme`, `date`, `venue`, `contact`, `impactStats`, `gallery`, `albums`, `dpTemplate`.
2. **`Speaker`** (`speaker.model.ts`) : `name`, `title`, `bio`, `photo`, `topics`, `status` (`draft` \| `published`), `socials` (`twitter`, `linkedin`, `github`), `day`.
3. **`AgendaItem`** (`agenda-item.model.ts`) : `id`, `editionId`, `dayId`, `title`, `description`, `speakerIds`, `startsAt`, `endsAt`, `room`, `track`, `format` (`keynote` \| `talk` \| `workshop` \| `codelab` \| `discussion` \| `break`), `isPublished`.
4. **`FaqItem`** (`faq-item.model.ts`) : `id`, `question`, `answer`, `category` (`Logistique` \| `Inscription` \| `Speakers` \| `Technique` \| `Autre`), `isPublished`, `order`.
5. **`EventPartner`** (`partner.model.ts`) : `id`, `name`, `role`, `quote`, `logo`, `link`, `isPublished`, `order`.
6. **`NewsArticle`** (`news-article.model.ts`) : `id`, `title`, `slug`, `excerpt`, `content`, `imageUrl`, `publishedAt`, `status`.
7. **`LiveSession`** & **`LiveQuestion`** (`live-session.model.ts`, `live-question.model.ts`) : Gestion du direct.

---

## 🛠️ Utilisation de `FirestoreService`

Tous les composants doivent injecter et utiliser [`FirestoreService`](file:///d:/ccc/prod/company_dev/devfestkiv/src/app/core/firestore/firestore.service.ts). **Aucun composant ne doit manipuler directement les fonctions bas niveau du SDK Firebase.**

### Méthodes Clés Disponibles :

```typescript
import { inject } from '@angular/core';
import { FirestoreService } from '../../core/firestore/firestore.service';

export class MonComposant {
  private fs = inject(FirestoreService);

  // 1. Récupérer l'ID de l'édition active sur le site
  currentEdition$ = this.fs.getCurrentEditionId();

  // 2. Récupérer les éléments publiés pour l'édition courante
  loadSpeakers(editionId: string) {
    this.fs.getPublishedEventCollection<Speaker>(editionId, 'speakers', { field: 'status', value: 'published' })
      .subscribe(speakers => {
        // ...
      });
  }

  // 3. Récupérer la configuration générale de l'édition avec fallback local
  eventConfig$ = this.fs.getCurrentEventWithFallback();
}
```

### Méthodes d'Écriture (CRUD Admin) :
- `createEventDocument(editionId, collectionName, data)` : Crée un document avec génération d'ID automatique.
- `saveEventDocument(editionId, collectionName, data)` : Enregistre / Upsert avec merge.
- `updateEventDocument(editionId, collectionName, docId, changes)` : Met à jour un document existant.
- `deleteEventDocument(editionId, collectionName, docId)` : Supprime un document.

---

## 🔒 Sécurité & Quotas (firestore.rules)

La sécurité est assurée côté serveur par `firestore.rules` :

1. **Rôle Administrateur** : Déterminé par le document `users/{uid}` avec le champ `role == 'admin'` et `disabled != true`. Les écritures sur les données d'édition et du CMS sont strictement réservées aux administrateurs.
2. **Quotas de Questions en Direct** :
   - Chaque question ajoutée fait l'objet d'une transaction atomique incrémentant le compteur dans `events/{editionId}/questionQuotas/{uid}`.
   - La limite maximale est définie par `maxQuestionsPerUser` (par défaut **5**, maximum configurable **100**).
   - Les questions nécessitent une authentification (Google ou Anonyme automatique gérée par `AuthService.ensureAnonymousOrAuthenticated()`).
3. **Filtrage des Requêtes Publiques** :
   - Les règles Firestore n'agissant pas comme des filtres automatiques, les requêtes publiques doivent obligatoirement cibler `where('isPublished', '==', true)` ou `where('status', '==', 'published')` via la méthode `getPublishedEventCollection()`.

---

## ⏱️ Conversion des Dates & Timestamps

Utilisez l'utilitaire `formattedTimestamp(timestamp)` situé dans `src/app/shared/utils/formatted-timestamp.ts` pour convertir les objets `Timestamp` Firestore en objets JavaScript `Date` de manière sécurisée et homogène.
