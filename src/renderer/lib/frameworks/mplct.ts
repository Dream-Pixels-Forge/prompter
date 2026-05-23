import { type Framework } from '@/shared/types';

export const mplctFramework: Framework = {
  id: 'mplct',
  name: 'MPLCT Framework',
  description: 'Multi-Purpose Language Creative Template for video, 3D, and cinematic prompts',
  sections: [
    {
      key: 'subject',
      label: 'Subject',
      placeholder: 'Primary subject, character, or focal element',
    },
    {
      key: 'environment',
      label: 'Environment',
      placeholder: 'Setting, background, time of day, atmosphere',
    },
    {
      key: 'lighting',
      label: 'Lighting',
      placeholder: 'Light sources, mood, shadows, color temperature',
    },
    {
      key: 'camera',
      label: 'Camera',
      placeholder: 'Angle, movement, lens, depth of field, framing',
    },
    {
      key: 'action',
      label: 'Action',
      placeholder: 'Movement, behavior, dynamics, timing',
    },
    {
      key: 'style',
      label: 'Style',
      placeholder: 'Visual aesthetic, reference style, medium',
    },
    {
      key: 'negative',
      label: 'Negative Space',
      placeholder: 'What to avoid, unwanted elements, artifacts',
    },
    {
      key: 'meta',
      label: 'Meta',
      placeholder: 'Aspect ratio, duration, format-specific parameters',
    },
  ],
};
