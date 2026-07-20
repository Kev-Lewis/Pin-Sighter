// Board option lists for targeting selects. Foot boards run from 20-left of
// center out to 60 (represented as -20…60); lane boards (arrows/breakpoints)
// run 1…39. Extracted from App.tsx; shared by GameEntryPage and the
// SavedFrameEditModal.

export const footBoardOptions = Array.from({ length: 81 }, (_, index) => index - 20);
export const laneBoardOptions = Array.from({ length: 39 }, (_, index) => index + 1);
