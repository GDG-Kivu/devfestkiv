import { EventConfig } from '../features/event/models/event.model';

export type { EventConfig } from '../features/event/models/event.model';

export const EVENT_CONFIG: EventConfig = {
  edition: 2025,
  year: 2025,
  name: 'DevFest Kivu',
  fullName: 'DevFest Kivu 2025',
  date: {
    start: new Date('2025-11-29T09:00:00'),
    end: new Date('2025-11-29T18:00:00'),
    display: {
      start: 29,
      end: 29,
      month: 'Novembre',
      year: 2025,
    },
  },
  venue: {
    city: 'Bukavu',
    country: 'RD Congo',
    fullLocation: 'Bukavu, RD Congo',
    conferenceCenter: 'Hotel Panorama Bukavu',
  },
  theme: 'Innovation & Tech',
  description:
    'Le plus grand rassemblement tech de la région des Grands Lacs, réunissant développeurs, étudiants, élèves, entrepreneurs, etc.',
  registrationUrl:
    'https://gdg.community.dev/events/details/google-gdg-kivu-presents-devfest-kivu-2025/cohost-gdg-kivu',
  contact: {
    email: 'gdgkivu@gmail.com',
    phone: '+243999537410',
  },
  impactStats: [
    {
      number: '80+',
      rawNumber: 80,
      label: 'Événements Organisés',
      description: 'Conférences, workshops,...',
    },
    {
      number: '500+',
      rawNumber: 500,
      label: 'Développeurs Rassemblés',
      description: 'Une communauté grandissante',
    },
    {
      number: '10+',
      rawNumber: 10,
      label: 'Startups & Entreprises',
      description: 'Partenaires et sponsors',
    },
    {
      number: '700+',
      rawNumber: 700,
      label: 'Personnes Formées',
      description: 'Compétences développées',
    },
  ],
  engagementYear: 5,
  supports: [
    {
      name: 'Wikisuite',
      role: 'Partenaire Principal',
      quote:
        ' Ils offrent une suite complète de solutions pour la collaboration et la gestion, que les organisations peuvent utiliser pour améliorer leur productivité et créer des outils fiables ',
      logo: 'assets/supports/support-3.jpg',
      link: 'https://wikisuite.org/Software',
    },
    {
      name: 'DrcMind',
      role: 'Partenaire Principal',
      quote:
        'Basée à Bukavu, elle forme, équipe et accompagne les talents africains à bâtir des solutions numériques utiles et durables',
      logo: 'assets/supports/support-1.jpg',
      link: 'https://drcmind.com/',
    },

    {
      name: 'NeoTex',
      role: 'Partenaire Principal',
      quote:
        'Ils développent Halisi, une plateforme IA qui utilise biométrie, données et modèles avancés pour créer des solutions utiles, comme la reconnaissance faciale animale pour l’élevage et des systèmes de recommandation pour le retail. ',
      logo: 'assets/supports/support-2.jpeg',
      link: 'https://neotex.ai/',
    },

    {
      name: 'SIA RDC',
      role: 'Partenaire Principal',
      quote:
        "SIA RDC est une entreprise technologique innovante spécialisée dans dans les technologies de l'information et de la communication en RDC. ",
      logo: 'assets/supports/support-6.jpg',
      link: 'https://sia-rdc.com/',
    },
    {
      name: 'Denota',
      role: 'Partenaire Media',
      quote: 'Denota assure la couverture des videos promotionnels du DevFest Kivu.',
      logo: 'assets/supports/support-4.jpeg',
      link: '',
    },
    {
      name: 'Kivu Graphic',
      role: 'Partenaire Media',
      quote: 'Kivu Graphic assure la couverture des affiches  officiels du DevFest Kivu.',
      logo: 'assets/supports/support-5.png',
      link: '',
    },
    // {
    //   name: 'Jambo World',
    //   role: 'Partenaire Média',
    //   quote:
    //     'Jambo World contribue à la visibilité du DevFest Kivu à travers la couverture médiatique et la diffusion d\'actualités tech.',
    // },
    // {
    //   name: 'Congo Cloud Computer',
    //   role: 'Partenaire Technique',
    //   quote:
    //     'Congo Cloud Computer fournit l\'infrastructure cloud et le support technique pour assurer une expérience fluide durant l\'événement.',
    // },
  ],
  pastEvents: [
    {
      title: 'DevFest Kivu 2024',
      description:
        'Grand festival annuel avec des speakers internationaux et des workshops innovants sur les dernières technologies.',
      date: 'Décembre 2024',
      location: 'Bukavu',
      category: 'Festival',
      participants: '400+',
      tags: ['AI/ML', 'Web', 'Mobile'],
      badgeColor: 'text-blue-700 bg-blue-100',
      dotColor: 'bg-blue-500',
    },
    {
      title: 'DevFest Kivu 2023',
      description:
        'Grand festival annuel avec des speakers internationaux et des workshops innovants sur les dernières technologies.',
      date: 'Décembre 2023',
      location: 'Bukavu',
      category: 'Festival',
      participants: '400+',
      tags: ['AI/ML', 'Cloud', 'Mobile'],
      badgeColor: 'text-blue-700 bg-blue-100',
      dotColor: 'bg-blue-500',
    },
    {
      title: 'DevFest Kivu 2022',
      description:
        'Grand festival annuel avec des speakers internationaux et des workshops innovants sur les dernières technologies.',
      date: 'Décembre 2022',
      location: 'Bukavu',
      category: 'Festival',
      participants: '400+',
      tags: ['AI/ML', 'Cloud', 'Mobile'],
      badgeColor: 'text-blue-700 bg-blue-100',
      dotColor: 'bg-blue-500',
    },
    {
      title: 'DevFest Kivu 2021',
      description:
        'Grand festival annuel avec des speakers internationaux et des workshops innovants sur les dernières technologies.',
      date: 'Décembre 2021',
      location: 'Bukavu',
      category: 'Festival',
      participants: '400+',
      tags: ['AI/ML', 'Cloud', 'Mobile'],
      badgeColor: 'text-blue-700 bg-blue-100',
      dotColor: 'bg-blue-500',
    },
    {
      title: 'DevFest Kivu 2020',
      description:
        'Grand festival annuel avec des speakers internationaux et des workshops innovants sur les dernières technologies.',
      date: 'Décembre 2020',
      location: 'Bukavu',
      category: 'Festival',
      participants: '400+',
      tags: ['AI/ML', 'Cloud', 'Mobile'],
      badgeColor: 'text-blue-700 bg-blue-100',
      dotColor: 'bg-blue-500',
    },
    {
      title: 'AI/ML Meetup',
      description:
        "Rencontre dédiée à l'intelligence artificielle et au machine learning avec des cas d'usage africains.",
      date: 'Juillet 2025',
      location: 'Bukavu',
      category: 'Meetup',
      participants: '80+',
      tags: ['AI', 'Machine Learning', 'Data'],
      badgeColor: 'text-purple-700 bg-purple-100',
      dotColor: 'bg-purple-500',
    },
    {
      title: 'Malakisi-Lancement',
      description:
        'Formation intensive de développement web et mobile moderne avec Angular, Kotlin, Firebase et les meilleures pratiques.',
      date: 'Novembre 2024',
      location: 'Bukavu',
      category: 'Formation',
      participants: '100+',
      tags: ['Angular', 'Kotlin', 'Firebase'],
      badgeColor: 'text-indigo-700 bg-indigo-100',
      dotColor: 'bg-indigo-500',
    },
    {
      title: 'DevFest Kivu 2019',
      description:
        "Première édition du DevFest Kivu, marquant le début d'une tradition technologique dans la région.",
      date: 'Décembre 2019',
      location: 'Bukavu',
      category: 'Festival',
      participants: '200+',
      tags: ['Web', 'Mobile', 'Community'],
      badgeColor: 'text-green-700 bg-green-100',
      dotColor: 'bg-green-500',
    },
    {
      title: 'Web Development Bootcamp',
      description:
        'Bootcamp intensif de développement web pour les débutants, avec focus sur les technologies modernes.',
      date: 'Janvier 2025',
      location: 'Bukavu',
      category: 'Formation',
      participants: '50+',
      tags: ['Web', 'JavaScript', 'HTML/CSS'],
      badgeColor: 'text-orange-700 bg-orange-100',
      dotColor: 'bg-orange-500',
    },
    {
      title: 'Mobile App Challenge',
      description:
        "Concours de développement d'applications mobiles avec des prix et des mentors experts.",
      date: 'Juillet 2025',
      location: 'Bukavu',
      category: 'Challenge',
      participants: '30+',
      tags: ['Mobile', 'Android', 'iOS'],
      badgeColor: 'text-red-700 bg-red-100',
      dotColor: 'bg-red-500',
    },
  ],
  agenda: {
    days: [
      {
        id: 'day1',
        name: 'DevFest Kivu',
        date: '29 Nov',
        fullDate: 'Samedi 29 Novembre 2025',
        location: 'Centre de Conférences DevFest',
        isActive: true,
      },
    ],
  },
  firebase: {
    projectId: `devfestkivu${2025}`,
    appId: '1:142493229043:web:2e7e063847140023c83c86',
    storageBucket: `devfestkivu${2025}.firebasestorage.app`,
    apiKey: 'AIzaSyDs1NHP5Fcwqb4G9_07eaQmNe8zrrbmqXY',
    authDomain: `devfestkivu${2025}.firebaseapp.com`,
    messagingSenderId: '142493229043',
    measurementId: 'G-JGFQPBQ6WY',
  },
};
