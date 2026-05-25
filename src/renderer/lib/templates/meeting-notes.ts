import type { Template } from '@/shared/types';

export const meetingNotesTemplate: Template = {
  id: 'meeting-notes',
  name: 'Meeting Notes / Agenda',
  description: 'Structured meeting notes with action items and decision tracking',
  icon: 'Calendar',
  domain: 'productivity',
  audienceHint: 'Team leads, PMs, and anyone running meetings',
  framework: 'openai',
  defaultInput:
    'Create a meeting agenda and note-taking template for a weekly sprint retrospective. Include sections for: what went well, what could improve, action items, and team health check. Format should facilitate a blameless postmortem culture with clear owners and deadlines for each action item.',
};
