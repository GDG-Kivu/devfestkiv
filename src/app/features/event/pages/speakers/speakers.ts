import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { EventConfigService } from '../../services/event-config.service';
import { FirestoreService } from '../../../../core/firestore/firestore.service';

@Component({
  selector: 'app-speakers',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <!-- Header -->
        <div class="text-center mb-20 animate-fade-in-up">
          <h1 class="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6 tracking-tight">
            Speakers {{ eventConfig.year }}
          </h1>
          <p class="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Découvrez les esprits brillants qui façonneront le DevFest Kivu {{ eventConfig.year }}.
          </p>
        </div>

        <!-- Speakers Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          @for (s of speakers; track $index) {
            <div
              class="group bg-white rounded-2xl border border-gray-200 p-6 flex flex-col items-center text-center transition-all duration-300 hover:border-blue-500 hover:-translate-y-1 animate-fade-in-up"
              [style.animation-delay]="$index * 100 + 'ms'"
            >
              <div class="relative mb-6">
                <div
                  class="absolute inset-0 rounded-full bg-blue-100 scale-0 group-hover:scale-110 transition-transform duration-300 ease-out"
                ></div>
                <img
                  src="{{ s.profilePicture }}"
                  alt="{{ s.owner }}"
                  class="relative w-32 h-32 rounded-full object-cover border-4 border-white shadow-sm group-hover:shadow-md transition-all duration-300"
                />
              </div>

              <h3
                class="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors"
              >
                {{ s.owner }}
              </h3>

              <!-- TagLine/Bio snippet could go here if desired, but user asked to remove title. 
                 Keeping it minimal as requested. -->
              <p class="text-sm text-gray-500 mb-4 line-clamp-2 px-2">
                {{ s.TagLine }}
              </p>

              <div class="mt-auto">
                @if (s.LinkedIn) {
                  <a
                    href="{{ s.LinkedIn }}"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-50 text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-all duration-300"
                    aria-label="LinkedIn Profile"
                  >
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"
                      />
                    </svg>
                  </a>
                }
              </div>
            </div>
          }
        </div>

        <!-- Event Details (Minimalist) -->
        <div class="mt-24 border-t border-gray-100 pt-16">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-4xl mx-auto">
            <div
              class="flex flex-col items-center text-center animate-fade-in-up"
              style="animation-delay: 600ms"
            >
              <div
                class="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-4"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 class="text-lg font-semibold text-gray-900 mb-1">Date & Heure</h3>
              <p class="text-gray-600">
                {{ eventConfig.date.display.start }} {{ eventConfig.date.display.month }}
                {{ eventConfig.date.display.year }}
              </p>
              <p class="text-sm text-gray-500">10h30 - 18h00</p>
            </div>

            <div
              class="flex flex-col items-center text-center animate-fade-in-up"
              style="animation-delay: 800ms"
            >
              <div
                class="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-4"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <h3 class="text-lg font-semibold text-gray-900 mb-1">Lieu</h3>
              <p class="text-gray-600">{{ eventConfig.venue.conferenceCenter }}</p>
              <p class="text-sm text-gray-500">{{ eventConfig.venue.fullLocation }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: `
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .animate-fade-in-up {
      animation: fadeInUp 0.6s ease-out forwards;
      opacity: 0; /* Start hidden */
    }
  `,
})
export default class Speakers implements OnInit {
  eventConfig = inject(EventConfigService);
  private fs = inject(FirestoreService);

  initialFallbackSpeakers = [
    {
      owner: 'Daniella Ansima',
      title:
        "Au-delà du Prompt : Les Enjeux Éthiques et Sociaux de la Création d'Images par Intelligence Artificielle",
      description:
        'Démontrer les enjeux majeurs de la génération d’image par l’intelligence artificielle',
      TagLine: 'Web Developer',
      bio: 'Membre du GDG.',
      LinkedIn:
        'https://www.linkedin.com/in/daniella-ansima-01184129a?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=ios_app',
      profilePicture: 'https://sessionize.com/image/98cb-400o400o1-wFYhA45HmxKR8eaNVFytZh.jpg',
    },
    {
      owner: 'Yannick S. Nick King',
      title: 'IA vs Local Guides : Comment votre contribution réécrit le futur de Google Maps',
      description:
        "Nous visons à faire comprendre le rôle critique des données humaines ( venant de Local Guides) pour corriger les biais et entraîner l'IA de Google Maps.  (Prouver que l'IA ne peut pas se passer du terrain et il n'y a pas plus meilleur pour comprendre celà qu'un Développeur.",
      TagLine: 'GDG Bukavu, Content Creator',
      bio: 'YANNICK S., Membre du GDG Bukavu / Tech Advocate / Content Creator / Designer, Graphiste, Evenementiel ',
      LinkedIn:
        'https://www.linkedin.com/in/yannick-s-nick-king-262b1815b?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app',
      profilePicture: 'https://sessionize.com/image/dc0a-400o400o1-EhZvKMVpXgPUW89Vtn8rhm.jpg',
    },
    {
      owner: 'Fearless Alain',
      title: 'Comment digitaliser les commerces locaux grâce à l’IA ?',
      description:
        'Dans cette session, je partagerai mon parcours d’étudiant passionné de tech qui cherche à digitaliser les commerces locaux grâce à l’IA. Je montrerai comment j’ai pensé et commencé à construire zFlex, une plateforme SaaS qui vise à rendre la gestion et la vente en ligne naturelles pour les marchands et leurs clients. Au programme : Les défis concrets rencontrés en imaginant et en testant un produit digital pour un marché local. Les choix technologiques et stratégies adoptés pour rendre le SaaS efficace et accessible. Une mini démo pour illustrer comment un commerçant pourrait utiliser la plateforme au quotidien. Les leçons apprises sur le design produit, le process de développement et la mise en pratique de l’IA pour résoudre des problèmes réels. Cette session est pensée pour inspirer et guider ceux qui veulent transformer une idée en prototype fonctionnel, tout en découvrant comment la tech peut simplifier la vie de la communauté locale.',
      TagLine: 'Étudiant passionné de tech et développement web',
      bio: 'Uwezo Bisimwa Alain est étudiant en mathématiques et passionné par le développement web et les solutions numériques locales. Il travaille sur zFlex, une idée de plateforme SaaS visant à aider les commerces locaux à gérer et digitaliser leurs activités. Son intérêt se concentre sur la façon dont la technologie peut simplifier la vie des petits commerces et créer des opportunités économiques concrètes dans sa communauté.',
      LinkedIn: 'https://linkedin.com/in/fearlessalan',
      profilePicture: 'https://sessionize.com/image/b302-400o400o1-BwiidGoFEWj4NgnXAPLxAs.jpg',
    },
    {
      owner: 'Jérémie Ndeke',
      title: 'Construire des vraies compétences en dev : l’IA n’est pas un raccourci',
      description:
        'Avec l’arrivée des assistants IA, coder n’a jamais été aussi simple : une phrase, un clic… et le code apparaît. Mais pour beaucoup de nouveaux développeurs et intermediaires, cela crée une illusion de compétence : on produit du code sans réellement apprendre à le comprendre, à le corriger ou à l’améliorer. Dans cette session, nous allons explorer comment utiliser l’IA pour apprendre, et non à la place d’apprendre.',
      TagLine: 'Web Developer',
      bio: 'GDG Kivu organizer et web developer',
      LinkedIn:
        'https://www.linkedin.com/in/j%C3%A9r%C3%A9mie-ndeke-70a840287?lipi=urn%3Ali%3Apage%3Amw_learning_feed%3BhMV3SqxTTrWLsc0qoVEw6w%3D%3D&licu=urn%3Ali%3Acontrol%3Amw_learning_feed-view_profile',
      profilePicture: 'https://sessionize.com/image/3c68-400o400o1-wC62QEniwWYub9stL7qktH.jpg',
    },
    {
      owner: 'Marie-Grâce Bahati',
      title:
        'Les erreurs qui m’ont fait grandir en tant que dev : leçons que j’aurais aimé apprendre plus tôt.',
      description:
        'Un partage sincère sur les erreurs qui ont marqué mon parcours ,  les leçons que j’ai apprises de ces erreurs et qui m’ont aidées à progresser et à m’améliorer.',
      TagLine: 'Software Developer',
      bio: "I'm a 24 yo software developer born and raised in Bukavu, DRC but actually living in Kigali/Rwanda. I completed my primary and secondary studies in Bukavu before moving to Kigali for university, where I studied Finance. After university, in 2022, I discovered my passion for technology and completed a 10-month Software Development program at Microverse. Through hands-on projects and various professional experiences, I have grown as a developer and enjoys sharing my journey to inspire young people, especially women, to pursue careers in tech with confidence.",
      LinkedIn: 'https://www.linkedin.com/in/marie-gr%C3%A2ce-bahati/',
      profilePicture: 'https://sessionize.com/image/5e01-400o400o1-XmJp6XEHNhcNWy6zthCWE3.jpg',
    },
    {
      owner: 'Heshima Magalabaha Ezra',
      title: 'Éducation et carrière',
      description: 'Mon success Grace à la formation certifiante en remote ',
      TagLine: 'CEO et ingénieur logiciel chez matrix group ltd',
      bio: 'Heshima Magalabaha Ezra est un ingénieur logiciel et expert en intelligence artificielle originaire de la République Démocratique du Congo. Né le 23 juin 1997, il est actuellement Software Engineer chez Matrix Group Ltd au Royaume-Uni et CEO de Black Born Community, une organisation engagée dans la formation des jeunes et leur insertion professionnelle à travers le numérique. Diplômé en informatique de l’Université Catholique de Bukavu (UCB), Heshima a complété son parcours académique par plusieurs formations spécialisées en ligne dans les domaines de l’ingénierie logicielle, de la cybersécurité et de l’intelligence artificielle. Avec plus de six années d’expérience professionnelle, il a travaillé sur des projets technologiques d’envergure internationale, notamment en tant qu’ingénieur logiciel chez Always Good (États-Unis). Son expertise s’étend du développement d’applications mobiles et backend à la conception de systèmes intelligents basés sur l’IA et l’automatisation. À travers sa plateforme bbcommunity.academy￼, il œuvre pour réduire le fossé numérique en Afrique, en offrant aux jeunes des opportunités concrètes d’apprentissage, de création d’emploi et d’émancipation professionnelle. Reconnu pour sa vision innovante et son leadership engagé, Heshima Magalabaha Ezra incarne une nouvelle génération d’ingénieurs africains déterminés à utiliser la technologie comme moteur de transformation sociale et économique.',
      LinkedIn: 'https://linkedin.com/in/heshimakob/',
      profilePicture: 'https://sessionize.com/image/a1ae-400o400o1-VzBrSBb484Kt1J5LJHkWbZ.jpg',
    },
    {
      owner: 'Christian Rusipa Jerry',
      title:
        'RESILIENCE & ADAPTABILITE DE DEVELOPPEURS DANS UN MONDE EN PLEINE REVOLUTION DIGITALE',
      description:
        "Dans cette session, nous envisageons échanger avec les newbies dans le domaine  sur l'importance d'être résilient face aux différents défaits que présente le domaine informatique dans une  communauté où la majorité de la population n'utilise pas l'outil informatique mais également la souplesse dans l'adaptabilité aux différents changements et innovation que ce domaine est en train de subir du jours au lendemain.",
      TagLine: 'Kwetu-Tech, Founder  & Project Manager',
      bio: "Christian Rusipa est un Jeune de la Republique democratique du Congo, passionné de l'informatique depuis son jeune âge. Il detient un diplome de Bachelor of Information Technology (IT) de l'Université de St. Lawrence Univeristy -SLAU, Kampala, Uganda, promotion de 2016. Depuis 2019, Il  est fondateur de KWETU-TECH(https://kwetutech.com), une entreprise specialisée dans l'etude, conception, developpement et maintenance des systemes informatiques, basée à Bukavu, Sud-Kivu. Kwetu-Tech a deja mis au points plusieurs solutions telles que Smart-Duka, easyChick, kwetuEvent, KwetuTicket, smartBuguza, etc. Certaines des leurs solutions sont utilisées dans le secteur privé et d'autres dans le secteur public.",
      LinkedIn: 'https://www.linkedin.com/in/christian-rusipa-136366b1/',
      profilePicture: 'https://sessionize.com/image/a2ae-400o400o1-fUbwSCiXMvcg8ATYc3mT5B.jpg',
    },
    {
      owner: 'Raphael AMISI CABWINE',
      title: '',
      description: '',
      TagLine: 'CEO & Founder at Congo Cloud Computer sarl',
      bio: '',
      LinkedIn:
        'https://www.linkedin.com/in/raphael-amisi-cabwine-107b4693?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app',
      profilePicture:
        'https://media.licdn.com/dms/image/v2/D4D03AQE5ZZnSl4g9DA/profile-displayphoto-scale_400_400/B4DZl2LMicIgAk-/0/1758624272756?e=1765411200&v=beta&t=AC6NnjgYaJq2IngI_6USR5-BUpmZnasZtux6gaCFtpE',
    },
  ];

  speakers = [...this.initialFallbackSpeakers];

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Subscribe to Firestore published speakers for current edition
    this.fs.getCurrentEditionId().subscribe((editionId) => {
      this.fs.getPublishedEventCollection<any>(editionId, 'speakers', { field: 'status', value: 'published' }).subscribe({
        next: (fsSpeakers) => {
          if (fsSpeakers && fsSpeakers.length > 0) {
            this.speakers = fsSpeakers.map((s) => ({
              owner: s.name,
              title: s.title || '',
              description: s.bio || '',
              TagLine: s.title || '',
              bio: s.bio || '',
              LinkedIn: s.socials?.linkedin || '',
              profilePicture: s.photo || 'assets/logo.png',
            }));
          } else {
            this.speakers = [...this.initialFallbackSpeakers];
          }
        },
        error: () => {
          this.speakers = [...this.initialFallbackSpeakers];
        },
      });
    });
  }
}
