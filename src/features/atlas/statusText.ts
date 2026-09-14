// src/features/atlas/statusText.ts — the one place the session's internal
// status becomes words a visitor reads. It lives apart from the panel so the
// hero can label the orb with exactly the same sentence the status line shows:
// the picture and the text can never tell different stories.
import { MIC_PROMPT_STATUS } from './content';
import type { AtlasAgentState } from './messages';
import type { useAtlasSession } from './useAtlasSession';

type Status = ReturnType<typeof useAtlasSession>['status'];

/**
 * `live` + agentState 'idle' is the gap between Atlas finishing a sentence and
 * the worker reporting the next state. The microphone is open throughout, so
 * "Listening" is the truthful label for it.
 */
export const atlasStatusText = (status: Status, agentState: AtlasAgentState) => {
  // The browser's permission prompt is open and the page is waiting on the
  // visitor, not the other way round. "Connecting…" here is the sentence that
  // let someone wait 100 seconds for a demo that was waiting for them.
  if (status === 'requesting_mic') {
    return MIC_PROMPT_STATUS;
  }
  if (status === 'requesting' || status === 'connecting') {
    return 'Connecting…';
  }
  if (status === 'waiting_agent') {
    return 'Waiting for Atlas…';
  }
  if (status === 'ended') {
    return 'Ended';
  }
  // The panel replaces its status line with the error message itself, but the
  // orb still needs a name — and "Listening" beside a failed call would be a
  // lie told only to screen readers.
  if (status === 'error') {
    return 'Not connected';
  }
  if (agentState === 'thinking') {
    return 'Thinking';
  }
  if (agentState === 'speaking') {
    return 'Speaking';
  }
  return 'Listening';
};
