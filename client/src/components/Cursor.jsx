import { useCursor } from '../hooks/useCursor.js';

export function Cursor() {
  useCursor();
  return (
    <>
      <div className="cursor" id="cursor" />
      <div className="cursor-ring" id="cursorRing" />
    </>
  );
}
