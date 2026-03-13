export const DEFAULT_COLLAB_WS_URL = 'ws://localhost:1234';
export const DEFAULT_API_URL = 'http://localhost:4000';
export const DEFAULT_COLLAB_PORT = 1234;
export const DEFAULT_API_PORT = 4000;
export const DEFAULT_FRONTEND_PORT = 3000;

export const YJS_DOCUMENT_FIELD = 'default';

export const COLORS = [
  '#958DF1', '#F98181', '#FBBC88', '#FAF594',
  '#70CFF8', '#94FADB', '#B9F18D', '#C3E2C2',
  '#EAECCC', '#AFC8AD', '#EEC759', '#9BB8CD',
];

export function getRandomColor(): string {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}
