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
  attendee: { label: 'Participant·e', icon: '🎟️', color: '#4285F4', textColor: '#FFFFFF', adminOnly: false },
  speaker: { label: 'Speaker', icon: '🎤', color: '#EA4335', textColor: '#FFFFFF', adminOnly: true },
  organizer: { label: 'Organisateur', icon: '⚙️', color: '#34A853', textColor: '#FFFFFF', adminOnly: true },
  volunteer: { label: 'Bénévole', icon: '🤝', color: '#FBBC05', textColor: '#202124', adminOnly: true },
};

export const ROLE_LIST = Object.keys(ROLE_META) as ParticipantRole[];