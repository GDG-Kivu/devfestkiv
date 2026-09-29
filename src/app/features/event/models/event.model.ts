export interface EventConfig {
  edition: number;
  year: number;
  name: string;
  fullName: string;
  date: {
    start: Date;
    end: Date;
    display: {
      start: number;
      end: number;
      month: string;
      year: number;
    };
  };
  venue: {
    city: string;
    country: string;
    fullLocation: string;
    conferenceCenter: string;
  };
  theme: string;
  description: string;
  registrationUrl: string;
  contact: {
    email: string;
    phone: string;
  };
  impactStats: Array<{
    number: string;
    rawNumber: number;
    label: string;
    description: string;
  }>;
  engagementYear: number;
  supports: Array<{
    name: string;
    role: string;
    quote: string;
    logo: string;
    link: string;
  }>;
  pastEvents: Array<{
    title: string;
    description: string;
    date: string;
    location: string;
    category: string;
    participants: string;
    tags: string[];
    badgeColor: string;
    dotColor: string;
  }>;
  agenda: {
    days: Array<{
      id: string;
      name: string;
      date: string;
      fullDate: string;
      location: string;
      isActive: boolean;
    }>;
  };
  firebase: {
    projectId: string;
    appId: string;
    storageBucket: string;
    apiKey: string;
    authDomain: string;
    messagingSenderId: string;
    measurementId: string;
  };
}
