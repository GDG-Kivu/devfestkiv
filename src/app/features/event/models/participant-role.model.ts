export type ParticipantRole = 'attendee' | 'speaker' | 'organizer' | 'volunteer';
export type DpTemplate = 'classic' | 'bold';

export interface RoleMeta {
  label: string;
  icon: string;
  color: string;
  textColor: string;
  adminOnly: boolean;
}

export const ROLE_META: Record<ParticipantRole, RoleMeta> = {
  attendee: { label: 'attendee', icon: '', color: '#4285F4', textColor: '#FFFFFF', adminOnly: false },
  speaker: { label: 'Speaker', icon: '', color: '#EA4335', textColor: '#FFFFFF', adminOnly: true },
  organizer: { label: 'organizer', icon: '', color: '#34A853', textColor: '#FFFFFF', adminOnly: true },
  volunteer: { label: 'volunteer', icon: '', color: '#FBBC05', textColor: '#202124', adminOnly: true },
};


export const ROLE_LIST = Object.keys(ROLE_META) as ParticipantRole[];

export interface RoleTheme {
  main: string;       // bulle, bordure photo, carte, hashtag
  pill: string;       // fond de la pastille de rôle
  pillLabel: string;  // texte de la pastille
}

export const ROLE_THEME: Record<ParticipantRole, RoleTheme> = {
  attendee:  { main: '#EA4335', pill: '#EA4335', pillLabel: 'ATTENDEE' },
  speaker:   { main: '#1A73E8', pill: '#1A73E8', pillLabel: 'SPEAKER' },
  organizer: { main: '#F9AB00', pill: '#F4600C', pillLabel: 'ORGANIZER' },
  volunteer: { main: '#1E9E4F', pill: '#1E9E4F', pillLabel: 'VOLUNTEER' },
};