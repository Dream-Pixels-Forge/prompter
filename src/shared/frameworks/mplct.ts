import { type Framework } from '@/shared/types';

export const mplctFramework: Framework = {
  id: 'mplct',
  name: 'MPLCT Framework',
  description: 'Multi-Purpose Language Creative Template for video, 3D, and cinematic prompts',
  color: 'cyan',
  sections: [
    {
      key: 'subject',
      label: 'Subject',
      placeholder: 'Primary subject, character, or focal element',
      defaultContent: 'The primary subject is described by: {goal}',
    },
    {
      key: 'environment',
      label: 'Environment',
      placeholder: 'Setting, background, time of day, atmosphere',
      defaultContent: 'The environment should support and contextualize the subject',
    },
    {
      key: 'lighting',
      label: 'Lighting',
      placeholder: 'Light sources, mood, shadows, color temperature',
      defaultContent: 'Lighting is cinematic, with deliberate mood and atmosphere',
    },
    {
      key: 'camera',
      label: 'Camera',
      placeholder: 'Angle, movement, lens, depth of field, framing',
      defaultContent: 'Camera work is intentional and purposeful',
    },
    {
      key: 'action',
      label: 'Action',
      placeholder: 'Movement, behavior, dynamics, timing',
      defaultContent: 'The action follows from: {goal}',
    },
    {
      key: 'style',
      label: 'Style',
      placeholder: 'Visual aesthetic, reference style, medium',
      defaultContent: 'The visual style is polished and intentional',
    },
    {
      key: 'negative',
      label: 'Negative Space',
      placeholder: 'What to avoid, unwanted elements, artifacts',
      defaultContent: 'Avoid artifacts, inconsistencies, and unintended elements',
    },
    {
      key: 'meta',
      label: 'Meta',
      placeholder: 'Aspect ratio, duration, format-specific parameters',
      defaultContent: 'Standard format with balanced composition',
    },
  ],
};
