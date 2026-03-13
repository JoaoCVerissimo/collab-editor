'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import Placeholder from '@tiptap/extension-placeholder';
import Highlight from '@tiptap/extension-highlight';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { Toolbar } from './Toolbar';

interface EditorProps {
  ydoc: Y.Doc;
  provider: WebsocketProvider;
  user: { name: string; color: string };
}

export function CollabEditor({ ydoc, provider, user }: EditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Disable built-in history — Yjs handles undo/redo
        history: false,
      }),
      Highlight,
      Placeholder.configure({
        placeholder: 'Start writing...',
      }),
      Collaboration.configure({
        document: ydoc,
        field: 'default',
      }),
      CollaborationCursor.configure({
        provider,
        user: {
          name: user.name,
          color: user.color,
        },
      }),
    ],
    editorProps: {
      attributes: {
        class: 'tiptap',
      },
    },
  });

  return (
    <div
      style={{
        background: 'var(--bg-primary)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-md)',
        overflow: 'hidden',
      }}
    >
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
